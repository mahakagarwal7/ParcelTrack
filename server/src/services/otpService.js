import crypto from 'crypto';
import { Otp } from '../models/Otp.js';
import { Parcel } from '../models/Parcel.js';
import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/env.js';
import * as activityLogService from './activityLogService.js';
import * as notificationService from './notificationService.js';
import { PARCEL_STATUS } from '../utils/stateMachine.js';

export function hashOtp(otp, salt) {
  return crypto.createHash('sha256').update(`${otp}:${salt}`).digest('hex');
}

export function verifyTimingSafe(strA, strB) {
  if (typeof strA !== 'string' || typeof strB !== 'string') return false;
  const bufA = Buffer.from(strA, 'hex');
  const bufB = Buffer.from(strB, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function generateCollectionOtp(parcelId, studentUser) {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(parcelId);
  const filter = isObjectId ? { _id: parcelId } : { parcelId: parcelId.toUpperCase() };

  const parcel = await Parcel.findOne(filter);
  if (!parcel) {
    throw ApiError.notFound('Parcel not found');
  }

  // 1. Ownership verification: Only recipient student can request collection OTP
  if (parcel.studentId.toString() !== studentUser._id.toString()) {
    throw ApiError.forbidden('You can only generate collection OTP for your own parcel');
  }

  // 2. Status verification: Must be physically in custody (RECEIVED)
  if (parcel.status === PARCEL_STATUS.COLLECTED) {
    throw ApiError.badRequest('This parcel has already been collected.');
  }

  if (parcel.status !== PARCEL_STATUS.RECEIVED) {
    throw ApiError.badRequest(
      `Cannot generate collection OTP: Parcel is in '${parcel.status}' status. It must be physically received by a guard first.`
    );
  }

  // 3. Invalidate any previously active OTPs for this parcel
  await Otp.updateMany(
    { parcelId: parcel._id, isUsed: false },
    { $set: { isUsed: true, usedAt: new Date() } }
  );

  // 4. Generate cryptographically secure 6-digit OTP and random salt
  const otpNumber = crypto.randomInt(100000, 1000000).toString();
  const salt = crypto.randomBytes(16).toString('hex');
  const otpHash = hashOtp(otpNumber, salt);

  const expiryMinutes = config.otpExpiryMinutes || 10;
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  const maxAttempts = config.otpMaxAttempts || 3;

  // 5. Store ONLY hash, salt, expiry, and rate-limit metadata
  await Otp.create({
    parcelId: parcel._id,
    studentId: studentUser._id,
    hostelId: studentUser.hostelId,
    otpHash,
    salt,
    attempts: 0,
    maxAttempts,
    expiresAt,
    isUsed: false,
  });

  // Audit log & Notification
  await activityLogService.logActivity({
    actorId: studentUser._id,
    actorRole: studentUser.role,
    hostelId: studentUser.hostelId,
    parcelId: parcel._id,
    action: 'OTP_GENERATED',
    metadata: { expiresInMinutes: expiryMinutes },
  });

  await notificationService.sendNotification({
    recipientId: studentUser._id,
    title: 'Collection OTP Generated',
    message: `Your single-use collection OTP for parcel ${parcel.parcelId} is generated. Valid for ${expiryMinutes} minutes.`,
    type: 'COLLECTION_OTP',
    relatedParcelId: parcel._id,
  });

  // Plaintext OTP is returned ONLY in this response
  return {
    otp: otpNumber,
    expiresAt,
    expiresInMinutes: expiryMinutes,
    parcelId: parcel.parcelId,
    courierName: parcel.courierName,
  };
}

export async function verifyOtpAndHandover(parcelId, candidateOtp, guardUser) {
  if (!candidateOtp || candidateOtp.toString().trim().length === 0) {
    throw ApiError.badRequest('Please enter the 6-digit collection OTP');
  }

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(parcelId);
  const filter = isObjectId ? { _id: parcelId } : { parcelId: parcelId.toUpperCase() };

  const parcel = await Parcel.findOne(filter);
  if (!parcel) {
    throw ApiError.notFound('Parcel not found');
  }

  // 1. Guard hostel boundary check
  if (guardUser.role !== 'ADMIN' && parcel.hostelId !== guardUser.hostelId) {
    throw ApiError.forbidden('You can only perform parcel handovers within your assigned hostel');
  }

  // 2. Parcel status check
  if (parcel.status === PARCEL_STATUS.COLLECTED) {
    throw ApiError.badRequest('Parcel has already been collected and handed over.');
  }

  if (parcel.status !== PARCEL_STATUS.RECEIVED) {
    throw ApiError.badRequest(`Cannot handover parcel: Current status is '${parcel.status}'. Must be RECEIVED.`);
  }

  // 3. Find active (unused) OTP
  const activeOtp = await Otp.findOne({
    parcelId: parcel._id,
    isUsed: false,
  });

  if (!activeOtp) {
    throw ApiError.badRequest(
      'No active collection OTP found for this parcel. Ask the student to generate a new OTP.'
    );
  }

  // 4. Check expiration
  if (new Date() > activeOtp.expiresAt) {
    activeOtp.isUsed = true;
    activeOtp.usedAt = new Date();
    await activeOtp.save();
    throw ApiError.badRequest('Collection OTP has expired. Please ask the student to generate a fresh OTP.');
  }

  // 5. Check rate limit attempts threshold
  if (activeOtp.attempts >= activeOtp.maxAttempts) {
    activeOtp.isUsed = true;
    activeOtp.usedAt = new Date();
    await activeOtp.save();
    throw ApiError.badRequest(
      'Maximum verification attempts exceeded. This OTP has been invalidated for security. Student must generate a new OTP.'
    );
  }

  // 6. Verify candidate OTP hash using constant-time comparison
  const candidateClean = candidateOtp.toString().trim();
  const candidateHash = hashOtp(candidateClean, activeOtp.salt);
  const isValid = verifyTimingSafe(candidateHash, activeOtp.otpHash);

  if (!isValid) {
    activeOtp.attempts += 1;
    const remaining = activeOtp.maxAttempts - activeOtp.attempts;

    if (remaining <= 0) {
      activeOtp.isUsed = true;
      activeOtp.usedAt = new Date();
    }
    await activeOtp.save();

    if (remaining <= 0) {
      throw ApiError.badRequest(
        'Incorrect OTP. Maximum attempts reached. OTP has been invalidated. Student must request a new OTP.'
      );
    } else {
      throw ApiError.badRequest(`Incorrect OTP. ${remaining} attempt(s) remaining.`);
    }
  }

  // 7. ATOMIC STATE TRANSITION: Mark parcel COLLECTED
  const updatedParcel = await Parcel.findOneAndUpdate(
    {
      _id: parcel._id,
      status: PARCEL_STATUS.RECEIVED, // Ensures atomic check against race conditions
    },
    {
      $set: {
        status: PARCEL_STATUS.COLLECTED,
        collectedBy: guardUser._id,
        collectedAt: new Date(),
      },
      $push: {
        statusHistory: {
          status: PARCEL_STATUS.COLLECTED,
          changedBy: guardUser._id,
          note: `Secure handover completed by Guard ${guardUser.name} after OTP verification`,
          timestamp: new Date(),
        },
      },
    },
    { new: true }
  )
    .populate('studentId', 'name email roomNumber studentId phone')
    .populate('collectedBy', 'name role');

  if (!updatedParcel) {
    throw ApiError.conflict('Duplicate collection prevented: Parcel was already collected.');
  }

  // 8. Invalidate OTP (single-use guarantee)
  activeOtp.isUsed = true;
  activeOtp.usedAt = new Date();
  activeOtp.usedBy = guardUser._id;
  await activeOtp.save();

  // Audit Log & Notification
  await activityLogService.logActivity({
    actorId: guardUser._id,
    actorRole: guardUser.role,
    hostelId: guardUser.hostelId,
    parcelId: parcel._id,
    action: 'PARCEL_HANDOVER',
    previousValue: { status: PARCEL_STATUS.RECEIVED },
    newValue: { status: PARCEL_STATUS.COLLECTED, collectedAt: updatedParcel.collectedAt },
    metadata: { studentId: parcel.studentId.toString(), guardName: guardUser.name },
  });

  await notificationService.sendNotification({
    recipientId: parcel.studentId,
    title: 'Parcel Collected Successfully',
    message: `Your parcel ${updatedParcel.parcelId} from ${updatedParcel.courierName} has been handed over by Guard ${guardUser.name}.`,
    type: 'PARCEL_COLLECTED',
    relatedParcelId: updatedParcel._id,
  });

  return {
    parcel: updatedParcel,
    handoverTime: updatedParcel.collectedAt,
    handedOverBy: guardUser.name,
  };
}

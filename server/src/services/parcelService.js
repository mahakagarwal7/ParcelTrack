import crypto from 'crypto';
import { Parcel } from '../models/Parcel.js';
import { Authorization } from '../models/Authorization.js';
import { DeliveryAttempt } from '../models/DeliveryAttempt.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import * as policyService from './policyService.js';
import * as authorizationService from './authorizationService.js';
import {
  PARCEL_STATUS,
  AUTHORIZATION_STATUS,
  DELIVERY_ATTEMPT_STATUS,
  validateParcelTransition,
} from '../utils/stateMachine.js';

export function generateParcelId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `PT-${dateStr}-${randomSuffix}`;
}

export async function registerExpectedParcel(studentUser, parcelInput) {
  const {
    courierName,
    trackingNumber,
    description,
    expectedDeliveryDate,
    isHighValue = false,
    isOversized = false,
    isCOD = false,
    codAmount = 0,
    category = 'OTHER',
    consent = true,
  } = parcelInput;

  if (!courierName) {
    throw ApiError.badRequest('Courier name is required');
  }

  // 1. Evaluate policy for student's hostel
  const policyResult = await policyService.evaluateAuthorizationNeed({
    hostelId: studentUser.hostelId,
    student: studentUser,
    parcelDetails: { isHighValue, isOversized, isCOD, codAmount, category },
  });

  // 2. Create Authorization record
  const authorization = await authorizationService.createAuthorizationForExpectedParcel({
    student: studentUser,
    parcelData: { consent, isHighValue, isOversized, isCOD },
    policyResult,
  });

  // 3. Determine initial parcel status based on authorization status
  const initialParcelStatus =
    authorization.status === AUTHORIZATION_STATUS.AUTHORIZED
      ? PARCEL_STATUS.AUTHORIZED
      : PARCEL_STATUS.EXPECTED;

  const parcelId = generateParcelId();

  // 4. Create Parcel record
  const parcel = await Parcel.create({
    parcelId,
    studentId: studentUser._id,
    hostelId: studentUser.hostelId,
    trackingNumber: trackingNumber || null,
    courierName,
    description: description || null,
    isHighValue,
    isOversized,
    isCOD,
    codAmount: isCOD ? codAmount : 0,
    category,
    expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
    status: initialParcelStatus,
    authorizationId: authorization._id,
    statusHistory: [
      {
        status: initialParcelStatus,
        changedBy: studentUser._id,
        note:
          initialParcelStatus === PARCEL_STATUS.AUTHORIZED
            ? 'Expected parcel registered and automatically authorized by standing policy'
            : 'Expected parcel registered, awaiting consent or warden approval',
        timestamp: new Date(),
      },
    ],
  });

  // Link parcel to authorization
  authorization.parcelId = parcel._id;
  await authorization.save();

  return { parcel, authorization, policyResult };
}

export async function getStudentParcels(studentId, { status, page = 1, limit = 20, search }) {
  const query = { studentId };

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { parcelId: { $regex: search, $options: 'i' } },
      { trackingNumber: { $regex: search, $options: 'i' } },
      { courierName: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const total = await Parcel.countDocuments(query);
  const parcels = await Parcel.find(query)
    .populate('authorizationId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  return {
    parcels,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  };
}

export async function getParcelById(idOrParcelId, requestingUser) {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrParcelId);
  const filter = isObjectId ? { _id: idOrParcelId } : { parcelId: idOrParcelId.toUpperCase() };

  const parcel = await Parcel.findOne(filter)
    .populate('studentId', 'name email roomNumber studentId hostelId phone')
    .populate('authorizationId')
    .populate('receivedBy', 'name role')
    .populate('collectedBy', 'name role');

  if (!parcel) {
    throw ApiError.notFound('Parcel not found');
  }

  // Ownership & hostel boundary verification
  if (requestingUser.role === 'STUDENT') {
    if (parcel.studentId._id.toString() !== requestingUser._id.toString()) {
      throw ApiError.forbidden('You are not authorized to view this parcel');
    }
  } else if (requestingUser.role !== 'ADMIN') {
    if (parcel.hostelId !== requestingUser.hostelId) {
      throw ApiError.forbidden('You can only view parcels within your assigned hostel');
    }
  }

  return parcel;
}

export async function receiveExpectedParcel(parcelId, guardUser, { storageLocation, remarks }) {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(parcelId);
  const filter = isObjectId ? { _id: parcelId } : { parcelId: parcelId.toUpperCase() };

  const parcel = await Parcel.findOne(filter).populate('authorizationId');
  if (!parcel) {
    throw ApiError.notFound('Parcel not found');
  }

  // Hostel boundary check
  if (guardUser.role !== 'ADMIN' && parcel.hostelId !== guardUser.hostelId) {
    throw ApiError.forbidden('You cannot accept parcels for another hostel');
  }

  // Invariant: Never accept a parcel without valid authorization
  if (!parcel.authorizationId || parcel.authorizationId.status !== AUTHORIZATION_STATUS.AUTHORIZED) {
    throw ApiError.badRequest(
      `Cannot accept parcel: Authorization is in status '${parcel.authorizationId?.status || 'UNKNOWN'}'. Must be AUTHORIZED.`
    );
  }

  // Enforce legal state transition
  validateParcelTransition(parcel.status, PARCEL_STATUS.RECEIVED);

  parcel.status = PARCEL_STATUS.RECEIVED;
  parcel.receivedBy = guardUser._id;
  parcel.receivedAt = new Date();
  parcel.storageLocation = storageLocation || 'Gate Reception Counter';

  parcel.statusHistory.push({
    status: PARCEL_STATUS.RECEIVED,
    changedBy: guardUser._id,
    note: remarks || `Physical receipt recorded by Guard ${guardUser.name} at ${parcel.storageLocation}`,
    timestamp: new Date(),
  });

  await parcel.save();

  return parcel;
}

export async function receiveUnexpectedParcel(attemptId, guardUser, { storageLocation, remarks }) {
  const attempt = await DeliveryAttempt.findById(attemptId).populate('authorizationId');
  if (!attempt) {
    throw ApiError.notFound('Delivery attempt not found');
  }

  // Hostel boundary check
  if (guardUser.role !== 'ADMIN' && attempt.hostelId !== guardUser.hostelId) {
    throw ApiError.forbidden('You cannot accept deliveries for another hostel');
  }

  // Invariant: Guard accepts only after authorization passes
  if (
    !attempt.authorizationId ||
    attempt.authorizationId.status !== AUTHORIZATION_STATUS.AUTHORIZED
  ) {
    throw ApiError.badRequest(
      `Cannot accept courier parcel: Delivery attempt is in status '${attempt.status}' and authorization is '${attempt.authorizationId?.status || 'UNKNOWN'}'. It must be AUTHORIZED.`
    );
  }

  // Prevent duplicate parcel generation for same attempt
  if (attempt.authorizationId.parcelId) {
    const existing = await Parcel.findById(attempt.authorizationId.parcelId);
    if (existing) {
      throw ApiError.conflict(`Parcel ${existing.parcelId} has already been received for this delivery attempt.`);
    }
  }

  const newParcelId = generateParcelId();

  const parcel = await Parcel.create({
    parcelId: newParcelId,
    studentId: attempt.studentId,
    hostelId: attempt.hostelId,
    courierName: attempt.courierName,
    trackingNumber: attempt.trackingNumber || null,
    status: PARCEL_STATUS.RECEIVED,
    authorizationId: attempt.authorizationId._id,
    receivedBy: guardUser._id,
    receivedAt: new Date(),
    storageLocation: storageLocation || 'Gate Reception Counter',
    statusHistory: [
      {
        status: PARCEL_STATUS.RECEIVED,
        changedBy: guardUser._id,
        note: remarks || `Physical receipt recorded by Guard ${guardUser.name} at ${storageLocation || 'Gate Reception'}`,
        timestamp: new Date(),
      },
    ],
  });

  // Link parcel back to authorization
  attempt.authorizationId.parcelId = parcel._id;
  await attempt.authorizationId.save();

  // Mark attempt accepted
  attempt.status = DELIVERY_ATTEMPT_STATUS.ACCEPTED;
  await attempt.save();

  return { parcel, deliveryAttempt: attempt };
}

export async function getGuardActiveParcels(guardUser, { search, page = 1, limit = 20 }) {
  const query = {
    status: PARCEL_STATUS.RECEIVED, // Awaiting collection
  };

  if (guardUser.role !== 'ADMIN') {
    query.hostelId = guardUser.hostelId;
  }

  if (search) {
    query.$or = [
      { parcelId: { $regex: search, $options: 'i' } },
      { trackingNumber: { $regex: search, $options: 'i' } },
      { courierName: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const total = await Parcel.countDocuments(query);
  const parcels = await Parcel.find(query)
    .populate('studentId', 'name email roomNumber studentId phone')
    .populate('receivedBy', 'name role')
    .sort({ receivedAt: -1 })
    .skip(skip)
    .limit(limitNum);

  return {
    parcels,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  };
}

export async function lookupGateAuthorization(guardUser, { trackingNumber, studentId }) {
  const query = {};

  if (guardUser.role !== 'ADMIN') {
    query.hostelId = guardUser.hostelId;
  }

  if (trackingNumber) {
    // Check in parcels
    const matchingParcels = await Parcel.find({
      ...query,
      trackingNumber: { $regex: trackingNumber.trim(), $options: 'i' },
    })
      .populate('studentId', 'name roomNumber studentId phone')
      .populate('authorizationId');

    // Check in delivery attempts
    const matchingAttempts = await DeliveryAttempt.find({
      ...query,
      trackingNumber: { $regex: trackingNumber.trim(), $options: 'i' },
    })
      .populate('studentId', 'name roomNumber studentId phone')
      .populate('authorizationId');

    return {
      parcels: matchingParcels,
      deliveryAttempts: matchingAttempts,
    };
  }

  if (studentId) {
    const student = await User.findOne({
      studentId: studentId.trim(),
      ...(guardUser.role !== 'ADMIN' && { hostelId: guardUser.hostelId }),
    });

    if (!student) {
      return { parcels: [], deliveryAttempts: [] };
    }

    const parcels = await Parcel.find({
      studentId: student._id,
      status: { $in: [PARCEL_STATUS.EXPECTED, PARCEL_STATUS.AUTHORIZED] },
    }).populate('authorizationId');

    const attempts = await DeliveryAttempt.find({
      studentId: student._id,
      status: DELIVERY_ATTEMPT_STATUS.AWAITING_AUTHORIZATION,
    }).populate('authorizationId');

    return {
      student,
      parcels,
      deliveryAttempts: attempts,
    };
  }

  throw ApiError.badRequest('Provide trackingNumber or studentId for gate lookup');
}

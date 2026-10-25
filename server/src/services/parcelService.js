import crypto from 'crypto';
import { Parcel } from '../models/Parcel.js';
import { Authorization } from '../models/Authorization.js';
import { ApiError } from '../utils/ApiError.js';
import * as policyService from './policyService.js';
import * as authorizationService from './authorizationService.js';
import { PARCEL_STATUS, AUTHORIZATION_STATUS } from '../utils/stateMachine.js';

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

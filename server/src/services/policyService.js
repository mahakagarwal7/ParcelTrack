import { HostelPolicy } from '../models/HostelPolicy.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export async function getOrCreatePolicy(hostelId) {
  if (!hostelId) {
    throw ApiError.badRequest('Hostel ID is required');
  }

  const normalizedHostelId = hostelId.toUpperCase();
  let policy = await HostelPolicy.findOne({ hostelId: normalizedHostelId }).populate(
    'updatedBy',
    'name email role'
  );

  if (!policy) {
    policy = await HostelPolicy.create({
      hostelId: normalizedHostelId,
      mode: 'INDIVIDUAL_APPROVAL',
      maxStorageDays: 7,
      allowCOD: false,
      maxParcelSize: 'ANY',
      requireWardenApprovalFor: ['HIGH_VALUE', 'OVERSIZED'],
    });
  }

  return policy;
}

export async function updatePolicy(hostelId, updateData, wardenUser) {
  if (!hostelId) {
    throw ApiError.badRequest('Hostel ID is required');
  }

  const normalizedHostelId = hostelId.toUpperCase();
  const allowedFields = [
    'mode',
    'maxStorageDays',
    'allowCOD',
    'maxParcelSize',
    'requireWardenApprovalFor',
  ];

  const filteredUpdates = {};
  for (const key of allowedFields) {
    if (updateData[key] !== undefined) {
      filteredUpdates[key] = updateData[key];
    }
  }

  filteredUpdates.updatedBy = wardenUser._id;

  const policy = await HostelPolicy.findOneAndUpdate(
    { hostelId: normalizedHostelId },
    { $set: filteredUpdates },
    { new: true, upsert: true, runValidators: true }
  ).populate('updatedBy', 'name email role');

  return policy;
}

export async function evaluateAuthorizationNeed({ hostelId, student, parcelDetails = {} }) {
  const policy = await getOrCreatePolicy(hostelId);

  // Student consent is ALWAYS required
  const result = {
    policyMode: policy.mode,
    requiresStudentConsent: true,
    requiresWardenApproval: false,
    reason: '',
  };

  // 1. If student standing permission is suspended, warden approval is always required
  if (student && student.standingPermissionSuspended) {
    result.requiresWardenApproval = true;
    result.reason = 'Standing permission is suspended for this student';
    return result;
  }

  // 2. Evaluate based on policy mode
  switch (policy.mode) {
    case 'INDIVIDUAL_APPROVAL':
      result.requiresWardenApproval = true;
      result.reason = 'Hostel policy requires individual approval for all parcels';
      break;

    case 'STANDING_PERMISSION':
      result.requiresWardenApproval = false;
      result.reason = 'Standing permission allows automatic authorization upon student consent';
      break;

    case 'HYBRID': {
      const exceptions = [];

      if (parcelDetails.isHighValue && policy.requireWardenApprovalFor.includes('HIGH_VALUE')) {
        exceptions.push('High value item');
      }
      if (parcelDetails.isOversized && policy.requireWardenApprovalFor.includes('OVERSIZED')) {
        exceptions.push('Oversized parcel');
      }
      if (parcelDetails.isCOD && policy.requireWardenApprovalFor.includes('COD')) {
        exceptions.push('Cash on delivery (COD)');
      }
      if (
        parcelDetails.category === 'ELECTRONICS' &&
        policy.requireWardenApprovalFor.includes('ELECTRONICS')
      ) {
        exceptions.push('Electronics item');
      }

      if (exceptions.length > 0) {
        result.requiresWardenApproval = true;
        result.reason = `Hybrid policy exception triggered: ${exceptions.join(', ')}`;
      } else {
        result.requiresWardenApproval = false;
        result.reason = 'Standard parcel covered under hybrid standing permission';
      }
      break;
    }

    default:
      result.requiresWardenApproval = true;
      result.reason = 'Default policy requires warden approval';
  }

  return result;
}

export async function toggleStudentSuspension(studentId, isSuspended, wardenUser) {
  const student = await User.findById(studentId);
  if (!student) {
    throw ApiError.notFound('Student not found');
  }

  if (student.role !== 'STUDENT') {
    throw ApiError.badRequest('Only student permissions can be suspended');
  }

  // Ensure warden belongs to same hostel unless admin
  if (wardenUser.role !== 'ADMIN' && student.hostelId !== wardenUser.hostelId) {
    throw ApiError.forbidden('You can only manage students in your assigned hostel');
  }

  student.standingPermissionSuspended = Boolean(isSuspended);
  await student.save();

  return student;
}

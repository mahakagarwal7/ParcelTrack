import { DeliveryAttempt } from '../models/DeliveryAttempt.js';
import { Authorization } from '../models/Authorization.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import * as policyService from './policyService.js';
import * as activityLogService from './activityLogService.js';
import * as notificationService from './notificationService.js';
import { AUTHORIZATION_STATUS, DELIVERY_ATTEMPT_STATUS } from '../utils/stateMachine.js';

export async function searchStudents(guardUser, queryStr) {
  if (!queryStr || queryStr.trim().length === 0) {
    throw ApiError.badRequest('Search query is required');
  }

  const trimmed = queryStr.trim();
  const searchRegex = new RegExp(trimmed, 'i');

  const query = {
    role: 'STUDENT',
    isActive: true,
  };

  // Restrict to guard's hostel unless admin
  if (guardUser.role !== 'ADMIN') {
    query.hostelId = guardUser.hostelId;
  }

  query.$or = [
    { studentId: searchRegex },
    { roomNumber: searchRegex },
    { name: searchRegex },
    { email: searchRegex },
  ];

  const students = await User.find(query)
    .select('name email studentId roomNumber hostelId phone standingPermissionSuspended')
    .limit(20);

  return students;
}

export async function createDeliveryAttempt(guardUser, attemptData) {
  const {
    studentId,
    courierName,
    trackingNumber,
    isHighValue = false,
    isOversized = false,
    isCOD = false,
    codAmount = 0,
    category = 'OTHER',
  } = attemptData;

  if (!studentId || !courierName) {
    throw ApiError.badRequest('Student ID and courier name are required');
  }

  const student = await User.findById(studentId);
  if (!student || student.role !== 'STUDENT') {
    throw ApiError.notFound('Student not found');
  }

  // Ensure guard and student belong to same hostel
  if (guardUser.role !== 'ADMIN' && student.hostelId !== guardUser.hostelId) {
    throw ApiError.forbidden('Guard cannot create delivery attempts for another hostel');
  }

  // 1. Evaluate policy
  const policyResult = await policyService.evaluateAuthorizationNeed({
    hostelId: student.hostelId,
    student,
    parcelDetails: { isHighValue, isOversized, isCOD, codAmount, category },
  });

  // 2. Create Authorization record in PENDING_STUDENT
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 3); // Delivery attempt authorization expires in 3 days

  const authorization = await Authorization.create({
    studentId: student._id,
    hostelId: student.hostelId,
    studentConsent: 'PENDING',
    wardenDecision: policyResult.requiresWardenApproval ? 'PENDING' : 'NOT_REQUIRED',
    status: AUTHORIZATION_STATUS.PENDING_STUDENT,
    policyApplied: policyResult.policyMode,
    expiresAt,
  });

  // 3. Create DeliveryAttempt record
  const deliveryAttempt = await DeliveryAttempt.create({
    studentId: student._id,
    guardId: guardUser._id,
    hostelId: guardUser.hostelId,
    courierName,
    trackingNumber: trackingNumber || null,
    status: DELIVERY_ATTEMPT_STATUS.AWAITING_AUTHORIZATION,
    authorizationId: authorization._id,
  });

  // Link back
  authorization.deliveryAttemptId = deliveryAttempt._id;
  await authorization.save();

  // Audit Log & Notification to Student
  await activityLogService.logActivity({
    actorId: guardUser._id,
    actorRole: guardUser.role,
    hostelId: guardUser.hostelId,
    deliveryAttemptId: deliveryAttempt._id,
    authorizationId: authorization._id,
    action: 'DELIVERY_ATTEMPT_CREATED',
    newValue: { status: deliveryAttempt.status, courierName, trackingNumber },
  });

  await notificationService.sendNotification({
    recipientId: student._id,
    title: 'Courier Arrival at Hostel Gate',
    message: `${courierName} courier is at the hostel gate with a parcel for you. Please approve or reject reception.`,
    type: 'CONSENT_REQUEST',
    relatedAuthorizationId: authorization._id,
  });

  return { deliveryAttempt, authorization, policyResult };
}

export async function getDeliveryAttempts(requestingUser, { status, page = 1, limit = 20 }) {
  const query = {};

  if (requestingUser.role === 'STUDENT') {
    query.studentId = requestingUser._id;
  } else if (requestingUser.role !== 'ADMIN') {
    query.hostelId = requestingUser.hostelId;
  }

  if (status) {
    query.status = status;
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const total = await DeliveryAttempt.countDocuments(query);
  const attempts = await DeliveryAttempt.find(query)
    .populate('studentId', 'name email roomNumber studentId phone')
    .populate('guardId', 'name')
    .populate('authorizationId')
    .sort({ attemptedAt: -1 })
    .skip(skip)
    .limit(limitNum);

  return {
    attempts,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  };
}

export async function getDeliveryAttemptById(attemptId, requestingUser) {
  const attempt = await DeliveryAttempt.findById(attemptId)
    .populate('studentId', 'name email roomNumber studentId phone')
    .populate('guardId', 'name')
    .populate('authorizationId');

  if (!attempt) {
    throw ApiError.notFound('Delivery attempt not found');
  }

  if (requestingUser.role === 'STUDENT') {
    if (attempt.studentId._id.toString() !== requestingUser._id.toString()) {
      throw ApiError.forbidden('You are not authorized to view this delivery attempt');
    }
  } else if (requestingUser.role !== 'ADMIN') {
    if (attempt.hostelId !== requestingUser.hostelId) {
      throw ApiError.forbidden('You cannot view delivery attempts from another hostel');
    }
  }

  return attempt;
}

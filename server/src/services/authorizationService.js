import { Authorization } from '../models/Authorization.js';
import { Parcel } from '../models/Parcel.js';
import { DeliveryAttempt } from '../models/DeliveryAttempt.js';
import { ApiError } from '../utils/ApiError.js';
import {
  AUTHORIZATION_STATUS,
  PARCEL_STATUS,
  DELIVERY_ATTEMPT_STATUS,
  validateAuthTransition,
  validateParcelTransition,
} from '../utils/stateMachine.js';

export async function createAuthorizationForExpectedParcel({
  student,
  parcelData,
  policyResult,
}) {
  const hasConsent = Boolean(parcelData.consent);
  const requiresWardenApproval = policyResult.requiresWardenApproval;

  let authStatus;
  let wardenDecision;
  const studentConsent = hasConsent ? 'GRANTED' : 'PENDING';
  const studentConsentAt = hasConsent ? new Date() : null;

  if (hasConsent) {
    if (requiresWardenApproval) {
      authStatus = AUTHORIZATION_STATUS.PENDING_WARDEN;
      wardenDecision = 'PENDING';
    } else {
      authStatus = AUTHORIZATION_STATUS.AUTHORIZED;
      wardenDecision = 'NOT_REQUIRED';
    }
  } else {
    authStatus = AUTHORIZATION_STATUS.PENDING_STUDENT;
    wardenDecision = requiresWardenApproval ? 'PENDING' : 'NOT_REQUIRED';
  }

  // Authorizations expire in 14 days by default
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  const authorization = await Authorization.create({
    studentId: student._id,
    hostelId: student.hostelId,
    studentConsent,
    studentConsentAt,
    wardenDecision,
    status: authStatus,
    policyApplied: policyResult.policyMode,
    expiresAt,
  });

  return authorization;
}

export async function getAuthorizationById(authId) {
  const auth = await Authorization.findById(authId)
    .populate('studentId', 'name email roomNumber studentId')
    .populate('wardenId', 'name email role')
    .populate('parcelId')
    .populate('deliveryAttemptId');

  if (!auth) {
    throw ApiError.notFound('Authorization record not found');
  }
  return auth;
}

export async function processStudentDecision(authId, studentUser, decision) {
  const auth = await Authorization.findById(authId);
  if (!auth) {
    throw ApiError.notFound('Authorization record not found');
  }

  // Ensure only the designated student can give consent
  if (auth.studentId.toString() !== studentUser._id.toString()) {
    throw ApiError.forbidden('You can only authorize deliveries designated for you');
  }

  if (decision === 'GRANT') {
    if (auth.wardenDecision === 'APPROVED' || auth.wardenDecision === 'NOT_REQUIRED') {
      validateAuthTransition(auth.status, AUTHORIZATION_STATUS.AUTHORIZED);
      auth.status = AUTHORIZATION_STATUS.AUTHORIZED;
    } else {
      validateAuthTransition(auth.status, AUTHORIZATION_STATUS.PENDING_WARDEN);
      auth.status = AUTHORIZATION_STATUS.PENDING_WARDEN;
    }

    auth.studentConsent = 'GRANTED';
    auth.studentConsentAt = new Date();
  } else if (decision === 'REJECT') {
    validateAuthTransition(auth.status, AUTHORIZATION_STATUS.REJECTED);
    auth.studentConsent = 'REVOKED';
    auth.status = AUTHORIZATION_STATUS.REJECTED;
  } else {
    throw ApiError.badRequest("Invalid decision. Must be 'GRANT' or 'REJECT'");
  }

  await auth.save();

  // If a parcel is linked, sync parcel status
  if (auth.parcelId) {
    const parcel = await Parcel.findById(auth.parcelId);
    if (parcel) {
      if (auth.status === AUTHORIZATION_STATUS.AUTHORIZED) {
        validateParcelTransition(parcel.status, PARCEL_STATUS.AUTHORIZED);
        parcel.status = PARCEL_STATUS.AUTHORIZED;
        parcel.statusHistory.push({
          status: PARCEL_STATUS.AUTHORIZED,
          changedBy: studentUser._id,
          note: 'Parcel authorized after student consent',
        });
        await parcel.save();
      }
    }
  }

  // If linked to a DeliveryAttempt, sync delivery attempt status
  if (auth.deliveryAttemptId) {
    const attempt = await DeliveryAttempt.findById(auth.deliveryAttemptId);
    if (attempt) {
      if (auth.status === AUTHORIZATION_STATUS.AUTHORIZED) {
        attempt.status = DELIVERY_ATTEMPT_STATUS.ACCEPTED;
      } else if (auth.status === AUTHORIZATION_STATUS.REJECTED) {
        attempt.status = DELIVERY_ATTEMPT_STATUS.DENIED;
        attempt.failureReason = 'Delivery rejected by recipient student';
      }
      await attempt.save();
    }
  }

  return auth;
}

export async function processWardenDecision(authId, wardenUser, decision, comments = '') {
  const auth = await Authorization.findById(authId);
  if (!auth) {
    throw ApiError.notFound('Authorization record not found');
  }

  // Ensure warden belongs to same hostel unless admin
  if (wardenUser.role !== 'ADMIN' && auth.hostelId !== wardenUser.hostelId) {
    throw ApiError.forbidden('You can only review requests for your assigned hostel');
  }

  if (auth.status !== AUTHORIZATION_STATUS.PENDING_WARDEN) {
    throw ApiError.badRequest(
      `Cannot review authorization in status '${auth.status}'. Only PENDING_WARDEN requests can be reviewed.`
    );
  }

  if (decision === 'APPROVE') {
    validateAuthTransition(auth.status, AUTHORIZATION_STATUS.AUTHORIZED);
    auth.wardenDecision = 'APPROVED';
    auth.wardenId = wardenUser._id;
    auth.wardenDecisionAt = new Date();
    auth.wardenComments = comments;
    auth.status = AUTHORIZATION_STATUS.AUTHORIZED;
  } else if (decision === 'REJECT') {
    validateAuthTransition(auth.status, AUTHORIZATION_STATUS.REJECTED);
    auth.wardenDecision = 'REJECTED';
    auth.wardenId = wardenUser._id;
    auth.wardenDecisionAt = new Date();
    auth.wardenComments = comments;
    auth.status = AUTHORIZATION_STATUS.REJECTED;
  } else {
    throw ApiError.badRequest("Decision must be either 'APPROVE' or 'REJECT'");
  }

  await auth.save();

  // Sync linked parcel if authorized
  if (auth.parcelId) {
    const parcel = await Parcel.findById(auth.parcelId);
    if (parcel) {
      if (auth.status === AUTHORIZATION_STATUS.AUTHORIZED) {
        validateParcelTransition(parcel.status, PARCEL_STATUS.AUTHORIZED);
        parcel.status = PARCEL_STATUS.AUTHORIZED;
        parcel.statusHistory.push({
          status: PARCEL_STATUS.AUTHORIZED,
          changedBy: wardenUser._id,
          note: `Warden approved authorization: ${comments || 'No remarks'}`,
        });
        await parcel.save();
      }
    }
  }

  // Sync linked delivery attempt if applicable
  if (auth.deliveryAttemptId) {
    const attempt = await DeliveryAttempt.findById(auth.deliveryAttemptId);
    if (attempt) {
      if (auth.status === AUTHORIZATION_STATUS.AUTHORIZED) {
        attempt.status = DELIVERY_ATTEMPT_STATUS.ACCEPTED;
      } else if (auth.status === AUTHORIZATION_STATUS.REJECTED) {
        attempt.status = DELIVERY_ATTEMPT_STATUS.DENIED;
        attempt.failureReason = `Delivery rejected by warden: ${comments || 'No remarks'}`;
      }
      await attempt.save();
    }
  }

  return auth;
}

import { ApiError } from './ApiError.js';

export const PARCEL_STATUS = {
  EXPECTED: 'EXPECTED',
  AUTHORIZED: 'AUTHORIZED',
  RECEIVED: 'RECEIVED',
  COLLECTED: 'COLLECTED',
  DISPUTED: 'DISPUTED',
};

export const AUTHORIZATION_STATUS = {
  PENDING_STUDENT: 'PENDING_STUDENT',
  PENDING_WARDEN: 'PENDING_WARDEN',
  AUTHORIZED: 'AUTHORIZED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED',
};

export const DELIVERY_ATTEMPT_STATUS = {
  AWAITING_AUTHORIZATION: 'AWAITING_AUTHORIZATION',
  ACCEPTED: 'ACCEPTED',
  DENIED: 'DENIED',
  FAILED: 'FAILED',
};

// Legal state transitions for Parcels
const LEGAL_PARCEL_TRANSITIONS = {
  [PARCEL_STATUS.EXPECTED]: [PARCEL_STATUS.AUTHORIZED, PARCEL_STATUS.RECEIVED],
  [PARCEL_STATUS.AUTHORIZED]: [PARCEL_STATUS.RECEIVED],
  [PARCEL_STATUS.RECEIVED]: [PARCEL_STATUS.COLLECTED, PARCEL_STATUS.DISPUTED],
  [PARCEL_STATUS.DISPUTED]: [PARCEL_STATUS.COLLECTED],
  [PARCEL_STATUS.COLLECTED]: [], // Terminal state
};

// Legal state transitions for Authorizations
const LEGAL_AUTH_TRANSITIONS = {
  [AUTHORIZATION_STATUS.PENDING_STUDENT]: [
    AUTHORIZATION_STATUS.PENDING_WARDEN,
    AUTHORIZATION_STATUS.AUTHORIZED,
    AUTHORIZATION_STATUS.REJECTED,
    AUTHORIZATION_STATUS.EXPIRED,
  ],
  [AUTHORIZATION_STATUS.PENDING_WARDEN]: [
    AUTHORIZATION_STATUS.AUTHORIZED,
    AUTHORIZATION_STATUS.REJECTED,
    AUTHORIZATION_STATUS.EXPIRED,
  ],
  [AUTHORIZATION_STATUS.AUTHORIZED]: [
    AUTHORIZATION_STATUS.REVOKED,
    AUTHORIZATION_STATUS.EXPIRED,
  ],
  [AUTHORIZATION_STATUS.REJECTED]: [], // Terminal state
  [AUTHORIZATION_STATUS.EXPIRED]: [],  // Terminal state
  [AUTHORIZATION_STATUS.REVOKED]: [],  // Terminal state
};

export function validateParcelTransition(currentStatus, targetStatus) {
  if (currentStatus === targetStatus) return true;

  const allowed = LEGAL_PARCEL_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    throw ApiError.badRequest(
      `Illegal parcel state transition from '${currentStatus}' to '${targetStatus}'.`
    );
  }
  return true;
}

export function validateAuthTransition(currentStatus, targetStatus) {
  if (currentStatus === targetStatus) return true;

  const allowed = LEGAL_AUTH_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    throw ApiError.badRequest(
      `Illegal authorization state transition from '${currentStatus}' to '${targetStatus}'.`
    );
  }
  return true;
}

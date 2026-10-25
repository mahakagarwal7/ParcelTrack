import mongoose from 'mongoose';
import { AUTHORIZATION_STATUS } from '../utils/stateMachine.js';

const authorizationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    hostelId: {
      type: String,
      required: [true, 'Hostel ID is required'],
      uppercase: true,
      trim: true,
      index: true,
    },
    parcelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parcel',
      default: null,
    },
    deliveryAttemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryAttempt',
      default: null,
    },
    studentConsent: {
      type: String,
      enum: ['PENDING', 'GRANTED', 'REVOKED'],
      default: 'PENDING',
      required: true,
    },
    studentConsentAt: {
      type: Date,
      default: null,
    },
    wardenDecision: {
      type: String,
      enum: ['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      required: true,
    },
    wardenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    wardenDecisionAt: {
      type: Date,
      default: null,
    },
    wardenComments: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(AUTHORIZATION_STATUS),
      default: AUTHORIZATION_STATUS.PENDING_STUDENT,
      required: true,
      index: true,
    },
    policyApplied: {
      type: String,
      enum: ['INDIVIDUAL_APPROVAL', 'STANDING_PERMISSION', 'HYBRID'],
      required: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

authorizationSchema.index({ hostelId: 1, status: 1 });
authorizationSchema.index({ studentId: 1, status: 1 });

export const Authorization = mongoose.model('Authorization', authorizationSchema);

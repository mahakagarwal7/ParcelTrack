import mongoose from 'mongoose';
import { DELIVERY_ATTEMPT_STATUS } from '../utils/stateMachine.js';

const deliveryAttemptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    guardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Guard ID is required'],
      index: true,
    },
    hostelId: {
      type: String,
      required: [true, 'Hostel ID is required'],
      uppercase: true,
      trim: true,
      index: true,
    },
    courierName: {
      type: String,
      required: [true, 'Courier name is required'],
      trim: true,
    },
    trackingNumber: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(DELIVERY_ATTEMPT_STATUS),
      default: DELIVERY_ATTEMPT_STATUS.AWAITING_AUTHORIZATION,
      required: true,
      index: true,
    },
    attemptedAt: {
      type: Date,
      default: Date.now,
    },
    authorizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Authorization',
      default: null,
    },
    failureReason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

deliveryAttemptSchema.index({ hostelId: 1, status: 1 });

export const DeliveryAttempt = mongoose.model('DeliveryAttempt', deliveryAttemptSchema);

import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorRole: {
      type: String,
      enum: ['STUDENT', 'GUARD', 'WARDEN', 'ADMIN', 'SYSTEM'],
      required: true,
    },
    hostelId: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    parcelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parcel',
      default: null,
      index: true,
    },
    deliveryAttemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryAttempt',
      default: null,
    },
    authorizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Authorization',
      default: null,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    previousValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

activityLogSchema.index({ hostelId: 1, timestamp: -1 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

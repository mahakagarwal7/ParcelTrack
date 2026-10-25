import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'PARCEL_EXPECTED',
        'DELIVERY_ATTEMPT',
        'CONSENT_REQUEST',
        'WARDEN_APPROVAL_NEEDED',
        'PARCEL_RECEIVED',
        'COLLECTION_OTP',
        'PARCEL_COLLECTED',
      ],
      required: true,
    },
    relatedParcelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parcel',
      default: null,
    },
    relatedAuthorizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Authorization',
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);

import mongoose from 'mongoose';
import { PARCEL_STATUS } from '../utils/stateMachine.js';

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: Object.values(PARCEL_STATUS),
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const parcelSchema = new mongoose.Schema(
  {
    parcelId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient student is required'],
      index: true,
    },
    hostelId: {
      type: String,
      required: [true, 'Hostel ID is required'],
      uppercase: true,
      trim: true,
      index: true,
    },
    trackingNumber: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    courierName: {
      type: String,
      required: [true, 'Courier name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    isHighValue: {
      type: Boolean,
      default: false,
    },
    isOversized: {
      type: Boolean,
      default: false,
    },
    isCOD: {
      type: Boolean,
      default: false,
    },
    codAmount: {
      type: Number,
      default: 0,
      min: [0, 'COD amount cannot be negative'],
    },
    category: {
      type: String,
      enum: ['DOCUMENTS', 'ELECTRONICS', 'CLOTHING', 'MEDICINE', 'FOOD', 'OTHER'],
      default: 'OTHER',
    },
    expectedDeliveryDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(PARCEL_STATUS),
      default: PARCEL_STATUS.EXPECTED,
      required: true,
      index: true,
    },
    authorizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Authorization',
      required: true,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    receivedAt: {
      type: Date,
      default: null,
    },
    storageLocation: {
      type: String,
      trim: true,
      default: null,
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    collectedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

parcelSchema.index({ hostelId: 1, status: 1 });
parcelSchema.index({ studentId: 1, status: 1 });

export const Parcel = mongoose.model('Parcel', parcelSchema);

import mongoose from 'mongoose';

const hostelPolicySchema = new mongoose.Schema(
  {
    hostelId: {
      type: String,
      required: [true, 'Hostel ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    mode: {
      type: String,
      enum: {
        values: ['INDIVIDUAL_APPROVAL', 'STANDING_PERMISSION', 'HYBRID'],
        message: '{VALUE} is not a valid policy mode',
      },
      default: 'INDIVIDUAL_APPROVAL',
      required: true,
    },
    maxStorageDays: {
      type: Number,
      default: 7,
      min: [1, 'Maximum storage days must be at least 1'],
      max: [60, 'Maximum storage days cannot exceed 60'],
    },
    allowCOD: {
      type: Boolean,
      default: false,
    },
    maxParcelSize: {
      type: String,
      enum: ['SMALL', 'MEDIUM', 'LARGE', 'ANY'],
      default: 'ANY',
    },
    requireWardenApprovalFor: {
      type: [String],
      enum: ['HIGH_VALUE', 'OVERSIZED', 'COD', 'ELECTRONICS'],
      default: ['HIGH_VALUE', 'OVERSIZED'],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// hostelId is already indexed with unique: true
export const HostelPolicy = mongoose.model('HostelPolicy', hostelPolicySchema);

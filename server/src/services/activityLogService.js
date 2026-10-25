import { ActivityLog } from '../models/ActivityLog.js';
import { Parcel } from '../models/Parcel.js';
import { ApiError } from '../utils/ApiError.js';

export async function logActivity({
  actorId,
  actorRole,
  hostelId,
  parcelId = null,
  deliveryAttemptId = null,
  authorizationId = null,
  action,
  previousValue = null,
  newValue = null,
  metadata = {},
  ipAddress = null,
}) {
  try {
    const log = await ActivityLog.create({
      actorId,
      actorRole,
      hostelId: hostelId ? hostelId.toUpperCase() : 'SYSTEM',
      parcelId,
      deliveryAttemptId,
      authorizationId,
      action,
      previousValue,
      newValue,
      metadata,
      ipAddress,
    });
    return log;
  } catch (error) {
    // Non-blocking for primary workflows, but logged
    console.error('Failed to write activity log:', error);
    return null;
  }
}

export async function getActivityLogs(requestingUser, { parcelId, action, hostelId, page = 1, limit = 25 }) {
  const query = {};

  if (requestingUser.role === 'STUDENT') {
    // Student can only see activity related to their parcels or performed by them
    const studentParcels = await Parcel.find({ studentId: requestingUser._id }).select('_id');
    const parcelIds = studentParcels.map((p) => p._id);

    query.$or = [{ actorId: requestingUser._id }, { parcelId: { $in: parcelIds } }];
  } else if (requestingUser.role !== 'ADMIN') {
    query.hostelId = requestingUser.hostelId.toUpperCase();
  } else if (hostelId) {
    query.hostelId = hostelId.toUpperCase();
  }

  if (parcelId) {
    query.parcelId = parcelId;
  }

  if (action) {
    query.action = action;
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 25;
  const skip = (pageNum - 1) * limitNum;

  const total = await ActivityLog.countDocuments(query);
  const logs = await ActivityLog.find(query)
    .populate('actorId', 'name email role')
    .populate('parcelId', 'parcelId trackingNumber courierName')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limitNum);

  return {
    logs,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  };
}

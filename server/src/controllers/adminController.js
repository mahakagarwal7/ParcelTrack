import { User } from '../models/User.js';
import { Parcel } from '../models/Parcel.js';
import { Authorization } from '../models/Authorization.js';
import { DeliveryAttempt } from '../models/DeliveryAttempt.js';
import { ApiError } from '../utils/ApiError.js';
import { PARCEL_STATUS, AUTHORIZATION_STATUS, DELIVERY_ATTEMPT_STATUS } from '../utils/stateMachine.js';

export async function getAllUsers(req, res, next) {
  try {
    const { role, hostelId, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (hostelId) query.hostelId = hostelId.toUpperCase();
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }, { studentId: regex }, { roomNumber: regex }];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { role, hostelId, isActive, standingPermissionSuspended, roomNumber, phone } = req.body;

    const user = await User.findById(id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (role) user.role = role;
    if (hostelId) user.hostelId = hostelId.toUpperCase();
    if (isActive !== undefined) user.isActive = Boolean(isActive);
    if (standingPermissionSuspended !== undefined) {
      user.standingPermissionSuspended = Boolean(standingPermissionSuspended);
    }
    if (roomNumber !== undefined) user.roomNumber = roomNumber;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSystemStats(req, res, next) {
  try {
    const [
      totalUsers,
      totalParcels,
      parcelsReceived,
      parcelsCollected,
      pendingApprovals,
      activeAttempts,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Parcel.countDocuments({}),
      Parcel.countDocuments({ status: PARCEL_STATUS.RECEIVED }),
      Parcel.countDocuments({ status: PARCEL_STATUS.COLLECTED }),
      Authorization.countDocuments({ status: AUTHORIZATION_STATUS.PENDING_WARDEN }),
      DeliveryAttempt.countDocuments({ status: DELIVERY_ATTEMPT_STATUS.AWAITING_AUTHORIZATION }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalParcels,
        parcelsAwaitingCollection: parcelsReceived,
        parcelsCollected,
        pendingWardenApprovals: pendingApprovals,
        activeDeliveryAttempts: activeAttempts,
      },
    });
  } catch (error) {
    next(error);
  }
}

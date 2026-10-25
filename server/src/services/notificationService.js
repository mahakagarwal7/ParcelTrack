import { Notification } from '../models/Notification.js';
import { emitToUser } from '../sockets/socketEmitter.js';
import { ApiError } from '../utils/ApiError.js';

export async function sendNotification({
  recipientId,
  title,
  message,
  type,
  relatedParcelId = null,
  relatedAuthorizationId = null,
}) {
  try {
    const notification = await Notification.create({
      recipientId,
      title,
      message,
      type,
      relatedParcelId,
      relatedAuthorizationId,
    });

    // Real-time delivery via Socket.IO
    emitToUser(recipientId, 'notification:new', notification);

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

export async function getUserNotifications(userId, { unreadOnly = false, page = 1, limit = 20 }) {
  const query = { recipientId: userId };

  if (unreadOnly) {
    query.isRead = false;
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [total, unreadCount, notifications] = await Promise.all([
    Notification.countDocuments(query),
    Notification.countDocuments({ recipientId: userId, isRead: false }),
    Notification.find(query)
      .populate('relatedParcelId', 'parcelId trackingNumber courierName status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  };
}

export async function markAsRead(notificationId, userId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipientId: userId },
    { $set: { isRead: true } },
    { new: true }
  );

  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  return notification;
}

export async function markAllAsRead(userId) {
  const result = await Notification.updateMany(
    { recipientId: userId, isRead: false },
    { $set: { isRead: true } }
  );

  return {
    success: true,
    modifiedCount: result.modifiedCount,
  };
}

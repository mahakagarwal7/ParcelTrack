import * as notificationService from '../services/notificationService.js';

export async function getNotifications(req, res, next) {
  try {
    const { unreadOnly, page, limit } = req.query;
    const result = await notificationService.getUserNotifications(req.user._id, {
      unreadOnly: unreadOnly === 'true',
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationAsRead(req, res, next) {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsAsRead(req, res, next) {
  try {
    const result = await notificationService.markAllAsRead(req.user._id);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

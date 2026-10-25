import * as activityLogService from '../services/activityLogService.js';

export async function getActivityLogs(req, res, next) {
  try {
    const { parcelId, action, hostelId, page, limit } = req.query;
    const result = await activityLogService.getActivityLogs(req.user, {
      parcelId,
      action,
      hostelId,
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

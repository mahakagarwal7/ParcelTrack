import * as deliveryAttemptService from '../services/deliveryAttemptService.js';

export async function searchStudents(req, res, next) {
  try {
    const { query } = req.query;
    const students = await deliveryAttemptService.searchStudents(req.user, query);

    res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    next(error);
  }
}

export async function createAttempt(req, res, next) {
  try {
    const result = await deliveryAttemptService.createDeliveryAttempt(req.user, req.body);

    res.status(201).json({
      success: true,
      message: 'Delivery attempt registered and authorization request dispatched to student',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAttempts(req, res, next) {
  try {
    const { status, page, limit } = req.query;
    const result = await deliveryAttemptService.getDeliveryAttempts(req.user, {
      status,
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

export async function getAttempt(req, res, next) {
  try {
    const attempt = await deliveryAttemptService.getDeliveryAttemptById(req.params.id, req.user);

    res.status(200).json({
      success: true,
      deliveryAttempt: attempt,
    });
  } catch (error) {
    next(error);
  }
}

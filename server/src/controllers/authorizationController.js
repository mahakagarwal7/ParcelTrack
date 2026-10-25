import * as authorizationService from '../services/authorizationService.js';
import { Authorization } from '../models/Authorization.js';
import { DeliveryAttempt } from '../models/DeliveryAttempt.js';
import { AUTHORIZATION_STATUS } from '../utils/stateMachine.js';

export async function getAuthorization(req, res, next) {
  try {
    const auth = await authorizationService.getAuthorizationById(req.params.id);

    // Ownership & hostel check
    if (req.user.role === 'STUDENT' && auth.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    if (req.user.role !== 'ADMIN' && req.user.role !== 'STUDENT' && auth.hostelId !== req.user.hostelId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    res.status(200).json({
      success: true,
      authorization: auth,
    });
  } catch (error) {
    next(error);
  }
}

export async function studentDecision(req, res, next) {
  try {
    const { decision } = req.body; // 'GRANT' or 'REJECT'
    const auth = await authorizationService.processStudentDecision(
      req.params.id,
      req.user,
      decision
    );

    res.status(200).json({
      success: true,
      message: `Consent decision '${decision}' recorded successfully`,
      authorization: auth,
    });
  } catch (error) {
    next(error);
  }
}

export async function wardenDecision(req, res, next) {
  try {
    const { decision, comments } = req.body; // 'APPROVE' or 'REJECT'
    const auth = await authorizationService.processWardenDecision(
      req.params.id,
      req.user,
      decision,
      comments
    );

    res.status(200).json({
      success: true,
      message: `Warden decision '${decision}' recorded successfully`,
      authorization: auth,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPendingWardenApprovals(req, res, next) {
  try {
    const hostelId = req.query.hostelId || req.user.hostelId;
    const query = {
      status: AUTHORIZATION_STATUS.PENDING_WARDEN,
    };

    if (req.user.role !== 'ADMIN') {
      query.hostelId = req.user.hostelId;
    } else if (hostelId) {
      query.hostelId = hostelId;
    }

    const pending = await Authorization.find(query)
      .populate('studentId', 'name email roomNumber studentId phone')
      .populate('parcelId')
      .populate('deliveryAttemptId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pending.length,
      authorizations: pending,
    });
  } catch (error) {
    next(error);
  }
}

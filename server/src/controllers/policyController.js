import * as policyService from '../services/policyService.js';

export async function getPolicy(req, res, next) {
  try {
    const hostelId = req.query.hostelId || req.user.hostelId;
    const policy = await policyService.getOrCreatePolicy(hostelId);

    res.status(200).json({
      success: true,
      policy,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePolicy(req, res, next) {
  try {
    const hostelId = req.body.hostelId || req.user.hostelId;
    const policy = await policyService.updatePolicy(hostelId, req.body, req.user);

    res.status(200).json({
      success: true,
      message: 'Hostel policy updated successfully',
      policy,
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleSuspension(req, res, next) {
  try {
    const { id: studentId } = req.params;
    const { isSuspended } = req.body;

    const student = await policyService.toggleStudentSuspension(
      studentId,
      isSuspended,
      req.user
    );

    res.status(200).json({
      success: true,
      message: `Standing permission ${student.standingPermissionSuspended ? 'suspended' : 'restored'} for student`,
      student,
    });
  } catch (error) {
    next(error);
  }
}

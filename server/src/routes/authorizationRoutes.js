import express from 'express';
import {
  getAuthorization,
  studentDecision,
  wardenDecision,
  getPendingWardenApprovals,
} from '../controllers/authorizationController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(protect);

// Warden approval queue
router.get('/pending', authorize('WARDEN', 'ADMIN'), getPendingWardenApprovals);

// Student decision (Grant / Reject consent)
router.post('/:id/student-decision', authorize('STUDENT'), studentDecision);

// Warden decision (Approve / Reject authorization)
router.post('/:id/warden-decision', authorize('WARDEN', 'ADMIN'), wardenDecision);

// Single authorization lookup
router.get('/:id', getAuthorization);

export default router;

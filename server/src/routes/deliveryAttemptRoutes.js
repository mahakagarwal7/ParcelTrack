import express from 'express';
import {
  searchStudents,
  createAttempt,
  getAttempts,
  getAttempt,
} from '../controllers/deliveryAttemptController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(protect);

// Guard searches students in their hostel
router.get('/students/search', authorize('GUARD', 'WARDEN', 'ADMIN'), searchStudents);

// Guard registers unexpected delivery attempt at the gate
router.post('/', authorize('GUARD', 'ADMIN'), createAttempt);

// Get delivery attempts (filtered by role and hostel)
router.get('/', getAttempts);

// Single delivery attempt
router.get('/:id', getAttempt);

export default router;

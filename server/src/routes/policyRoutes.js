import express from 'express';
import { getPolicy, updatePolicy, toggleSuspension } from '../controllers/policyController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';
import { enforceHostelScope } from '../middleware/hostelScope.js';

const router = express.Router();

router.use(protect); // All routes below require login

// Get active policy for user's hostel
router.get('/policy', getPolicy);

// Warden or Admin updates hostel policy
router.patch(
  '/policy',
  authorize('WARDEN', 'ADMIN'),
  enforceHostelScope((req) => req.body.hostelId || req.user.hostelId),
  updatePolicy
);

// Warden or Admin manages student standing permission suspension
router.patch(
  '/students/:id/suspension',
  authorize('WARDEN', 'ADMIN'),
  toggleSuspension
);

export default router;

import express from 'express';
import { getAllUsers, updateUser, getSystemStats } from '../controllers/adminController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN'));

router.get('/users', getAllUsers);
router.patch('/users/:id', updateUser);
router.get('/stats', getSystemStats);

export default router;

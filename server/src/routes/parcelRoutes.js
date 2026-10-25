import express from 'express';
import { registerParcel, getMyParcels, getParcel } from '../controllers/parcelController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(protect);

// Student routes
router.post('/', authorize('STUDENT'), registerParcel);
router.get('/my', authorize('STUDENT'), getMyParcels);

// Single parcel inspection (guarded by ownership/hostel inside controller)
router.get('/:id', getParcel);

export default router;

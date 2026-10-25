import express from 'express';
import {
  registerParcel,
  getMyParcels,
  getParcel,
  receiveParcel,
  getGuardActiveParcels,
  lookupGateAuthorization,
} from '../controllers/parcelController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(protect);

// Guard routes (must be placed before /:id)
router.get('/guard/active', authorize('GUARD', 'ADMIN'), getGuardActiveParcels);
router.get('/guard/lookup', authorize('GUARD', 'ADMIN'), lookupGateAuthorization);
router.post('/:id/receive', authorize('GUARD', 'ADMIN'), receiveParcel);

// Student routes
router.post('/', authorize('STUDENT'), registerParcel);
router.get('/my', authorize('STUDENT'), getMyParcels);

// Single parcel inspection
router.get('/:id', getParcel);

export default router;

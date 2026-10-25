import express from 'express';
import {
  registerParcel,
  getMyParcels,
  getParcel,
  receiveParcel,
  getGuardActiveParcels,
  lookupGateAuthorization,
  requestCollectionOtp,
  verifyOtpAndCollect,
} from '../controllers/parcelController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(protect);

// Guard routes (must precede /:id)
router.get('/guard/active', authorize('GUARD', 'ADMIN'), getGuardActiveParcels);
router.get('/guard/lookup', authorize('GUARD', 'ADMIN'), lookupGateAuthorization);

// Guard actions on parcels
router.post('/:id/receive', authorize('GUARD', 'ADMIN'), receiveParcel);
router.post('/:id/collect', authorize('GUARD', 'ADMIN'), verifyOtpAndCollect);

// Student actions on parcels
router.post('/', authorize('STUDENT'), registerParcel);
router.get('/my', authorize('STUDENT'), getMyParcels);
router.post('/:id/collection-otp', authorize('STUDENT'), requestCollectionOtp);

// Single parcel inspection (accessible by student owner or guard/warden within hostel)
router.get('/:id', getParcel);

export default router;

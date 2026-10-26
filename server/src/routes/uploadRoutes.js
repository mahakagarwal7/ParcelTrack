import express from 'express';
import { upload } from '../middleware/upload.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided. Please upload an image under field name "image".',
      });
    }

    const result = await uploadToCloudinary(req.file.buffer, 'parceltrack/inspection_photos');

    res.status(200).json({
      success: true,
      message: 'Photo uploaded to Cloudinary successfully',
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

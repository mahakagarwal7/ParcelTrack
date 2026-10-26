import cloudinary from '../config/cloudinary.js';
import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/env.js';

export async function uploadToCloudinary(fileBuffer, folder = 'parceltrack/inspection_photos') {
  if (!config.cloudinaryCloudName || !config.cloudinaryApiKey || !config.cloudinaryApiSecret) {
    throw ApiError.badRequest(
      'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in server/.env'
    );
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(ApiError.internal(`Cloudinary upload failed: ${error.message}`));
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
}

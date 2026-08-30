import sharp from 'sharp';
import { cloudinary, isCloudinaryConfigured, configureCloudinary } from '../config/cloudinary.js';
import ApiError from './ApiError.js';

const MAX_DIMENSION = 5000;
const THUMBNAIL_SIZE = 400;

/** Verify the binary, enforce dimensions, and normalize every image to a 400px WebP thumbnail. */
export const prepareImage = async (buffer) => {
  let metadata;
  try {
    metadata = await sharp(buffer).metadata();
  } catch {
    throw ApiError.badRequest('The uploaded file is not a valid image');
  }

  if (!metadata.width || !metadata.height || metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
    throw ApiError.badRequest(`Image dimensions must be between 1 and ${MAX_DIMENSION}px`);
  }

  return sharp(buffer)
    .rotate()
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: 'cover', position: 'attention' })
    .webp({ quality: 85 })
    .toBuffer();
};

const uploadToCloudinary = (buffer, folder) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    { folder, resource_type: 'image', format: 'webp' },
    (error, result) => (error ? reject(error) : resolve(result))
  );
  stream.end(buffer);
});

export const uploadImage = async (buffer, folder) => {
  if (!isCloudinaryConfigured() || !configureCloudinary()) {
    throw new ApiError(503, 'Image uploads are not configured');
  }
  const prepared = await prepareImage(buffer);
  try {
    const result = await uploadToCloudinary(prepared, folder);
    return { url: result.secure_url, publicId: result.public_id };
  } catch {
    throw new ApiError(502, 'Image upload service is unavailable');
  }
};

/** Cleanup is deliberately best-effort after a record has been persisted/deleted. */
export const deleteImage = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured() || !configureCloudinary()) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (error) {
    console.error('Cloudinary cleanup failed:', error.message);
  }
};

export { MAX_DIMENSION, THUMBNAIL_SIZE };

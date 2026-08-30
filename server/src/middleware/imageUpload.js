import multer from 'multer';
import ApiError from '../utils/ApiError.js';
import { ALLOWED_IMAGE_MIME_TYPES, getMaxFileSize } from '../config/upload.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: getMaxFileSize() },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      return callback(new Error('Only JPG, PNG, and WebP images are allowed'));
    }
    callback(null, true);
  },
});

/** Convert Multer failures into the API's normal 400 validation envelope. */
export const imageUpload = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return next(ApiError.badRequest(`Image must not exceed ${Math.round(getMaxFileSize() / 1024 / 1024)}MB`));
    }
    return next(ApiError.badRequest(error.message || 'Invalid image upload'));
  });
};

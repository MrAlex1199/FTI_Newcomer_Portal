import fs from 'fs';
import path from 'path';
import multer from 'multer';
import ApiError from '../utils/ApiError.js';

const uploadDir = path.resolve('uploads/floorplans');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `fp-bg-${uniqueSuffix}${ext}`);
  },
});

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

const upload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('รองรับเฉพาะไฟล์ภาพ PNG, JPG และ WebP เท่านั้น'));
    }
    cb(null, true);
  },
});

export const floorPlanImageUpload = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return next(ApiError.badRequest('ขนาดไฟล์ภาพต้องไม่เกิน 10MB'));
    }
    return next(ApiError.badRequest(error.message || 'การอัปโหลดไฟล์ภาพไม่ถูกต้อง'));
  });
};

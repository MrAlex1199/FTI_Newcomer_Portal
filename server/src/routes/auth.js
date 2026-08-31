import { Router } from 'express';
import { register, login, logout, refresh, getMe } from '../controllers/authController.js';
import { getMyProfile, updateMyProfile } from '../controllers/profileController.js';
import { registerValidator, loginValidator } from '../validators/authValidators.js';
import { updateProfileValidator } from '../validators/profileValidators.js';
import validate from '../middleware/validate.js';
import { authenticate, attachUserIfPresent } from '../middleware/auth.js';
import authRateLimiter from '../middleware/authRateLimiter.js';
import { imageUpload } from '../middleware/imageUpload.js';

const router = Router();

router.post('/register', authRateLimiter, registerValidator, validate, register);
router.post('/login', authRateLimiter, loginValidator, validate, login);
router.post('/logout', attachUserIfPresent, logout);
router.post('/refresh', refresh);
router.get('/me', authenticate, getMe);
router.get('/profile', authenticate, getMyProfile);
router.patch('/profile', authenticate, imageUpload('profileImage'), updateProfileValidator, validate, updateMyProfile);

export default router;

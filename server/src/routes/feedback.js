import rateLimit from 'express-rate-limit';
import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { submitFeedback, listFeedback, updateFeedbackStatus } from '../controllers/feedbackController.js';
import { submitFeedbackValidator, listFeedbackValidator, updateFeedbackValidator } from '../validators/feedbackValidators.js';

const router = Router();
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { success: false, message: 'Too many feedback submissions. Please try again later.' },
});

router.use(authenticate);
router.post('/', submitLimiter, requirePermission('feedback:submit'), submitFeedbackValidator, validate, submitFeedback);
router.get('/', requirePermission('feedback:manage'), listFeedbackValidator, validate, listFeedback);
router.patch('/:id/status', requirePermission('feedback:manage'), updateFeedbackValidator, validate, updateFeedbackStatus);

export default router;

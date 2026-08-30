import { Router } from 'express';
import {
  listFaqs,
  getFaq,
  createFaq,
  updateFaq,
  deleteFaq,
  reorderFaqs,
  listFaqCategories,
} from '../controllers/faqController.js';
import {
  createFaqValidator,
  updateFaqValidator,
  faqIdValidator,
  listFaqValidator,
  reorderFaqValidator,
} from '../validators/faqValidators.js';
import validate from '../middleware/validate.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.get('/categories', requirePermission('faq:view'), listFaqCategories);
router.patch('/reorder', requirePermission('faq:manage'), reorderFaqValidator, validate, reorderFaqs);
router.get('/', requirePermission('faq:view'), listFaqValidator, validate, listFaqs);
router.get('/:id', requirePermission('faq:view'), faqIdValidator, validate, getFaq);
router.post('/', requirePermission('faq:manage'), createFaqValidator, validate, createFaq);
router.patch('/:id', requirePermission('faq:manage'), updateFaqValidator, validate, updateFaq);
router.delete('/:id', requirePermission('faq:manage'), faqIdValidator, validate, deleteFaq);

export default router;

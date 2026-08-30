import { Router } from 'express';
import {
  listInternBatches,
  getInternBatch,
  createInternBatch,
  updateInternBatch,
  deleteInternBatch,
} from '../controllers/internBatchController.js';
import {
  createInternBatchValidator,
  updateInternBatchValidator,
  internBatchIdValidator,
  listInternBatchesValidator,
} from '../validators/internBatchValidators.js';
import validate from '../middleware/validate.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { imageUpload } from '../middleware/imageUpload.js';

const router = Router();
router.use(authenticate);
router.get('/', requirePermission('interns:view'), listInternBatchesValidator, validate, listInternBatches);
router.get('/:id', requirePermission('interns:view'), internBatchIdValidator, validate, getInternBatch);
router.post('/', requirePermission('interns:manage'), imageUpload('groupPhoto'), createInternBatchValidator, validate, createInternBatch);
router.patch('/:id', requirePermission('interns:manage'), imageUpload('groupPhoto'), updateInternBatchValidator, validate, updateInternBatch);
router.delete('/:id', requirePermission('interns:manage'), internBatchIdValidator, validate, deleteInternBatch);

export default router;

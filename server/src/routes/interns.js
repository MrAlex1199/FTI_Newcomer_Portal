import { Router } from 'express';
import {
  listInterns,
  getIntern,
  createIntern,
  updateIntern,
  deleteIntern,
} from '../controllers/internController.js';
import {
  createInternValidator,
  updateInternValidator,
  internIdValidator,
  listInternsValidator,
} from '../validators/internValidators.js';
import validate from '../middleware/validate.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { imageUpload } from '../middleware/imageUpload.js';

const router = Router();
router.use(authenticate);
router.get('/', requirePermission('interns:view'), listInternsValidator, validate, listInterns);
router.get('/:id', requirePermission('interns:view'), internIdValidator, validate, getIntern);
router.post('/', requirePermission('interns:manage'), imageUpload('profileImage'), createInternValidator, validate, createIntern);
router.patch('/:id', requirePermission('interns:manage'), imageUpload('profileImage'), updateInternValidator, validate, updateIntern);
router.delete('/:id', requirePermission('interns:manage'), internIdValidator, validate, deleteIntern);

export default router;

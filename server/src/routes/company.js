import { Router } from 'express';
import { getCompanyInfo, updateCompanyInfo } from '../controllers/companyController.js';
import validate from '../middleware/validate.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { updateCompanyValidator } from '../validators/companyValidators.js';

const router = Router();
router.use(authenticate);
router.get('/', requirePermission('organization:view'), getCompanyInfo);
router.patch('/', requirePermission('knowledge:manage'), updateCompanyValidator, validate, updateCompanyInfo);

export default router;

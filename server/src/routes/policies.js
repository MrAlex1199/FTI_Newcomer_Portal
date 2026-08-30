import { Router } from 'express';
import {
  listPolicies,
  getPolicy,
  createPolicy,
  updatePolicy,
  deletePolicy,
  listPolicyCategories,
} from '../controllers/policyController.js';
import {
  createPolicyValidator,
  updatePolicyValidator,
  policyIdValidator,
  listPolicyValidator,
} from '../validators/policyValidators.js';
import validate from '../middleware/validate.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.get('/categories', requirePermission('policies:view'), listPolicyCategories);
router.get('/', requirePermission('policies:view'), listPolicyValidator, validate, listPolicies);
router.get('/:id', requirePermission('policies:view'), policyIdValidator, validate, getPolicy);
router.post('/', requirePermission('policies:manage'), createPolicyValidator, validate, createPolicy);
router.patch('/:id', requirePermission('policies:manage'), updatePolicyValidator, validate, updatePolicy);
router.delete('/:id', requirePermission('policies:manage'), policyIdValidator, validate, deletePolicy);

export default router;

import { Router } from 'express';
import { organizationTree, updateReportingStructure } from '../controllers/organizationController.js';
import validate from '../middleware/validate.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { organizationTreeValidator, reportingUpdateValidator } from '../validators/organizationValidators.js';

const router = Router();
router.use(authenticate);

router.get('/tree', requirePermission('organization:view'), organizationTreeValidator, validate, organizationTree);
router.patch(
  '/reporting/:employeeId',
  requirePermission('employees:manage'),
  reportingUpdateValidator,
  validate,
  updateReportingStructure,
);

export default router;

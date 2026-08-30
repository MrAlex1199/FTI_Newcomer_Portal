import { Router } from 'express';
import { getAdminDashboardStatistics } from '../controllers/adminDashboardController.js';
import { adminDashboardValidator } from '../validators/adminDashboardValidators.js';
import validate from '../middleware/validate.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, requirePermission('admin-dashboard:view'));
router.get('/dashboard/statistics', adminDashboardValidator, validate, getAdminDashboardStatistics);

export default router;

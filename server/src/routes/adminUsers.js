import { Router } from 'express';
import {
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  resetAdminUserPassword,
  bulkDeactivateAdminUsers,
  listAuditLogs,
} from '../controllers/adminUserController.js';
import {
  listUsersValidator,
  createUserValidator,
  updateUserValidator,
  userIdValidator,
  resetPasswordValidator,
  bulkDeactivateValidator,
  auditLogsValidator,
} from '../validators/adminUserValidators.js';
import validate from '../middleware/validate.js';
import { auditMutation } from '../services/auditService.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/users', requirePermission('users:manage'), listUsersValidator, validate, listAdminUsers);
router.post('/users', requirePermission('users:manage'), auditMutation, createUserValidator, validate, createAdminUser);
router.post('/users/bulk/deactivate', requirePermission('users:manage'), auditMutation, bulkDeactivateValidator, validate, bulkDeactivateAdminUsers);
router.patch('/users/:id', requirePermission('users:manage'), auditMutation, updateUserValidator, validate, updateAdminUser);
router.post('/users/:id/reset-password', requirePermission('users:manage'), auditMutation, resetPasswordValidator, validate, resetAdminUserPassword);

router.get('/audit-logs', requirePermission('auditlog:view'), auditLogsValidator, validate, listAuditLogs);

export default router;

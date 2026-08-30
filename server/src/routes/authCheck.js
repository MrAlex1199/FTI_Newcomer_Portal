import { Router } from 'express';
import {
  authenticate,
  authorize,
  requirePermission,
  authorizeOwnerOrRoles,
} from '../middleware/auth.js';
import { ROLES } from '../config/permissions.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Development-only routes to exercise the authorization layer end-to-end
 * before real CRUD endpoints exist. Mounted only when NODE_ENV !== 'production'
 * (see app.js). Not part of the public API surface.
 *
 * Each route echoes back the caller's role so a test harness can assert both
 * the allow (200 + role) and deny (403) paths.
 */
const router = Router();

const ok = (label) =>
  asyncHandler(async (req, res) => {
    res.status(200).json({ success: true, route: label, role: req.user.role });
  });

// Any authenticated user.
router.get('/any', authenticate, ok('any'));

// Permission-matrix gated (preferred style).
router.get(
  '/manage-employees',
  authenticate,
  requirePermission('employees:manage'),
  ok('manage-employees')
);
router.get(
  '/manage-content',
  authenticate,
  requirePermission('policies:manage'),
  ok('manage-content')
);
router.get(
  '/view-auditlog',
  authenticate,
  requirePermission('auditlog:view'),
  ok('view-auditlog')
);

// Ad-hoc role list style.
router.get('/admins-only', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), ok('admins-only'));

// Ownership guard: :userId owner may pass, otherwise must be admin/super_admin.
// Mirrors the "edit own profile" matrix cell.
router.get(
  '/owner-or-admin/:userId',
  authenticate,
  authorizeOwnerOrRoles((req) => req.params.userId, ROLES.SUPER_ADMIN, ROLES.ADMIN),
  ok('owner-or-admin')
);

export default router;

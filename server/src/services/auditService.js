import { AuditLog } from '../models/index.js';

/**
 * Keep audit writes consistent while allowing existing controllers to retain
 * their explicit before/after snapshots. This middleware exposes a request-
 * scoped writer instead of blindly logging every mutation (which would
 * duplicate the existing controller-level records and cannot know `before`).
 */
export const auditMutation = (req, _res, next) => {
  req.recordAudit = (entry) => AuditLog.record({
    ...entry,
    userId: entry.userId ?? req.user?.id ?? null,
    ip: entry.ip ?? req.ip,
    userAgent: entry.userAgent ?? req.get('user-agent') ?? '',
  });
  next();
};

/** Explicit allowlist for User snapshots; credentials and lockout internals never enter the log. */
export const safeUserSnapshot = (user) => {
  if (!user) return null;
  const value = typeof user.toObject === 'function' ? user.toObject() : user;
  return {
    _id: value._id,
    username: value.username,
    email: value.email,
    role: value.role,
    employeeId: value.employeeId ?? null,
    internId: value.internId ?? null,
    isActive: value.isActive,
    lastLoginAt: value.lastLoginAt ?? null,
    mustChangePassword: value.mustChangePassword,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
};

/** Explicit allowlist for API responses, excluding token and lockout internals. */
export const serializeUser = (user) => safeUserSnapshot(user);

import { User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { ACCESS_TOKEN_COOKIE } from '../utils/cookies.js';
import { can } from '../config/permissions.js';

/**
 * Verifies the access token from its HttpOnly cookie and attaches a minimal
 * `req.user` ({ id, role }) for downstream handlers. Confirms the account
 * still exists and is active on every request rather than trusting the
 * token's claims for the account's entire lifetime - a deactivated user is
 * rejected immediately instead of waiting up to 15 minutes for the access
 * token to expire.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE];
  if (!token) {
    throw ApiError.unauthorized('Authentication required');
  }

  const payload = verifyAccessToken(token); // throws on invalid/expired - caught by asyncHandler

  const user = await User.findById(payload.sub).select('_id role isActive');
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Authentication required');
  }

  req.user = { id: user._id.toString(), role: user.role };
  next();
});

/**
 * Restricts a route to a set of roles. Must run after `authenticate`.
 * Accepts explicit role names for ad-hoc gating:
 *   authorize('admin', 'super_admin')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission to perform this action'));
  }
  next();
};

/**
 * Preferred gate for feature routes: checks a named permission against the
 * central matrix in config/permissions.js instead of an inline role list, so
 * the policy stays in one place.
 *   router.post('/employees', authenticate, requirePermission('employees:manage'), ...)
 */
const requirePermission = (action) => (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }
  if (!can(req.user.role, action)) {
    return next(ApiError.forbidden('You do not have permission to perform this action'));
  }
  next();
};

/**
 * Ownership guard: allows the request when the authenticated user owns the
 * target resource, OR holds one of the fallback roles (typically the "manage"
 * roles for that resource). This expresses the spec's "Own profile" cells in
 * the authorization matrix - e.g. an intern may edit their own profile, while
 * admins may edit anyone's.
 *
 * `getOwnerId(req)` returns the id that must match the requester. It may be
 * async (e.g. to look up the owning user of a resource). Returning null/undefined
 * means ownership cannot be established, so access falls to the role check.
 *
 *   authorizeOwnerOrRoles(
 *     (req) => req.params.userId,
 *     ROLES.SUPER_ADMIN, ROLES.ADMIN
 *   )
 */
const authorizeOwnerOrRoles = (getOwnerId, ...fallbackRoles) =>
  asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    const ownerId = await getOwnerId(req);
    if (ownerId && ownerId.toString() === req.user.id) {
      return next();
    }

    if (fallbackRoles.includes(req.user.role)) {
      return next();
    }

    return next(ApiError.forbidden('You do not have permission to perform this action'));
  });

/**
 * Like `authenticate`, but never rejects the request. Used on /auth/logout so
 * a request with an already-expired (or missing) access token still reaches
 * the controller and gets its cookies cleared, instead of dead-ending in a
 * 401 before logout can run. Populates req.user when the token is valid,
 * leaves it undefined otherwise.
 */
const attachUserIfPresent = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE];
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select('_id role isActive');
    if (user && user.isActive) {
      req.user = { id: user._id.toString(), role: user.role };
    }
  } catch {
    // Expired or invalid - proceed unauthenticated rather than failing the request.
  }
  next();
});

export {
  authenticate,
  authorize,
  requirePermission,
  authorizeOwnerOrRoles,
  attachUserIfPresent,
};

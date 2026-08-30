import { User, AuditLog } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { setAuthCookies, clearAuthCookies, REFRESH_TOKEN_COOKIE } from '../utils/cookies.js';

const issueSession = async (res, user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  setAuthCookies(res, { accessToken, refreshToken });
};

/**
 * POST /auth/register
 * Public self-registration. Always creates a 'staff' account - callers
 * cannot request a role. Elevated roles are granted later by an admin.
 */
export const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    const field = existing.username === username ? 'username' : 'email';
    throw ApiError.conflict(`This ${field} is already registered`);
  }

  const user = await User.create({ username, email, password, role: 'staff' });

  await issueSession(res, user);
  await AuditLog.record({
    userId: user._id,
    action: 'create',
    entity: 'User',
    entityId: user._id,
    after: { username: user.username, email: user.email, role: user.role },
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  res.status(201).json({ success: true, data: { user } });
});

/**
 * POST /auth/login
 * Rejects with the same generic message whether the username doesn't exist
 * or the password is wrong, so the endpoint can't be used to enumerate valid
 * usernames. Locked accounts get their own message since that state is only
 * reachable after already proving you know a valid username.
 */
export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username: username.toLowerCase().trim() }).select(
    '+password +failedLoginAttempts +lockUntil'
  );

  if (!user) {
    throw ApiError.unauthorized('Invalid username or password');
  }

  if (user.isLocked) {
    const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
    throw ApiError.tooManyRequests(
      `Account temporarily locked due to repeated failed logins. Try again in ${minutesLeft} minute(s).`
    );
  }

  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated. Contact an administrator.');
  }

  const passwordMatches = await user.comparePassword(password);
  if (!passwordMatches) {
    await user.registerFailedLogin();
    throw ApiError.unauthorized('Invalid username or password');
  }

  await user.registerSuccessfulLogin();
  await issueSession(res, user);
  await AuditLog.record({
    userId: user._id,
    action: 'login',
    entity: 'User',
    entityId: user._id,
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  // Strip the fields we had to select explicitly before sending the user back.
  user.password = undefined;
  user.failedLoginAttempts = undefined;
  user.lockUntil = undefined;

  res.status(200).json({ success: true, data: { user } });
});

/**
 * POST /auth/logout
 * Bumps tokenVersion so the refresh token just cleared from the cookie (and
 * any other copy of it) can no longer be used even if it's still unexpired.
 */
export const logout = asyncHandler(async (req, res) => {
  // The access token may already be expired even though the refresh token
  // cookie is still present - fall back to it so we still identify the user
  // and revoke their session rather than silently no-op-ing.
  let userId = req.user?.id;
  if (!userId) {
    const refreshCookie = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (refreshCookie) {
      try {
        userId = verifyRefreshToken(refreshCookie).sub;
      } catch {
        // Refresh token invalid/expired - nothing to revoke, just clear cookies below.
      }
    }
  }

  if (userId) {
    const user = await User.findById(userId);
    if (user) {
      await user.invalidateTokens();
      await AuditLog.record({
        userId: user._id,
        action: 'logout',
        entity: 'User',
        entityId: user._id,
        ip: req.ip,
        userAgent: req.get('user-agent') || '',
      });
    }
  }

  clearAuthCookies(res);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

/**
 * POST /auth/refresh
 * Reads the refresh token from its own cookie (never from the request body),
 * confirms it matches the user's current tokenVersion, and issues a fresh
 * access/refresh pair. Any failure clears cookies so the client doesn't keep
 * retrying with a dead token.
 */
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_TOKEN_COOKIE];
  if (!token) {
    throw ApiError.unauthorized('Refresh token missing');
  }

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    clearAuthCookies(res);
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) {
    clearAuthCookies(res);
    throw ApiError.unauthorized('Refresh token is no longer valid');
  }

  await issueSession(res, user);
  res.status(200).json({ success: true, message: 'Token refreshed' });
});

/**
 * GET /auth/me
 * Returns the current user. Requires the `authenticate` middleware to have
 * already populated req.user from the access token.
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('employeeId')
    .populate('internId');

  if (!user) {
    throw ApiError.unauthorized('User no longer exists');
  }

  res.status(200).json({ success: true, data: { user } });
});

import jwt from 'jsonwebtoken';

/**
 * JWT signing/verification helpers.
 *
 * Two token types:
 *  - Access token:  short-lived (default 15m), carries id + role, sent on every
 *                    authenticated request via the HttpOnly cookie.
 *  - Refresh token: longer-lived (default 7d), carries id + tokenVersion only,
 *                    used solely to mint a new access token at /auth/refresh.
 *
 * Secrets and expiry are read from environment variables so they can differ
 * between environments without touching code.
 */

const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const signAccessToken = (user) => {
  const secret = requireEnv('JWT_SECRET');
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

export const signRefreshToken = (user) => {
  const secret = requireEnv('REFRESH_TOKEN_SECRET');
  return jwt.sign(
    { sub: user._id.toString(), tokenVersion: user.tokenVersion ?? 0 },
    secret,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  );
};

/** Throws jwt.JsonWebTokenError / jwt.TokenExpiredError on failure - let the caller handle it. */
export const verifyAccessToken = (token) => jwt.verify(token, requireEnv('JWT_SECRET'));

export const verifyRefreshToken = (token) =>
  jwt.verify(token, requireEnv('REFRESH_TOKEN_SECRET'));

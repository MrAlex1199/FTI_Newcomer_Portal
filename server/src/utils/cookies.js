/**
 * HttpOnly cookie helpers for the access/refresh token pair.
 *
 * `secure` is tied to NODE_ENV rather than hardcoded so local HTTP development
 * keeps working while production always requires HTTPS for the cookie to be
 * sent. `sameSite: 'lax'` allows normal top-level navigation while still
 * blocking the cookie on cross-site requests forged from another origin.
 */

const isProduction = () => process.env.NODE_ENV === 'production';

const ACCESS_TOKEN_COOKIE = 'accessToken';
const REFRESH_TOKEN_COOKIE = 'refreshToken';

const parseDurationMs = (value, fallbackMs) => {
  if (!value) return fallbackMs;
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]];
  return amount * unitMs;
};

const baseCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: 'lax',
  path: '/',
});

export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...baseCookieOptions(),
    maxAge: parseDurationMs(process.env.JWT_EXPIRES_IN, 15 * 60 * 1000),
  });

  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...baseCookieOptions(),
    // Refresh token is only ever read by /auth/refresh and /auth/logout.
    path: '/api/v1/auth',
    maxAge: parseDurationMs(process.env.REFRESH_TOKEN_EXPIRES_IN, 7 * 24 * 60 * 60 * 1000),
  });
};

export const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, baseCookieOptions());
  res.clearCookie(REFRESH_TOKEN_COOKIE, { ...baseCookieOptions(), path: '/api/v1/auth' });
};

export { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE };

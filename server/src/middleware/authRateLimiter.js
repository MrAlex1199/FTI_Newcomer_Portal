import rateLimit from 'express-rate-limit';

/**
 * Stricter limit than the global API limiter (spec section 3.1: "rate limit
 * ที่ Login"). Keyed by IP + submitted username so one abusive IP can't lock
 * out every account, and one attacker cycling usernames from the same IP
 * still gets throttled.
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
  keyGenerator: (req) => `${req.ip}:${(req.body?.username || '').toLowerCase()}`,
});

export default authRateLimiter;

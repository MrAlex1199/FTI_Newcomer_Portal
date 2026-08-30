# Task 3: Authentication System - Registration & Login - ✅ COMPLETED

**Date:** August 30, 2026
**Status:** ✅ All 10 subtasks completed and verified end-to-end

---

## Summary

Implemented a complete authentication system using JWT stored in HttpOnly cookies, bcrypt password hashing, account lockout, and endpoint rate limiting. The system exposes five endpoints (register, login, logout, refresh, me) and includes reusable error-handling and validation infrastructure that the rest of the API will build on.

All flows were verified against the live server using a real HTTP client with a cookie jar. One genuine bug was found and fixed during testing (see "Bug Found and Fixed").

---

## Completed Subtasks

### ✅ 3.1: tokenVersion field for token revocation

**File:** `server/src/models/User.js`

- Added `tokenVersion` field (Number, default 0).
- Added `invalidateTokens()` method that increments `tokenVersion` and saves.
- Refresh tokens embed the `tokenVersion` at issuance. On refresh, the stored value must match the token's value.
- Logout and (future) password change bump this counter, immediately invalidating any previously issued refresh token without needing a blacklist table.

### ✅ 3.2: JWT utility

**File:** `server/src/utils/jwt.js`

- `signAccessToken(user)` - short-lived (default 15m), payload `{ sub, role }`.
- `signRefreshToken(user)` - longer-lived (default 7d), payload `{ sub, tokenVersion }`.
- `verifyAccessToken(token)` / `verifyRefreshToken(token)` - throw on invalid/expired, caught upstream.
- Secrets and expiry read from environment variables (`JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `JWT_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`).

### ✅ 3.3: Cookie utility

**File:** `server/src/utils/cookies.js`

- `setAuthCookies(res, { accessToken, refreshToken })` and `clearAuthCookies(res)`.
- `accessToken` cookie scoped to path `/`.
- `refreshToken` cookie scoped to path `/api/v1/auth` so the browser only sends it to auth endpoints, reducing exposure.
- `httpOnly: true` on both; `secure` tied to `NODE_ENV === 'production'` (local HTTP dev still works); `sameSite: 'lax'`.
- Cookie `maxAge` derived from the same duration strings used for token expiry.

### ✅ 3.4: ApiError and asyncHandler

**Files:** `server/src/utils/ApiError.js`, `server/src/utils/asyncHandler.js`, `server/src/middleware/errorHandler.js`

- `ApiError` with static factories: `badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`, `tooManyRequests`.
- `asyncHandler(fn)` wraps async route handlers so rejected promises reach Express's error middleware.
- `errorHandler` extended with `normalizeError()` mapping:
  - `ApiError.statusCode` passthrough
  - Mongoose `ValidationError` -> 400 with per-field messages
  - Duplicate key (`11000`) -> 409
  - `CastError` -> 400
  - JWT `TokenExpiredError` -> 401 "Token has expired"
  - JWT `JsonWebTokenError` -> 401 "Invalid token"
- Consistent response shape: `{ success: false, message, errors? }`; stack included in development only; only 5xx logged to console.

### ✅ 3.5: Auth validators

**Files:** `server/src/validators/authValidators.js`, `server/src/middleware/validate.js`

- `registerValidator` - username (3-30, charset), email format, password (min 8, at least one letter and one number).
- `loginValidator` - username and password required.
- **No `role` field in registration** - public self-registration always creates `staff`. Role elevation is an admin action (future task).
- `validate` middleware collects express-validator errors into `{ field: message }` and throws `ApiError.badRequest('Validation failed', details)`, matching the error handler's shape.

### ✅ 3.6: Auth controller

**File:** `server/src/controllers/authController.js`

- `register` - rejects duplicate username/email (409), creates `staff` user, issues session, writes an audit entry, returns 201.
- `login` - identical generic message for unknown username and wrong password (no user enumeration); increments failed attempts on wrong password; blocks locked and deactivated accounts; clears selected sensitive fields before responding.
- `logout` - identifies the user from the access token or, if expired, falls back to decoding the refresh cookie; bumps `tokenVersion`; clears cookies; audits.
- `refresh` - reads the refresh token only from its cookie (never the body), verifies `tokenVersion` match, issues a fresh pair; clears cookies on any failure.
- `getMe` - returns the current user with `employeeId` and `internId` populated.
- All state-changing actions write an `AuditLog` entry (with the model's built-in secret redaction).

### ✅ 3.7: authenticate middleware

**File:** `server/src/middleware/auth.js`

- `authenticate` - strict; reads access token from cookie, verifies it, re-checks the user exists and is active on every request, attaches `req.user = { id, role }`; 401 otherwise.
- `authorize(...roles)` - role gate to run after `authenticate` (prepared for Task 4).
- `attachUserIfPresent` - lenient variant used only on logout so an already-expired access token doesn't block clearing cookies / revoking the session.

### ✅ 3.8: Auth rate limiter

**File:** `server/src/middleware/authRateLimiter.js`

- 5 requests / 15 minutes on auth endpoints (stricter than the global 100/15min).
- Keyed by `IP + username` so one IP cannot lock out arbitrary accounts and an attacker cycling usernames from one IP is still throttled.

### ✅ 3.9: Auth routes mounted

**Files:** `server/src/routes/auth.js`, `server/src/app.js`

```
POST /api/v1/auth/register   authRateLimiter -> validate -> register
POST /api/v1/auth/login      authRateLimiter -> validate -> login
POST /api/v1/auth/logout     attachUserIfPresent -> logout
POST /api/v1/auth/refresh    refresh   (reads its own cookie, no auth middleware)
GET  /api/v1/auth/me         authenticate -> getMe
```

### ✅ 3.10: End-to-end verification

See the testing section below.

---

## Bug Found and Fixed

**Symptom:** `GET /api/v1/auth/me` returned HTTP 500 with `MissingSchemaError: Schema hasn't been registered for model "Employee"`.

**Root cause:** `authController.js` and `auth.js` imported `User` directly from `./User.js` rather than from the barrel `models/index.js`. On the `/me` request path nothing had imported `Employee` or `Intern`, so those schemas were never registered with Mongoose, and `getMe`'s `.populate('employeeId').populate('internId')` failed. This is exactly the situation the barrel file was created to prevent in Task 2, but nothing enforced its use.

**Fix (two layers):**
1. Switched `authController.js` and `auth.js` to import models from `../models/index.js`.
2. Added `import './models/index.js'` as the first import in `server.js`, so every model is registered once at process start regardless of which file imports what later. This closes the entire bug class, not just this instance.

---

## Testing Results

Verified with a real HTTP client (`curl.exe`) and a cookie jar against the running dev server.

| # | Scenario | Expected | Result |
|---|----------|----------|--------|
| 1 | `GET /me` with no token | 401 | ✅ 401 "Authentication required" |
| 2 | `POST /register` new user | 201, cookies set, role forced to staff, no password in body | ✅ |
| 3 | `POST /login` wrong password | 401 generic message, failed counter increments | ✅ |
| 4 | 5 failed attempts | account locked in DB | ✅ `failedLoginAttempts: 5`, `isLocked: true` |
| 5 | Correct password while locked | 429 lockout message (independent of rate limiter) | ✅ "Account temporarily locked...15 minute(s)" |
| 6 | Reset via `registerSuccessfulLogin` | lock cleared | ✅ `isLocked: false` |
| 7 | `POST /login` correct password | 200, session issued | ✅ |
| 8 | `GET /me` with valid cookie | 200, user returned, populate resolves | ✅ (after the bug fix) |
| 9 | `POST /refresh` with valid cookie | 200, new token pair, new access token works | ✅ |
| 10 | `POST /logout` | 200, cookies cleared | ✅ |
| 11 | Replay pre-logout refresh token after logout | 401 revoked | ✅ "Refresh token is no longer valid" |

**Two checks worth highlighting:**

- **Lockout is independent of the rate limiter.** Because both share a 5-attempt threshold, I isolated the account-level lockout by restarting the server (which resets the in-memory rate-limit store) while the DB lockout persisted, then confirmed the correct password was still rejected with the lockout message. This proves the lockout lives in the database, not the limiter.
- **Logout truly revokes server-side.** I captured a valid, correctly-signed refresh token before logout, then replayed it against `/refresh` afterward. It was rejected because `tokenVersion` no longer matched - proving revocation, not just client-side cookie deletion.

---

## Cleanup

- Deleted the temporary `checkLockout.js` debug script.
- Removed temporary cookie-jar and JSON body files.
- Re-ran `npm run seed` to restore the canonical dev dataset (this also removed the `testkrit` user created during testing).
- Confirmed `/api/health` healthy after reseed.

---

## Files Created / Modified

**Created**
```
server/src/utils/jwt.js
server/src/utils/cookies.js
server/src/utils/ApiError.js
server/src/utils/asyncHandler.js
server/src/validators/authValidators.js
server/src/middleware/validate.js
server/src/middleware/auth.js
server/src/middleware/authRateLimiter.js
server/src/controllers/authController.js
server/src/routes/auth.js
```

**Modified**
```
server/src/models/User.js          (tokenVersion + invalidateTokens)
server/src/middleware/errorHandler.js (normalizeError)
server/src/server.js                (register all models at startup)
server/src/app.js                   (mount auth routes)
```

---

## Design Decisions

1. **HttpOnly cookies over localStorage** - tokens are not reachable from JavaScript, mitigating XSS token theft (spec section 3.1).
2. **Refresh cookie path-scoped to `/api/v1/auth`** - the refresh token is only transmitted to the endpoints that need it.
3. **tokenVersion instead of a token blacklist** - immediate revocation on logout / password change without extra storage or lookups.
4. **No role in registration** - prevents privilege escalation via self-registration; elevation is an admin-only action.
5. **Generic login failure message** - avoids username enumeration.
6. **Lockout in the database, rate limit in memory** - two independent layers; the account stays protected even across server restarts.
7. **Register all models at startup** - eliminates `MissingSchemaError` from populate regardless of import order.

---

## Known Limitations / Follow-ups

- **No email verification** - anyone can self-register as `staff` immediately. Acceptable for MVP; should be decided before real users can reach the system.
- **Password change / reset endpoints** not implemented in this task (a `changePasswordValidator` was drafted then removed as out of scope).
- **Atlas credentials** were shared in plain text earlier in the session; rotating them is recommended.

---

## Next Task

**Task 4 - Role-Based Authorization Middleware.** The `authorize(...roles)` middleware is already implemented and exercised, so the remaining work is enforcing the authorization matrix on routes and building the frontend route guards and auth hooks (`useAuth`, `useRequireAuth`, `useRequireRole`).

---

**Task 3 Status:** ✅ **COMPLETE**
**Next Task:** Task 4 - Role-Based Authorization Middleware

# Task 4: Role-Based Authorization - ✅ COMPLETED

**Date:** August 30, 2026
**Status:** ✅ All 13 subtasks completed and verified

---

## Summary

Implemented role-based authorization end to end. The backend gained a single-source-of-truth permission matrix (spec section 31), a permission-checking middleware, and an ownership guard for "edit your own record" cases. The frontend gained an auth context that rehydrates the session from cookies, route guards, role-aware UI gating, and a login flow. Both layers reference the identical matrix, with the server as the enforcing boundary and the client mirror used only for UX.

Backend authorization was proven with a 30-check harness across all five roles. The frontend was verified by a clean production build plus exercising the full auth flow through the Vite dev proxy (the browser's real request path).

---

## Completed Subtasks

### Backend

#### ✅ 4.1: Central permission matrix

**File:** `server/src/config/permissions.js`

- `ROLES` constants and `ROLE_HIERARCHY` (display/sort order only - **no implicit inheritance**; every action lists its allowed roles explicitly to prevent accidental privilege creep).
- `PERMISSIONS` maps an action string (e.g. `employees:manage`) to the array of roles allowed to perform it.
- `can(role, action)` - deny by default (unknown action returns false).
- `rolesFor(action)` - the allowed-roles list for a given action.

Matrix highlights (mirrors spec section 31):

| Action group | Allowed roles |
|---|---|
| `*:view` (dashboard, employees, interns, org, policies, faq, announcements) | all roles |
| `employees:manage`, `interns:manage`, `departments:manage`, `users:manage` | super_admin, admin |
| `policies:manage`, `faq:manage`, `announcements:manage`, `knowledge:manage`, `feedback:manage` | super_admin, admin, editor |
| `feedback:submit` | all roles |
| `auditlog:view`, `settings:manage` | super_admin only |

#### ✅ 4.2: Authorization middleware

**File:** `server/src/middleware/auth.js`

- `authorize(...roles)` - ad-hoc role gate (kept from Task 3).
- `requirePermission(action)` - **preferred** gate for feature routes; checks the central matrix so policy lives in one place.
- `authorizeOwnerOrRoles(getOwnerId, ...fallbackRoles)` - async ownership guard. Passes when the requester owns the resource (`getOwnerId(req)` matches `req.user.id`) **or** holds a fallback role. This expresses the spec's "Own profile" matrix cells - e.g. an intern editing their own profile, while admins may edit anyone's.

#### ✅ 4.3: Dev-only test routes

**File:** `server/src/routes/authCheck.js` (mounted in `app.js` only when `NODE_ENV !== 'production'`)

Routes exercising each guard before real CRUD exists:

| Route | Guard |
|---|---|
| `GET /_authcheck/any` | `authenticate` |
| `GET /_authcheck/manage-employees` | `requirePermission('employees:manage')` |
| `GET /_authcheck/manage-content` | `requirePermission('policies:manage')` |
| `GET /_authcheck/view-auditlog` | `requirePermission('auditlog:view')` |
| `GET /_authcheck/admins-only` | `authorize(SUPER_ADMIN, ADMIN)` |
| `GET /_authcheck/owner-or-admin/:userId` | `authorizeOwnerOrRoles(...)` |

#### ✅ 4.4: Backend verification (30/30 passed)

A temporary Node harness (using global `fetch`, since deleted) logged in as all five seeded roles and probed every route.

```
1. Unauthenticated access
  PASS  /any with no cookie -> 401

Route /any               super_admin 200 | admin 200 | editor 200 | staff 200 | intern 200
Route /manage-employees  super_admin 200 | admin 200 | editor 403 | staff 403 | intern 403
Route /manage-content    super_admin 200 | admin 200 | editor 200 | staff 403 | intern 403
Route /view-auditlog     super_admin 200 | admin 403 | editor 403 | staff 403 | intern 403
Route /admins-only       super_admin 200 | admin 200 | editor 403 | staff 403 | intern 403

Ownership guard /owner-or-admin/:userId
  PASS  intern -> own id (200 via ownership)
  PASS  intern -> staff's id (403)
  PASS  admin -> intern's id (200 via role)
  PASS  staff -> intern's id (403)

  30 passed, 0 failed
```

(One harness-only bug was fixed mid-run: expectations were keyed by role `super_admin` while the account username is `superadmin`.)

### Frontend

#### ✅ 4.5: API client with refresh-retry

**File:** `client/src/services/apiClient.js`

- Axios instance, `baseURL` from `VITE_API_URL`, `withCredentials: true` (required so the browser sends the HttpOnly cookies cross-origin).
- Response interceptor: on a 401, performs a single silent `/auth/refresh` and replays the original request. Loop guards: `/auth/login|refresh|register` are exempt, each request retries at most once (`_retry`), and concurrent 401s share one in-flight refresh promise.

#### ✅ 4.6: Auth service

**File:** `client/src/services/authService.js` - `login`, `register`, `logout`, `getMe`, each returning the unwrapped payload.

#### ✅ 4.7: Auth context

**File:** `client/src/hooks/AuthContext.jsx` - `AuthProvider` calls `getMe()` once on mount to rehydrate the session from cookies (survives page refresh even though JS can't read HttpOnly cookies). `loading` stays true until that settles so guards don't flash the login page for an already-authenticated user. Exposes `user`, `loading`, `isAuthenticated`, `login`, `logout`, `hasPermission`, `hasRole`.

#### ✅ 4.8: Hooks + client permission mirror

- `client/src/utils/permissions.js` - exact mirror of the server matrix (`can`, `ROLES`, `ROLE_LABELS`), **documented as UI-only, not a security boundary**.
- `client/src/hooks/useAuth.js` - reads the context, throws if used outside the provider.
- `useRequireAuth.js` - imperative redirect to `/login`, preserving the attempted location.
- `useRequireRole.js` - imperative; unauth -> `/login`, forbidden -> `/unauthorized`.

#### ✅ 4.9: Route guards

- `client/src/components/common/ProtectedRoute.jsx` - requires a session; shows a loader while the session restores; redirects to `/login` with `state.from` on failure.
- `client/src/components/common/RoleGuard.jsx` - dual mode: `route` (redirects) and `inline` (renders a fallback, for hiding buttons). Accepts `roles={[...]}` and/or `permission="x:y"`.

#### ✅ 4.10-4.11: Pages and router

- Pages: `Login`, `Dashboard` (role-aware capability cards via inline `RoleGuard`), `AdminArea` (route-gated), `Unauthorized` (403).
- `App.jsx`: `AuthProvider > BrowserRouter > Routes`. Public `/login`, `/unauthorized`; protected `/dashboard`; admin-only `/admin`; `/` and `*` redirect to `/dashboard`.
- `main.jsx`: `QueryClientProvider` (retry 1, no refetch on focus) wrapping `App`.

#### ✅ 4.12: Frontend verification

Because a browser UI can't be driven here, verification used two automated methods:

1. **Production build** - `npm run build` succeeded, 145 modules transformed, no errors. This proves every import and JSX file across the new context, hooks, guards, pages, and services compiles and resolves.
2. **Full auth flow through the Vite dev proxy** (client `:5173` `/api` -> `:5000`, the browser's actual path) with a cookie jar:
   - no-session `/me` -> **401** (AuthProvider will show login)
   - login `intern` -> **200**, cookies set
   - authed `/me` -> **200** with `internId` fully populated (Krittapas Thipsang, `status: active`, `durationDays: 89`)
   - refresh-only `/me` (simulating an expired access token) -> **401**, then `/auth/refresh` -> **200** minting a new token — the exact contract the axios interceptor automates
   - role gating through the proxy: intern -> `/_authcheck/manage-employees` **403**, `/_authcheck/any` **200**, matching what `RoleGuard` shows/hides on the dashboard

---

## Files Created / Modified

**Created (backend)**
```
server/src/config/permissions.js
server/src/routes/authCheck.js
```

**Modified (backend)**
```
server/src/middleware/auth.js   (requirePermission, authorizeOwnerOrRoles)
server/src/app.js               (mount dev-only authcheck routes)
```

**Created (frontend)**
```
client/src/services/apiClient.js
client/src/services/authService.js
client/src/utils/permissions.js
client/src/hooks/AuthContext.jsx
client/src/hooks/useAuth.js
client/src/hooks/useRequireAuth.js
client/src/hooks/useRequireRole.js
client/src/components/common/ProtectedRoute.jsx
client/src/components/common/RoleGuard.jsx
client/src/pages/Login.jsx
client/src/pages/Dashboard.jsx
client/src/pages/AdminArea.jsx
client/src/pages/Unauthorized.jsx
```

**Modified (frontend)**
```
client/src/App.jsx    (router with public/protected/role-gated routes)
client/src/main.jsx   (QueryClientProvider)
```

---

## Design Decisions

1. **Single permission matrix, mirrored not shared.** The backend matrix is the enforcing authority. The client keeps a hand-synced copy purely to decide what to render. They are documented as needing to stay in sync; the client copy is explicitly *not* a security boundary.
2. **No implicit role inheritance.** A "higher" role does not automatically get "lower" permissions. Every action names its roles, so widening one action can't silently widen others.
3. **`requirePermission` over inline role lists.** Feature routes reference a named action, so re-tuning who can do what is a one-line change in the matrix rather than edits scattered across routes.
4. **Ownership as a separate guard.** "Edit your own profile" depends on the target resource, not the role alone, so it lives in `authorizeOwnerOrRoles` rather than being forced into the role matrix.
5. **Silent refresh in the client, not the UI.** The 15-minute access token is invisible to components; users are only sent to login when the refresh token itself is gone or revoked.
6. **Loader while the session restores.** Prevents a returning user with valid cookies from briefly seeing the login page before `/auth/me` resolves.

---

## Known Limitations / Follow-ups

- The client permission matrix is **manually kept in sync** with the server. If the two drift, the only symptom is a UI affordance that shows then gets refused by the server (fails safe, but confusing). A future improvement is to serve the matrix from an endpoint or share it via a common package.
- The `/_authcheck/*` routes are development scaffolding and are never mounted in production; they will be removed once real CRUD routes exercise the same guards.
- The `useRequireAuth` / `useRequireRole` imperative hooks are provided for completeness but the app currently gates via the declarative `ProtectedRoute` / `RoleGuard` components.

---

## Verification Summary

| Layer | Method | Result |
|---|---|---|
| Backend matrix + guards | 30-check role harness | ✅ 30/30 |
| Client compile integrity | `npm run build` | ✅ 145 modules, no errors |
| Auth flow via Vite proxy | cookie-jar walkthrough | ✅ login / me / refresh / role gating all as expected |

---

**Task 4 Status:** ✅ **COMPLETE**
**Next Task:** Task 5 - Employee CRUD with Search & Pagination

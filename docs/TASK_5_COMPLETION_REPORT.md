# Task 5: Employee CRUD with Search & Pagination - ✅ COMPLETED

**Date:** August 30, 2026
**Status:** ✅ All 11 subtasks completed and verified

---

## Summary

Built the first full feature slice: employee management, end to end. The backend gained a reusable pagination utility, employee validators, a CRUD controller with search/filter/sort, and permission-gated routes. The frontend gained a data layer (service + TanStack Query hooks), a set of reusable UI components that every later feature page will reuse, a shared create/edit form, and the Employee Directory page.

A read-only departments endpoint was also added (needed for the form's department dropdown); full department CRUD is deferred to Task 6.

Backend verified with a 25-check harness; frontend verified via a clean production build plus a full CRUD round-trip through the Vite proxy as both admin and staff.

---

## Completed Subtasks

### Backend

#### ✅ 5.1: Pagination utility

**File:** `server/src/utils/pagination.js`

- `parsePagination(query, { allowedSortFields, defaultSort })` - clamps `page >= 1` and `limit` to 1-100 (prevents page 0, negative offsets, or huge dumps), and parses a `sort` string like `-createdAt,lastName` where a leading `-` means descending. Only whitelisted fields are honored; anything else falls back to the default sort.
- `paginatedResponse({ data, page, limit, total })` - the standard `{ success, data, pagination: { page, limit, total, totalPages } }` envelope from spec section 30.

#### ✅ 5.2: Employee validators

**File:** `server/src/validators/employeeValidators.js`

- `createEmployeeValidator` - requires `employeeCode`, `firstName`, `lastName`, `position`, `departmentId`; validates optional fields.
- `updateEmployeeValidator` - same rules but all optional, so a PATCH can send just the changed fields.
- `employeeIdValidator`, `listEmployeesValidator` (page/limit/search/department/status/published).

#### ✅ 5.3: Employee controller

**File:** `server/src/controllers/employeeController.js`

- `listEmployees` - MongoDB `$text` search, filter by department/status/published, whitelisted sort, pagination. **Non-managers are hard-limited to published records** regardless of the `published` query param.
- `getEmployee` - returns 404 (not 403) for a non-manager requesting an unpublished record, so hidden records aren't revealed by status code.
- `createEmployee` - checks the department and manager exist first, then creates; duplicate `employeeCode` surfaces as 409 via the global error handler.
- `updateEmployee` - applies **only whitelisted fields** (`UPDATABLE_FIELDS`) to prevent mass assignment; re-validates references when they change; blocks self-management.
- `deleteEmployee` - hard delete, and clears dangling references (any `Intern.mentorId` or `Employee.managerId` pointing at the deleted record is set to null).
- Every write records an `AuditLog` entry with before/after snapshots.

#### ✅ 5.4: Employee routes

**File:** `server/src/routes/employees.js` (mounted at `/api/v1/employees`)

```
GET    /            requirePermission('employees:view')
GET    /:id         requirePermission('employees:view')
POST   /            requirePermission('employees:manage')
PATCH  /:id         requirePermission('employees:manage')
DELETE /:id         requirePermission('employees:manage')
```

All routes require `authenticate` first (`router.use(authenticate)`).

#### ✅ 5.4b: Read-only departments endpoint (supporting)

**Files:** `server/src/controllers/departmentController.js`, `server/src/routes/departments.js`

`GET /api/v1/departments` returns active departments for dropdowns. Intentionally minimal - full department CRUD is Task 6.

#### ✅ 5.5: Backend verification (25/25 passed)

A temporary harness (`verifyEmployees.js`, since deleted) using global `fetch`:

| Group | Checks |
|---|---|
| List + shape | 200, pagination envelope, total >= 10, limit honored, department populated |
| Search / filter / sort | `search=Somchai` finds the president; department filter scoped; `sort=-employeeCode` descending |
| Pagination math | page 1 != page 2; `totalPages` computed correctly |
| Permission | staff view 200; staff create 403; staff delete 403 |
| Validation | missing required -> 400 with field errors; nonexistent department -> 400 |
| CRUD round-trip | create 201; duplicate code 409; get 200; patch 200; self-manager 400; delete 200; then 404 |
| Unauthenticated | no cookie -> 401 |

**Result: 25 passed, 0 failed.** The test record was created and deleted cleanly, leaving seed data intact.

### Frontend

#### ✅ 5.6: Data layer

- `client/src/services/employeeService.js` - `list` (returns `{ data, pagination }`, strips empty params), `get`, `create`, `update`, `remove`.
- `client/src/services/departmentService.js` - `list`.
- `client/src/hooks/useEmployees.js` - TanStack Query: `useEmployees(params)` keyed by the params object with `keepPreviousData` (no empty-table flash on page change), `useDepartments` (5-minute stale time), and create/update/delete mutations that invalidate the employee list on success.

#### ✅ 5.7: Reusable components

**Directory:** `client/src/components/common/`

| Component | Notes |
|---|---|
| `SearchBar` | Debounced (300ms), controlled by `value` |
| `Pagination` | Prev/next + "showing X-Y of N", hides for a single page, disables at bounds and while fetching |
| `states.jsx` | `LoadingState`, `EmptyState`, `ErrorState` (with retry) - so no screen is ever blank on error (spec section 47) |
| `DataTable` | Generic `columns` config with optional `render`; handles its own loading/empty/error |
| `Modal` | Closes on Escape and backdrop click, locks body scroll, `aria-modal` (spec section 37) |
| `ConfirmDialog` | Built on `Modal`; buttons disable while the action runs |

These satisfy spec Rule 9 (reusable components) and will back every later feature page.

#### ✅ 5.8: Employee form

**File:** `client/src/components/employees/EmployeeForm.jsx` - one component for both create and edit (`initial` prop decides). Client-side validation of required fields and email; **merges server-side field errors** (from a 400 `errors` map) with client errors so both render inline. Normalizes the populated department object to an id and the skills array to a comma string for editing, and back on submit.

#### ✅ 5.9: Employee directory page

**File:** `client/src/pages/Employees.jsx` - search + department filter (both reset to page 1), `DataTable` with a status-badge column, `Pagination`, add/edit via `Modal` + `EmployeeForm`, delete via `ConfirmDialog`. The `+ Add` button, the Edit/Delete actions column are gated behind `hasPermission('employees:manage')`, so read-only roles see the list without management controls - matching the server, which would reject those calls regardless. Wired as a `ProtectedRoute` at `/employees`; the dashboard's directory card links to it.

#### ✅ 5.10: Frontend verification

1. **Production build** - `npm run build` succeeded, 156 modules (up from 145), no errors.
2. **Full CRUD round-trip through the Vite proxy** (client `:5173` `/api` -> `:5000`, the browser's real path):
   - admin login -> **200**
   - `GET /departments` -> **200** (5 departments)
   - `GET /employees?search=Somchai` -> **200**, Somchai Wattana with populated department
   - admin create -> **201** -> edit -> **200** (position updated)
   - staff list -> **200** but staff delete -> **403**
   - admin cleanup delete -> **200**

   The test record was removed, leaving seed data intact.

---

## Files Created / Modified

**Created (backend)**
```
server/src/utils/pagination.js
server/src/validators/employeeValidators.js
server/src/controllers/employeeController.js
server/src/routes/employees.js
server/src/controllers/departmentController.js
server/src/routes/departments.js
```

**Modified (backend)**
```
server/src/app.js   (mount /employees and /departments)
```

**Created (frontend)**
```
client/src/services/employeeService.js
client/src/services/departmentService.js
client/src/hooks/useEmployees.js
client/src/components/common/SearchBar.jsx
client/src/components/common/Pagination.jsx
client/src/components/common/states.jsx
client/src/components/common/DataTable.jsx
client/src/components/common/Modal.jsx
client/src/components/common/ConfirmDialog.jsx
client/src/components/employees/EmployeeForm.jsx
client/src/pages/Employees.jsx
```

**Modified (frontend)**
```
client/src/App.jsx         (add /employees route)
client/src/pages/Dashboard.jsx  (link directory card to /employees)
```

---

## Design Decisions

1. **Visibility enforced server-side, not just filtered.** Non-managers can't see unpublished employees no matter what query params they send, and a hidden record returns 404 rather than 403 so its existence isn't leaked.
2. **Field whitelist on update.** Only known fields are copied from the request body, so a client can't set arbitrary or internal fields via mass assignment.
3. **Dangling references cleared on delete.** Deleting an employee nulls any intern `mentorId` or employee `managerId` that pointed at them, so no record references a ghost.
4. **Reusable components first.** The common components were built as a shared set rather than inline in the page, because Tasks 7-17 all need the same table/modal/pagination/state building blocks.
5. **Server errors merged into the form.** The form shows the API's per-field validation messages inline, so a 409 duplicate code or a server-only rule surfaces next to the relevant input, not just as a banner.
6. **Client permission gate mirrors the server.** Management controls are hidden for read-only roles purely for UX; the server independently rejects unauthorized writes (verified: staff delete -> 403).

---

## Known Limitations / Follow-ups

- **Departments endpoint is read-only.** Full department CRUD (create/edit/delete, manager assignment, member counts) is Task 6. The employee `managerId` field is supported by the API but the form doesn't yet expose a manager picker - that pairs naturally with the org-chart work in Task 9.
- **Hard delete, not soft delete.** Employees are removed outright. If an audit trail of "who existed" matters more than the `AuditLog` snapshot already captures, a soft-delete flag could be added later.
- **Contact-visibility masking is coarse.** The `contactVisibility` field exists on the model but the API does not yet strip contact fields per-viewer; that refinement can come with the directory detail view.

---

## Verification Summary

| Layer | Method | Result |
|---|---|---|
| Backend CRUD + search + permissions | 25-check harness | ✅ 25/25 |
| Client compile integrity | `npm run build` | ✅ 156 modules, no errors |
| Full CRUD via Vite proxy (admin + staff) | cookie-jar round-trip | ✅ create/edit/delete + role denial all as expected |

---

**Task 5 Status:** ✅ **COMPLETE**
**Next Task:** Task 6 - Department Management & Employee Assignment

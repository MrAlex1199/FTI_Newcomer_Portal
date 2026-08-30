# Task 7: Intern Management with Batch System - ✅ COMPLETED

**Date:** August 30, 2026  
**Status:** ✅ All 8 subtasks completed and verified

---

## Summary

Task 7 adds intern and cohort management to the FTI Newcomer Portal. The backend now supports intern batch CRUD, intern CRUD, mentor and department assignment, date-derived statuses, search/filter/pagination, visibility rules, audit logging, and protected image uploads. The frontend provides intern and batch directories, detail pages, forms, filters, timeline displays, and dashboard navigation.

The existing `Intern` and `InternBatch` Mongoose models were reused and extended only where necessary. Status remains derived from dates instead of being stored, so it cannot drift from the actual timeline.

---

## Completed Work

### Backend API

#### ✅ Intern batch CRUD

**Files:**

- `server/src/controllers/internBatchController.js`
- `server/src/routes/internBatches.js`
- `server/src/validators/internBatchValidators.js`

Implemented endpoints mounted at `/api/v1/intern-batches`:

```text
GET    /             List batches with pagination, search, status, and counts
GET    /:id          Batch detail with visible intern members
POST   /             Create a batch
PATCH  /:id          Update a batch
DELETE /:id          Delete an empty batch
```

Features:

- Batch code, title, year, sequence, description, and date validation.
- Derived batch status: `upcoming`, `active`, or `completed`.
- Search across batch code, title, and description.
- Explicit `internCount` response field.
- Paginated list response using the shared pagination utility.
- Populated department and mentor data in batch detail members.
- `409 Conflict` when deleting a batch that still contains interns.
- Audit logs for create, update, and delete operations.
- Group-photo upload support.

A text index was added to `InternBatch` for batch code, title, and description search.

#### ✅ Intern CRUD

**Files:**

- `server/src/controllers/internController.js`
- `server/src/routes/interns.js`
- `server/src/validators/internValidators.js`

Implemented endpoints mounted at `/api/v1/interns`:

```text
GET    /             List interns with search/filter/pagination
GET    /:id          Intern detail
POST   /             Create an intern
PATCH  /:id          Update an intern
DELETE /:id          Delete an intern
```

Supported list filters:

- Text search across intern name, university, major, and project title.
- Department.
- Batch.
- Date-derived status.
- Publication state for administrators.
- Whitelisted sort fields.
- Pagination.

Each intern response can include populated:

- Department.
- Intern batch.
- Employee mentor.

#### ✅ Relationship integrity

Intern creation and updates validate that:

1. The department exists and is active.
2. The batch exists.
3. The mentor exists when supplied.
4. The mentor is active.
5. The mentor belongs to the intern’s department.
6. The intern dates are ordered correctly.
7. The intern dates fall within the selected batch timeline.

Batch deletion is blocked when interns remain, preventing orphaned required `batchId` references.

#### ✅ Visibility and privacy

- All intern and batch reads require authentication.
- Administrators can see unpublished interns.
- Other authenticated roles are restricted to published interns.
- Hidden interns cannot be retrieved by direct ID by non-managers.
- Age is omitted from non-admin responses unless `privacyConsent` is enabled.
- Intern profile image public IDs are never exposed in normal responses.
- Intern and batch writes require `interns:manage`.

The current permission matrix grants intern management to `super_admin` and `admin`, matching the existing project policy. Own-profile intern editing remains a future ownership-guard enhancement rather than being implemented insecurely through client-side checks.

### Image upload support

**Files:**

- `server/src/config/cloudinary.js`
- `server/src/middleware/imageUpload.js`
- `server/src/utils/imageUpload.js`

Added a focused Task 7 image pipeline:

- Multer memory storage.
- JPG, PNG, and WebP allowlist.
- 5MB upload limit.
- Sharp image signature validation.
- Dimension validation up to 5000px per side.
- Orientation correction.
- Resize to an 800px maximum dimension.
- WebP normalization at quality 85.
- Cloudinary upload for intern profile and batch group photos.
- Old Cloudinary asset cleanup when replacing an image.
- Cloudinary asset cleanup when deleting an intern or batch.
- Graceful handling when cleanup fails so record deletion is not blocked.

The broader reusable upload UI/system remains part of Task 8.

### Frontend

#### ✅ Services and query hooks

**Files:**

- `client/src/services/internService.js`
- `client/src/services/internBatchService.js`
- `client/src/hooks/useInterns.js`
- `client/src/hooks/useInternBatches.js`

Added service and TanStack Query layers for:

- Intern list/detail/create/update/delete.
- Batch list/detail/create/update/delete.
- Multipart FormData submission for profile and group photos.
- Query invalidation across interns, batches, and departments after mutations.

#### ✅ Intern directory

**File:** `client/src/pages/Interns.jsx`

Added `/interns` with:

- Debounced search.
- Department filter.
- Batch filter.
- Upcoming/active/completed status filter.
- Pagination.
- Profile image or initials fallback.
- Mentor, department, university, batch, and status columns.
- Admin-only create/edit/delete controls.
- Loading, empty, and error states.

#### ✅ Batch directory

**File:** `client/src/pages/InternBatches.jsx`

Added `/intern-batches` with:

- Batch code and title.
- Cohort date timeline.
- Derived status badge.
- Intern count.
- Admin-only create/edit/delete controls.
- Group photo upload field.
- Non-empty deletion conflict feedback.
- Pagination and reusable table states.

#### ✅ Forms

**Files:**

- `client/src/components/interns/InternForm.jsx`
- `client/src/components/interns/BatchForm.jsx`
- `client/src/components/interns/StatusBadge.jsx`

Added controlled forms with:

- Required-field validation.
- Date-order validation.
- Department, batch, and mentor selectors.
- Batch date prefill for new interns.
- Profile and group photo inputs.
- Privacy consent and publication controls.
- Server-side field error display.
- Create/edit reuse through the existing modal pattern.

#### ✅ Detail pages

**Files:**

- `client/src/pages/InternDetail.jsx`
- `client/src/pages/InternBatchDetail.jsx`

Added:

- Intern profile detail with image fallback.
- Education and project information.
- Mentor and department display.
- Batch link and date range.
- Derived duration and status.
- Consent-aware lessons/advice display.
- Batch detail with group-photo placeholder.
- Batch timeline visualization.
- Batch member table with intern detail links.

#### ✅ Navigation and integration

**Files:**

- `client/src/App.jsx`
- `client/src/pages/Dashboard.jsx`
- `client/src/pages/DepartmentDetail.jsx`

Added protected routes:

```text
/interns
/interns/:id
/intern-batches
/intern-batches/:id
```

Dashboard now links to the intern directory and batch directory for authenticated users and exposes an admin-only management card. Department detail intern rows now link to intern profiles.

---

## Verification

### Backend verification: ✅ 18 assertions passed

A temporary live API harness was created and deleted after execution. It verified:

- Admin and staff login.
- Mentor employee availability.
- Admin batch creation.
- Batch status derivation.
- Initial batch member count.
- Batch list pagination envelope.
- Staff batch detail access.
- Admin intern creation with a valid PNG profile image.
- Intern status derivation from dates.
- Profile image URL generation.
- Populated mentor and department relationships.
- Intern filtering by batch, department, and status.
- Staff published intern detail access.
- PDF/non-image upload rejection.
- Staff intern creation denial (`403`).
- Non-empty batch deletion rejection (`409`).
- Successful intern deletion.
- Successful empty batch deletion.

Temporary intern and batch records were removed, and Cloudinary cleanup was triggered for the temporary profile image.

### Vite proxy verification: ✅ 7 assertions passed

A temporary proxy harness was created and deleted after execution. Through the Vite development proxy it verified:

- Admin login.
- Batch list retrieval.
- Intern list retrieval.
- Batch detail retrieval.
- Intern detail and status retrieval.
- Staff login.
- Staff batch write denial (`403`).

### Build and syntax checks

- Client production build: ✅
  - 171 modules transformed.
  - No compilation errors.
- Backend syntax checks: ✅
  - Intern controller.
  - Batch controller.
  - Intern routes.
  - Batch routes.
  - Intern validators.
  - Batch validators.
  - Image upload middleware.
  - Image upload utility.
- Development servers were stopped after verification.

---

## Files Created

```text
client/src/components/interns/BatchForm.jsx
client/src/components/interns/InternForm.jsx
client/src/components/interns/StatusBadge.jsx
client/src/hooks/useInternBatches.js
client/src/hooks/useInterns.js
client/src/pages/InternBatchDetail.jsx
client/src/pages/InternBatches.jsx
client/src/pages/InternDetail.jsx
client/src/pages/Interns.jsx
client/src/services/internBatchService.js
client/src/services/internService.js
server/src/config/cloudinary.js
server/src/controllers/internBatchController.js
server/src/controllers/internController.js
server/src/middleware/imageUpload.js
server/src/routes/internBatches.js
server/src/routes/interns.js
server/src/utils/imageUpload.js
server/src/validators/internBatchValidators.js
server/src/validators/internValidators.js
docs/TASK_7_COMPLETION_REPORT.md
```

## Files Modified

```text
client/src/App.jsx
client/src/pages/Dashboard.jsx
client/src/pages/DepartmentDetail.jsx
server/src/app.js
server/src/models/InternBatch.js
```

---

## Design Decisions

1. **Status is derived from dates.** Intern and batch status are never stored, preventing stale status values.
2. **Intern dates must fit the batch timeline.** This keeps cohort scheduling consistent and makes batch timelines meaningful.
3. **Mentors are department-scoped.** A mentor must be active and belong to the intern’s department.
4. **Batches cannot be deleted while populated.** This protects the required intern-to-batch relationship.
5. **Visibility is enforced server-side.** Frontend controls are only a usability layer; unpublished records remain protected even when query parameters are manipulated.
6. **Uploads are normalized before Cloudinary storage.** Files are signature-checked and processed with Sharp instead of trusting the browser MIME type.
7. **The API uses multipart only when a file is present.** JSON requests remain simple for normal CRUD, while FormData is used for photo mutations.
8. **Own-profile editing is deferred.** The current permission matrix supports admin intern management; future self-service editing should use the existing ownership guard and a restricted field whitelist.

---

## Known Follow-ups

- Task 8 will extract the image pipeline into a broader reusable file-upload system and add the reusable frontend image-upload component, previews, upload progress, and more complete asset handling.
- Employee profile-photo uploads are not yet wired to the new image utility; that belongs to Task 8.
- Intern self-profile editing is not enabled yet because it requires User-to-Intern ownership resolution and a separate restricted permission path.
- The batch timeline visualization is intentionally lightweight for the MVP; a richer calendar/timeline component can be added later.

---

**Task 7 Status:** ✅ **COMPLETE**  
**Next Task:** Task 8 - File Upload System & Image Processing

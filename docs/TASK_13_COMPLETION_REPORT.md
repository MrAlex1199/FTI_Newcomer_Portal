# Task 13: Announcements System - ✅ IMPLEMENTED

**Date:** August 30, 2026  
**Status:** ✅ Implementation and focused validation completed

## Summary

Task 13 adds an authenticated announcements/news system with scheduling, role targeting, priority, pinned ordering, cover-image support, manager CRUD, safe rich-text rendering, localized Thai/English UI, and a dashboard recent-announcements widget.

The existing `Announcement` model, seed records, and permission entries were reused. Reader visibility remains server-authoritative: non-managers receive only published, currently active, role-matching announcements. Managers can review drafts, future-scheduled records, and expired records through derived status filters.

## Backend Implementation

### API and routing

**Files:**

- `server/src/controllers/announcementController.js`
- `server/src/validators/announcementValidators.js`
- `server/src/routes/announcements.js`
- `server/src/app.js`
- `server/src/models/Announcement.js`

Added endpoints:

```text
GET    /api/v1/announcements/categories
GET    /api/v1/announcements
GET    /api/v1/announcements/:id
POST   /api/v1/announcements
PATCH  /api/v1/announcements/:id
DELETE /api/v1/announcements/:id
```

Implemented:

- Authentication and `announcements:view` enforcement on reads.
- `announcements:manage` enforcement on create, update, and delete.
- Category and role catalogs for the client form.
- Search, category, status, pagination, and stable ordering.
- Pinned-first ordering followed by priority and publish time.
- Reader filtering through `Announcement.visibleToRoleFilter(req.user.role)`.
- Reader exclusion of future, expired, draft, archived, and non-targeted records.
- Manager-only status filtering for `draft`, `scheduled`, `published`, `expired`, and `archived`.
- Derived `displayStatus` values without expanding the persisted `draft/published/archived` enum.
- Whitelisted writable fields and server-authoritative `authorId`.
- Date validation requiring expiry after publication.
- Consistent exact-expiration behavior between the model virtual and database filter.

### Cover-image upload and cleanup

Announcement writes reuse the existing upload architecture:

- `imageUpload('coverImage')` validates multipart MIME type and size.
- `uploadImage` validates dimensions with Sharp, converts to WebP, and stores through Cloudinary.
- Failed persistence removes newly uploaded assets.
- Replaced and deleted cover assets are cleaned up after successful persistence.
- Public Cloudinary IDs are not included in normal API responses.

If Cloudinary is not configured, the API returns the existing explicit upload-configuration error rather than storing an invalid image reference.

### Audit logging

Announcement changes use the existing append-only `AuditLog` model:

- Create draft: `create`
- Create published: `publish`
- Publish/unpublish transitions: `publish` / `unpublish`
- Other updates: `update`
- Deletes: `delete`

Snapshots exclude the internal cover-image public ID.

## Client Implementation

### Data layer

**Files:**

- `client/src/services/announcementService.js`
- `client/src/hooks/useAnnouncements.js`

Added Axios and React Query support for list, category catalog, detail, create, update, and delete operations. Multipart requests use `FormData` only when a cover file is present and preserve upload progress reporting.

### Announcements page

**File:** `client/src/pages/Announcements.jsx`

Added protected `/announcements` page with:

- Search field.
- Category filter.
- Manager-only status filter.
- Pinned-first announcement cards.
- Priority/status/category/date/author metadata.
- Cover image display with fallback.
- Expandable safe rich-text content through `RichTextRenderer`.
- Manager-only create, edit, publish/unpublish, and delete controls.
- Date-time-local fields converted to ISO timestamps before API submission.
- Role-target checkboxes.
- Priority and pinned controls.
- Cover-image upload field.
- Loading, error, empty, pagination, and upload-progress states.

The page is registered in `client/src/App.jsx` and remains behind `ProtectedRoute`.

### Dashboard integration

**File:** `client/src/pages/Dashboard.jsx`

Added:

- Announcements dashboard card.
- Recent-announcements widget using the authenticated reader API.
- Role and schedule filtering remains server-side; the widget does not reproduce visibility logic in the browser.

### Localization

**Files:**

- `client/src/i18n/messages.js`
- `client/src/hooks/LanguageContext.jsx`

Added Thai and English strings for announcement headings, filters, categories, derived statuses, form fields, publication errors, dashboard states, and image-upload messaging. Announcement categories are included in the shared enum-label mapping so Thai category labels render correctly.

Server-authored titles, summaries, and content are intentionally not machine-translated.

## Validation

### ✅ Client production build

Command:

```text
npm run build
```

Result:

- Passed successfully.
- Vite transformed 199 modules.
- No JSX, JavaScript, or bundling errors.

### ✅ Server syntax and import checks

Passed checks for:

```text
server/src/controllers/announcementController.js
server/src/validators/announcementValidators.js
server/src/routes/announcements.js
server/src/app.js
```

The server application also imported successfully, confirming the new route/controller imports resolve. A temporary server instance started on port 5001 and connected to the configured MongoDB database; it was stopped after validation. Port 5000 was already occupied by an existing server process, so the isolated port was used.

### ✅ Vite route smoke test

A temporary Vite process returned HTTP 200 with the application root for:

```text
/announcements
/dashboard
```

The temporary Vite process was stopped.

### Validation limitation

A complete authenticated CRUD acceptance suite was not run in this pass. The repository does not contain an announcement-specific automated test runner, and cover-image assertions require configured Cloudinary credentials. The implementation reuses the already-tested authentication, permission, audit, pagination, image-upload, and safe-rich-text infrastructure; live schedule/role/expiry scenarios should be run against the seeded development server as a follow-up integration check.

## Compatibility and Security Decisions

1. **Authenticated reader page:** The existing portal treats internal content pages as authenticated, so `/announcements` is protected rather than anonymous.
2. **Derived schedule states:** `scheduled` and `expired` are display/filter states; persisted status remains compatible with the existing model and seed data.
3. **Server-authoritative visibility:** Client filters are convenience controls only. The server applies publication windows and role targeting for every reader request.
4. **Safe content rendering:** Announcement content uses the existing constrained Markdown-like renderer and does not introduce raw HTML or `dangerouslySetInnerHTML`.
5. **Existing upload pipeline:** Cloudinary, MIME checks, Sharp processing, size limits, and cleanup behavior are reused instead of introducing a parallel storage path.
6. **Existing permission matrix:** All roles can view announcements; `super_admin`, `admin`, and `editor` can manage them.
7. **Existing audit vocabulary:** No new audit action was added; publish/unpublish transitions use the existing action enum.

## Files Added or Modified

```text
server/src/controllers/announcementController.js
server/src/validators/announcementValidators.js
server/src/routes/announcements.js
server/src/app.js
server/src/models/Announcement.js
client/src/services/announcementService.js
client/src/hooks/useAnnouncements.js
client/src/pages/Announcements.jsx
client/src/App.jsx
client/src/pages/Dashboard.jsx
client/src/i18n/messages.js
client/src/hooks/LanguageContext.jsx
docs/TASK_13_COMPLETION_REPORT.md
```

**Task 13 Status:** ✅ **IMPLEMENTED AND FOCUSED-VALIDATED**

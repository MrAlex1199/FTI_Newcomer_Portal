# Task 12: Getting Started Guide & Company Info - ✅ COMPLETED

**Date:** August 30, 2026  
**Status:** ✅ All 6 subtasks completed and verified

## Summary

Task 12 adds an end-to-end Getting Started guide and fictional company-information experience. Authenticated users can browse published onboarding articles grouped into First Day, First Week, and Before Leaving sections. Content managers (`super_admin`, `admin`, and `editor`) can create, edit, publish/unpublish, and delete guide articles. Company information is exposed through a singleton settings document with mission, vision, history, contact details, OpenStreetMap coordinates, and interactive office points.

All content changes use the existing audit-log conventions. Article content continues to use the constrained safe renderer from Task 11; the implementation does not render untrusted HTML with `dangerouslySetInnerHTML` and does not add a map or rich-text dependency.

## Completed Work

### ✅ KnowledgeArticle API

**Files:**

- `server/src/controllers/knowledgeController.js`
- `server/src/routes/knowledge.js`
- `server/src/validators/knowledgeValidators.js`
- `server/src/app.js`

Added endpoints:

```text
GET    /api/v1/knowledge/categories
GET    /api/v1/knowledge
GET    /api/v1/knowledge/:id
POST   /api/v1/knowledge
PATCH  /api/v1/knowledge/:id
DELETE /api/v1/knowledge/:id
```

Implemented:

- Category and catalog response for article categories, Getting Started sections, IT topics, and user roles.
- Category, subcategory, search, status, pagination, and stable sort support.
- Server-authoritative publication filtering: non-managers receive only `published` articles, with empty or matching `targetRoles`.
- Managers can review drafts and archived articles through status filtering.
- Direct draft access is rejected for non-managers.
- New articles default to `draft` when a status is not supplied.
- Field whitelisting, validation, and safe status transitions.
- View-count increment for non-manager article detail requests.
- Audit events for create, update, publish, unpublish, and delete operations.

### ✅ CompanyInfo singleton API

**Files:**

- `server/src/models/CompanyInfo.js`
- `server/src/controllers/companyController.js`
- `server/src/routes/company.js`
- `server/src/validators/companyValidators.js`
- `server/src/models/index.js`
- `server/src/app.js`

Added endpoints:

```text
GET    /api/v1/company
PATCH  /api/v1/company
```

Implemented:

- Singleton record using `key: 'default'`.
- Fictional fallback data so the page remains usable before seeding.
- Company name, tagline, overview, mission, vision, history, address, phone, email, and website fields.
- Latitude/longitude validation and an OpenStreetMap provider catalog value.
- Nested office-point data with name, description, contact, extension, category, and coordinates.
- Editor/admin company updates through the existing `knowledge:manage` permission.
- Authenticated company reading through the existing `organization:view` permission.
- Audit logging for singleton creation and updates.
- Seed clearing and fictional company-data seeding in `server/src/utils/seed.js`.

### ✅ Getting Started UI

**Files:**

- `client/src/pages/GettingStarted.jsx`
- `client/src/hooks/useKnowledge.js`
- `client/src/services/knowledgeService.js`

Added protected `/getting-started` page with:

- Tabs for First Day, First Week, and Before Leaving.
- Article grouping by `subcategory`.
- Summary, tags, cover-image display, image fallback, and expandable article detail.
- Safe formatted content through `RichTextRenderer`.
- Manager-only status filtering and create/edit/delete/publish controls.
- Article form fields for title, slug, section, summary, safe content, cover image URL, tags, target roles, sort order, and status.
- Loading, error, and empty states.

### ✅ Company Info UI

**Files:**

- `client/src/pages/Company.jsx`
- `client/src/components/content/OfficeMap.jsx`
- `client/src/hooks/useCompanyInfo.js`
- `client/src/services/companyService.js`

Added protected `/company` page with:

- Company name and tagline header.
- Overview, mission, vision, and history sections.
- Contact details with telephone, email, and website links.
- Dependency-free OpenStreetMap iframe presentation and external map link.
- Clickable office-point cards with selected-point detail.
- Manager-only company edit modal for profile fields, coordinates, and office-point JSON.
- Server error, loading, and empty/fallback handling.

### ✅ Routing and navigation integration

**Files:**

- `client/src/App.jsx`
- `client/src/pages/Dashboard.jsx`

Added protected routes:

```text
/getting-started
/company
```

The dashboard now links to both pages for every authenticated role. Management controls are permission-gated in the UI while the API remains the security boundary.

## Verification

### ✅ Live API verification

A temporary verification harness was created, run against the live backend, and deleted afterward. It used the seeded fictional accounts and restored the company singleton after mutation. All 22 checks passed:

- Admin, editor, staff, and intern login.
- Knowledge category catalog availability.
- Exposure of all three Getting Started sections.
- Staff access to published guide articles.
- Seeded articles grouped across First Day, First Week, and Before Leaving.
- Staff access to company information.
- Company response includes `openstreetmap` and office points.
- Editor guide-article creation.
- New article defaults to draft.
- Staff draft list exclusion and direct-detail rejection.
- Editor publication, update, and unpublication.
- Staff visibility after publication.
- Staff guide-article creation denial with HTTP 403.
- Staff company-update denial with HTTP 403.
- Editor company update success.
- Company data restoration after the test.
- Temporary article deletion.

The backend port was already occupied by an existing development process, so the attempted second server start correctly failed with `EADDRINUSE`; the existing server served the complete live suite.

### ✅ Vite proxy verification

A temporary Vite process was started on port 5174 and stopped after verification. All proxy checks passed:

- Admin login through the Vite proxy.
- `/api/v1/knowledge` through the proxy.
- `/api/v1/company` through the proxy.
- `/getting-started` page shell returned HTTP 200.
- `/company` page shell returned HTTP 200.

The temporary proxy harness was deleted.

### ✅ Build and syntax validation

- Client production build: ✅
  - Vite transformed 191 modules.
  - No compilation errors.
- Backend syntax checks: ✅ for all new/modified Task 12 server modules, including models, controllers, validators, routes, seed changes, and app mounting.
- Temporary verification files and processes: ✅ removed/stopped.

## Design Decisions

1. **KnowledgeArticle is reused for onboarding.** The existing schema already models article categories, Getting Started sections, target roles, publication status, ordering, tags, cover images, and helpfulness/view counters.
2. **CompanyInfo uses a singleton document.** The requirement calls for one company-information/settings record, so the API uses the stable `default` key and upsert-style updates.
3. **Fictional defaults and seed content are retained.** No real company, employee, location, or credential data was introduced.
4. **`knowledge:manage` controls content management.** This keeps editors aligned with the existing content-management permission matrix and avoids granting the broader super-admin-only settings permission.
5. **Publication visibility is enforced on the server.** UI filters are convenience controls only; staff and interns cannot expose drafts by changing query parameters or requesting a draft ID.
6. **OpenStreetMap is used without an API key.** Coordinates generate an embedded map and external map link, while office points provide an interactive dependency-free presentation.
7. **Safe constrained rich text is preserved.** The existing React renderer supports headings, bullets, bold text, and plain text without executing user-provided HTML.

## Files Added or Modified for Task 12

```text
server/src/models/CompanyInfo.js
server/src/controllers/knowledgeController.js
server/src/controllers/companyController.js
server/src/validators/knowledgeValidators.js
server/src/validators/companyValidators.js
server/src/routes/knowledge.js
server/src/routes/company.js
server/src/models/index.js
server/src/app.js
server/src/utils/seed.js
client/src/services/knowledgeService.js
client/src/services/companyService.js
client/src/hooks/useKnowledge.js
client/src/hooks/useCompanyInfo.js
client/src/components/content/OfficeMap.jsx
client/src/pages/GettingStarted.jsx
client/src/pages/Company.jsx
client/src/App.jsx
client/src/pages/Dashboard.jsx
docs/TASK_12_COMPLETION_REPORT.md
```

**Task 12 Status:** ✅ **COMPLETE**  
**Next Task:** Task 13 - Announcements System

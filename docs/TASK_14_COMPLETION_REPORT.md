# Task 14: IT Help Center & Knowledge Base - ✅ IMPLEMENTED

**Date:** August 30, 2026  
**Status:** ✅ Implementation and focused validation completed

## Summary

Task 14 adds an authenticated IT Help Center at `/it-help`, reusing the existing `KnowledgeArticle` architecture. It provides IT-topic navigation, debounced IT-only search, quick links, safe troubleshooting article rendering, related articles, helpfulness voting, manager CRUD, Thai/English UI localization, and a department-backed Contact IT fallback.

The server remains authoritative for publication status and role-target visibility. Article content continues to use the constrained rich-text format rendered by `RichTextRenderer`; no raw HTML rendering or `dangerouslySetInnerHTML` was introduced.

## Backend Implementation

### Model and validation changes

**Files:**

- `server/src/models/KnowledgeArticle.js`
- `server/src/models/KnowledgeArticleVote.js`
- `server/src/models/index.js`
- `server/src/validators/knowledgeValidators.js`
- `server/src/validators/knowledgeVoteValidators.js`

Implemented:

- Added `isQuickLink` and `quickLinkOrder` to `KnowledgeArticle` with a supporting index.
- Added the `KnowledgeArticleVote` model with one unique vote per `{ articleId, userId }`.
- Preserved the existing `it_help` category and 11 IT topics:
  `windows`, `printer`, `network`, `wifi`, `email`, `password`, `office_suite`, `vpn`, `shared_folder`, `browser`, and `software_request`.
- Added category-aware subcategory validation for IT and Getting Started articles.
- Added quick-link field validation and boolean query validation.
- Added vote validation for `helpful` and `not_helpful`.

### API and authorization

**Files:**

- `server/src/controllers/knowledgeController.js`
- `server/src/routes/knowledge.js`

Added endpoints:

```text
GET  /api/v1/knowledge/it-help/quick-links
POST /api/v1/knowledge/:id/helpfulness
```

Extended the existing article endpoints with:

- IT quick-link filtering and stable quick-link ordering.
- Server-filtered related IT articles, prioritizing the same topic and then overlapping tags.
- Current-user vote state in article detail responses.
- Idempotent vote creation/change behavior with counter updates.
- Vote cleanup when an article is deleted.
- Controller-level category shape enforcement in addition to request validation.
- Automatic disabling of quick-link fields for non-IT categories.

Reader requests still require `policies:view`; article management still requires `knowledge:manage`, matching the existing permission matrix. Drafts, archived articles, and role-targeted articles are not exposed to ordinary readers, and related/quick-link queries apply the same server-side visibility rules.

### Seed data

**File:** `server/src/utils/seed.js`

The seeded printer, Wi-Fi, and password articles are marked as published quick links with deterministic ordering. The existing IT Department record remains the canonical contact fallback source, including its editable location, extension, and contact topics.

## Client Implementation

### Data layer

**Files:**

- `client/src/services/knowledgeService.js`
- `client/src/hooks/useKnowledge.js`

Added React Query/Axios support for:

- IT quick links.
- Article detail queries.
- Helpfulness voting.
- Cache invalidation after votes and article changes.

### IT Help page

**File:** `client/src/pages/ItHelp.jsx`

Added a protected `/it-help` page with:

- IT topic navigation and localized topic labels.
- Debounced search scoped to `category=it_help`.
- Quick Links section.
- Article list and detail panel.
- Safe troubleshooting rendering through `RichTextRenderer`.
- Helpful/not-helpful controls showing server counters and the current user’s vote.
- Related article navigation.
- Manager-only create, edit, publish/unpublish, and delete controls.
- IT-specific article form with topic, safe content, tags, target roles, status, and quick-link fields.
- Contact IT fallback backed by the Information Technology department record.
- Loading, error, empty, and mutation error states.

The existing rich-text editor had an undefined toolbar callback in the shared component; this was corrected so its existing bold, heading, and bullet controls work for IT and Getting Started forms.

The route is registered in `client/src/App.jsx` behind `ProtectedRoute`. The dashboard now includes an IT Help card.

### Localization

**Files:**

- `client/src/i18n/messages.js`
- `client/src/hooks/LanguageContext.jsx`

Added Thai and English labels for IT Help headings, topic names, search/filter states, quick links, related articles, rating controls, contact fallback, form fields, and errors. IT topics are included in the shared enum-label mapping.

Server-authored article titles and troubleshooting content are not machine-translated; localization applies to the surrounding UI and enum labels.

## Validation

### ✅ Server syntax checks

Passed:

```text
node --check src/controllers/knowledgeController.js
node --check src/routes/knowledge.js
node --check src/models/KnowledgeArticle.js
node --check src/models/KnowledgeArticleVote.js
node --check src/validators/knowledgeValidators.js
node --check src/validators/knowledgeVoteValidators.js
```

### ✅ Server application import

Passed:

```text
node --input-type=module -e "import('./src/app.js').then(({default: app}) => console.log('app-loaded', typeof app))"
```

The result confirmed that the application and route/controller imports resolve successfully.

### ✅ Client production build

Passed:

```text
npm run build
```

Vite transformed 200 modules and produced the production bundle successfully.

### ✅ Vite route smoke test

A temporary Vite process returned HTTP 200 for:

```text
/it-help
/dashboard
```

The temporary Vite process was stopped after the check.

### Validation limitation

A complete authenticated MongoDB acceptance suite was not run in this pass. The repository does not provide a Task 14 automated test runner, and authenticated vote/visibility assertions require a running seeded MongoDB environment and valid session credentials. The implementation uses the existing authentication, permission, pagination, model, and safe-rendering infrastructure; those focused API scenarios should be exercised against the configured development database when available.

## Compatibility and Security Decisions

1. **Existing article architecture:** IT Help reuses `KnowledgeArticle` and the persisted lowercase `it_help` category instead of creating a parallel model.
2. **Server-authoritative visibility:** Draft, archived, and role-targeted visibility is filtered on every relevant server query; the client does not fetch and hide restricted records.
3. **Idempotent voting:** Votes are stored per user and article, preventing repeated clicks from inflating counters and allowing a user to change their vote safely.
4. **Safe rich text:** Article content is rendered only through the existing constrained renderer. No unrestricted HTML or XSS-prone rendering path was added.
5. **Canonical IT contact:** Contact fallback reads the editable Information Technology department record rather than hardcoding the conflicting seed extensions found in article prose.
6. **Quick-link compatibility:** Quick links use dedicated fields instead of overloading `sortOrder`, preserving ordering behavior for Getting Started and other article categories.
7. **Cloud compatibility:** Cover image fields retain the existing URL contract; no storage bypass or unvalidated upload path was introduced.

## Files Added or Modified

```text
server/src/models/KnowledgeArticle.js
server/src/models/KnowledgeArticleVote.js
server/src/models/index.js
server/src/validators/knowledgeValidators.js
server/src/validators/knowledgeVoteValidators.js
server/src/controllers/knowledgeController.js
server/src/routes/knowledge.js
server/src/utils/seed.js
client/src/services/knowledgeService.js
client/src/hooks/useKnowledge.js
client/src/pages/ItHelp.jsx
client/src/components/content/RichText.jsx
client/src/App.jsx
client/src/pages/Dashboard.jsx
client/src/i18n/messages.js
client/src/hooks/LanguageContext.jsx
docs/TASK_14_COMPLETION_REPORT.md
```

**Task 14 Status:** ✅ **IMPLEMENTED AND FOCUSED-VALIDATED**

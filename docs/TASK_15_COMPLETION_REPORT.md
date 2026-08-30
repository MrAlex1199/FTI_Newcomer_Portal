# Task 15: Global Search - ✅ IMPLEMENTED

**Date:** August 30, 2026  
**Status:** ✅ Implementation and focused validation completed

## Summary

Task 15 adds authenticated global search across the existing internal data domains: employees, interns, departments, FAQs, policies, announcements, knowledge/IT Help articles, and company information. Projects were not included because the repository has no Project model, route, controller, or client API.

The feature provides a unified grouped response, exact/prefix/partial relevance scoring, server-side visibility filtering, a debounced navbar dropdown, recent searches in local storage, a dedicated `/search` results page, safe result URLs, Thai/English UI labels, and separate short-retention search analytics.

## Backend Implementation

### Search API and authorization

**Files:**

- `server/src/controllers/searchController.js`
- `server/src/routes/search.js`
- `server/src/validators/searchValidators.js`
- `server/src/app.js`
- `server/src/config/permissions.js`
- `client/src/utils/permissions.js`

Added:

```text
GET /api/v1/search?q=<term>&limit=<per-group-limit>&types=<comma-separated-types>
```

The endpoint is protected by authentication and the new `search:view` permission, granted to all authenticated roles. Query input is trimmed and bounded to 100 characters; entity types are allow-listed; the per-group limit is bounded to 20.

The response shape is:

```json
{
  "success": true,
  "data": {
    "query": "printer",
    "total": 3,
    "groups": [
      {
        "type": "knowledge",
        "count": 1,
        "results": [
          {
            "id": "...",
            "entityType": "knowledge",
            "title": "Printer Is Not Printing",
            "summary": "...",
            "url": "/it-help?article=...",
            "score": 1,
            "meta": { "category": "it_help", "subcategory": "printer" }
          }
        ]
      }
    ]
  }
}
```

### Search behavior and security

The controller runs entity searches in parallel with `Promise.all`. User input is escaped before being used in case-insensitive controlled regex queries, preventing regex injection and supporting punctuation and Thai/Unicode terms without relying on raw user-provided patterns.

Results are scored deterministically:

- Exact field match: `1.00`
- Prefix match: `0.85`
- Partial match: `0.65`
- Other matched fields: `0.40`

Results are sorted by score and then title. Employee search also resolves matching active department names/codes so a search for `IT` can return IT department members even when the employee’s own title does not contain the term.

Visibility is applied before result projection:

- Employees: published records only.
- Interns: published records only, with no age or private profile fields returned.
- Departments: active departments only.
- FAQs: published records only.
- Policies: published records only.
- Announcements: current published, scheduled, expiry-valid, role-targeted records using `Announcement.visibleToRoleFilter`.
- Knowledge/IT Help: published articles matching the user’s role target.
- Company: the default company document or the existing safe fallback, returned as a minimal synthetic result.

Search results never return raw article/policy/announcement content, employee contact fields, intern age, unpublished flags, or full model objects.

### Search analytics

**File:** `server/src/models/SearchEvent.js`

Added a separate analytics collection rather than using the sensitive-action `AuditLog`. Each event records the bounded query, requester ID and role, total returned results, result entity types, and latency. A MongoDB TTL index removes events after 90 days.

Analytics writes are best-effort and do not prevent search responses if analytics persistence is unavailable.

## Client Implementation

### Search data layer

**Files:**

- `client/src/services/searchService.js`
- `client/src/hooks/useGlobalSearch.js`

Added an Axios service and React Query hook. Empty and whitespace-only queries do not issue a request. Query results are briefly cached to avoid duplicate requests while navigating between the dropdown and full results page.

### Navbar search and recent searches

**File:** `client/src/components/common/GlobalSearch.jsx`

Added a reusable global search component with:

- Existing `SearchBar` debounce behavior of 300 ms.
- Search dropdown grouped by entity type.
- Localized entity headings and result summaries.
- Loading, error, and no-result states.
- View All Results navigation.
- Clickable result navigation.
- A bounded, de-duplicated five-item recent-search list in `localStorage`.
- Clear recent-search action.

The search component is included in `AppShell` and the protected pages that use custom headers: Dashboard, Employees, Departments, Interns, and Intern Batches.

The shared `SearchBar` now accepts focus, blur, and accessible-label props without changing existing page-local search behavior.

### Full results page

**File:** `client/src/pages/SearchResults.jsx`

Added protected `/search` with:

- Query editing with the same 300 ms debounce.
- Grouped result sections and localized counts.
- Relevance score indicators.
- Loading, error, empty, and no-query states.
- Click-through links to employee, intern, department, FAQ, policy, announcement, knowledge/IT Help, and company pages.

Knowledge and FAQ result URLs include identifiers used by their existing pages for article selection/opening behavior.

### Routing and localization

**Files:**

- `client/src/App.jsx`
- `client/src/i18n/messages.js`
- `client/src/utils/permissions.js`
- `client/src/pages/ItHelp.jsx`
- `client/src/pages/FAQ.jsx`

Added the protected `/search` route, global-search English/Thai strings, localized entity type names, and the client-side `search:view` permission mirror. IT Help and FAQ pages accept result identifiers in their URLs so global-search links can target the relevant content.

Projects are intentionally not presented as a result type because no repository infrastructure exists for them.

## Validation

### ✅ Server syntax and import checks

Passed:

```text
node --check src/controllers/searchController.js
node --check src/routes/search.js
node --check src/validators/searchValidators.js
node --check src/models/SearchEvent.js
node --check src/config/permissions.js
node --check src/app.js
node --input-type=module -e "import('./src/app.js').then(({default: app}) => console.log('app-loaded', typeof app))"
```

### ✅ Authentication smoke check

A temporary in-process HTTP server confirmed that the new endpoint rejects an unauthenticated request:

```text
GET /api/v1/search?q=printer -> 401
```

### ✅ Client production build

Passed:

```text
npm run build
```

Vite transformed 204 modules and produced the production bundle successfully.

### ✅ Vite route smoke test

A temporary Vite process returned HTTP 200 for:

```text
/search?q=printer
/it-help?article=sample
/dashboard
/employees
/intern-batches
```

The temporary Vite process was stopped after validation.

### Validation limitation

A complete authenticated MongoDB acceptance suite was not run in this pass because it requires a running seeded database and valid session credentials. The remaining live scenarios to exercise in that environment are exact/partial ranking, `john` cross-domain matches, `IT` department/staff/IT Help matches, role-targeted content exclusion, scheduled/expired announcement exclusion, and special-character/Thai queries.

## Compatibility and Security Decisions

1. **Existing domain scope:** Search includes every existing searchable internal domain and excludes the specification’s Project type because Project infrastructure is absent.
2. **Visibility before projection:** Every search query applies publication, schedule, active-state, and role-target filters before returning result summaries.
3. **Controlled search input:** Queries are length-bounded and regex-escaped; no arbitrary Mongo operators or raw regular expressions are accepted.
4. **Safe result payloads:** Search results expose only identifiers, titles, short summaries, safe URLs, scores, and minimal metadata.
5. **Separate analytics:** Search terms are operational analytics, not administrative audit records, and are subject to 90-day TTL retention.
6. **Existing debounce reused:** The established 300 ms `SearchBar` behavior is reused rather than creating a second debounce implementation.
7. **No automatic content translation:** Entity titles and authored content remain server-authored; only surrounding search UI and entity labels are localized.

## Files Added or Modified

```text
server/src/controllers/searchController.js
server/src/routes/search.js
server/src/validators/searchValidators.js
server/src/models/SearchEvent.js
server/src/models/index.js
server/src/config/permissions.js
server/src/app.js
client/src/services/searchService.js
client/src/hooks/useGlobalSearch.js
client/src/components/common/GlobalSearch.jsx
client/src/components/common/SearchBar.jsx
client/src/pages/SearchResults.jsx
client/src/App.jsx
client/src/components/layout/AppShell.jsx
client/src/pages/Dashboard.jsx
client/src/pages/Employees.jsx
client/src/pages/Departments.jsx
client/src/pages/Interns.jsx
client/src/pages/InternBatches.jsx
client/src/pages/ItHelp.jsx
client/src/pages/FAQ.jsx
client/src/i18n/messages.js
client/src/utils/permissions.js
docs/TASK_15_COMPLETION_REPORT.md
```

**Task 15 Status:** ✅ **IMPLEMENTED AND FOCUSED-VALIDATED**

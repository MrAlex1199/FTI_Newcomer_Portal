# Thai / English Localization - ✅ COMPLETED

**Date:** August 30, 2026  
**Status:** ✅ All localization subtasks completed

## Summary

The portal now uses Thai as its default interface language and provides English as an additional selectable language. The selected language is persisted across refreshes without changing authentication behavior, API contracts, enum values, server-authored content, CRUD flows, or safe rich-text rendering.

The implementation uses a dependency-free localization layer with a shared language provider and message dictionary. When no valid preference exists, the interface starts in Thai. Users can switch between Thai and English from the shared application shell.

## Implemented Behavior

- Thai (`th`) is the default language.
- English (`en`) is available from the language selector.
- The selected value is persisted as `localStorage['fti-language']`.
- Invalid or unavailable stored values fall back to Thai.
- `document.documentElement.lang` updates to `th` or `en`.
- Date formatting uses `th-TH` for Thai and `en-US` for English.
- API enum values remain unchanged; only their displayed labels are translated.
- Employee names, department names, article content, policy text, FAQ content, and company-authored data remain server-authored and are not machine-translated.
- Server error messages continue to be shown when returned by the API; client fallback messages are localized.

## Localization Foundation

**Files:**

- `client/src/i18n/messages.js`
- `client/src/hooks/LanguageContext.jsx`
- `client/src/hooks/useLanguage.js`
- `client/src/components/common/LanguageToggle.jsx`
- `client/src/components/layout/AppShell.jsx`
- `client/src/main.jsx`

`LanguageProvider` wraps the application inside the existing `QueryClientProvider`. `AppShell` provides the shared brand, dashboard navigation, and language selector for authenticated and public portal pages.

## Localized Areas

### Authentication and shared UI

- Login and sign-in feedback.
- Protected-route loading and unauthorized states.
- Dashboard navigation, role cards, and admin-area links.
- Common loading, empty, error, modal, confirmation, pagination, search, upload, badge, and rich-text controls.

### Portal pages

- Dashboard.
- Employees and employee details.
- Departments and department details.
- Interns, intern details, batches, and batch details.
- Organization chart, including controls, accessibility labels, orphan-link explanations, and mobile view.
- Policies and FAQ pages and management forms.
- Getting Started guide and article management UI.
- Company information and office-map UI.
- Unauthorized and admin-only pages.

### Forms and validation

Client-side validation and helper messages now use translations for employee, department, intern, batch, guide, and image-upload forms. This includes required fields, email validation, date-range validation, manager assignment guidance, sort-order validation, and image type/size/dimension errors.

## Verification

### ✅ Client build

Command:

```text
npm run build
```

Result:

- Passed successfully.
- Vite transformed 196 modules.
- No JSX, JavaScript, or bundling errors.
- Final build output generated under `client/dist`.

### ✅ Vite route smoke test

A temporary Vite development process was started and stopped after verification. The following routes returned HTTP 200 and contained the application root:

```text
/login
/dashboard
/getting-started
/company
/policies
/faq
/employees
/departments
/interns
/intern-batches
/organization
```

### ✅ Source-level persistence checks

Reviewed and confirmed:

- The provider reads `fti-language` safely from `localStorage`.
- Missing, invalid, or unavailable storage values resolve to Thai.
- `setLanguage` accepts only `th` and `en` and writes the selected value back to storage.
- The language selector is wired to the shared provider.
- The document language attribute and locale update with the selected language.

### Browser verification note

No browser automation runner is configured in this repository, so visual interaction with the selector was not automated. The provider, selector wiring, persistence logic, production build, and route shell behavior were verified from source and through the Vite smoke test. Manual browser verification can confirm the final visual behavior by selecting English, refreshing, selecting Thai, and refreshing again.

## Design Decisions

1. **Custom dictionary instead of a new dependency:** The portal is small and static UI messages are adequately served by a dependency-free message dictionary.
2. **Explicit Thai default:** The product requirement takes precedence over the browser locale, so the browser language is not used to choose the initial language.
3. **Language independent of authentication:** Preference state is stored in the language provider rather than auth state, allowing it to persist independently of login/session changes.
4. **Display-only enum translation:** Backend values such as `published`, `draft`, `first_day`, and role identifiers remain in their original form for API validation and data integrity.
5. **Shared shell integration:** A reusable shell keeps the selector consistently available without changing existing route protection or permissions.
6. **Safe content preservation:** Localization changes do not weaken the existing constrained rich-text renderer or introduce unsafe HTML rendering.

## Files Added or Modified

The primary localization files are:

```text
client/src/i18n/messages.js
client/src/hooks/LanguageContext.jsx
client/src/hooks/useLanguage.js
client/src/components/common/LanguageToggle.jsx
client/src/components/layout/AppShell.jsx
client/src/main.jsx
```

The translated page, form, chart, content, and common-component changes are listed in the session change set and are contained under `client/src`.

**Localization Status:** ✅ **COMPLETE**

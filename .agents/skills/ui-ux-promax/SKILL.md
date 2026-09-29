---
name: ui-ux-promax
description: >
  Premier UI/UX Design System and standards for enterprise web applications.
  Guides modern card-based interfaces, glassmorphism, responsive grids, micro-interactions,
  cohesive typography, accessible state indicators, and information-dense layouts.
  Use when redesigning pages, building cards, directories, dashboards, or when the user
  requests 'UI/UX Promax', 'modern card design', or elite frontend polish.
---

# UI/UX Promax Design System & Standards

This skill defines the elite UI/UX standards for the FTI Portal and modern enterprise web apps. It guarantees designs that wow users on first glance while preserving rock-solid usability and high information density.

---

## 1. Core Principles

1. **Information Architecture & Density**:
   - Avoid empty, sparse cards or bloated white space.
   - Group data into clear visual hierarchies: Primary (Title, Avatar, Status), Secondary (Role, Department, Code), Metadata (Contact, Timestamps, Metrics).
2. **Interactive States & Micro-animations**:
   - `transition-all duration-200` on interactive elements.
   - Hover states: Subtle elevation (`hover:shadow-lg`, `hover:-translate-y-0.5`, `hover:border-primary-400`).
   - Active states: Subtle press effect (`active:scale-[0.99]`).
3. **Dual View Flexibility**:
   - Provide a View Switcher (`⊞ Cards Grid` vs `☰ Table List`) where applicable, defaulting to rich Cards.
4. **Scannability**:
   - Use color-coded status badges, meaningful icons, and high-contrast typography.
   - Truncate long text gracefully with native `title` tooltips.

---

## 2. Card Anatomy Standard

Every entity card (`EmployeeCard`, `InternCard`, `DepartmentCard`) follows a balanced 4-tier structure:

```
+-----------------------------------------------------------+
| [Header] Avatar / Icon  | Name, Code, Badges   | Quick Menu|
+-----------------------------------------------------------+
| [Body] Position, Department, Mentor / University           |
|        Contact info chips (Email, Phone, Location)         |
+-----------------------------------------------------------+
| [Stats / Metrics] Tags, Active Counts, Project chips       |
+-----------------------------------------------------------+
| [Footer] Secondary actions (View Detail, Edit, Delete)     |
+-----------------------------------------------------------+
```

### Style Classes:
- **Card Container**: `relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:border-primary-400 hover:shadow-lg hover:-translate-y-0.5 group`
- **Avatar**: `h-14 w-14 rounded-2xl object-cover ring-2 ring-slate-100 shadow-xs`
- **Badge / Pill**: `inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold`
- **Primary Text**: `font-bold text-slate-900 group-hover:text-primary-600 transition-colors`

---

## 3. Top Toolbar & Filtering

- **Header Banner**: Page title + subtitle + total count chip + primary action (`+ Add New`).
- **Search & Filter Bar**:
  - Live search input with instant clear `✕`.
  - Filter dropdowns (Department, Batch, Status) styled with rounded corners and focus rings.
  - Quick filter pills for instant 1-click filtering.
  - View toggle button group (`Grid` / `List`).

---

## 4. Responsive Grid Breakpoints

- Mobile (< 640px): 1 column (`grid-cols-1 gap-4`)
- Tablet (640px - 1024px): 2 columns (`sm:grid-cols-2 gap-4`)
- Desktop (1024px - 1536px): 3 columns (`lg:grid-cols-3 gap-5`)
- Ultra-wide (≥ 1536px): 4 columns (`2xl:grid-cols-4 gap-5`)

---

## 5. Accessibility & Quality Checklist

- [ ] All interactive buttons and links have distinct focus states (`focus-visible:ring-2`).
- [ ] Contrast ratio meets WCAG AA (at least 4.5:1 for body text).
- [ ] Fallback initials rendered if avatar image fails to load.
- [ ] Empty state renders friendly illustration/emoji + helpful guidance button.
- [ ] Loading skeleton with shimmer animations (`animate-pulse`) instead of blank space.

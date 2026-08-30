Perfect! I now have all the information I need to create a tailored implementation plan. Let me conduct some research and then build your comprehensive plan.Let me research best practices for your technical stack and organizational patterns:Excellent! Now I have all the context I need. Let me create your comprehensive implementation plan.

---

# **Implementation Plan - FTI Newcomer Portal**

## **Problem Statement**

New interns and employees at Function International (FTI) face challenges during onboarding:
- Company information is scattered across multiple sources
- No centralized directory for finding colleagues and mentors
- Unclear who to contact for specific issues (IT, HR, Admin)
- Lack of structured onboarding guidance for first days
- No knowledge transfer between intern cohorts

**Scope:** Build an internal web portal that centralizes onboarding information, employee/intern directories, organizational structure, policies, and guides - demonstrating full-stack development skills with production-ready security and scalability.

---

## **Requirements**

### **Project Context**
- **Timeline:** 4-6 weeks (aggressive MVP delivery)
- **Developer Level:** Advanced (experienced with React, Node.js, MongoDB)
- **Deployment:** Cloud-based (Vercel/Netlify + Render/Railway + MongoDB Atlas)
- **Data:** Dummy/seed data for demonstration purposes
- **Primary Goal:** Demonstrate full-stack development expertise
- **Technical Focus:** Complex data relationships (org charts, hierarchies, role-based access)

### **Functional Requirements**

**Core Features (MUST HAVE):**
1. **Authentication & Authorization**
   - 5 role levels: super_admin, admin, editor, staff, intern
   - JWT with HttpOnly cookies
   - Password hashing (bcrypt/Argon2id)
   - Rate limiting & account lockout

2. **Employee Directory**
   - CRUD operations with role-based access
   - Search and filter capabilities
   - Profile photos
   - Department assignments

3. **Intern Management**
   - Intern profiles with batch system
   - University and mentor tracking
   - Timeline (start/end dates)
   - Status management (active/completed/upcoming)

4. **Organization Chart**
   - Interactive hierarchical tree structure
   - Manager-employee relationships
   - Department-based filtering
   - Employee detail popups

5. **Department Management**
   - Department CRUD
   - Manager assignments
   - Contact information
   - Location details

6. **Content Management**
   - Getting Started guide
   - Policies & regulations
   - FAQ system
   - Company location map

7. **Admin Dashboard**
   - Statistics (employee count, active interns, departments)
   - Content management interface
   - User management
   - Audit logs

**Enhanced Features (HIGH VALUE, if time permits):**
8. **Announcements System** - Critical for practical use
9. **IT Help Center** - Showcases IT support expertise
10. **Global Search** - Improves UX significantly
11. **Feedback System** - Demonstrates two-way communication

**Future Scope (Post-MVP):**
- Intern Alumni & Knowledge Archive
- Project Showcase
- QR Profile Cards
- Onboarding Checklist with progress tracking
- AI Assistant (RAG-based chatbot)

### **Non-Functional Requirements**

**Security:**
- No plaintext passwords
- Environment variable management
- Input validation (client + server)
- CSRF protection for cookies
- XSS prevention
- File upload validation
- Backend authorization on ALL protected routes

**Performance:**
- Response time < 2s for API calls
- Optimized MongoDB queries
- Image compression and resizing
- Pagination for large datasets

**Usability:**
- Mobile-responsive design
- Loading, empty, and error states
- Accessible UI (keyboard navigation, focus states, ARIA labels)
- Thai + English language support in UI

**Scalability:**
- Modular architecture for easy feature additions
- Reusable React components
- Consistent API response format
- Clear separation of concerns

---

## **Background**

### **Research Findings**

**Company Context (from FTI website):**
- Function International Public Company Limited (FTI)
- Business: Manufacturing, import, and wholesale distribution of water system products
- Over 20 brands in portfolio
- Focus on quality products at accessible prices
- Emphasis on sustainability and good governance
- Office: 313 Charoenpattana Road, Bang Chan, Khlong Sam Wa, Bangkok 10510

**Technical Architecture Decision:**

**Monorepo vs Separate Repos:**
- **Recommendation: Monorepo** for your 4-6 week timeline
- **Reasoning:**
  - Faster development (shared configs, scripts)
  - Easier local development setup
  - Simpler dependency management
  - Better for solo development
  - Still deployable to separate cloud services
  - Can split later if needed

**Project Structure:**
```
fti-welcome-hub/
├── client/          # React + Vite frontend
├── server/          # Express backend
├── docs/            # Documentation
├── .env.example     # Environment template
└── package.json     # Root scripts
```

**Tech Stack Justification:**

| Technology | Why Chosen |
|------------|------------|
| **React + Vite** | Fast dev experience, modern tooling, component reusability |
| **Tailwind CSS** | Rapid UI development, consistent design system, responsive utilities |
| **Node.js + Express** | JavaScript full-stack, RESTful API simplicity, extensive ecosystem |
| **MongoDB + Mongoose** | Flexible schema for varied content types, easy prototyping, scalable |
| **JWT + HttpOnly Cookies** | Stateless auth, XSS protection, standard approach |
| **bcrypt** | Industry-standard password hashing, battle-tested |

**Key Technical Patterns:**

1. **Role-Based Access Control (RBAC)**
   - Middleware-based authorization
   - Permission matrix enforcement
   - Frontend route guards + backend validation

2. **Data Relationships**
   - Employee → Department (many-to-one)
   - Employee → Manager (self-referential)
   - Intern → Mentor (Employee reference)
   - Intern → Batch (many-to-one)
   - User → Employee/Intern (one-to-one optional)

3. **API Design Pattern**
   - Consistent response format: `{ success, data, message, pagination }`
   - RESTful endpoints with proper HTTP verbs
   - Query string filtering: `?search=x&department=y&page=1&limit=20`
   - Validation middleware using Zod/Joi

4. **Component Architecture**
   - Atomic design: atoms → molecules → organisms → templates → pages
   - Reusable components: DataTable, SearchBar, Modal, FormInput, etc.
   - Feature-based folder structure for scalability

---

## **Proposed Solution**

### **System Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│                    (React + Vite App)                        │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS REST API
                     │ (Axios + TanStack Query)
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Express API Server                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Middleware Stack                                      │  │
│  │ • CORS • Helmet • Rate Limit • Auth • RBAC           │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Routes                                                │  │
│  │ /auth /employees /interns /departments /organization │  │
│  │ /announcements /policies /faq /feedback              │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Controllers → Services → Models                       │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    MongoDB Atlas                             │
│  • Users  • Employees  • Interns  • Departments             │
│  • InternBatches  • Announcements  • Policies  • FAQ        │
│  • KnowledgeArticles  • Projects  • Feedback  • AuditLogs   │
└─────────────────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Object Storage (Cloudinary)                     │
│  • Profile photos  • Cover images  • Documents              │
└─────────────────────────────────────────────────────────────┘
```

### **Database Schema Highlights**

**Key Relationships:**
```
User ──(auth)──> Employee/Intern
Employee ──> Department
Employee ──(manages)──> Employee
Intern ──> Employee (mentor)
Intern ──> InternBatch
Intern ──> Department
Announcement ──(targetRoles)──> User roles
```

### **Authentication Flow**

```
1. Login: POST /api/v1/auth/login
   → Validate credentials
   → Generate JWT access token (15min)
   → Generate refresh token (7d)
   → Set HttpOnly cookie
   → Return user data

2. Protected Route Access:
   → Extract token from cookie
   → Verify JWT signature
   → Check expiration
   → Attach user to request
   → Check role permissions
   → Allow/Deny access

3. Token Refresh: POST /api/v1/auth/refresh
   → Validate refresh token
   → Issue new access token
   → Update cookie

4. Logout: POST /api/v1/auth/logout
   → Clear cookies
   → Invalidate refresh token
```

### **Authorization Matrix Implementation**

**Middleware Pattern:**
```javascript
// Require authentication
router.use(authenticate);

// Require specific roles
router.post('/employees', authorize(['super_admin', 'admin']), createEmployee);
router.patch('/employees/:id', authorize(['super_admin', 'admin']), updateEmployee);
router.delete('/employees/:id', authorize(['super_admin']), deleteEmployee);

// Require ownership or admin
router.patch('/interns/:id', authorizeOwnerOrAdmin('intern'), updateIntern);
```

---

## **Task Breakdown**

I'll structure this as **10 phases** over **4-6 weeks**, with each task resulting in working, demoable functionality following test-driven development principles.

### **Week 1: Foundation & Authentication**

---

#### **Task 1: Project Bootstrap & Environment Setup**

**Objective:** Set up monorepo structure with client and server, establish development environment, and verify all tools are working.

**Implementation Guidance:**
1. Initialize monorepo with root package.json containing concurrently scripts
2. Create `client/` folder with Vite + React + Tailwind
3. Create `server/` folder with Express + basic middleware
4. Set up MongoDB Atlas cluster and connection
5. Configure environment variables (.env.example for both client/server)
6. Add CORS, Helmet, express-rate-limit
7. Create health check endpoint `/api/health`
8. Set up Git repository with proper .gitignore

**Test Requirements:**
- Root `npm run dev` starts both client and server
- Server connects to MongoDB successfully
- Health endpoint returns 200 OK
- Client displays "Hello World" React component
- Environment variables load correctly

**Demo:** Open browser to localhost:5173 (client) and localhost:5000/api/health (server), show both running simultaneously with hot reload.

---

#### **Task 2: Database Models & Schema Design**

**Objective:** Create all MongoDB schemas with Mongoose, establish relationships, and implement validation rules.

**Implementation Guidance:**
1. Create models folder: `/server/src/models/`
2. Implement User model with password hashing pre-save hook
3. Implement Employee model with department reference
4. Implement Intern model with mentor, department, and batch references
5. Implement Department model
6. Implement InternBatch model
7. Add indexes for frequently queried fields (email, employeeCode, search)
8. Add virtuals for computed fields (e.g., age from birthdate)
9. Implement model methods (e.g., `user.comparePassword()`)

**Test Requirements:**
- Create test script that inserts sample data
- Verify relationships work (population)
- Test password hashing (plaintext never saved)
- Verify unique constraints (email, username)
- Test validation rules

**Demo:** Run seed script, show data in MongoDB Compass/Atlas UI with proper relationships and data types.

---

#### **Task 3: Authentication System - Registration & Login**

**Objective:** Implement complete authentication flow with JWT tokens, HttpOnly cookies, and password security.

**Implementation Guidance:**
1. Install dependencies: jsonwebtoken, bcrypt, cookie-parser
2. Create auth controller: register, login, logout, refresh
3. Create JWT utility functions (sign, verify)
4. Implement password validation (min length, complexity)
5. Set up cookie options (httpOnly, secure, sameSite)
6. Add rate limiting specifically for auth endpoints (5 attempts per 15min)
7. Implement account lockout after failed attempts
8. Create auth middleware to extract and verify JWT from cookies
9. Add /auth/me endpoint to get current user

**Test Requirements:**
- Manual test with Postman/Thunder Client:
  - Register new user → success
  - Login with correct password → JWT in cookie
  - Login with wrong password → 401
  - Access /auth/me without token → 401
  - Access /auth/me with valid token → user data
  - Logout → cookie cleared

**Demo:** Use Postman to demonstrate complete auth flow, show JWT cookie in browser DevTools, attempt to access protected route without auth.

---

#### **Task 4: Role-Based Authorization Middleware**

**Objective:** Implement RBAC system with middleware for role checking and resource ownership validation.

**Implementation Guidance:**
1. Create authorization middleware factory: `authorize(roles[])`
2. Implement permission checking logic
3. Create ownership validator: `authorizeOwnerOrAdmin(resourceType)`
4. Add role field to User model with enum validation
5. Create test routes for each role level
6. Implement frontend route guards in React
7. Create custom hooks: `useAuth()`, `useRequireAuth()`, `useRequireRole()`
8. Add 403 Forbidden error handling

**Test Requirements:**
- Create test routes with different role requirements
- Test super_admin can access all routes
- Test admin cannot access super_admin routes
- Test intern can only edit own profile
- Test staff cannot access admin routes
- Frontend redirects unauthorized users to login

**Demo:** Login as different role types (intern, staff, admin), show different UI elements and routes accessible, attempt unauthorized action and see proper error.

---

### **Week 2: Core Data Management**

---

#### **Task 5: Employee CRUD with Search & Pagination**

**Objective:** Build complete employee management system with CRUD operations, search, filtering, and pagination.

**Implementation Guidance:**
1. Create employee routes: GET (list), GET/:id, POST, PATCH/:id, DELETE/:id
2. Implement controller with business logic
3. Add validation middleware using Zod/Joi
4. Implement search across name, position, department
5. Add filtering by department, isPublished status
6. Implement cursor/offset pagination
7. Create reusable pagination utility
8. Add sorting options (name, createdAt, department)
9. Build Employee List page in React with DataTable component
10. Create Employee Form component (shared for create/edit)
11. Add loading, empty, and error states
12. Implement optimistic updates with TanStack Query

**Test Requirements:**
- API tests:
  - GET /employees?page=1&limit=10 returns paginated results
  - GET /employees?search=john finds matching employees
  - POST /employees with valid data creates employee
  - POST /employees with invalid data returns 400
  - PATCH /employees/:id updates only allowed fields
  - DELETE /employees/:id soft deletes (or hard delete based on design)
- Frontend tests:
  - Search updates results
  - Pagination works
  - Create modal opens and submits
  - Edit prefills form
  - Delete confirmation works

**Demo:** Show employee list, search for specific employee, create new employee, edit existing, delete employee, show pagination working with 20+ records.

---

#### **Task 6: Department Management & Employee Assignment**

**Objective:** Create department management system and wire employee-department relationships.

**Implementation Guidance:**
1. Create department routes: CRUD endpoints
2. Implement department controller with manager assignment
3. Add department dropdown in Employee form (populated from API)
4. Create Department List page with employee count
5. Create Department Detail page showing all members
6. Add department filter to Employee list
7. Implement cascading updates (when department name changes)
8. Add department statistics (member count, intern count)
9. Create Department Form component
10. Add validation (prevent deleting departments with employees)

**Test Requirements:**
- Create department
- Assign manager to department
- Assign employees to department
- View department members
- Filter employees by department
- Prevent deleting non-empty department
- Update department name reflects everywhere

**Demo:** Create IT department, assign manager, add 3 employees to IT, view department detail page, show employee list filtered by IT department.

---

#### **Task 7: Intern Management with Batch System**

**Objective:** Build intern management with batch grouping, mentor assignment, and timeline tracking.

**Implementation Guidance:**
1. Create InternBatch model and CRUD routes
2. Create Intern CRUD routes with batch association
3. Implement mentor selection (dropdown of employees)
4. Add date range picker for start/end dates
5. Calculate and display status (upcoming/active/completed) based on dates
6. Create Intern List page with batch filter
7. Create Intern Detail page with profile photo
8. Implement file upload for profile photos using Multer
9. Add image validation (type, size, dimensions)
10. Integrate Cloudinary for image storage
11. Create Batch Detail page showing all interns in batch
12. Add batch timeline visualization

**Test Requirements:**
- Create intern batch (e.g., "2024/01")
- Create intern with photo upload
- Assign mentor (employee reference)
- Assign department
- Verify status auto-calculates based on dates
- Upload profile photo (reject invalid files)
- View batch page with all interns
- Filter interns by batch, status, department

**Demo:** Create new intern batch, add 3 interns with photos and different universities, assign mentors, show batch detail page with group photo placeholder, demonstrate status changes based on dates.

---

#### **Task 8: File Upload System & Image Processing**

**Objective:** Implement secure file upload with validation, image processing, and cloud storage integration.

**Implementation Guidance:**
1. Set up Multer middleware with file type validation
2. Configure Cloudinary SDK with environment variables
3. Create upload utility functions (uploadImage, deleteImage)
4. Implement image resizing using sharp (400x400 for thumbnails)
5. Add file size limits (5MB for images)
6. Validate MIME types and file signatures
7. Create reusable ImageUpload component in React
8. Add preview before upload
9. Handle upload progress indicators
10. Implement image deletion when record is deleted
11. Add fallback/placeholder images

**Test Requirements:**
- Upload valid image (JPG/PNG/WebP) → success
- Upload oversized image → rejected
- Upload non-image file → rejected
- Upload malicious file disguised as image → rejected
- View uploaded image in browser
- Delete record also deletes image from Cloudinary
- Show placeholder when no image exists

**Demo:** Upload employee profile photo, show thumbnail generation, attempt to upload PDF (rejected), delete employee and verify image removed from Cloudinary.

---

### **Week 3: Organizational Structure & Content**

---

#### **Task 9: Organization Chart - Data Structure & API**

**Objective:** Build hierarchical organization tree API that returns employee-manager relationships for visualization.

**Implementation Guidance:**
1. Add managerId field to Employee model (self-referential)
2. Create `/organization/tree` endpoint
3. Implement recursive tree builder algorithm
4. Optimize query with aggregation pipeline
5. Add department grouping option
6. Cache tree data (Redis or in-memory for MVP)
7. Add endpoint to update reporting structure
8. Handle orphaned nodes (employees without managers)
9. Return tree in nested JSON format
10. Add depth limiting to prevent infinite loops

**Test Requirements:**
- Create employees with manager relationships
- GET /organization/tree returns proper hierarchy
- Root node has no manager (CEO/President)
- All employees appear in tree
- Department filtering works
- Update manager updates tree structure
- Handle circular reference prevention

**Demo:** Use Postman to show tree API response, demonstrate nested structure with CEO → Directors → Managers → Staff.

---

#### **Task 10: Organization Chart - Interactive UI**

**Objective:** Build interactive, visual organization chart with zoom, pan, search, and employee detail popups.

**Implementation Guidance:**
1. Install react-organizational-chart or similar library (or D3.js for custom)
2. Create OrganizationChart component
3. Implement tree rendering from API data
4. Add zoom in/out controls
5. Add pan/drag functionality
6. Implement node click → employee detail modal
7. Add search that highlights matching nodes
8. Add department filter toggle
9. Implement expand/collapse for large trees
10. Add responsive mobile view (simplified tree or list fallback)
11. Style nodes with employee photos, names, positions

**Test Requirements:**
- Tree renders correctly with all employees
- Click employee node shows detail modal
- Search highlights matching employees
- Zoom and pan work smoothly
- Department filter updates tree
- Collapse/expand works
- Mobile responsive view displays

**Demo:** Show full organization chart, zoom to specific department, search for employee name and see highlighted, click node to show employee details, toggle department filter.

---

#### **Task 11: Content Management - Policies & FAQ**

**Objective:** Build admin interface for managing policies, regulations, and FAQ with rich text editing.

**Implementation Guidance:**
1. Create Policy model (title, content, category, version, effectiveDate)
2. Create FAQ model (question, answer, category, sortOrder)
3. Implement CRUD routes for both
4. Add category management
5. Integrate rich text editor (TipTap or React Quill)
6. Create Policy List page (admin) with publish/unpublish toggle
7. Create FAQ List page (admin) with drag-drop reordering
8. Create public Policy List page (filtered by published)
9. Create public FAQ page with search and category filter
10. Add version history for policies (optional but impressive)
11. Implement accordion UI for FAQ

**Test Requirements:**
- Admin can create policy with rich text
- Admin can publish/unpublish policies
- Staff/intern can only view published policies
- Admin can create FAQ with categories
- Admin can reorder FAQ items
- Public FAQ page shows only published items
- Search FAQ returns relevant results
- Category filter works

**Demo:** Login as admin, create new policy "Dress Code" with formatted text, publish it, login as intern and see it in policies page, create 5 FAQs in different categories, reorder them, show public FAQ page with search.

---

#### **Task 12: Getting Started Guide & Company Info**

**Objective:** Create onboarding guide system with multi-section content and company information management.

**Implementation Guidance:**
1. Create KnowledgeArticle model (flexible for guides, help articles)
2. Create sections: First Day, First Week, Before Leaving
3. Implement article CRUD with category grouping
4. Create CompanyInfo model/settings (single document pattern)
5. Add admin interface to edit company info
6. Create Getting Started page with tabbed sections
7. Create Company Info page (about, vision, mission, history)
8. Add company location map (Google Maps or Leaflet integration)
9. Create interactive office map with marked locations
10. Add contact information section

**Test Requirements:**
- Admin can create articles in different categories
- Getting Started page shows articles grouped by section
- Articles support rich text and images
- Admin can update company information
- Company info displays on About page
- Map shows company location with marker
- Interactive points show office facilities

**Demo:** Show Getting Started guide with "First Day" checklist, "First Week" setup instructions, Company About page with mission/vision, interactive office map with marked parking, reception, IT desk.

---

### **Week 4: Enhanced Features & Admin**

---

#### **Task 13: Announcements System**

**Objective:** Build announcement/news system with scheduling, targeting, and priority levels.

**Implementation Guidance:**
1. Create Announcement model (title, content, category, publishAt, expireAt, targetRoles, isPinned)
2. Implement CRUD routes with scheduling logic
3. Add announcement controller with filtering (show only published & unexpired & matching role)
4. Create admin Announcement List with status indicators (draft, scheduled, published, expired)
5. Create Announcement Form with date-time picker
6. Add role targeting (select which roles can see announcement)
7. Create public Announcements page with category filter
8. Add "pinned" announcements at top
9. Implement announcement cards with cover images
10. Add dashboard widget showing recent announcements for user's role

**Test Requirements:**
- Admin creates announcement scheduled for future → not visible until publishAt
- Admin creates announcement with expiry → disappears after expireAt
- Announcement targeted to "intern" role → only interns see it
- Pinned announcement appears at top
- Cover image upload works
- Dashboard shows relevant announcements
- Expired announcements hidden from public but visible in admin

**Demo:** Create announcement "Welcome 2024 Interns" targeted to intern role, schedule it, show it doesn't appear yet, change date to now, show it appears on dashboard, create another pinned announcement, show it appears first.

---

#### **Task 14: IT Help Center & Knowledge Base**

**Objective:** Create IT self-service knowledge base with categorized articles and search functionality.

**Implementation Guidance:**
1. Reuse KnowledgeArticle model with "IT_HELP" category
2. Create subcategories: Windows, Printer, Network, Email, Software, etc.
3. Implement article templates with troubleshooting steps
4. Create IT Help Center page with category navigation
5. Add search within IT articles only
6. Implement article rating system (helpful/not helpful)
7. Create admin interface to manage IT articles
8. Add "Related Articles" suggestions
9. Create "Quick Links" section (common issues)
10. Add contact IT support fallback button

**Test Requirements:**
- Create articles in different IT categories
- Articles appear in correct category pages
- Search finds relevant articles
- Rating system works
- Quick links section displays
- Admin can edit articles
- Support contact button displays

**Demo:** Show IT Help Center homepage with categories, click "Printer" category and see articles, search "print not working", view article with troubleshooting steps, rate article as helpful, show "Contact IT" fallback button.

---

#### **Task 15: Global Search Functionality**

**Objective:** Implement global search across all entities (employees, interns, departments, articles, FAQ) with unified results.

**Implementation Guidance:**
1. Create `/search` endpoint with query parameter
2. Implement parallel search across multiple collections
3. Weight results by relevance (exact match > partial match)
4. Return unified format with entity type indicator
5. Add search debouncing in frontend (300ms)
6. Create SearchBar component in navbar
7. Implement search results dropdown with entity type badges
8. Add "View All Results" link to dedicated search page
9. Add recent searches (local storage)
10. Implement search analytics (track what users search)

**Test Requirements:**
- Search "john" returns matching employees, interns, articles
- Search "IT" returns department, IT help articles, IT staff
- Results grouped by type (Employees, Articles, FAQ, etc.)
- Click result navigates to correct page
- Empty search shows no results
- Search handles special characters safely

**Demo:** Type "printer" in global search, see results from FAQ, IT Help articles, possibly employee named "Printer Tech", click FAQ result and navigate to that FAQ, show "View All" page with grouped results.

---

#### **Task 16: Admin Dashboard with Statistics**

**Objective:** Create comprehensive admin dashboard with key metrics, charts, and quick actions.

**Implementation Guidance:**
1. Create `/admin/dashboard` route (admin only)
2. Implement statistics endpoints:
   - Total employees, active interns, departments count
   - Interns by university (chart data)
   - Interns by department (chart data)
   - Recent activity (new employees, announcements, etc.)
3. Install charting library (Recharts or Chart.js)
4. Create StatCard component (reusable metric card)
5. Create PieChart for intern distribution
6. Create BarChart for department sizes
7. Add quick action buttons (Add Employee, Add Intern, etc.)
8. Create recent activity feed
9. Add pending items counter (unpublished content, feedback)
10. Make dashboard responsive

**Test Requirements:**
- Dashboard shows correct total counts
- Charts display data accurately
- Clicking stat card navigates to relevant list
- Quick action buttons work
- Recent activity updates in real-time
- Dashboard loads within 2 seconds

**Demo:** Show admin dashboard with statistics cards, pie chart showing interns by university, bar chart showing employees per department, recent activity feed, click "Add Employee" quick action.

---

#### **Task 17: User Management & Audit Logging**

**Objective:** Build user management interface for admins and implement audit logging for sensitive actions.

**Implementation Guidance:**
1. Create AuditLog model (userId, action, entity, before, after, timestamp, ip)
2. Create audit logging middleware for POST/PATCH/DELETE
3. Implement user management routes (admin only)
4. Create User List page (admin) showing all users
5. Add user activation/deactivation toggle
6. Add role change functionality (super_admin only)
7. Create Audit Log page (super_admin only) with filtering
8. Add password reset functionality (admin can reset user password)
9. Implement user activity tracking (last login)
10. Add bulk actions (deactivate multiple users)

**Test Requirements:**
- Admin creates employee → audit log entry created
- Admin updates policy → audit log captures before/after
- Admin deletes announcement → logged
- Super_admin can view audit logs
- Regular admin cannot view audit logs
- User list shows active/inactive status
- Password reset sends notification (or shows temp password)

**Demo:** Show user management page, create new user, assign role, activate/deactivate user, change user role from staff to editor, view audit log showing all these actions with timestamps and user who performed them.

---

### **Week 5: Feedback, Polish & Testing**

---

#### **Task 18: Feedback System**

**Objective:** Implement user feedback collection system with admin review interface.

**Implementation Guidance:**
1. Create Feedback model (userId, category, message, rating, status, adminNote)
2. Implement feedback submission endpoint (authenticated users)
3. Create Feedback Form component with category dropdown
4. Add optional rating (1-5 stars)
5. Create Feedback List page (admin) with status filter
6. Add admin actions: mark as resolved, add notes
7. Create Feedback widget (button in corner of pages)
8. Add email notification for new feedback (optional)
9. Implement feedback statistics in admin dashboard
10. Add feedback success message with ticket number

**Test Requirements:**
- User submits feedback → saved to database
- Admin sees feedback in list
- Admin can mark feedback as resolved
- Admin can add internal notes
- Feedback categories work
- Rating displays correctly
- Anonymous feedback allowed (optional)

**Demo:** As intern user, submit feedback "Can't find printer information", as admin, view feedback list, add note "Added printer article to IT Help", mark as resolved, show status updated.

---

#### **Task 19: UI/UX Polish & Responsive Design**

**Objective:** Refine UI/UX across all pages, ensure mobile responsiveness, add loading states, and improve accessibility.

**Implementation Guidance:**
1. Audit all pages for loading states (skeleton loaders)
2. Add empty states with illustrations and CTAs
3. Implement error boundaries in React
4. Add toast notifications for success/error messages
5. Ensure all forms have proper validation feedback
6. Test and fix mobile layouts (hamburger menu, collapsible filters)
7. Add keyboard navigation support (tab order, focus indicators)
8. Implement dark mode toggle (optional but impressive)
9. Add smooth transitions and animations
10. Optimize images (lazy loading, WebP format)
11. Test with Lighthouse and fix accessibility issues

**Test Requirements:**
- All pages responsive on mobile (375px), tablet (768px), desktop (1440px)
- Loading states appear during API calls
- Empty states display when no data
- Error states show retry options
- Forms show validation errors inline
- Keyboard navigation works on all interactive elements
- Lighthouse accessibility score > 90
- No console errors

**Demo:** Show mobile view with hamburger menu, demonstrate skeleton loaders on slow network, show empty state on new account with no data, navigate entire app using only keyboard, show toast notifications for actions.

---

#### **Task 20: Integration Testing & Bug Fixes**

**Objective:** Perform end-to-end testing, fix bugs, optimize performance, and prepare for deployment.

**Implementation Guidance:**
1. Create comprehensive test plan covering all features
2. Test all user role scenarios (intern, staff, editor, admin, super_admin)
3. Test authentication flows (login, logout, token refresh)
4. Test all CRUD operations
5. Test file uploads with edge cases
6. Verify authorization (try accessing unauthorized routes)
7. Test search and filtering extensively
8. Check API error handling
9. Optimize slow queries (add indexes)
10. Fix identified bugs
11. Update documentation (API docs, README, deployment guide)
12. Create seed script with comprehensive dummy data

**Test Requirements:**
- All CRUD operations work without errors
- All role permissions enforced correctly
- File uploads handle edge cases
- Search returns accurate results
- API response times < 2s
- No security vulnerabilities (SQL injection, XSS, CSRF)
- Seed script creates realistic demo data
- All environment variables documented

**Demo:** Run full demo flow: login as intern → view onboarding guide → search for IT help → view org chart → submit feedback → logout → login as admin → manage content → view dashboard → check audit logs → create announcement.

---

### **Week 6: Deployment & Documentation**

---

#### **Task 21: Production Environment Configuration**

**Objective:** Configure production environment variables, secure secrets, and prepare for cloud deployment.

**Implementation Guidance:**
1. Create production environment checklist
2. Set up MongoDB Atlas production cluster (separate from dev)
3. Configure Cloudinary production environment
4. Generate secure JWT secrets (use crypto.randomBytes)
5. Set up environment variables in deployment platforms
6. Configure CORS for production domains
7. Enable HTTPS enforcement
8. Set secure cookie options for production
9. Configure rate limiting for production traffic
10. Set up error logging service (Sentry optional)
11. Create production build scripts
12. Test production builds locally

**Test Requirements:**
- Production build creates optimized bundles
- Environment variables load correctly in production mode
- HTTPS redirects work
- CORS allows only production domain
- Cookies set with secure flag
- No development dependencies in production
- MongoDB production cluster accessible
- All secrets stored securely (not in code)

**Demo:** Show .env.example with placeholders, show production environment variables configured (without exposing secrets), run production build locally, verify optimized bundle sizes.

---

#### **Task 22: Deploy to Cloud Platforms**

**Objective:** Deploy frontend to Vercel/Netlify, backend to Render/Railway, and verify production functionality.

**Implementation Guidance:**
1. **Frontend Deployment (Vercel):**
   - Connect GitHub repository
   - Configure build command: `cd client && npm run build`
   - Set root directory: `client`
   - Add environment variables (API URL)
   - Deploy and verify

2. **Backend Deployment (Render):**
   - Create new Web Service
   - Connect repository
   - Configure build: `cd server && npm install`
   - Configure start: `cd server && npm start`
   - Add environment variables
   - Deploy and verify

3. **Database (MongoDB Atlas):**
   - Whitelist Render IP addresses
   - Create production database user
   - Run seed script on production DB

4. **Configure Cross-Origin:**
   - Update CORS to allow Vercel domain
   - Update frontend API URL to Render domain
   - Test communication between services

**Test Requirements:**
- Frontend accessible via Vercel URL
- Backend accessible via Render URL
- API calls from frontend to backend work
- Authentication works across domains
- File uploads work in production
- Database operations work
- All environment variables correct

**Demo:** Show live site on custom domain (optional), perform complete user journey on production: register, login, view data, upload photo, create content, logout.

---

#### **Task 23: Documentation & Handover**

**Objective:** Create comprehensive documentation for development, deployment, API usage, and project handover.

**Implementation Guidance:**
1. **README.md:**
   - Project overview
   - Features list
   - Tech stack
   - Installation instructions
   - Development setup
   - Environment variables guide
   - Scripts documentation

2. **API Documentation:**
   - All endpoints with request/response examples
   - Authentication requirements
   - Error codes
   - Rate limits
   - Consider using Swagger/Postman collection

3. **Deployment Guide:**
   - Step-by-step deployment instructions
   - Environment configuration
   - Database setup
   - Backup procedures
   - Monitoring setup

4. **Architecture Documentation:**
   - System architecture diagram
   - Database ERD
   - Authentication flow diagram
   - Folder structure explanation

5. **User Manual (optional):**
   - How to use the system (for FTI staff)
   - Admin guide
   - Troubleshooting common issues

**Test Requirements:**
- Another developer can set up project following README
- API documentation is accurate and testable
- Deployment guide is complete and reproducible
- All diagrams render correctly
- Links in documentation work

**Demo:** Show complete documentation set, walk through README setup process, show API documentation with examples, display architecture diagrams.

---

#### **Task 24: Final Demo & Internship Presentation Preparation**

**Objective:** Prepare comprehensive demo, create presentation materials, and document achievements for internship report.

**Implementation Guidance:**
1. **Create Demo Script:**
   - Introduction (problem statement)
   - Technology overview
   - Feature walkthrough (15-20 minutes)
   - Technical highlights (architecture, security)
   - Challenges and solutions
   - Future enhancements

2. **Prepare Presentation Slides:**
   - Title slide with project name
   - Problem statement and objectives
   - System architecture diagram
   - Technology stack rationale
   - Feature showcase (screenshots)
   - Database design (ERD)
   - Security implementation highlights
   - Demo video/live demo
   - Challenges faced and lessons learned
   - Results and impact
   - Future roadmap

3. **Demo Data Preparation:**
   - Run comprehensive seed script
   - Create diverse demo users (all roles)
   - Populate with realistic content
   - Add sample announcements, policies, FAQ
   - Upload sample profile photos
   - Create rich organization chart

4. **Video Demo (backup):**
   - Record full feature walkthrough
   - Show different user perspectives
   - Highlight key technical achievements

5. **Internship Report Content:**
   - Abstract
   - Introduction and objectives
   - Literature review (related systems)
   - System analysis and design
   - Implementation details
   - Testing and results
   - Discussion
   - Conclusion and recommendations

**Test Requirements:**
- Demo runs smoothly without errors
- All features work as expected
- Presentation fits time limit
- Backup video ready if needed
- Demo users have proper data
- No bugs during critical flows

**Demo:** Perform complete system demo following the recommended flow from Section 56 of your technical spec, highlighting full-stack development skills, complex data relationships, security implementation, and practical business value.

---

## **Success Criteria**

### **Technical Achievement:**
- ✅ Full-stack application with React, Node.js, MongoDB operational
- ✅ Secure authentication with JWT and role-based authorization (5 roles)
- ✅ 11+ data models with complex relationships (employees, interns, departments, batches, etc.)
- ✅ 50+ API endpoints with consistent patterns
- ✅ File upload with validation and cloud storage
- ✅ Responsive UI that works on mobile, tablet, desktop
- ✅ Global search across multiple entities
- ✅ Admin dashboard with statistics and charts
- ✅ Audit logging for sensitive operations
- ✅ Deployed to cloud platforms (Vercel + Render + MongoDB Atlas)

### **Security & Best Practices:**
- ✅ No plaintext passwords (bcrypt hashing)
- ✅ JWT with HttpOnly cookies
- ✅ Rate limiting on authentication endpoints
- ✅ Input validation (client + server)
- ✅ Authorization checks on all protected routes
- ✅ File upload validation (type, size, MIME)
- ✅ Environment variables for secrets
- ✅ CORS, Helmet, security headers configured

### **User Experience:**
- ✅ Intuitive navigation and UI
- ✅ Loading states, empty states, error states
- ✅ Responsive design (mobile-first)
- ✅ Accessible (keyboard navigation, focus states)
- ✅ Toast notifications for feedback
- ✅ Search and filtering work smoothly

### **Documentation & Presentation:**
- ✅ Comprehensive README with setup instructions
- ✅ API documentation with examples
- ✅ Deployment guide
- ✅ Architecture diagrams (system, ERD, flows)
- ✅ Presentation slides ready
- ✅ Demo script prepared
- ✅ Internship report content organized

---

## **Risk Mitigation**

| Risk | Mitigation Strategy |
|------|---------------------|
| **Time overrun** | Focus on MVP first (Tasks 1-17), Tasks 18-24 are enhancements. Can skip Feedback, IT Help if needed. |
| **Technical blockers** | Use caveman mode for faster AI assistance, leverage existing libraries (don't build from scratch), skip complex animations |
| **Deployment issues** | Test deployment early (Week 4), use proven platforms (Vercel/Render), keep detailed deployment notes |
| **Scope creep** | Refer to this plan, resist adding features not in tasks, mark extras as "Future Enhancements" |
| **Authentication complexity** | Use Passport.js or proven auth patterns, test early and frequently |
| **Data relationship bugs** | Test relationships immediately after creating models (Task 2), use MongoDB Compass to verify |

---

## **Optional Enhancements (Post-MVP)**

If you finish ahead of schedule, these add significant value:

1. **QR Profile Cards** - Generate QR codes for intern profiles (great for demo)
2. **Email Notifications** - SendGrid integration for announcements
3. **Export to PDF** - Generate reports (employee list, intern certificates)
4. **Advanced Analytics** - More detailed charts and insights
5. **Dark Mode** - Toggle theme preference
6. **Mobile App** - React Native wrapper (impressive but time-consuming)
7. **AI Chatbot** - RAG-based assistant for FAQs (cutting-edge feature)

---

Does this plan look good, or would you like me to adjust anything? I can modify:
- Task order or grouping
- Level of detail
- Feature priorities
- Timeline distribution
- Technology choices

Let me know if you'd like any changes before we proceed!


Work day 1

Great! You've updated the server `.env` file. Let me check what you've configured and verify the MongoDB connection:Perfect! I can see you've set up MongoDB Atlas with your credentials. However, I notice the `MONGO_URI` needs a small fix - it should include the database name. Let me update it for you:Perfect! Now let's restart the server to connect to MongoDB Atlas. First, let me stop the current server process:Now restart the server with the new MongoDB Atlas connection:Let's check if it connects successfully to MongoDB Atlas:🎉 **Excellent!** MongoDB Atlas is now connected successfully! You can see:
- ✅ MongoDB Connected to: `ac-q1uswfw-shard-00-00.9go91do.mongodb.net` (your Atlas cluster)
- 📊 Database: `fti_welcome_hub`

Let's verify everything is working by testing the health endpoint again:Perfect! Now let's complete Task 1 by marking all tasks as done and creating a completion summary:Perfect! Task 1 is now complete. Let me create a comprehensive completion report:Perfect! Let me create a visual confirmation screen:---

# 🎉 Task 1: Project Bootstrap & Environment Setup - COMPLETE!

## ✅ All 8 Subtasks Completed Successfully

### What We Built:
1. ✅ **Monorepo Structure** - Client & server with concurrently
2. ✅ **React Frontend** - Vite + Tailwind CSS configured
3. ✅ **Express Backend** - Security middleware ready
4. ✅ **MongoDB Atlas** - Cloud database connected
5. ✅ **Environment Variables** - All secrets configured
6. ✅ **Health Endpoint** - API verified working
7. ✅ **Git Repository** - Proper .gitignore setup
8. ✅ **Integration Test** - Everything running smoothly

### 🚀 Live System Status:

| Component | Status | URL |
|-----------|--------|-----|
| **Client** | ✅ Running | http://localhost:5173 |
| **Server** | ✅ Running | http://localhost:5000 |
| **MongoDB** | ✅ Connected | cluster0.9go91do.mongodb.net |
| **Health API** | ✅ 200 OK | http://localhost:5000/api/health |

### 📊 Project Statistics:
- **Total Files Created:** 30+
- **Dependencies Installed:** 380+ packages
- **Lines of Configuration:** 500+
- **Documentation Pages:** 3 (README, MongoDB Setup, Task Report)

### 🎯 Next Steps:

You're now ready to proceed with **Task 2: Database Models & Schema Design**

This will involve:
- Creating 11 Mongoose models (User, Employee, Intern, Department, etc.)
- Defining relationships between entities
- Adding validation rules and indexes
- Creating a seed script for dummy data

---

## 📝 Quick Reference

**Start Development:**
```bash
npm run dev
```

**Access Points:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api/health
- MongoDB: Connected to Atlas

**Documentation:**
- Full setup guide: `README.md`
- MongoDB guide: `docs/MONGODB_SETUP.md`
- Completion report: `docs/TASK_1_COMPLETION_REPORT.md`

---

**Would you like to proceed with Task 2: Database Models & Schema Design?**



work day 2

Here's where the project stands.

## Progress: 3 of 24 tasks done (~12.5%)

You're on track in **Week 1** of the 4-6 week plan.

**✅ Completed**
- **Task 1** — Project bootstrap: monorepo, React+Vite+Tailwind client, Express server, MongoDB Atlas connected
- **Task 2** — 11 Mongoose models with relationships, validation, indexes, and a seed script (verified with 49 checks)
- **Task 3** — Authentication: register/login/logout/refresh/me, JWT HttpOnly cookies, bcrypt, account lockout, rate limiting

**🔜 Remaining: 21 tasks**

| Week | Tasks | Focus |
|------|-------|-------|
| 1 | **Task 4** | Role-based authorization (next up — `authorize()` already stubbed) |
| 2 | Tasks 5-8 | Employee CRUD, Departments, Interns/Batches, File upload |
| 3 | Tasks 9-12 | Org chart (API + UI), Policies/FAQ, Getting Started/Company info |
| 4 | Tasks 13-17 | Announcements, IT Help Center, Global search, Admin dashboard, User mgmt + audit |
| 5 | Tasks 18-20 | Feedback, UI/UX polish, Integration testing |
| 6 | Tasks 21-24 | Production config, Deploy, Documentation, Demo prep |

## Where the effort sits

The foundation-heavy work is behind you. The backend groundwork from Tasks 2-3 (models, auth, error handling, the `ApiError`/`asyncHandler`/`validate` utilities) is reused across every feature task ahead, so Tasks 5-8 should move faster than they look.

**Task 4 is a short one** — the `authorize(...roles)` middleware is already written and tested from Task 3, so Task 4 is mostly wiring the frontend route guards and auth React hooks (`useAuth`, `useRequireRole`) plus enforcing the authorization matrix.

## Two open decisions worth noting

1. **Email verification** — registration currently lets anyone self-register as `staff` with no verification. Fine for MVP, but flag it before real users can reach it.
2. **Atlas password** — still the one pasted in plain text earlier this session. Worth rotating when convenient.

Want me to start Task 4?
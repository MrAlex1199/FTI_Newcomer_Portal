# API Documentation
**FTI Welcome Hub REST API**

## Base URL
```
Development: http://localhost:5000/api/v1
Production: https://your-domain.com/api/v1
```

## Authentication

All protected endpoints require authentication via JWT tokens stored in HttpOnly cookies.

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "ChangeMe123!"
}

Response 200:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "isActive": true
    }
  }
}
```

### Logout
```http
POST /auth/logout

Response 200:
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Get Current User
```http
GET /auth/me

Response 200:
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```

### Refresh Token
```http
POST /auth/refresh

Response 200:
{
  "success": true,
  "message": "Token refreshed"
}
```

## Error Responses

All endpoints follow a consistent error format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field": ["validation error message"]
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

## Employees

### List Employees
```http
GET /employees?search=john&department=IT&page=1&limit=10

Response 200:
{
  "success": true,
  "data": {
    "employees": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42
    }
  }
}
```

### Get Employee
```http
GET /employees/:id

Response 200:
{
  "success": true,
  "data": {
    "employee": { ... }
  }
}
```

### Create Employee (Admin+)
```http
POST /employees
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "0812345678",
  "position": "Software Engineer",
  "departmentId": "...",
  "isPublished": true
}

Response 201:
{
  "success": true,
  "message": "Employee created successfully",
  "data": {
    "employee": { ... }
  }
}
```

### Update Employee (Admin+)
```http
PUT /employees/:id
Content-Type: application/json

{
  "position": "Senior Software Engineer"
}

Response 200:
{
  "success": true,
  "message": "Employee updated successfully",
  "data": {
    "employee": { ... }
  }
}
```

### Delete Employee (Admin+)
```http
DELETE /employees/:id

Response 200:
{
  "success": true,
  "message": "Employee deleted successfully"
}
```

## Interns

### List Interns
```http
GET /interns?batch=2024-01&status=active&page=1&limit=10
```

### Get Intern
```http
GET /interns/:id
```

### Create Intern (Admin+)
```http
POST /interns
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "university": "Chulalongkorn University",
  "major": "Computer Science",
  "batchId": "...",
  "departmentId": "...",
  "startDate": "2024-06-01",
  "endDate": "2024-08-31"
}
```

### Update Intern (Admin+)
```http
PUT /interns/:id
```

### Delete Intern (Admin+)
```http
DELETE /interns/:id
```

## Departments

### List Departments
```http
GET /departments

Response 200:
{
  "success": true,
  "data": {
    "departments": [
      {
        "id": "...",
        "name": "Information Technology",
        "code": "IT",
        "description": "...",
        "headOfDepartment": "...",
        "isActive": true
      }
    ]
  }
}
```

### Get Department
```http
GET /departments/:id
```

### Create Department (Admin+)
```http
POST /departments
Content-Type: application/json

{
  "name": "Marketing",
  "code": "MKT",
  "description": "Marketing and Communications",
  "headOfDepartment": "employee_id"
}
```

## Announcements

### List Announcements
```http
GET /announcements?status=published&page=1&limit=10

Response 200:
{
  "success": true,
  "data": {
    "announcements": [
      {
        "id": "...",
        "title": "Welcome Event",
        "summary": "Join us for...",
        "coverImage": "https://...",
        "publishAt": "2024-09-01T00:00:00.000Z",
        "isPinned": true,
        "isLive": true
      }
    ],
    "pagination": { ... }
  }
}
```

### Get Announcement
```http
GET /announcements/:id
```

### Create Announcement (Editor+)
```http
POST /announcements
Content-Type: application/json

{
  "title": "New Policy Announcement",
  "summary": "Important updates...",
  "content": "Full content here...",
  "category": "policy",
  "publishAt": "2024-09-01T09:00:00.000Z",
  "isPinned": false,
  "status": "published"
}
```

### Update Announcement (Editor+)
```http
PUT /announcements/:id
```

### Delete Announcement (Admin+)
```http
DELETE /announcements/:id
```

## Policies

### List Policies
```http
GET /policies?category=hr&status=active

Response 200:
{
  "success": true,
  "data": {
    "policies": [...]
  }
}
```

### Get Policy
```http
GET /policies/:id
```

### Create Policy (Editor+)
```http
POST /policies
Content-Type: application/json

{
  "title": "Remote Work Policy",
  "summary": "Guidelines for remote work",
  "content": "Full policy content...",
  "category": "hr",
  "priority": "high",
  "effectiveDate": "2024-09-01",
  "status": "active"
}
```

## FAQs

### List FAQs
```http
GET /faqs?category=it&isPublished=true

Response 200:
{
  "success": true,
  "data": {
    "faqs": [
      {
        "id": "...",
        "question": "How do I reset my password?",
        "answer": "Contact IT support...",
        "category": "it",
        "tags": ["password", "account"],
        "sortOrder": 1
      }
    ]
  }
}
```

### Get FAQ
```http
GET /faqs/:id
```

### Create FAQ (Editor+)
```http
POST /faqs
Content-Type: application/json

{
  "question": "What is the dress code?",
  "answer": "Business casual...",
  "category": "general",
  "tags": ["dress code", "office"],
  "isPublished": true,
  "sortOrder": 10
}
```

## Knowledge Articles

### List Knowledge Articles
```http
GET /knowledge?category=getting-started&subcategory=setup

Response 200:
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": "...",
        "title": "IT Setup Guide",
        "summary": "Step-by-step guide...",
        "category": "getting-started",
        "subcategory": "setup",
        "tags": ["it", "setup"],
        "upvotes": 15,
        "downvotes": 2,
        "helpfulRatio": 0.88,
        "isQuickLink": true
      }
    ]
  }
}
```

### Get Knowledge Article
```http
GET /knowledge/:id
```

### Vote on Article
```http
POST /knowledge/:id/vote
Content-Type: application/json

{
  "isHelpful": true
}

Response 200:
{
  "success": true,
  "message": "Vote recorded"
}
```

### Create Knowledge Article (Editor+)
```http
POST /knowledge
Content-Type: application/json

{
  "title": "How to Access VPN",
  "summary": "Guide to connecting to company VPN",
  "content": "Full guide content...",
  "category": "it-help",
  "subcategory": "network",
  "tags": ["vpn", "remote", "network"],
  "isQuickLink": true,
  "quickLinkOrder": 1,
  "status": "published"
}
```

## Company Information

### Get Company Info
```http
GET /company

Response 200:
{
  "success": true,
  "data": {
    "company": {
      "name": "Function International",
      "nameTH": "ฟังก์ชั่น อินเตอร์เนชั่นแนล",
      "address": "...",
      "phone": "02-123-4567",
      "email": "info@functioninter.co.th",
      "coordinates": {
        "lat": 13.829194,
        "lng": 100.711056
      },
      "socialMedia": {
        "facebook": "...",
        "linkedin": "..."
      }
    }
  }
}
```

### Update Company Info (Admin+)
```http
PUT /company
Content-Type: application/json

{
  "phone": "02-999-8888",
  "coordinates": {
    "lat": 13.829194,
    "lng": 100.711056
  }
}
```

## Feedback

### Submit Feedback
```http
POST /feedback
Content-Type: application/json

{
  "category": "suggestion",
  "subject": "Improve search functionality",
  "message": "It would be great if...",
  "priority": "medium"
}

Response 201:
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": {
    "feedback": { ... }
  }
}
```

### List Feedback (Admin+)
```http
GET /admin/feedback?status=pending&category=bug
```

### Update Feedback Status (Admin+)
```http
PUT /admin/feedback/:id
Content-Type: application/json

{
  "status": "resolved",
  "adminNotes": "Fixed in version 1.2"
}
```

## Search

### Global Search
```http
GET /search?q=software&type=all

Response 200:
{
  "success": true,
  "data": {
    "results": {
      "employees": [...],
      "interns": [...],
      "announcements": [...],
      "policies": [...],
      "faqs": [...],
      "knowledge": [...]
    },
    "totalResults": 42
  }
}
```

Query parameters:
- `q` - Search query (required)
- `type` - Filter by type: `all`, `employees`, `interns`, `announcements`, `policies`, `faqs`, `knowledge`
- `limit` - Results per category (default: 5)

## File Upload

### Upload Profile Image
```http
POST /employees/:id/upload
Content-Type: multipart/form-data

file: [image file]

Response 200:
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "imageUrl": "https://cloudinary.com/..."
  }
}
```

**Constraints:**
- Max file size: 5MB
- Allowed formats: JPG, PNG, WebP
- Images are automatically resized and optimized

## Admin Endpoints

### User Management

#### List Users (Admin+)
```http
GET /admin/users?role=intern&isActive=true
```

#### Create User (Admin+)
```http
POST /admin/users
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "SecurePass123!",
  "role": "staff"
}
```

#### Update User (Admin+)
```http
PUT /admin/users/:id
Content-Type: application/json

{
  "role": "editor",
  "isActive": true
}
```

#### Delete User (Super Admin only)
```http
DELETE /admin/users/:id
```

### Audit Logs (Admin+)

```http
GET /admin/audit-logs?entity=employee&userId=...&startDate=2024-09-01

Response 200:
{
  "success": true,
  "data": {
    "logs": [
      {
        "action": "update",
        "entity": "employee",
        "entityId": "...",
        "userId": "...",
        "changes": { ... },
        "timestamp": "2024-09-01T10:30:00.000Z"
      }
    ],
    "pagination": { ... }
  }
}
```

### Statistics (Admin+)

```http
GET /admin/stats

Response 200:
{
  "success": true,
  "data": {
    "users": { total: 50, active: 45 },
    "employees": { total: 100 },
    "interns": { total: 20, active: 18 },
    "departments": { total: 8 },
    "announcements": { published: 15, draft: 3 }
  }
}
```

## Rate Limiting

All endpoints are rate-limited:
- **Default:** 100 requests per 15 minutes per IP
- **Auth endpoints:** 5 failed login attempts = 15 minute lockout

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1693526400
```

## Pagination

List endpoints support pagination:

```http
GET /employees?page=2&limit=20

Response:
{
  "data": { ... },
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

## Filtering & Sorting

Most list endpoints support:
- **Search:** `?search=keyword`
- **Filter:** `?category=value&status=active`
- **Sort:** `?sortBy=createdAt&order=desc`

Example:
```http
GET /announcements?status=published&sortBy=publishAt&order=desc&page=1&limit=10
```

---

**Version:** 1.0  
**Last Updated:** September 1, 2026

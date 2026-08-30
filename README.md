# FTI Welcome Hub

> Internal Onboarding & Information Portal for Function International (FTI)

A comprehensive web application designed to streamline the onboarding process for new interns and employees at Function International, providing centralized access to company information, employee directories, organizational structure, and essential resources.

## 🎯 Project Overview

### Problem Statement
New interns and employees at FTI face challenges during onboarding:
- Company information scattered across multiple sources
- No centralized directory for finding colleagues and mentors
- Unclear who to contact for specific issues (IT, HR, Admin)
- Lack of structured onboarding guidance
- No knowledge transfer between intern cohorts

### Solution
FTI Welcome Hub provides:
- **Centralized Information** - All company resources in one place
- **Employee & Intern Directories** - Easy search and contact information
- **Interactive Organization Chart** - Visual company structure
- **Content Management** - Policies, FAQs, guides, and announcements
- **IT Help Center** - Self-service troubleshooting resources
- **Admin Dashboard** - Statistics and content management

## 🏗️ Architecture

**Tech Stack:**
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Node.js + Express.js
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT with HttpOnly cookies
- **File Storage:** Cloudinary
- **Deployment:** Vercel (Frontend) + Render (Backend) + MongoDB Atlas

**Project Structure:**
```
fti-welcome-hub/
├── client/          # React frontend
├── server/          # Express backend
├── docs/            # Documentation
├── package.json     # Root scripts
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MongoDB Atlas account (or local MongoDB)

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd FTI_Newcomer_Portal
```

2. **Install dependencies:**
```bash
npm run install:all
```

3. **Set up environment variables:**

**Client (.env):**
```env
VITE_API_URL=http://localhost:5000/api/v1
```

**Server (.env):**
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# Get MongoDB URI from MongoDB Atlas (see docs/MONGODB_SETUP.md)
MONGO_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/fti_welcome_hub

JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
REFRESH_TOKEN_EXPIRES_IN=7d

UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

4. **Set up MongoDB:**
Follow the guide in `docs/MONGODB_SETUP.md` to create your MongoDB Atlas cluster.

5. **Start development servers:**
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

## 📚 Available Scripts

**Root directory:**
- `npm run dev` - Start both client and server concurrently
- `npm run install:all` - Install all dependencies (root + client + server)
- `npm run start:client` - Start only client
- `npm run start:server` - Start only server

**Client directory:**
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

**Server directory:**
- `npm run dev` - Start server with nodemon
- `npm start` - Start server (production)
- `npm run seed` - Seed database with dummy data

## 🔐 Authentication & Authorization

### User Roles
1. **super_admin** - Full system access, user management
2. **admin** - Content management, user management (except super_admin)
3. **editor** - Content creation and editing
4. **staff** - View company information and directories
5. **intern** - View information, edit own profile

### Security Features
- Password hashing with bcrypt
- JWT with HttpOnly cookies
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers
- Input validation on client and server
- File upload validation
- Audit logging

## 📊 Core Features

### Phase 1: MVP (Weeks 1-4)
- ✅ Authentication & Authorization (5 role levels)
- ✅ Employee Directory (CRUD, search, pagination)
- ✅ Intern Management with Batch system
- ✅ Department Management
- ✅ Interactive Organization Chart
- ✅ Content Management (Policies, FAQ, Getting Started)
- ✅ Admin Dashboard with statistics
- ✅ File Upload (profile photos)

### Phase 2: Enhanced Features (Weeks 4-5)
- 🔄 Announcements System
- 🔄 IT Help Center
- 🔄 Global Search
- 🔄 Feedback System

### Phase 3: Future Enhancements
- ⏳ Intern Alumni & Knowledge Archive
- ⏳ Project Showcase
- ⏳ QR Profile Cards
- ⏳ Onboarding Checklist
- ⏳ AI Assistant (RAG-based)

## 🗄️ Database Schema

### Core Models
1. **User** - Authentication and account management
2. **Employee** - Employee directory and information
3. **Intern** - Intern profiles with batch grouping
4. **Department** - Organizational units
5. **InternBatch** - Intern cohort management
6. **Announcement** - News and communications
7. **Policy** - Rules and regulations
8. **FAQ** - Frequently asked questions
9. **KnowledgeArticle** - Guides and IT help articles
10. **Feedback** - User feedback system
11. **AuditLog** - Activity tracking

## 🧪 Testing

### Manual Testing
1. Start both client and server: `npm run dev`
2. Open browser to http://localhost:5173
3. Verify client displays "FTI Welcome Hub"
4. Check health endpoint: http://localhost:5000/api/health
5. Verify MongoDB connection in server logs

### API Testing
Use Postman or Thunder Client to test endpoints:
```
GET http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-08-29T...",
  "environment": "development"
}
```

## 📖 Documentation

- [MongoDB Setup Guide](docs/MONGODB_SETUP.md)
- [API Documentation](docs/API.md) - Coming soon
- [Deployment Guide](docs/DEPLOYMENT.md) - Coming soon
- [Technical Specification](FTI_Newcomer_Portal_Technical_Spec.md)
- [Project Plan](ProjectPlan.md)

## 🤝 Contributing

This is an internship project for Function International. For questions or issues:
1. Check existing documentation
2. Review technical specification
3. Contact project supervisor

## 📝 License

MIT License - This is an educational/internship project.

## 👥 Team

**Internship Project 2024**
- Developer: FTI Internship Team
- Company: Function International Public Company Limited
- Focus: Full-Stack Development + IT Support

## 🙏 Acknowledgments

- Function International for the internship opportunity
- Project supervisors and mentors
- Tech stack: React, Node.js, MongoDB, Tailwind CSS, Vite, Express

---

**Status:** 🚧 In Development - Phase 1 (Project Bootstrap Complete)

**Last Updated:** August 29, 2024

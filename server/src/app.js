import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import authCheckRoutes from './routes/authCheck.js';
import employeeRoutes from './routes/employees.js';
import departmentRoutes from './routes/departments.js';
import internRoutes from './routes/interns.js';
import internBatchRoutes from './routes/internBatches.js';
import organizationRoutes from './routes/organization.js';
import knowledgeRoutes from './routes/knowledge.js';
import companyRoutes from './routes/company.js';
import policyRoutes from './routes/policies.js';
import faqRoutes from './routes/faq.js';
import announcementRoutes from './routes/announcements.js';
import searchRoutes from './routes/search.js';
import feedbackRoutes from './routes/feedback.js';
import adminDashboardRoutes from './routes/adminDashboard.js';
import adminUserRoutes from './routes/adminUsers.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/interns', internRoutes);
app.use('/api/v1/intern-batches', internBatchRoutes);
app.use('/api/v1/organization', organizationRoutes);
app.use('/api/v1/knowledge', knowledgeRoutes);
app.use('/api/v1/company', companyRoutes);
app.use('/api/v1/policies', policyRoutes);
app.use('/api/v1/faq', faqRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/admin', adminDashboardRoutes);
app.use('/api/v1/admin', adminUserRoutes);
// etc.

// Development-only routes for exercising the authorization layer. Never mounted
// in production so they can't be reached on a deployed instance.
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/v1/_authcheck', authCheckRoutes);
}

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

export default app;

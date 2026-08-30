import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './hooks/AuthContext.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import RoleGuard from './components/common/RoleGuard.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Employees from './pages/Employees.jsx';
import Departments from './pages/Departments.jsx';
import DepartmentDetail from './pages/DepartmentDetail.jsx';
import Interns from './pages/Interns.jsx';
import InternBatches from './pages/InternBatches.jsx';
import InternDetail from './pages/InternDetail.jsx';
import InternBatchDetail from './pages/InternBatchDetail.jsx';
import Organization from './pages/Organization.jsx';
import Policies from './pages/Policies.jsx';
import FAQ from './pages/FAQ.jsx';
import Announcements from './pages/Announcements.jsx';
import GettingStarted from './pages/GettingStarted.jsx';
import ItHelp from './pages/ItHelp.jsx';
import SearchResults from './pages/SearchResults.jsx';
import Company from './pages/Company.jsx';
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const AdminUsers = lazy(() => import('./pages/AdminUsers.jsx'));
const AdminAuditLogs = lazy(() => import('./pages/AdminAuditLogs.jsx'));
const AdminFeedback = lazy(() => import('./pages/AdminFeedback.jsx'));
import Unauthorized from './pages/Unauthorized.jsx';

/**
 * Route map for Task 4:
 *  - /login          public
 *  - /unauthorized   public (403 landing)
 *  - /dashboard      any authenticated user (ProtectedRoute)
 *  - /admin          admins only (ProtectedRoute + route-mode RoleGuard)
 *  - /               redirect to dashboard
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <Employees />
              </ProtectedRoute>
            }
          />

          <Route
            path="/departments"
            element={
              <ProtectedRoute>
                <Departments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/departments/:id"
            element={
              <ProtectedRoute>
                <DepartmentDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/interns"
            element={
              <ProtectedRoute>
                <Interns />
              </ProtectedRoute>
            }
          />

          <Route
            path="/interns/:id"
            element={
              <ProtectedRoute>
                <InternDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/intern-batches"
            element={
              <ProtectedRoute>
                <InternBatches />
              </ProtectedRoute>
            }
          />

          <Route
            path="/intern-batches/:id"
            element={
              <ProtectedRoute>
                <InternBatchDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/organization"
            element={
              <ProtectedRoute>
                <Organization />
              </ProtectedRoute>
            }
          />

          <Route
            path="/policies"
            element={
              <ProtectedRoute>
                <Policies />
              </ProtectedRoute>
            }
          />

          <Route
            path="/faq"
            element={
              <ProtectedRoute>
                <FAQ />
              </ProtectedRoute>
            }
          />

          <Route
            path="/announcements"
            element={
              <ProtectedRoute>
                <Announcements />
              </ProtectedRoute>
            }
          />

          <Route
            path="/getting-started"
            element={
              <ProtectedRoute>
                <GettingStarted />
              </ProtectedRoute>
            }
          />

          <Route
            path="/it-help"
            element={
              <ProtectedRoute>
                <ItHelp />
              </ProtectedRoute>
            }
          />

          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <SearchResults />
              </ProtectedRoute>
            }
          />

          <Route
            path="/company"
            element={
              <ProtectedRoute>
                <Company />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/feedback"
            element={
              <ProtectedRoute>
                <RoleGuard permission="feedback:manage">
                  <Suspense fallback={<div className="min-h-screen bg-gray-50 p-8 text-center text-gray-500">Loading feedback...</div>}><AdminFeedback /></Suspense>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <RoleGuard permission="users:manage">
                  <Suspense fallback={<div className="min-h-screen bg-gray-50 p-8 text-center text-gray-500">Loading user management...</div>}><AdminUsers /></Suspense>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute>
                <RoleGuard permission="auditlog:view">
                  <Suspense fallback={<div className="min-h-screen bg-gray-50 p-8 text-center text-gray-500">Loading audit logs...</div>}><AdminAuditLogs /></Suspense>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <RoleGuard roles={['super_admin', 'admin']}>
                  <Suspense fallback={<div className="min-h-screen bg-gray-50 p-8 text-center text-gray-500">Loading admin dashboard...</div>}><AdminDashboard /></Suspense>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <RoleGuard roles={['super_admin', 'admin']}>
                  <Suspense fallback={<div className="min-h-screen bg-gray-50 p-8 text-center text-gray-500">Loading admin dashboard...</div>}><AdminDashboard /></Suspense>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

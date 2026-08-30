import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import AdminArea from './pages/AdminArea.jsx';
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
            path="/admin"
            element={
              <ProtectedRoute>
                <RoleGuard roles={['super_admin', 'admin']}>
                  <AdminArea />
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

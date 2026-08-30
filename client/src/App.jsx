import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/AuthContext.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import RoleGuard from './components/common/RoleGuard.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Employees from './pages/Employees.jsx';
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

import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';

/**
 * Gates content by role or by a named permission. Two usage modes:
 *
 *   As a route element (redirects on failure):
 *     <RoleGuard roles={['admin','super_admin']}><AdminPage/></RoleGuard>
 *
 *   As an inline UI gate (renders `fallback` instead of redirecting), e.g. to
 *   hide an "Add" button:
 *     <RoleGuard permission="employees:manage" mode="inline"><AddButton/></RoleGuard>
 *
 * UI-only: the server enforces the same matrix on every request.
 */
export default function RoleGuard({
  children,
  roles,
  permission,
  mode = 'route',
  fallback = null,
}) {
  const { user, loading, isAuthenticated, hasPermission, hasRole } = useAuth();

  if (loading) return null;

  let allowed = isAuthenticated;
  if (allowed && permission) allowed = hasPermission(permission);
  if (allowed && roles) allowed = hasRole(...roles);

  if (allowed) return children;

  if (mode === 'inline') return fallback;

  // Route mode: unauthenticated -> login, authenticated-but-forbidden -> 403 page.
  return <Navigate to={user ? '/unauthorized' : '/login'} replace />;
}

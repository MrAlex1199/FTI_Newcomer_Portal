import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';

/**
 * Route wrapper that requires an authenticated session. While the session is
 * still being restored from cookies we render a lightweight loader rather than
 * redirecting, otherwise a returning user with valid cookies would briefly see
 * the login page before /auth/me resolves.
 *
 * On failure it redirects to /login and stashes the attempted location so the
 * login page can return the user there afterward.
 */
import useLanguage from '../../hooks/useLanguage.js';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <span className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          {t('loading')}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

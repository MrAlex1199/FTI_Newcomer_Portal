import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from './useAuth.js';

/**
 * Imperative role guard. Once the session is loaded, redirects unauthenticated
 * users to /login and authenticated-but-unauthorized users to /unauthorized.
 *
 * This is a UX convenience only - the server independently enforces every
 * permission, so a user who bypasses this still can't perform the action.
 *
 * @param {...string} roles - roles permitted to view the calling component.
 */
export default function useRequireRole(...roles) {
  const { user, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    } else if (!roles.includes(user.role)) {
      navigate('/unauthorized', { replace: true });
    }
  }, [loading, isAuthenticated, user, roles, navigate]);

  return { user, loading, allowed: isAuthenticated && !!user && roles.includes(user.role) };
}

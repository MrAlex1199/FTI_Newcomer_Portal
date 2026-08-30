import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from './useAuth.js';

/**
 * Imperative guard for use inside a component body when declarative
 * <ProtectedRoute> isn't a good fit. Redirects to /login once the session has
 * finished loading and no user is present, preserving the attempted location
 * so login can send the user back.
 *
 * Returns { user, loading } for convenience.
 */
export default function useRequireAuth() {
  const { user, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true, state: { from: location } });
    }
  }, [loading, isAuthenticated, navigate, location]);

  return { user, loading };
}

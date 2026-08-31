import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService.js';
import { can } from '../utils/permissions.js';

/**
 * Holds the authenticated user and the operations that change it.
 *
 * On mount it calls /auth/me once to rehydrate the session from the HttpOnly
 * cookies (which survive a page refresh even though JS can't read them). Until
 * that call settles, `loading` is true so guards can show a spinner instead of
 * flashing the login page for an already-authenticated user.
 */
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const me = await authService.getMe();
        if (!cancelled) setUser(me);
      } catch {
        // No valid session - remain logged out. Expected on first visit.
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username, password) => {
    const loggedIn = await authService.login(username, password);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      // Clear local state even if the network call fails - the user asked to leave.
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const refreshed = await authService.getMe();
    setUser(refreshed);
    return refreshed;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refreshUser,
      /** UI-only permission check mirroring the server matrix. */
      hasPermission: (action) => (user ? can(user.role, action) : false),
      hasRole: (...roles) => (user ? roles.includes(user.role) : false),
    }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

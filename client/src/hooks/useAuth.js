import { useContext } from 'react';
import { AuthContext } from './AuthContext.jsx';

/**
 * Access the auth context: { user, loading, isAuthenticated, login, logout,
 * hasPermission, hasRole }. Throws if used outside <AuthProvider> so the
 * mistake surfaces immediately rather than as a confusing null read.
 */
export default function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}

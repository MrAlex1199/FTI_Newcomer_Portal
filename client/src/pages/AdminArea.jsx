import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import { ROLE_LABELS } from '../utils/permissions.js';

/**
 * Trivial admin-only page. Reaching it at all proves the route-level RoleGuard
 * worked - a staff or intern account is redirected to /unauthorized before
 * this renders.
 */
export default function AdminArea() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-semibold text-gray-800">Admin Area</h1>
        <p className="mt-2 text-gray-500">
          You reached this page because your role ({ROLE_LABELS[user.role] || user.role}) is
          permitted. Staff and interns are redirected to the 403 page.
        </p>
        <Link
          to="/dashboard"
          className="inline-block mt-6 bg-primary-600 text-white px-5 py-2 rounded-md font-medium hover:bg-primary-700"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

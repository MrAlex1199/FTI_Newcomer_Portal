import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import RoleGuard from '../components/common/RoleGuard.jsx';
import { ROLE_LABELS } from '../utils/permissions.js';

/**
 * Placeholder dashboard that also serves as a live demonstration of the
 * authorization layer: each capability card is wrapped in a RoleGuard so it
 * only appears for roles the matrix permits. Logging in as different seeded
 * accounts shows the set of cards change.
 */
export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-600">FTI Welcome Hub</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{user.username}</p>
              <p className="text-xs text-gray-500">{ROLE_LABELS[user.role] || user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          Welcome back, {user.username}
        </h2>
        <p className="text-gray-500 mb-6">
          The cards below appear based on your role ({ROLE_LABELS[user.role] || user.role}).
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Visible to everyone authenticated */}
          <Link to="/employees" className="block">
            <Card title="Employee Directory" desc="Browse and search employees." tone="neutral" />
          </Link>
          <Card title="Organization Chart" desc="View the company structure." tone="neutral" />
          <Card title="Policies & FAQ" desc="Read company policies and FAQs." tone="neutral" />

          {/* Content managers: super_admin, admin, editor */}
          <RoleGuard permission="policies:manage" mode="inline">
            <Card title="Manage Content" desc="Create and edit policies, FAQ, announcements." tone="editor" />
          </RoleGuard>

          {/* Admins: super_admin, admin */}
          <RoleGuard permission="employees:manage" mode="inline">
            <Card title="Manage Employees" desc="Add, edit, and remove employee records." tone="admin" />
          </RoleGuard>
          <RoleGuard permission="users:manage" mode="inline">
            <Card title="User Management" desc="Manage user accounts and roles." tone="admin" />
          </RoleGuard>

          {/* Super admin only */}
          <RoleGuard permission="auditlog:view" mode="inline">
            <Card title="Audit Log" desc="Review sensitive activity history." tone="super" />
          </RoleGuard>

          {/* Route-guarded page link, admins only */}
          <RoleGuard roles={['super_admin', 'admin']} mode="inline">
            <Link to="/admin" className="block">
              <Card title="Admin Area →" desc="Open the admin-only section." tone="admin" />
            </Link>
          </RoleGuard>
        </div>
      </main>
    </div>
  );
}

const toneClasses = {
  neutral: 'border-gray-200',
  editor: 'border-blue-300 bg-blue-50',
  admin: 'border-amber-300 bg-amber-50',
  super: 'border-purple-300 bg-purple-50',
};

function Card({ title, desc, tone }) {
  return (
    <div className={`rounded-lg border p-4 bg-white ${toneClasses[tone] || ''}`}>
      <h3 className="font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
    </div>
  );
}

import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import useLanguage from '../hooks/useLanguage.js';
import { ROLE_LABELS } from '../utils/permissions.js';
import AppShell from '../components/layout/AppShell.jsx';

export default function AdminArea() {
  const { user } = useAuth(); const { t, label } = useLanguage();
  return <AppShell><div className="text-center max-w-md mx-auto py-16"><h1 className="text-2xl font-semibold text-gray-800">{t('adminTitle')}</h1><p className="mt-2 text-gray-500">{t('adminMessage')} ({label(user.role) || ROLE_LABELS[user.role] || user.role})</p><Link to="/dashboard" className="inline-block mt-6 bg-primary-600 text-white px-5 py-2 rounded-md font-medium hover:bg-primary-700">{t('backToDashboard')}</Link></div></AppShell>;
}

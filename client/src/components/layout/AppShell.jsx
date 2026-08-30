import { Link } from 'react-router-dom';
import GlobalSearch from '../common/GlobalSearch.jsx';
import LanguageToggle from '../common/LanguageToggle.jsx';
import useLanguage from '../../hooks/useLanguage.js';

export default function AppShell({ children, rightContent }) {
  const { t } = useLanguage();
  return <div className="min-h-screen bg-gray-50"><header className="bg-white border-b border-gray-200"><div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4"><Link to="/dashboard" className="text-xl font-bold text-primary-600 shrink-0">{t('brand')}</Link><div className="flex items-center gap-3 min-w-0"><GlobalSearch />{rightContent || <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 shrink-0">{t('backDashboard')}</Link>}<LanguageToggle /></div></div></header><main className="max-w-5xl mx-auto px-4 py-6">{children}</main></div>;
}

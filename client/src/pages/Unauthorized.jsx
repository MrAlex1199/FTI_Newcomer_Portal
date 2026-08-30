import { Link } from 'react-router-dom';
import useLanguage from '../hooks/useLanguage.js';
import LanguageToggle from '../components/common/LanguageToggle.jsx';

export default function Unauthorized() {
  const { t } = useLanguage();
  return <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4"><div className="absolute top-4 right-4"><LanguageToggle /></div><div className="text-center max-w-md"><p className="text-6xl font-bold text-primary-600">403</p><h1 className="mt-4 text-2xl font-semibold text-gray-800">{t('unauthorizedTitle')}</h1><p className="mt-2 text-gray-500">{t('unauthorizedMessage')}</p><Link to="/dashboard" className="inline-block mt-6 bg-primary-600 text-white px-5 py-2 rounded-md font-medium hover:bg-primary-700">{t('backToDashboard')}</Link></div></div>;
}

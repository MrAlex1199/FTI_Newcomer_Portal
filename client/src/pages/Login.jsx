import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import useLanguage from '../hooks/useLanguage.js';
import LanguageToggle from '../components/common/LanguageToggle.jsx';

export default function Login() {
  const { login } = useAuth(); const { t } = useLanguage();
  const navigate = useNavigate(); const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';
  const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (event) => { event.preventDefault(); setError(''); setSubmitting(true); try { await login(username, password); navigate(from, { replace: true }); } catch (requestError) { setError(requestError.response?.data?.message || t('loginError')); } finally { setSubmitting(false); } };
  return <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4"><div className="absolute top-4 right-4"><LanguageToggle /></div><div className="w-full max-w-sm bg-white rounded-lg shadow-md p-8"><h1 className="text-2xl font-bold text-primary-600 text-center mb-1">{t('loginTitle')}</h1><p className="text-gray-500 text-sm text-center mb-6">{t('loginSubtitle')}</p><form onSubmit={handleSubmit} className="space-y-4"><div><label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">{t('username')}</label><input id="username" type="text" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" /></div><div><label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label><input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>{error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2" role="alert">{error}</p>}<button type="submit" disabled={submitting} className="w-full bg-primary-600 text-white py-2 rounded-md font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60">{submitting ? t('signingIn') : t('login')}</button></form></div></div>;
}

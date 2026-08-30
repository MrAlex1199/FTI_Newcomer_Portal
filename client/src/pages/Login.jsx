import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import useLanguage from '../hooks/useLanguage.js';
import LanguageToggle from '../components/common/LanguageToggle.jsx';

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('loginError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-100 px-4 py-10">
      {/* Decorative background blobs; hidden from assistive technology. */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary-200/40 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-primary-300/30 blur-3xl" aria-hidden="true" />

      <div className="absolute right-4 top-4">
        <LanguageToggle />
      </div>

      <div className="w-full max-w-sm animate-pop-in rounded-2xl border border-white/60 bg-white/90 p-8 shadow-lift backdrop-blur">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 animate-float items-center justify-center rounded-2xl bg-primary-100 text-3xl" aria-hidden="true">
            🏢
          </div>
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
            <span aria-hidden="true">✨</span>
            {t('loginWelcomeBadge')}
          </p>
          <h1 className="mt-3 text-2xl font-bold text-gray-800">{t('loginTitle')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('loginSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="mb-1 block text-sm font-medium text-gray-700">
              {t('username')}
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              className="field"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              {t('password')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="field"
            />
          </div>

          {error && (
            <p className="animate-fade-in rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              <span className="mr-1" aria-hidden="true">⚠️</span>
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" aria-hidden="true" />
                {t('signingIn')}
              </>
            ) : (
              <>
                {t('login')}
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-gray-500">{t('loginHelp')}</p>
      </div>
    </div>
  );
}

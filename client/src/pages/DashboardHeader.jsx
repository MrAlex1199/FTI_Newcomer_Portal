import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import GlobalSearch from '../components/common/GlobalSearch.jsx';
import LanguageToggle from '../components/common/LanguageToggle.jsx';
import useAuth from '../hooks/useAuth.js';
import useLanguage from '../hooks/useLanguage.js';
import { ROLE_LABELS } from '../utils/permissions.js';

export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const { t, label } = useLanguage();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const role = label(user.role) || ROLE_LABELS[user.role] || user.role;
  const handleLogout = async () => {
    await logout();
    window.location.assign('/login');
  };

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileNavOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [mobileNavOpen]);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex min-h-16 items-center justify-between gap-3 py-3">
          <Link
            to="/dashboard"
            className="min-w-0 shrink text-lg font-bold leading-tight text-primary-600 sm:text-xl"
          >
            {t('brand')}
          </Link>

          <nav aria-label={t('navigation')} className="hidden min-w-0 items-center gap-4 md:flex">
            <GlobalSearch />
            <Account user={user} role={role} logout={handleLogout} />
            <LanguageToggle />
          </nav>

          <div className="flex shrink-0 items-center gap-2 md:hidden">
            <LanguageToggle />
            <button
              type="button"
              onClick={() => setMobileNavOpen((open) => !open)}
              aria-expanded={mobileNavOpen}
              aria-controls="dashboard-mobile-navigation"
              aria-label={mobileNavOpen ? t('closeMenu') : t('openMenu')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <span className="sr-only">{mobileNavOpen ? t('closeMenu') : t('openMenu')}</span>
              {mobileNavOpen ? (
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                  <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                  <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <nav
            id="dashboard-mobile-navigation"
            aria-label={t('navigation')}
            className="space-y-3 border-t border-gray-100 py-3 md:hidden"
          >
            <GlobalSearch />
            <Account user={user} role={role} logout={handleLogout} />
          </nav>
        )}
      </div>
    </header>
  );
}

function Account({ user, role, logout }) {
  const { t } = useLanguage();
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="min-w-0 text-right">
        <p className="truncate text-sm font-medium text-gray-800">{user.username}</p>
        <p className="truncate text-xs text-gray-500">{role}</p>
      </div>
      <button
        type="button"
        onClick={logout}
        className="shrink-0 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
      >
        {t('logout')}
      </button>
    </div>
  );
}

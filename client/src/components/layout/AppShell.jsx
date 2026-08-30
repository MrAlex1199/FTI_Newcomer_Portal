import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import GlobalSearch from '../common/GlobalSearch.jsx';
import LanguageToggle from '../common/LanguageToggle.jsx';
import useLanguage from '../../hooks/useLanguage.js';
import FeedbackWidget from '../common/FeedbackWidget.jsx';

export default function AppShell({ children, rightContent }) {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const dashboardLink = rightContent || (
    <Link
      to="/dashboard"
      className="text-sm text-gray-600 hover:text-primary-700 focus-visible:text-primary-700"
    >
      {t('backDashboard')}
    </Link>
  );

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileNavOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [mobileNavOpen]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
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
              {dashboardLink}
              <LanguageToggle />
            </nav>

            <div className="flex shrink-0 items-center gap-2 md:hidden">
              <LanguageToggle />
              <button
                type="button"
                onClick={() => setMobileNavOpen((open) => !open)}
                aria-expanded={mobileNavOpen}
                aria-controls="mobile-navigation"
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
              id="mobile-navigation"
              aria-label={t('navigation')}
              className="space-y-3 border-t border-gray-100 py-3 md:hidden"
            >
              <GlobalSearch />
              <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                {dashboardLink}
              </div>
            </nav>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <FeedbackWidget />
    </div>
  );
}

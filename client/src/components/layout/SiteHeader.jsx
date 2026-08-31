import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import GlobalSearch from '../common/GlobalSearch.jsx';
import LanguageToggle from '../common/LanguageToggle.jsx';
import useAuth from '../../hooks/useAuth.js';
import useLanguage from '../../hooks/useLanguage.js';
import { ROLE_LABELS } from '../../utils/permissions.js';
import AnnouncementTicker from './AnnouncementTicker.jsx';

const profileRecord = (user) => user?.employeeId || user?.internId || user || {};
const profileName = (user) => {
  const record = profileRecord(user);
  const name = [record.firstName, record.lastName].filter(Boolean).join(' ').trim();
  return name || user?.username || 'User';
};
const profileImage = (user) => profileRecord(user).profileImage || '';

export default function SiteHeader({ rightContent }) {
  const { user, logout } = useAuth();
  const { t, label } = useLanguage();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const role = label(user?.role) || ROLE_LABELS[user?.role] || user?.role;
  const name = profileName(user);
  const image = profileImage(user);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen && !profileOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        setProfileOpen(false);
      }
    };
    const closeOnPointer = (event) => {
      if (profileOpen && !profileRef.current?.contains(event.target)) setProfileOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('mousedown', closeOnPointer);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('mousedown', closeOnPointer);
    };
  }, [mobileOpen, profileOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 shadow-md">
      <div className="bg-primary-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex min-h-[4.25rem] items-center justify-between gap-3 py-2">
            <Link to="/dashboard" className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:ring-white focus-visible:ring-offset-primary-900">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-800 p-1">
                <img src="/logo-ft-white.png" alt="FTI" className="h-auto w-full object-contain" />
              </span>
              <span className="hidden text-sm font-semibold tracking-wide text-white sm:inline">{t('brand')}</span>
            </Link>

            <nav aria-label={t('navigation')} className="hidden min-w-0 flex-1 items-center justify-end gap-3 md:flex lg:gap-5">
              <Link to="/dashboard" className={navClass(pathname === '/dashboard')}>{t('dashboard')}</Link>
              <GlobalSearch />
              {rightContent}
              <LanguageToggle />
              <ProfileMenu profileRef={profileRef} user={user} name={name} image={image} role={role} open={profileOpen} setOpen={setProfileOpen} onLogout={handleLogout} />
            </nav>

            <div className="flex shrink-0 items-center gap-2 md:hidden">
              <LanguageToggle />
              <button
                type="button"
                onClick={() => setMobileOpen((open) => !open)}
                aria-expanded={mobileOpen}
                aria-controls="site-mobile-navigation"
                aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-primary-700 text-white hover:bg-primary-800 focus-visible:ring-white focus-visible:ring-offset-primary-900"
              >
                <span className="sr-only">{mobileOpen ? t('closeMenu') : t('openMenu')}</span>
                {mobileOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>

          {mobileOpen && (
            <nav id="site-mobile-navigation" aria-label={t('navigation')} className="space-y-2 border-t border-primary-800 py-3 md:hidden">
              <Link to="/dashboard" className="block rounded-lg px-3 py-2 text-sm font-medium text-white hover:bg-primary-800">{t('dashboard')}</Link>
              <GlobalSearch />
              {rightContent && <div className="px-3 py-2">{rightContent}</div>}
              <Link to="/profile" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white hover:bg-primary-800">
                <Avatar image={image} name={name} />
                <span>{t('profileSettings')}</span>
              </Link>
              <button type="button" onClick={handleLogout} className="w-full rounded-lg px-3 py-2 text-left text-sm text-primary-100 hover:bg-primary-800">{t('logout')}</button>
            </nav>
          )}
        </div>
      </div>
      <AnnouncementTicker />
    </header>
  );
}

function ProfileMenu({ user, name, image, role, open, setOpen, onLogout, profileRef }) {
  const { t } = useLanguage();
  return (
    <div ref={profileRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t('profileMenu')}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-white hover:bg-primary-800 focus-visible:ring-white focus-visible:ring-offset-primary-900"
      >
        <Avatar image={image} name={name} />
        <span className="hidden max-w-28 lg:block">
          <span className="block truncate text-sm font-medium">{name}</span>
          <span className="block truncate text-xs text-primary-200">{role}</span>
        </span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white py-2 text-gray-800 shadow-xl">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-gray-500">{user?.email}</p>
            <p className="mt-1 text-xs text-primary-600">{role}</p>
          </div>
          <Link role="menuitem" to="/profile" className="mx-2 mt-2 block rounded-lg px-3 py-2 text-sm hover:bg-primary-50 hover:text-primary-700">👤 {t('profileSettings')}</Link>
          <button role="menuitem" type="button" onClick={onLogout} className="mx-2 mt-1 block w-[calc(100%-1rem)] rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">↪ {t('logout')}</button>
        </div>
      )}
    </div>
  );
}

function Avatar({ image, name }) {
  return image ? (
    <img src={image} alt="" className="h-9 w-9 rounded-full border-2 border-white/50 object-cover" />
  ) : (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white" aria-hidden="true">
      {name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
    </span>
  );
}

function navClass(active) {
  return `rounded-lg px-2 py-2 text-sm font-medium transition hover:bg-primary-800 ${active ? 'bg-primary-800 text-white' : 'text-primary-100'}`;
}

function MenuIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /></svg>;
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /></svg>;
}

function ChevronIcon({ open }) {
  return <svg viewBox="0 0 20 20" aria-hidden="true" className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}><path d="m5 7 5 5 5-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" /></svg>;
}

export { profileName, profileImage };

import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import GlobalSearch from '../common/GlobalSearch.jsx';
import LanguageToggle from '../common/LanguageToggle.jsx';
import useAuth from '../../hooks/useAuth.js';
import useChat from '../../hooks/useChat.js';
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
  const { user, logout, hasPermission, hasRole } = useAuth();
  const { totalUnreadCount } = useChat();
  const { t, label } = useLanguage();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const role = label(user?.role) || ROLE_LABELS[user?.role] || user?.role;
  const name = profileName(user);
  const image = profileImage(user);

  const isAdmin = hasRole('super_admin') || hasRole('admin');
  const canManageUsers = hasPermission('users:manage');
  const canViewAudit = hasPermission('auditlog:view');
  const canManageFeedback = hasPermission('feedback:manage');
  const showAdminNav = isAdmin || canManageUsers || canViewAudit || canManageFeedback;

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Keyboard navigation and backdrop pointer listeners
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
    setMobileOpen(false);
    setProfileOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const closeDrawer = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-40 shadow-md">
      <div className="bg-primary-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex min-h-[4.25rem] items-center justify-between gap-3 py-2">
            <Link
              to="/dashboard"
              onClick={closeDrawer}
              className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-800 p-1.5 shadow-xs">
                <img src="/logo-ft-white.png" alt="FTI" className="h-auto w-full object-contain" />
              </span>
              <span className="text-base font-bold tracking-wide text-white sm:text-lg">
                {t('brand')}
              </span>
            </Link>

            <nav aria-label={t('navigation')} className="hidden min-w-0 flex-1 items-center justify-end gap-3 md:flex lg:gap-4">
              <Link to="/dashboard" className={navClass(pathname === '/dashboard')}>{t('dashboard')}</Link>
              <Link to="/floor-plan" className={`flex items-center gap-1.5 ${navClass(pathname === '/floor-plan')}`}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>{t('floorPlan') || 'ผังอาคาร & ทรัพย์สิน'}</span>
              </Link>
              <Link to="/chat" className={`relative flex items-center gap-1.5 ${navClass(pathname === '/chat')}`}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{t('chat')}</span>
                {totalUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </span>
                )}
              </Link>
              <GlobalSearch />
              {rightContent}
              <LanguageToggle />
              <ProfileMenu
                profileRef={profileRef}
                user={user}
                name={name}
                image={image}
                role={role}
                open={profileOpen}
                setOpen={setProfileOpen}
                onLogout={handleLogout}
              />
            </nav>

            <div className="flex shrink-0 items-center gap-2 md:hidden">
              <LanguageToggle />
              <button
                type="button"
                onClick={() => setMobileOpen((open) => !open)}
                aria-expanded={mobileOpen}
                aria-controls="site-mobile-navigation"
                aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary-700 bg-primary-800/80 text-white transition hover:bg-primary-700 active:scale-95 focus-visible:ring-2 focus-visible:ring-white"
              >
                <span className="sr-only">{mobileOpen ? t('closeMenu') : t('openMenu')}</span>
                {mobileOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnnouncementTicker />

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs transition-opacity duration-300 md:hidden"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      <div
        id="site-mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-label={t('navigation')}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-xs sm:max-w-sm flex-col bg-gradient-to-b from-primary-950 via-primary-900 to-slate-950 text-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between border-b border-primary-800/80 px-4 py-3.5 bg-primary-950/50">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar image={image} name={name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{name}</p>
              <span className="inline-block truncate rounded-full bg-primary-800 px-2 py-0.5 text-[11px] font-medium text-primary-200">
                {role}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label={t('closeMenu')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary-700/80 bg-primary-800/60 text-white transition hover:bg-primary-700 active:scale-95"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="border-b border-primary-800/60 px-4 py-3 bg-primary-900/40">
          <GlobalSearch onSelect={closeDrawer} className="w-full" />
        </div>

        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          <div className="space-y-1">
            <DrawerLink
              to="/dashboard"
              active={pathname === '/dashboard'}
              icon="🏠"
              label={t('dashboard')}
              onClick={closeDrawer}
            />
            <DrawerLink
              to="/chat"
              active={pathname === '/chat'}
              icon="💬"
              label={t('chat')}
              badge={totalUnreadCount > 0 ? (totalUnreadCount > 99 ? '99+' : totalUnreadCount) : null}
              onClick={closeDrawer}
            />
          </div>

          <div className="space-y-1">
            <DrawerSectionHeader title={t('onboardingEssentials')} />
            <DrawerLink
              to="/getting-started"
              active={pathname === '/getting-started'}
              icon="🚀"
              label={t('gettingStarted')}
              onClick={closeDrawer}
            />
            <DrawerLink
              to="/policies"
              active={pathname === '/policies'}
              icon="📋"
              label={t('policies')}
              onClick={closeDrawer}
            />
            <DrawerLink
              to="/faq"
              active={pathname === '/faq'}
              icon="❓"
              label={t('faq')}
              onClick={closeDrawer}
            />
            <DrawerLink
              to="/announcements"
              active={pathname === '/announcements'}
              icon="📣"
              label={t('announcements')}
              onClick={closeDrawer}
            />
          </div>

          <div className="space-y-1">
            <DrawerSectionHeader title={t('directoriesAndServices')} />
            <DrawerLink
              to="/employees"
              active={pathname === '/employees'}
              icon="👥"
              label={t('employeeDirectory')}
              onClick={closeDrawer}
            />
            <DrawerLink
              to="/departments"
              active={pathname === '/departments'}
              icon="🏢"
              label={t('departments')}
              onClick={closeDrawer}
            />
            <DrawerLink
              to="/interns"
              active={pathname === '/interns'}
              icon="🎓"
              label={t('internDirectory')}
              onClick={closeDrawer}
            />
            <DrawerLink
              to="/intern-batches"
              active={pathname === '/intern-batches'}
              icon="📅"
              label={t('internBatches')}
              onClick={closeDrawer}
            />
            <DrawerLink
              to="/organization"
              active={pathname === '/organization'}
              icon="🗂️"
              label={t('organizationChart')}
              onClick={closeDrawer}
            />
          </div>

          <div className="space-y-1">
            <DrawerSectionHeader title={t('supportTab')} />
            <DrawerLink
              to="/it-help"
              active={pathname === '/it-help'}
              icon="🛠️"
              label={t('itHelp')}
              onClick={closeDrawer}
            />
            <DrawerLink
              to="/floor-plan"
              active={pathname === '/floor-plan'}
              icon="🏢"
              label={t('floorPlan') || 'ผังอาคารและทรัพย์สิน'}
              onClick={closeDrawer}
            />
            <DrawerLink
              to="/company"
              active={pathname === '/company'}
              icon="🏬"
              label={t('companyInfo')}
              onClick={closeDrawer}
            />
          </div>

          {showAdminNav && (
            <div className="space-y-1">
              <DrawerSectionHeader title={t('adminSectionClean')} />
              {isAdmin && (
                <DrawerLink
                  to="/admin"
                  active={pathname === '/admin' || pathname === '/admin/dashboard'}
                  icon="📊"
                  label={t('adminDashboard')}
                  onClick={closeDrawer}
                />
              )}
              {(isAdmin || canManageUsers) && (
                <DrawerLink
                  to="/admin/users"
                  active={pathname === '/admin/users'}
                  icon="🔐"
                  label={t('userManagement')}
                  onClick={closeDrawer}
                />
              )}
              {(isAdmin || canViewAudit) && (
                <DrawerLink
                  to="/admin/audit-logs"
                  active={pathname === '/admin/audit-logs'}
                  icon="📜"
                  label={t('auditLog')}
                  onClick={closeDrawer}
                />
              )}
              {(isAdmin || canManageFeedback) && (
                <DrawerLink
                  to="/admin/feedback"
                  active={pathname === '/admin/feedback'}
                  icon="📬"
                  label={t('pendingFeedback')}
                  onClick={closeDrawer}
                />
              )}
            </div>
          )}

          {rightContent && (
            <div className="pt-2 border-t border-primary-800/40" onClick={closeDrawer}>
              {rightContent}
            </div>
          )}
        </div>

        <div className="border-t border-primary-800/80 bg-primary-950/90 p-4 space-y-2">
          <Link
            to="/profile"
            onClick={closeDrawer}
            className="flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-800 active:scale-95"
          >
            <span className="text-lg" aria-hidden="true">👤</span>
            <span>{t('profileSettings')}</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium text-rose-300 transition hover:bg-rose-950/40 hover:text-rose-200 active:scale-95"
          >
            <span className="text-lg" aria-hidden="true">↪</span>
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function DrawerSectionHeader({ title }) {
  return (
    <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-primary-300/80">
      {title}
    </p>
  );
}

function DrawerLink({ to, active, icon, label, badge, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex min-h-[44px] items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition active:scale-[0.99] ${
        active
          ? 'bg-primary-700/90 text-white font-semibold shadow-xs ring-1 ring-primary-500/50'
          : 'text-primary-100 hover:bg-primary-800/70 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-lg shrink-0" aria-hidden="true">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      {badge && (
        <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white shadow-xs">
          {badge}
        </span>
      )}
    </Link>
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
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-white hover:bg-primary-800 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900"
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
          <Link role="menuitem" to="/floor-plan" className="mx-2 mt-1 block rounded-lg px-3 py-2 text-sm hover:bg-primary-50 hover:text-primary-700">🏢 {t('floorPlan') || 'ผังอาคาร & ทรัพย์สิน'}</Link>
          <button role="menuitem" type="button" onClick={onLogout} className="mx-2 mt-1 block w-[calc(100%-1rem)] rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">↪ {t('logout')}</button>
        </div>
      )}
    </div>
  );
}

function Avatar({ image, name }) {
  return image ? (
    <img src={image} alt="" className="h-9 w-9 shrink-0 rounded-full border-2 border-white/50 object-cover" />
  ) : (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white shadow-xs" aria-hidden="true">
      {name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
    </span>
  );
}

function navClass(active) {
  return `rounded-lg px-2.5 py-2 text-sm font-medium transition hover:bg-primary-800 ${active ? 'bg-primary-800 text-white' : 'text-primary-100'}`;
}

function MenuIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /></svg>;
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /></svg>;
}

function ChevronIcon({ open }) {
  return <svg viewBox="0 0 20 20" aria-hidden="true" className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}><path d="m5 7 5 5 5-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" /></svg>;
}

export { profileName, profileImage };

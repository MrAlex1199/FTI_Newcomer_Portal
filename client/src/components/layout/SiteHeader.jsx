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
            {/* Left Section: Brand & Core Links */}
            <div className="flex shrink-0 items-center gap-3 lg:gap-4">
              <Link
                to="/dashboard"
                onClick={closeDrawer}
                className="flex shrink-0 items-center gap-2.5 rounded-xl transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900"
              >
                <span className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-primary-800 p-1.5 shadow-sm border border-primary-700/60">
                  <img src="/logo-ft-white.png" alt="FTI" className="h-auto w-full object-contain" />
                </span>
                <span className="text-base font-bold tracking-wide text-white sm:text-lg">
                  {t('brand')}
                </span>
              </Link>

              <div className="hidden md:flex items-center gap-1.5">
                <Link
                  to="/dashboard"
                  className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${pathname === '/dashboard'
                    ? 'bg-primary-800 text-white shadow-xs font-semibold'
                    : 'text-primary-200 hover:bg-primary-800/60 hover:text-white'
                    }`}
                >
                  {t('dashboard')}
                </Link>

                <ServicesDropdown pathname={pathname} />
              </div>
            </div>

            {/* Center Section: Spacious Command Center Global Search */}
            <div className="hidden md:flex flex-1 justify-center px-2 lg:px-6 max-w-lg lg:max-w-xl">
              <GlobalSearch variant="header" className="w-full" />
            </div>

            {/* Right Section: Quick Utilities & Account */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {/* Chat Button with Unread Badge */}
              <Link
                to="/chat"
                title={t('chat')}
                aria-label={t('chat')}
                className={`relative hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary-700/70 bg-primary-800/70 text-white transition hover:bg-primary-700 hover:border-primary-600 active:scale-95 ${pathname === '/chat' ? 'ring-2 ring-blue-400 bg-primary-700' : ''
                  }`}
              >
                <svg className="h-5 w-5 text-primary-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {totalUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-primary-900 animate-pulse">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </span>
                )}
              </Link>

              {/* Language Switcher Pill */}
              <LanguageToggle variant="header" />

              {rightContent}

              {/* Compact User Profile Menu */}
              <div className="hidden sm:block">
                <ProfileMenu
                  profileRef={profileRef}
                  user={user}
                  name={name}
                  image={image}
                  role={role}
                  open={profileOpen}
                  setOpen={setProfileOpen}
                  onLogout={handleLogout}
                  showAdminNav={showAdminNav}
                  isAdmin={isAdmin}
                />
              </div>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileOpen((open) => !open)}
                aria-expanded={mobileOpen}
                aria-controls="site-mobile-navigation"
                aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary-700/80 bg-primary-800/80 text-white transition hover:bg-primary-700 active:scale-95 focus-visible:ring-2 focus-visible:ring-white md:hidden"
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
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-xs sm:max-w-sm flex-col bg-gradient-to-b from-primary-950 via-primary-900 to-slate-950 text-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${mobileOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
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
          <GlobalSearch variant="drawer" onSelect={closeDrawer} className="w-full" />
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
              label={t('floorPlan')}
              onClick={closeDrawer}
            />
            <DrawerLink
              to="/maintenance"
              active={pathname === '/maintenance'}
              icon="🔧"
              label={t('equipmentMaintenance')}
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
      className={`flex min-h-[44px] items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition active:scale-[0.99] ${active
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

function ServicesDropdown({ pathname }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isServicesActive = [
    '/floor-plan',
    '/maintenance',
    '/employees',
    '/departments',
    '/organization',
    '/it-help',
    '/policies',
    '/interns',
    '/company',
  ].some((path) => pathname.startsWith(path));

  useEffect(() => {
    const handlePointer = (e) => {
      if (open && !dropdownRef.current?.contains(e.target)) setOpen(false);
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition ${isServicesActive || open
          ? 'bg-primary-800 text-white shadow-xs font-semibold'
          : 'text-primary-200 hover:bg-primary-800/60 hover:text-white'
          }`}
      >
        <span>{t('servicesMenu')}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-2 w-72 origin-top-left overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-slate-800 shadow-2xl ring-1 ring-black/5"
        >
          {/* Featured: Floor Plan & Campus */}
          <Link
            to="/floor-plan"
            role="menuitem"
            className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-blue-50/80 group"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 text-base group-hover:scale-105 transition-transform">
              🏢
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-700">
                {t('floorPlan')}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {t('floorPlanDesc')}
              </p>
            </div>
          </Link>

          <Link
            to="/maintenance"
            role="menuitem"
            className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-emerald-50/80 group"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-base group-hover:scale-105 transition-transform">
              🔧
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700">
                {t('equipmentMaintenance')}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {t('equipmentMaintenanceDesc')}
              </p>
            </div>
          </Link>

          <div className="my-1 border-t border-slate-100" />

          {/* Directory & Services */}
          <div className="space-y-0.5">
            <ServicesMenuItem
              to="/employees"
              icon="👥"
              title={t('employeeDirectory')}
              subtitle={t('employeeDirectoryDesc')}
            />
            <ServicesMenuItem
              to="/departments"
              icon="🏛️"
              title={t('departments')}
              subtitle={t('departmentsDesc')}
            />
            <ServicesMenuItem
              to="/organization"
              icon="🗂️"
              title={t('organizationChart')}
              subtitle={t('organizationChartDesc')}
            />
            <ServicesMenuItem
              to="/it-help"
              icon="🛠️"
              title={t('itHelp')}
              subtitle={t('itHelpDesc')}
            />
            <ServicesMenuItem
              to="/policies"
              icon="📋"
              title={t('policies')}
              subtitle={t('policiesDesc')}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ServicesMenuItem({ to, icon, title, subtitle }) {
  return (
    <Link
      to={to}
      role="menuitem"
      className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-slate-700 hover:bg-slate-100/80 transition group"
    >
      <span className="text-base shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-800 group-hover:text-primary-700 truncate">{title}</p>
        {subtitle && <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>}
      </div>
    </Link>
  );
}

function ProfileMenu({ user, name, image, role, open, setOpen, onLogout, profileRef, showAdminNav }) {
  const { t } = useLanguage();
  return (
    <div ref={profileRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t('profileMenu')}
        className="flex items-center gap-1.5 rounded-xl p-1 text-left text-white hover:bg-primary-800/80 focus-visible:ring-2 focus-visible:ring-white transition"
      >
        <div className="relative">
          <Avatar image={image} name={name} />
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-primary-900" />
        </div>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-slate-800 shadow-2xl ring-1 ring-black/5"
        >
          <div className="border-b border-slate-100 px-3 py-2.5 bg-slate-50/70 rounded-xl mb-1">
            <p className="truncate text-sm font-bold text-slate-900">{name}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
            <span className="mt-1.5 inline-block rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700 border border-primary-100">
              {role}
            </span>
          </div>

          <div className="space-y-0.5">
            <Link
              role="menuitem"
              to="/profile"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              <span>👤</span>
              <span>{t('profileSettings')}</span>
            </Link>
            <Link
              role="menuitem"
              to="/floor-plan"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              <span>🏢</span>
              <span>{t('floorPlan') || 'ผังอาคาร & ทรัพย์สิน'}</span>
            </Link>
            {showAdminNav && (
              <Link
                role="menuitem"
                to="/admin"
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition"
              >
                <span>📊</span>
                <span>{t('adminDashboard')}</span>
              </Link>
            )}
          </div>

          <div className="my-1 border-t border-slate-100" />

          <button
            role="menuitem"
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
          >
            <span>↪</span>
            <span>{t('logout')}</span>
          </button>
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

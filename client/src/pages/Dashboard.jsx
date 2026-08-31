import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import useLanguage from '../hooks/useLanguage.js';
import RoleGuard from '../components/common/RoleGuard.jsx';
import FeedbackWidget from '../components/common/FeedbackWidget.jsx';
import DashboardHeader from './DashboardHeader.jsx';
import { useAnnouncements } from '../hooks/useAnnouncements.js';
import { ErrorState } from '../components/common/states.jsx';
import AnnouncementCarousel from '../components/content/AnnouncementCarousel.jsx';

const MANAGE_PERMISSIONS = [
  'policies:manage',
  'employees:manage',
  'departments:manage',
  'interns:manage',
  'users:manage',
  'auditlog:view',
];

export default function Dashboard() {
  const { hasPermission, hasRole } = useAuth();
  const { t } = useLanguage();
  const {
    data: announcementData,
    isLoading: announcementsLoading,
    isError: announcementsError,
    error: announcementError,
    refetch: refetchAnnouncements,
  } = useAnnouncements({ limit: 3 });

  const isAdmin = hasRole('super_admin') || hasRole('admin');
  const showManageSection = isAdmin || MANAGE_PERMISSIONS.some((permission) => hasPermission(permission));

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <DashboardHeader />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <AnnouncementCarousel />

        <SectionHeading emoji="🧭" title={t('exploreSection')} desc={t('exploreSectionDesc')} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NavCard index={0} to="/employees" emoji="👥" title={t('employeeDirectory')} desc={t('employeeDirectoryDesc')} />
          <NavCard index={1} to="/departments" emoji="🏢" title={t('departments')} desc={t('departmentsDesc')} />
          <NavCard index={2} to="/interns" emoji="🎓" title={t('internDirectory')} desc={t('internDirectoryDesc')} />
          <NavCard index={3} to="/intern-batches" emoji="📅" title={t('internBatches')} desc={t('internBatchesDesc')} />
          <NavCard index={4} to="/organization" emoji="🗂️" title={t('organizationChart')} desc={t('organizationChartDesc')} />
          <NavCard index={5} to="/policies" emoji="📋" title={t('policies')} desc={t('policiesDesc')} />
          <NavCard index={6} to="/faq" emoji="❓" title={t('faq')} desc={t('faqDesc')} />
          <NavCard index={7} to="/announcements" emoji="📣" title={t('announcements')} desc={t('announcementsDesc')} />
          <NavCard index={8} to="/getting-started" emoji="🚀" title={t('gettingStarted')} desc={t('gettingStartedDesc')} />
          <NavCard index={9} to="/it-help" emoji="🛠️" title={t('itHelp')} desc={t('itHelpDesc')} />
          <NavCard index={10} to="/company" emoji="🏬" title={t('companyInfo')} desc={t('companyInfoDesc')} />
        </div>

        {showManageSection && (
          <>
            <SectionHeading emoji="🔧" title={t('manageSection')} desc={t('manageSectionDesc')} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <RoleGuard permission="policies:manage" mode="inline">
                <NavCard index={0} to="/policies" emoji="📝" title={t('manageContent')} desc={t('manageContentDesc')} tone="editor" />
              </RoleGuard>
              <RoleGuard permission="employees:manage" mode="inline">
                <NavCard index={1} to="/employees" emoji="🧑‍💼" title={t('manageEmployees')} desc={t('manageEmployeesDesc')} tone="admin" />
              </RoleGuard>
              <RoleGuard permission="departments:manage" mode="inline">
                <NavCard index={2} to="/departments" emoji="🏗️" title={t('manageDepartments')} desc={t('manageDepartmentsDesc')} tone="admin" />
              </RoleGuard>
              <RoleGuard permission="interns:manage" mode="inline">
                <NavCard index={3} to="/intern-batches" emoji="🧑‍🎓" title={t('manageInterns')} desc={t('manageInternsDesc')} tone="admin" />
              </RoleGuard>
              <RoleGuard permission="users:manage" mode="inline">
                <NavCard index={4} to="/admin/users" emoji="🔐" title={t('userManagement')} desc={t('userManagementDesc')} tone="admin" />
              </RoleGuard>
              <RoleGuard permission="auditlog:view" mode="inline">
                <NavCard index={5} to="/admin/audit-logs" emoji="📜" title={t('auditLog')} desc={t('auditLogDesc')} tone="super" />
              </RoleGuard>
              <RoleGuard roles={['super_admin', 'admin']} mode="inline">
                <NavCard index={6} to="/admin" emoji="📊" title={t('adminArea')} desc={t('adminAreaDesc')} tone="admin" />
              </RoleGuard>
            </div>
          </>
        )}

        <RecentAnnouncements
          announcements={announcementData?.data || []}
          loading={announcementsLoading}
          error={announcementsError ? announcementError : null}
          onRetry={refetchAnnouncements}
        />
      </main>
      <FeedbackWidget />
    </div>
  );
}

const toneClasses = {
  neutral: 'bg-primary-50',
  editor: 'bg-blue-100',
  admin: 'bg-amber-100',
  super: 'bg-purple-100',
};

const MENU_VISUALS = {
  '/employees': '/menu-visuals/employee.jpg',
  '/departments': '/menu-visuals/department.jpg',
  '/interns': '/menu-visuals/intern.jpg',
  '/intern-batches': '/menu-visuals/intern.jpg',
  '/organization': '/menu-visuals/organization.svg',
  '/policies': '/menu-visuals/policies.jpg',
  '/faq': '/menu-visuals/support.svg',
  '/announcements': '/menu-visuals/announcement.jpg',
  '/getting-started': '/mock-posters/learning.svg',
  '/it-help': '/menu-visuals/Itsupport.jpg',
  '/company': '/menu-visuals/Company.jpg',
  '/admin/users': '/menu-visuals/organization.svg',
  '/admin/audit-logs': '/mock-posters/learning.svg',
  '/admin': '/menu-visuals/Company.jpg',
};

function SectionHeading({ emoji, title, desc }) {
  return (
    <div className="mb-4 mt-8 flex items-start gap-3">
      <span className="text-xl" aria-hidden="true">{emoji}</span>
      <div>
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
    </div>
  );
}

/**
 * Dashboard tile. The whole card is one link target so it is easy to hit on
 * touch screens, and the arrow gives a visual hint that it navigates.
 */
function NavCard({ to, emoji, title, desc, tone = 'neutral', index = 0 }) {
  const { t } = useLanguage();
  const visual = MENU_VISUALS[to];
  return (
    <Link
      to={to}
      className="app-card-interactive group flex h-full animate-fade-up flex-col overflow-hidden focus-visible:border-primary-400"
      style={{ animationDelay: `${Math.min(index, 11) * 40}ms` }}
    >
      <div className="relative -mx-5 -mt-5 mb-5 h-32 overflow-hidden bg-primary-50 sm:h-40">
        {visual ? <img src={visual} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <div className={`flex h-full w-full items-center justify-center ${toneClasses[tone] || toneClasses.neutral}`}><span className="text-6xl" aria-hidden="true">{emoji}</span></div>}
        <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur-sm" aria-hidden="true">{emoji}</span>
      </div>
      <div className="flex items-start gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-800 group-hover:text-primary-700">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{desc}</p>
        </div>
      </div>
      <span className="mt-auto flex items-center gap-1 pt-4 text-sm font-medium text-primary-600">
        {t('openCard')}
        <span className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">→</span>
      </span>
    </Link>
  );
}

function RecentAnnouncements({ announcements, loading, error, onRetry }) {
  const { t, locale, label } = useLanguage();
  return (
    <section className="mt-10 animate-fade-up rounded-xl border border-gray-200 bg-white p-5 shadow-card" aria-labelledby="recent-announcements-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="text-xl" aria-hidden="true">📣</span>
          <div>
            <h2 id="recent-announcements-heading" className="text-lg font-semibold text-gray-800">{t('dashboardAnnouncements')}</h2>
            <p className="mt-1 text-sm text-gray-500">{t('dashboardAnnouncementsDesc')}</p>
          </div>
        </div>
        <Link to="/announcements" className="group shrink-0 text-sm font-medium text-primary-600 hover:underline">
          {t('viewAnnouncements')}
          <span className="ml-1 inline-block transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">→</span>
        </Link>
      </div>
      {loading ? (
        <div className="mt-4 space-y-3" aria-live="polite" aria-label={t('loadingAnnouncements')}>
          <div className="h-5 w-2/3 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-3/4 animate-pulse rounded bg-gray-100" />
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : announcements.length === 0 ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <span aria-hidden="true">🌤️</span>
          {t('noRecentAnnouncements')}
        </p>
      ) : (
        <div className="mt-4 divide-y divide-gray-100">
          {announcements.map((item) => (
            <Link key={item._id} to="/announcements" className="block rounded-lg px-2 py-3 transition duration-200 first:pt-0 last:pb-0 hover:bg-primary-50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800">{item.title}</p>
                  <p className="mt-1 text-xs text-primary-600">
                    {label(item.category)}{item.isPinned ? ` · 📌 ${t('pinned')}` : ''}
                  </p>
                </div>
                {item.publishAt && <time className="shrink-0 text-right text-xs text-gray-400">{new Date(item.publishAt).toLocaleDateString(locale)}</time>}
              </div>
              {item.summary && <p className="mt-1 line-clamp-2 text-sm text-gray-500">{item.summary}</p>}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

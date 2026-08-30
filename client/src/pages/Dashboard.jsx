import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import useLanguage from '../hooks/useLanguage.js';
import RoleGuard from '../components/common/RoleGuard.jsx';
import FeedbackWidget from '../components/common/FeedbackWidget.jsx';
import DashboardHeader from './DashboardHeader.jsx';
import { ROLE_LABELS } from '../utils/permissions.js';
import { useAnnouncements } from '../hooks/useAnnouncements.js';
import { ErrorState } from '../components/common/states.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const {
    data: announcementData,
    isLoading: announcementsLoading,
    isError: announcementsError,
    error: announcementError,
    refetch: refetchAnnouncements,
  } = useAnnouncements({ limit: 3 });
  const role = ROLE_LABELS[user.role] || user.role;

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <DashboardHeader />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="mb-1 text-lg font-semibold text-gray-800">
          {t('welcomeBack', { name: user.username })}
        </h1>
        <p className="mb-6 text-gray-500">{t('roleCards', { role })}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link to="/employees" className="block"><Card title={t('employeeDirectory')} desc={t('employeeDirectoryDesc')} /></Link>
          <Link to="/departments" className="block"><Card title={t('departments')} desc={t('departmentsDesc')} /></Link>
          <Link to="/interns" className="block"><Card title={t('internDirectory')} desc={t('internDirectoryDesc')} /></Link>
          <Link to="/intern-batches" className="block"><Card title={t('internBatches')} desc={t('internBatchesDesc')} /></Link>
          <Link to="/organization" className="block"><Card title={t('organizationChart')} desc={t('organizationChartDesc')} /></Link>
          <Link to="/policies" className="block"><Card title={t('policies')} desc={t('policiesDesc')} /></Link>
          <Link to="/faq" className="block"><Card title={t('faq')} desc={t('faqDesc')} /></Link>
          <Link to="/announcements" className="block"><Card title={t('announcements')} desc={t('announcementsDesc')} /></Link>
          <Link to="/getting-started" className="block"><Card title={t('gettingStarted')} desc={t('gettingStartedDesc')} /></Link>
          <Link to="/it-help" className="block"><Card title={t('itHelp')} desc={t('itHelpDesc')} /></Link>
          <Link to="/company" className="block"><Card title={t('companyInfo')} desc={t('companyInfoDesc')} /></Link>
          <RoleGuard permission="policies:manage" mode="inline"><Link to="/policies" className="block"><Card title={t('manageContent')} desc={t('manageContentDesc')} tone="editor" /></Link></RoleGuard>
          <RoleGuard permission="employees:manage" mode="inline"><Link to="/employees" className="block"><Card title={t('manageEmployees')} desc={t('manageEmployeesDesc')} tone="admin" /></Link></RoleGuard>
          <RoleGuard permission="departments:manage" mode="inline"><Link to="/departments" className="block"><Card title={t('manageDepartments')} desc={t('manageDepartmentsDesc')} tone="admin" /></Link></RoleGuard>
          <RoleGuard permission="interns:manage" mode="inline"><Link to="/intern-batches" className="block"><Card title={t('manageInterns')} desc={t('manageInternsDesc')} tone="admin" /></Link></RoleGuard>
          <RoleGuard permission="users:manage" mode="inline"><Link to="/admin/users" className="block"><Card title={t('userManagement')} desc={t('userManagementDesc')} tone="admin" /></Link></RoleGuard>
          <RoleGuard permission="auditlog:view" mode="inline"><Link to="/admin/audit-logs" className="block"><Card title={t('auditLog')} desc={t('auditLogDesc')} tone="super" /></Link></RoleGuard>
          <RoleGuard roles={['super_admin', 'admin']} mode="inline"><Link to="/admin" className="block"><Card title={t('adminArea')} desc={t('adminAreaDesc')} tone="admin" /></Link></RoleGuard>
        </div>
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
  neutral: 'border-gray-200',
  editor: 'border-blue-300 bg-blue-50',
  admin: 'border-amber-300 bg-amber-50',
  super: 'border-purple-300 bg-purple-50',
};

function Card({ title, desc, tone = 'neutral' }) {
  return (
    <div className={`h-full rounded-lg border bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-sm ${toneClasses[tone] || ''}`}>
      <h2 className="font-semibold text-gray-800">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{desc}</p>
    </div>
  );
}

function RecentAnnouncements({ announcements, loading, error, onRetry }) {
  const { t, locale, label } = useLanguage();
  return (
    <section className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm" aria-labelledby="recent-announcements-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="recent-announcements-heading" className="text-lg font-semibold text-gray-800">{t('dashboardAnnouncements')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('dashboardAnnouncementsDesc')}</p>
        </div>
        <Link to="/announcements" className="shrink-0 text-sm text-primary-600 hover:underline">{t('viewAnnouncements')}</Link>
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
        <p className="mt-4 text-sm text-gray-500">{t('noRecentAnnouncements')}</p>
      ) : (
        <div className="mt-4 divide-y divide-gray-100">
          {announcements.map((item) => (
            <Link key={item._id} to="/announcements" className="block py-3 first:pt-0 last:pb-0 hover:bg-gray-50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800">{item.title}</p>
                  <p className="mt-1 text-xs text-primary-600">{label(item.category)}{item.isPinned ? ` · ${t('pinned')}` : ''}</p>
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

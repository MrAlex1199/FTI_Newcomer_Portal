import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import useLanguage from '../hooks/useLanguage.js';
import RoleGuard from '../components/common/RoleGuard.jsx';
import FeedbackWidget from '../components/common/FeedbackWidget.jsx';
import DashboardHeader from './DashboardHeader.jsx';
import AnnouncementCarousel from '../components/content/AnnouncementCarousel.jsx';

const MANAGE_PERMISSIONS = [
  'users:manage',
  'auditlog:view',
];

const MENU_VISUALS = {
  '/employees': '/menu-visuals/employee.jpg',
  '/departments': '/menu-visuals/department.jpg',
  '/interns': '/menu-visuals/intern.jpg',
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

const toneClasses = {
  neutral: 'bg-primary-50',
  editor: 'bg-blue-100',
  admin: 'bg-amber-100',
  super: 'bg-purple-100',
};

export default function Dashboard() {
  const { hasPermission, hasRole } = useAuth();
  const { t } = useLanguage();

  const isAdmin = hasRole('super_admin') || hasRole('admin');
  const showManageSection =
    isAdmin || MANAGE_PERMISSIONS.some((permission) => hasPermission(permission));

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50/60 pb-16">
      <DashboardHeader />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-10">
        {/* Top Hero: Announcement Carousel */}
        <AnnouncementCarousel />

        {/* 1. ONBOARDING ESSENTIALS: Priority Hub for Newcomers */}
        <section aria-labelledby="onboarding-essentials-heading">
          <SectionHeading
            emoji="🌟"
            title={t('onboardingEssentials')}
            desc={t('onboardingEssentialsDesc')}
            id="onboarding-essentials-heading"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <EssentialCard
              to="/getting-started"
              emoji="🚀"
              title={t('gettingStarted')}
              desc={t('gettingStartedDesc')}
              tag="Step 1"
              gradient="bg-blue-500"
              badgeColor="bg-blue-50 text-blue-700 border border-blue-100"
              index={0}
            />
            <EssentialCard
              to="/policies"
              emoji="📋"
              title={t('policies')}
              desc={t('policiesDesc')}
              tag="Rules"
              gradient="bg-emerald-500"
              badgeColor="bg-emerald-50 text-emerald-700 border border-emerald-100"
              index={1}
            />
            <EssentialCard
              to="/faq"
              emoji="❓"
              title={t('faq')}
              desc={t('faqDesc')}
              tag="Q&A"
              gradient="bg-amber-500"
              badgeColor="bg-amber-50 text-amber-700 border border-amber-100"
              index={2}
            />
            <EssentialCard
              to="/announcements"
              emoji="📣"
              title={t('announcements')}
              desc={t('announcementsDesc')}
              tag="News"
              gradient="bg-rose-500"
              badgeColor="bg-rose-50 text-rose-700 border border-rose-100"
              index={3}
            />
          </div>
        </section>

        {/* 2. DIRECTORIES & SERVICES: People, Hierarchy & Tools */}
        <section aria-labelledby="directories-heading">
          <SectionHeading
            emoji="🧭"
            title={t('directoriesAndServices')}
            desc={t('directoriesAndServicesDesc')}
            id="directories-heading"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NavCard
              index={0}
              to="/employees"
              emoji="👥"
              title={t('employeeDirectory')}
              desc={t('employeeDirectoryDesc')}
            />
            <NavCard
              index={1}
              to="/organization"
              emoji="🗂️"
              title={t('organizationChart')}
              desc={t('organizationChartDesc')}
            />
            <NavCard
              index={2}
              to="/departments"
              emoji="🏢"
              title={t('departments')}
              desc={t('departmentsDesc')}
            />
            <NavCard
              index={3}
              to="/interns"
              emoji="🎓"
              title={t('internDirectory')}
              desc={t('internDirectoryDesc')}
            />
            <NavCard
              index={4}
              to="/it-help"
              emoji="🛠️"
              title={t('itHelp')}
              desc={t('itHelpDesc')}
            />
            <NavCard
              index={5}
              to="/company"
              emoji="🏬"
              title={t('companyInfo')}
              desc={t('companyInfoDesc')}
            />
            <NavCard
              index={6}
              to="/floor-plan"
              emoji="🏢"
              title={t('floorPlanTitle') || 'ผังอาคาร & ทรัพย์สิน (20 ไร่)'}
              desc={t('floorPlanSubtitle') || 'ผังโครงการ 10 สิ่งปลูกสร้าง, จำลองมุมกล้อง CCTV และระบบชี้เป้าโต๊ะทำงาน'}
            />
          </div>
        </section>

        {/* 3. ADMIN MANAGEMENT: Non-duplicate system tools for Administrators */}
        {showManageSection && (
          <section aria-labelledby="manage-heading" className="pt-2">
            <SectionHeading
              emoji="🛡️"
              title={t('adminSectionClean')}
              desc={t('adminSectionCleanDesc')}
              id="manage-heading"
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <RoleGuard permission="users:manage" mode="inline">
                <NavCard
                  index={0}
                  to="/admin/users"
                  emoji="🔐"
                  title={t('userManagement')}
                  desc={t('userManagementDesc')}
                  tone="admin"
                />
              </RoleGuard>
              <RoleGuard permission="auditlog:view" mode="inline">
                <NavCard
                  index={1}
                  to="/admin/audit-logs"
                  emoji="📜"
                  title={t('auditLog')}
                  desc={t('auditLogDesc')}
                  tone="super"
                />
              </RoleGuard>
              <RoleGuard roles={['super_admin', 'admin']} mode="inline">
                <NavCard
                  index={2}
                  to="/admin"
                  emoji="📊"
                  title={t('adminArea')}
                  desc={t('adminAreaDesc')}
                  tone="admin"
                />
              </RoleGuard>
              <RoleGuard permission="knowledge:manage" mode="inline">
                <NavCard
                  index={3}
                  to="/floor-plan"
                  emoji="📐"
                  title="ออกแบบผังอาคารและทรัพย์สิน"
                  desc="เครื่องมือวาดผัง 10 อาคาร วางตำแหน่งโต๊ะทำงาน กล้องวงจรปิด และคัดลอกโครงร่างข้ามชั้น"
                  tone="admin"
                />
              </RoleGuard>
            </div>
          </section>
        )}
      </main>
      <FeedbackWidget />
    </div>
  );
}

function SectionHeading({ emoji, title, desc, id }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="text-2xl" aria-hidden="true">{emoji}</span>
      <div>
        <h2 id={id} className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

/**
 * High-priority Onboarding Hub Card
 */
function EssentialCard({ to, emoji, title, desc, tag, gradient, badgeColor, index = 0 }) {
  const { t } = useLanguage();

  return (
    <Link
      to={to}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary-500"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Ambient color aura */}
      <div
        className={`absolute -top-12 -right-12 h-28 w-28 rounded-full opacity-15 blur-2xl transition-opacity duration-300 group-hover:opacity-30 ${gradient}`}
        aria-hidden="true"
      />

      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-xs transition-transform duration-300 group-hover:scale-110 ${badgeColor}`}
          >
            <span aria-hidden="true">{emoji}</span>
          </div>
          {tag && (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
              {tag}
            </span>
          )}
        </div>

        <h3 className="text-base font-bold text-gray-900 group-hover:text-primary-700 transition-colors">
          {title}
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-gray-500 line-clamp-2">
          {desc}
        </p>
      </div>

      <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-primary-600">
        <span>{t('openCard')}</span>
        <span
          className="transition-transform duration-200 group-hover:translate-x-1"
          aria-hidden="true"
        >
          →
        </span>
      </div>
    </Link>
  );
}

/**
 * Standard Dashboard Tile
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
      <div className="relative -mx-5 -mt-5 mb-4 h-32 overflow-hidden bg-primary-50 sm:h-36">
        {visual ? (
          <img
            src={visual}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center ${
              toneClasses[tone] || toneClasses.neutral
            }`}
          >
            <span className="text-5xl" aria-hidden="true">{emoji}</span>
          </div>
        )}
        <span
          className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-xs backdrop-blur-xs"
          aria-hidden="true"
        >
          {emoji}
        </span>
      </div>
      <div className="flex items-start gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-800 group-hover:text-primary-700">{title}</h3>
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{desc}</p>
        </div>
      </div>
      <span className="mt-auto flex items-center gap-1 pt-3 text-xs font-medium text-primary-600">
        {t('openCard')}
        <span
          className="transition-transform duration-200 group-hover:translate-x-1"
          aria-hidden="true"
        >
          →
        </span>
      </span>
    </Link>
  );
}

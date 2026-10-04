import { useNavigate } from 'react-router-dom';
import useLanguage from '../../hooks/useLanguage.js';
import useAuth from '../../hooks/useAuth.js';

export default function OnboardingHero({ progress = { completed: 0, total: 0, percentage: 0 } }) {
  const { t, currentLanguage } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Dynamic time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('goodMorning');
    if (hour < 18) return t('goodAfternoon');
    return t('goodEvening');
  };

  const displayName = user?.nickname || user?.firstName || user?.username || (currentLanguage === 'th' ? 'เพื่อนร่วมงานใหม่' : 'Newcomer');

  // Launchpad cards configuration
  const launchpadItems = [
    {
      id: 'campus',
      icon: '🗺️',
      title: t('exploreCampus'),
      desc: t('exploreCampusDesc'),
      path: '/floor-plans',
      badge: currentLanguage === 'th' ? 'ผังอาคาร 20 ไร่' : 'Campus Master Plan',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
      hoverBorder: 'hover:border-emerald-400 dark:hover:border-emerald-500',
    },
    {
      id: 'vault',
      icon: '🔐',
      title: t('setupVault'),
      desc: t('setupVaultDesc'),
      path: '/vault',
      badge: currentLanguage === 'th' ? 'เข้ารหัสลับ AES-GCM' : 'AES-GCM Encrypted',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
      gradient: 'from-indigo-500/10 via-purple-500/5 to-transparent',
      hoverBorder: 'hover:border-indigo-400 dark:hover:border-indigo-500',
    },
    {
      id: 'directory',
      icon: '👥',
      title: t('searchDirectory'),
      desc: t('searchDirectoryDesc'),
      path: '/directory',
      badge: currentLanguage === 'th' ? 'เพื่อนร่วมงาน & พี่เลี้ยง' : 'Staff & Mentors',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
      gradient: 'from-blue-500/10 via-sky-500/5 to-transparent',
      hoverBorder: 'hover:border-blue-400 dark:hover:border-blue-500',
    },
    {
      id: 'it_help',
      icon: '🛠️',
      title: t('itHelpdesk'),
      desc: t('itHelpdeskDesc'),
      path: '/it-help',
      badge: currentLanguage === 'th' ? 'Wi-Fi / VPN / แจ้งซ่อม' : 'Wi-Fi, VPN & Tickets',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      gradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
      hoverBorder: 'hover:border-amber-400 dark:hover:border-amber-500',
    },
  ];

  // SVG Circular calculation
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress.percentage / 100) * circumference;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50/60 to-primary-50/30 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-800/80 p-6 sm:p-8 shadow-sm transition-all duration-300 mb-8">
      {/* Decorative ambient lights */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-teal-400/10 blur-3xl" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-slate-200/80 dark:border-slate-800">
        {/* Left: Greeting & Welcome text */}
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 dark:border-primary-800/60 bg-primary-50/90 dark:bg-primary-950/50 px-3.5 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-600"></span>
            </span>
            {currentLanguage === 'th' ? 'ศูนย์กลางปฐมนิเทศพนักงานใหม่' : 'Newcomer Onboarding Hub'}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {getGreeting()}, <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-teal-500 bg-clip-text text-transparent">{displayName}</span> 👋
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            {t('gettingStartedSubtitle')}
          </p>
        </div>

        {/* Right: Progress Ring & Stats */}
        <div className="flex items-center gap-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-5 rounded-2xl shadow-xs shrink-0">
          <div className="relative flex items-center justify-center">
            <svg className="h-24 w-24 -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                className="text-slate-100 dark:text-slate-700 stroke-current"
                strokeWidth="8"
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
              />
              <circle
                className="text-primary-600 dark:text-primary-400 stroke-current transition-all duration-700 ease-out"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                {progress.percentage}%
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                {progress.percentage === 100 ? '🎉' : 'Ready'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {t('onboardingProgress')}
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {progress.completed} / {progress.total} {currentLanguage === 'th' ? 'ภารกิจเสร็จสิ้น' : 'Done'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[130px] line-clamp-1">
              {progress.percentage === 100 ? t('allTasksDone') : currentLanguage === 'th' ? 'ทำภารกิจเพื่อเริ่มงาน' : 'Keep going!'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Launchpad Section */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span>⚡</span> {t('quickLaunchpad')}
          </h2>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {currentLanguage === 'th' ? '4 เครื่องมือแนะนำสำหรับวันแรก' : '4 vital tools for day one'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {launchpadItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.path)}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-4 text-left shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${item.hoverBorder} focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500`}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              <div className="relative z-10 flex items-start justify-between gap-2 mb-3">
                <span className="text-2xl transform transition-transform duration-200 group-hover:scale-110">
                  {item.icon}
                </span>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${item.badgeColor}`}>
                  {item.badge}
                </span>
              </div>

              <div className="relative z-10 space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex items-center justify-between">
                  <span>{item.title}</span>
                  <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">↗</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

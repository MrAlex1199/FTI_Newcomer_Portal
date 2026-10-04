import useLanguage from '../../hooks/useLanguage.js';

export default function MilestoneTabs({
  sections = ['first_day', 'first_week', 'before_leaving'],
  activeSection = 'first_day',
  onSelectSection,
  phaseStats = {},
}) {
  const { t, currentLanguage } = useLanguage();

  const phaseConfig = {
    first_day: {
      icon: '🚀',
      stepNum: 1,
      labelTh: 'วันแรก',
      labelEn: 'First Day',
      subtitleTh: 'ปฐมนิเทศ & รับอุปกรณ์',
      subtitleEn: 'Welcome & Basic Setup',
      color: 'from-blue-600 to-cyan-500',
    },
    first_week: {
      icon: '📅',
      stepNum: 2,
      labelTh: 'สัปดาห์แรก',
      labelEn: 'First Week',
      subtitleTh: 'ทีมงาน & ระบบปฏิบัติงาน',
      subtitleEn: 'Team & Internal Systems',
      color: 'from-indigo-600 to-primary-500',
    },
    before_leaving: {
      icon: '🏁',
      stepNum: 3,
      labelTh: 'ก่อนจบงาน / ส่งมอบ',
      labelEn: 'Before Leaving',
      subtitleTh: 'ส่งมอบงาน & คืนอุปกรณ์',
      subtitleEn: 'Handover & Offboarding',
      color: 'from-amber-600 to-orange-500',
    },
  };

  return (
    <div className="relative mb-6">
      {/* Background connector line for desktop */}
      <div className="hidden md:block absolute top-1/2 left-8 right-8 h-0.5 -translate-y-1/2 bg-slate-200 dark:bg-slate-800 -z-0" />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4" role="tablist" aria-label={t('onboardingRoadmap')}>
        {sections.map((sectionKey) => {
          const cfg = phaseConfig[sectionKey] || {
            icon: '📌',
            stepNum: 0,
            labelTh: sectionKey,
            labelEn: sectionKey,
            subtitleTh: '',
            subtitleEn: '',
            color: 'from-slate-600 to-slate-500',
          };

          const isActive = activeSection === sectionKey;
          const stats = phaseStats[sectionKey] || { completed: 0, total: 0, isAllDone: false };
          const title = currentLanguage === 'th' ? cfg.labelTh : cfg.labelEn;
          const subtitle = currentLanguage === 'th' ? cfg.subtitleTh : cfg.subtitleEn;

          return (
            <button
              key={sectionKey}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectSection(sectionKey)}
              className={`group relative flex items-center justify-between gap-3 rounded-2xl p-4 text-left transition-all duration-200 border ${
                isActive
                  ? 'border-primary-500/80 bg-white dark:bg-slate-800 shadow-md ring-2 ring-primary-100 dark:ring-primary-900/30 -translate-y-0.5'
                  : 'border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3.5">
                {/* Step badge / Icon */}
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg transition-transform duration-200 group-hover:scale-105 ${
                    isActive
                      ? `bg-gradient-to-br ${cfg.color} text-white shadow-xs`
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {stats.isAllDone ? '✓' : cfg.icon}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Step 0{cfg.stepNum}
                    </span>
                    {stats.isAllDone && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        100%
                      </span>
                    )}
                  </div>
                  <h3
                    className={`text-sm sm:text-base font-bold transition-colors ${
                      isActive
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400'
                    }`}
                  >
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress counter badge */}
              <div className="shrink-0 text-right">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                    stats.isAllDone
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                      : isActive
                      ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/60 dark:text-primary-200'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {stats.completed}/{stats.total}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

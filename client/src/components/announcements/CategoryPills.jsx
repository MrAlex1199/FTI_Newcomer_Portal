import useLanguage from '../../hooks/useLanguage.js';

const CATEGORY_META = {
  all: { icon: '🌐', activeColor: 'bg-primary-600 text-white shadow-xs' },
  urgent: { icon: '🚨', activeColor: 'bg-rose-600 text-white shadow-xs' },
  news: { icon: '📰', activeColor: 'bg-blue-600 text-white shadow-xs' },
  event: { icon: '📅', activeColor: 'bg-violet-600 text-white shadow-xs' },
  training: { icon: '🎓', activeColor: 'bg-amber-600 text-white shadow-xs' },
  holiday: { icon: '🌴', activeColor: 'bg-emerald-600 text-white shadow-xs' },
  maintenance: { icon: '🛠️', activeColor: 'bg-slate-700 text-white shadow-xs' },
  welcome: { icon: '👋', activeColor: 'bg-teal-600 text-white shadow-xs' },
};

export default function CategoryPills({
  categories = [],
  activeCategory = '',
  onSelectCategory,
}) {
  const { t, label } = useLanguage();

  const allItems = ['all', ...categories];

  return (
    <div
      role="tablist"
      aria-label={t('allAnnouncementCategories')}
      className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth"
    >
      {allItems.map((catKey) => {
        const isAll = catKey === 'all';
        const isActive = isAll ? activeCategory === '' : activeCategory === catKey;
        const meta = CATEGORY_META[catKey] || {
          icon: '🏷️',
          activeColor: 'bg-primary-600 text-white shadow-xs',
        };
        const title = isAll ? t('allCategories') : label(catKey);

        return (
          <button
            key={catKey}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectCategory(isAll ? '' : catKey)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
              isActive
                ? meta.activeColor
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-2xs'
            }`}
          >
            <span>{meta.icon}</span>
            <span>{title}</span>
          </button>
        );
      })}
    </div>
  );
}

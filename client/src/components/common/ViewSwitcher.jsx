import useLanguage from '../../hooks/useLanguage.js';

export default function ViewSwitcher({ viewMode = 'grid', onViewChange }) {
  const { t } = useLanguage();

  return (
    <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80 shadow-2xs">
      <button
        type="button"
        onClick={() => onViewChange('grid')}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
          viewMode === 'grid'
            ? 'bg-white text-primary-700 shadow-xs ring-1 ring-slate-200/80'
            : 'text-slate-500 hover:text-slate-800'
        }`}
        title={t('viewGrid') || 'มุมมองการ์ด'}
      >
        <span className="text-sm">⊞</span>
        <span>{t('viewCard') || 'การ์ด'}</span>
      </button>

      <button
        type="button"
        onClick={() => onViewChange('table')}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
          viewMode === 'table'
            ? 'bg-white text-primary-700 shadow-xs ring-1 ring-slate-200/80'
            : 'text-slate-500 hover:text-slate-800'
        }`}
        title={t('viewTable') || 'มุมมองตาราง'}
      >
        <span className="text-sm">☰</span>
        <span>{t('viewTable') || 'ตาราง'}</span>
      </button>
    </div>
  );
}

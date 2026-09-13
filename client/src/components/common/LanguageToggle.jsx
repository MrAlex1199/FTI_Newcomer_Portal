import useLanguage from '../../hooks/useLanguage.js';

export default function LanguageToggle({ variant = 'default' }) {
  const { language, setLanguage, t } = useLanguage();

  if (variant === 'header') {
    return (
      <div
        className="inline-flex items-center rounded-xl bg-primary-950/60 p-0.5 border border-primary-700/60 text-xs font-semibold shadow-inner"
        role="group"
        aria-label={t('language')}
      >
        <button
          type="button"
          onClick={() => setLanguage('th')}
          className={`rounded-lg px-2 py-1 transition-all ${
            language === 'th'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-primary-300 hover:text-white'
          }`}
          aria-pressed={language === 'th'}
        >
          TH
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`rounded-lg px-2 py-1 transition-all ${
            language === 'en'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-primary-300 hover:text-white'
          }`}
          aria-pressed={language === 'en'}
        >
          EN
        </button>
      </div>
    );
  }

  return (
    <label className="flex items-center gap-2 text-sm text-gray-600" title={t('language')}>
      <span className="sr-only">{t('language')}</span>
      <select
        aria-label={t('language')}
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
      >
        <option value="th">{t('thai')}</option>
        <option value="en">{t('english')}</option>
      </select>
    </label>
  );
}

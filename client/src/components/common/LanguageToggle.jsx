import useLanguage from '../../hooks/useLanguage.js';

export default function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();
  return <label className="flex items-center gap-2 text-sm text-gray-600" title={t('language')}><span className="sr-only">{t('language')}</span><select aria-label={t('language')} value={language} onChange={(event) => setLanguage(event.target.value)} className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"><option value="th">{t('thai')}</option><option value="en">{t('english')}</option></select></label>;
}

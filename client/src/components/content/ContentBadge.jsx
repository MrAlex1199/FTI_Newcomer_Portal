import useLanguage from '../../hooks/useLanguage.js';

export default function ContentBadge({ value, tone }) {
  const { t } = useLanguage();
  const tones = { published: 'bg-green-100 text-green-700', draft: 'bg-amber-100 text-amber-700', archived: 'bg-gray-100 text-gray-600', true: 'bg-green-100 text-green-700', false: 'bg-amber-100 text-amber-700' };
  const label = value === true ? t('published') : value === false ? t('draft') : t(value);
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone || String(value)] || 'bg-blue-100 text-blue-700'}`}>{label}</span>;
}

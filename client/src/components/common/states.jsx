import useLanguage from '../../hooks/useLanguage.js';

export function LoadingState({ label }) {
  const { t } = useLanguage();
  return <div className="flex items-center justify-center gap-3 py-12 text-gray-500"><span className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />{label || t('loading')}</div>;
}

export function EmptyState({ title, message, action }) {
  const { t } = useLanguage();
  return <div className="text-center py-12"><p className="text-gray-700 font-medium">{title || t('noData')}</p>{message && <p className="text-gray-500 text-sm mt-1">{message}</p>}{action && <div className="mt-4">{action}</div>}</div>;
}

export function ErrorState({ error, onRetry }) {
  const { t } = useLanguage();
  const message = error?.response?.data?.message || error?.message || t('unableLoad');
  return <div className="text-center py-12"><p className="text-red-600 font-medium">{t('unableLoad')}</p><p className="text-gray-500 text-sm mt-1">{message}</p>{onRetry && <button onClick={onRetry} className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700">{t('tryAgain')}</button>}</div>;
}

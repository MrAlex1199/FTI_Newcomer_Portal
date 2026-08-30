import useLanguage from '../../hooks/useLanguage.js';

export function LoadingState({ label }) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-center gap-3 rounded-lg border border-gray-100 bg-white py-12 text-gray-500" role="status" aria-live="polite">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" aria-hidden="true" />
      <span>{label || t('loading')}</span>
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  const { t } = useLanguage();
  return (
    <div className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-12 text-center" role="status">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400" aria-hidden="true">—</div>
      <p className="mt-3 font-medium text-gray-700">{title || t('noData')}</p>
      {message && <p className="mt-1 text-sm text-gray-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const { t } = useLanguage();
  const message = error?.response?.data?.message || error?.message || t('unableLoad');
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-10 text-center" role="alert">
      <p className="font-medium text-red-700">{t('unableLoad')}</p>
      <p className="mt-1 text-sm text-red-600">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-4 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          {t('tryAgain')}
        </button>
      )}
    </div>
  );
}

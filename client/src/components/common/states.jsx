import useLanguage from '../../hooks/useLanguage.js';

export function LoadingState({ label }) {
  const { t } = useLanguage();
  return (
    <div className="flex animate-fade-in items-center justify-center gap-3 rounded-xl border border-gray-100 bg-white py-12 text-gray-500" role="status" aria-live="polite">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" aria-hidden="true" />
      <span>{label || t('loading')}</span>
    </div>
  );
}

export function EmptyState({ title, message, action, emoji = '🗂️' }) {
  const { t } = useLanguage();
  return (
    <div className="animate-fade-up rounded-xl border border-dashed border-gray-300 bg-white px-4 py-12 text-center" role="status">
      <div className="mx-auto flex h-14 w-14 animate-float items-center justify-center rounded-2xl bg-primary-50 text-3xl" aria-hidden="true">
        {emoji}
      </div>
      <p className="mt-4 font-semibold text-gray-700">{title || t('noData')}</p>
      {message && <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, message, onRetry }) {
  const { t } = useLanguage();
  const detail = message || error?.response?.data?.message || error?.message || t('unableLoad');
  return (
    <div className="animate-fade-up rounded-xl border border-red-200 bg-red-50 px-4 py-10 text-center" role="alert">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-3xl" aria-hidden="true">
        😕
      </div>
      <p className="mt-4 font-semibold text-red-700">{t('unableLoad')}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-red-600">{detail}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-primary mt-5">
          <span aria-hidden="true">🔄</span>
          {t('tryAgain')}
        </button>
      )}
    </div>
  );
}

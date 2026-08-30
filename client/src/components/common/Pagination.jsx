import useLanguage from '../../hooks/useLanguage.js';

/**
 * Compact pager. Shows prev/next plus the current page range. Buttons disable
 * at the boundaries and while a fetch is in flight (`disabled`).
 */
export default function Pagination({ page, totalPages, total, limit, onPageChange, disabled }) {
  const { t } = useLanguage();

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <p className="text-gray-500">
        {t('showing', { from, to, total })}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          className="px-3 py-1.5 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
        >
          {t('previous')}
        </button>
        <span className="text-gray-600">
          {t('page', { page })} {t('of')} {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
          className="px-3 py-1.5 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
        >
          {t('next')}
        </button>
      </div>
    </div>
  );
}

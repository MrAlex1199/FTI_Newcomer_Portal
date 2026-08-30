/**
 * Compact pager. Shows prev/next plus the current page range. Buttons disable
 * at the boundaries and while a fetch is in flight (`disabled`).
 */
export default function Pagination({ page, totalPages, total, limit, onPageChange, disabled }) {
  if (!totalPages || totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <p className="text-gray-500">
        Showing {from}-{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          className="px-3 py-1.5 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
        >
          Previous
        </button>
        <span className="text-gray-600">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
          className="px-3 py-1.5 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

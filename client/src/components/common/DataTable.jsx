import { LoadingState, EmptyState, ErrorState } from './states.jsx';

/**
 * Generic table driven by a `columns` config, so feature pages don't hand-roll
 * <table> markup each time (spec Rule 9: reusable components).
 *
 * columns: [{ key, header, render?, className? }]
 *   - render(row) overrides the default `row[key]` cell content.
 * Handles its own loading / empty / error states internally so a caller just
 * passes the query result.
 */
export default function DataTable({
  columns,
  rows,
  loading,
  error,
  onRetry,
  emptyTitle,
  emptyMessage,
  emptyAction,
  rowKey = (row) => row._id,
}) {
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (!rows || rows.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} action={emptyAction} />;
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 text-sm text-gray-700 ${col.className || ''}`}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

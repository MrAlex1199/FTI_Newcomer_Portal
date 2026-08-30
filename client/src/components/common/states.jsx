/**
 * Standard loading / empty / error state blocks used across list and detail
 * pages, so every screen handles these states consistently (spec section 47:
 * "ห้ามปล่อยหน้าขาวเมื่อ API error" - never leave a blank screen on error).
 */

export function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-gray-500">
      <span className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', message, action }) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-700 font-medium">{title}</p>
      {message && <p className="text-gray-500 text-sm mt-1">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const message =
    error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.';
  return (
    <div className="text-center py-12">
      <p className="text-red-600 font-medium">Unable to load data</p>
      <p className="text-gray-500 text-sm mt-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}

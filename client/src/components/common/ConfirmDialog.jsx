import Modal from './Modal.jsx';

/**
 * Confirmation modal for destructive actions (e.g. delete). `loading` disables
 * the buttons while the action is in flight so it can't be double-fired.
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  loading = false,
  danger = true,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      {message && <p className="text-gray-600">{message}</p>}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 text-sm rounded-md text-white font-medium disabled:opacity-50 ${
            danger ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'
          }`}
        >
          {loading ? 'Working...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

import Modal from './Modal.jsx';
import useLanguage from '../../hooks/useLanguage.js';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel, loading = false, danger = true }) {
  const { t } = useLanguage();
  return <Modal open={open} onClose={onClose} title={title || t('confirm')} size="sm"><>{message && <p className="text-gray-600">{message}</p>}<div className="flex justify-end gap-3 mt-6"><button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50">{t('cancel')}</button><button onClick={onConfirm} disabled={loading} className={`px-4 py-2 text-sm rounded-md text-white font-medium disabled:opacity-50 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'}`}>{loading ? t('working') : (confirmLabel || t('confirm'))}</button></div></></Modal>;
}

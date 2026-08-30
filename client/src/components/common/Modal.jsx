import { useEffect } from 'react';
import useLanguage from '../../hooks/useLanguage.js';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  const { t } = useLanguage();
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}><div className={`w-full ${sizes[size]} bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto`} onClick={(event) => event.stopPropagation()}>{title && <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-800">{title}</h2><button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none" aria-label={t('closeModal')}>×</button></div>}<div className="px-6 py-4">{children}</div></div></div>;
}

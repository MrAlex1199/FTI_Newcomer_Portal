import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4500);
  }, []);
  const dismiss = useCallback((id) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);
  const value = useMemo(() => ({ showToast, dismiss }), [showToast, dismiss]);

  return <ToastContext.Provider value={value}>{children}<div className="pointer-events-none fixed bottom-20 left-4 z-[60] flex max-w-sm flex-col gap-2 sm:left-auto sm:right-4" aria-live="polite" aria-atomic="true">{toasts.map((toast) => <div key={toast.id} className={`pointer-events-auto flex items-start gap-3 rounded-lg border bg-white px-4 py-3 text-sm shadow-lg ${toast.type === 'error' ? 'border-red-200 text-red-700' : 'border-green-200 text-green-700'}`} role={toast.type === 'error' ? 'alert' : 'status'}><span className="flex-1">{toast.message}</span><button type="button" onClick={() => dismiss(toast.id)} className="font-semibold text-gray-400 hover:text-gray-700" aria-label="Dismiss notification">×</button></div>)}</div></ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within <ToastProvider>');
  return context;
}

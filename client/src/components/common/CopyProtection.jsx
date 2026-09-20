import { useEffect, useState, useRef, useCallback } from 'react';
import useAuth from '../../hooks/useAuth.js';
import useLanguage from '../../hooks/useLanguage.js';

function isInteractiveElement(target) {
  if (!target || !(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

export default function CopyProtection() {
  const { hasRole } = useAuth();
  const { t } = useLanguage();
  const [toastVisible, setToastVisible] = useState(false);
  const lastToastTimeRef = useRef(0);
  const hideTimerRef = useRef(null);

  const isAdmin = hasRole('super_admin') || hasRole('admin');

  const triggerToast = useCallback(() => {
    const now = Date.now();
    // Cooldown 2 seconds to avoid spamming
    if (now - lastToastTimeRef.current < 2000) {
      return;
    }
    lastToastTimeRef.current = now;

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    setToastVisible(true);
    hideTimerRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 3200);
  }, []);

  useEffect(() => {
    // If user is Admin or Super Admin, bypass all protection
    if (isAdmin) {
      document.body.classList.remove('copy-protected');
      return;
    }

    // Apply anti-selection class to body for non-admins
    document.body.classList.add('copy-protected');

    // 1. Prevent Right-Click Context Menu on content
    const handleContextMenu = (e) => {
      if (!isInteractiveElement(e.target)) {
        e.preventDefault();
        triggerToast();
      }
    };

    // 2. Prevent Copy Event
    const handleCopy = (e) => {
      if (!isInteractiveElement(e.target)) {
        e.preventDefault();
        triggerToast();
      }
    };

    // 3. Prevent Cut Event
    const handleCut = (e) => {
      if (!isInteractiveElement(e.target)) {
        e.preventDefault();
        triggerToast();
      }
    };

    // 4. Prevent Keyboard Shortcuts (Ctrl+C, Cmd+C, Ctrl+X, Cmd+X, Ctrl+A outside inputs)
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'c' || key === 'x') {
          if (!isInteractiveElement(e.target)) {
            e.preventDefault();
            triggerToast();
          }
        } else if (key === 'a') {
          if (!isInteractiveElement(e.target)) {
            e.preventDefault();
          }
        }
      }
    };

    // 5. Prevent Drag Selection on content
    const handleSelectStart = (e) => {
      if (!isInteractiveElement(e.target)) {
        e.preventDefault();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('copy', handleCopy, { capture: true });
    window.addEventListener('cut', handleCut, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('selectstart', handleSelectStart, { capture: true });

    return () => {
      document.body.classList.remove('copy-protected');
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('copy', handleCopy, { capture: true });
      window.removeEventListener('cut', handleCut, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('selectstart', handleSelectStart, { capture: true });
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [isAdmin, triggerToast]);

  if (!toastVisible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[9999] max-w-md animate-slide-up transition-all duration-300 pointer-events-auto"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-slate-900/95 px-4 py-3.5 text-sm font-medium text-white shadow-2xl backdrop-blur-md">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-lg text-amber-400 shadow-inner">
          🔒
        </span>
        <p className="flex-1 text-xs sm:text-sm leading-snug text-slate-100 font-medium">
          {t('copyProtectedToast')}
        </p>
        <button
          type="button"
          onClick={() => setToastVisible(false)}
          className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

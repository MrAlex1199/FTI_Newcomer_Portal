import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import AppShell from '../components/layout/AppShell.jsx';
import useLanguage from '../hooks/useLanguage.js';
import useAuth from '../hooks/useAuth.js';
import { useToast } from '../hooks/ToastContext.jsx';
import {
  useVaultStatus,
  useVaultItems,
  useVerifyVaultPin,
} from '../hooks/useVault.js';

import VaultPinSetupModal from '../components/vault/VaultPinSetupModal.jsx';
import VaultItemModal from '../components/vault/VaultItemModal.jsx';
import PasswordGeneratorModal from '../components/vault/PasswordGeneratorModal.jsx';
import VaultItemCard from '../components/vault/VaultItemCard.jsx';

export default function PersonalVault() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Master Session State (PIN stored in volatile memory only while unlocked)
  const [pin, setPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Keypad / PIN unlock state
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Auto-lock countdown (in seconds)
  const [secondsLeft, setSecondsLeft] = useState(600);
  const timerRef = useRef(null);

  // Filters & Search
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'login' | 'note' | 'card' | 'key' | 'favorites'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [isChangePinMode, setIsChangePinMode] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [initialCategory, setInitialCategory] = useState('login');
  const [passGenModalOpen, setPassGenModalOpen] = useState(false);

  // Server Status
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useVaultStatus();
  const verifyPinMut = useVerifyVaultPin();

  // Items query (PIN sent via authorization header for decryption)
  const queryParams = useMemo(() => {
    const p = {};
    if (activeTab !== 'all' && activeTab !== 'favorites') {
      p.category = activeTab;
    }
    if (activeTab === 'favorites') {
      p.favorite = 'true';
    }
    if (searchQuery.trim()) {
      p.search = searchQuery.trim();
    }
    return p;
  }, [activeTab, searchQuery]);

  const {
    data: items = [],
    isLoading: itemsLoading,
    refetch: refetchItems,
  } = useVaultItems(queryParams, isUnlocked ? pin : '');

  // Reset auto-lock timer
  const resetTimer = useCallback(() => {
    const mins = status?.autoLockMinutes || 10;
    setSecondsLeft(mins * 60);
  }, [status?.autoLockMinutes]);

  // Lock Vault handler
  const lockVault = useCallback(() => {
    setIsUnlocked(false);
    setPin('');
    setPinInput('');
    setPinError('');
    if (timerRef.current) clearInterval(timerRef.current);
    showToast('ล็อกตู้นิรภัยเรียบร้อยแล้ว', 'info');
  }, [showToast]);

  // Auto-lock timer effect
  useEffect(() => {
    if (!isUnlocked) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    resetTimer();

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsUnlocked(false);
          setPin('');
          setPinInput('');
          showToast('ตู้นิรภัยถูกล็อกอัตโนมัติเนื่องจากหมดเวลา', 'info');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Listen to user interaction to reset timer
    const handleActivity = () => resetTimer();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [isUnlocked, resetTimer, showToast]);

  // Auto-submit PIN once 6 digits are typed
  const handleVerifyPin = useCallback(
    async (candidatePin) => {
      if (!candidatePin || candidatePin.length !== 6 || isSubmittingPin) return;
      setIsSubmittingPin(true);
      setPinError('');

      try {
        await verifyPinMut.mutateAsync(candidatePin);
        setPin(candidatePin);
        setIsUnlocked(true);
        setPinInput('');
        setPinError('');
        showToast('ปลดล็อกตู้นิรภัยสำเร็จ', 'success');
      } catch (err) {
        setPinError(err?.response?.data?.message || 'รหัส Master PIN ไม่ถูกต้อง');
        setPinInput('');
      } finally {
        setIsSubmittingPin(false);
      }
    },
    [isSubmittingPin, verifyPinMut, showToast]
  );

  // Keypad click handlers
  const handleDigitPress = (digit) => {
    if (pinInput.length < 6) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      if (nextPin.length === 6) {
        handleVerifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setPinError('');
  };

  const handleClear = () => {
    setPinInput('');
    setPinError('');
  };

  // Keyboard support for PIN entry
  useEffect(() => {
    if (isUnlocked || !status?.isConfigured) return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUnlocked, status?.isConfigured, pinInput]);

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = items.length;
    const logins = items.filter((i) => i.category === 'login').length;
    const notes = items.filter((i) => i.category === 'note').length;
    const cards = items.filter((i) => i.category === 'card').length;
    const keys = items.filter((i) => i.category === 'key').length;
    const favorites = items.filter((i) => i.favorite).length;
    return { total, logins, notes, cards, keys, favorites };
  }, [items]);

  // Open item modal for creation
  const handleOpenCreateModal = (cat = 'login') => {
    setItemToEdit(null);
    setInitialCategory(cat);
    setItemModalOpen(true);
  };

  // Open item modal for editing
  const handleOpenEditModal = (item) => {
    setItemToEdit(item);
    setInitialCategory(item.category);
    setItemModalOpen(true);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <span>หน้าแรก</span>
              <span>/</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">ตู้นิรภัยส่วนตัว</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-blue-500/20">
                🔒
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  ตู้นิรภัยส่วนตัว (Personal Vault)
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ระบบจัดเก็บรหัสผ่านและข้อมูลความลับ เข้ารหัสแบบ Zero-Knowledge (AES-256-GCM)
                </p>
              </div>
            </div>
          </div>

          {/* Quick Security Status Badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              AES-256 End-to-End Encrypted
            </span>
          </div>
        </div>

        {/* STATE 1: Loading Status */}
        {statusLoading && (
          <div className="py-24 text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-medium text-slate-500">กำลังตรวจสอบระบบรักษาความปลอดภัย...</p>
          </div>
        )}

        {/* STATE 2: Vault Not Configured Yet */}
        {!statusLoading && !status?.isConfigured && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-sm text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">
              🛡️
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              ตั้งค่าตู้นิรภัยส่วนตัวของคุณ
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              ปกป้องข้อมูลสำคัญ รหัสผ่านระบบภายใน โน้ตลับ และคีย์ความปลอดภัยของคุณด้วยระบบเข้ารหัส
              <strong className="text-blue-600 dark:text-blue-400 mx-1">Zero-Knowledge AES-256-GCM</strong>
              ที่จะไม่มีใครสามารถเข้าถึงข้อมูลของคุณได้ แม้แต่ผู้ดูแลระบบ หากไม่มี Master PIN 6 หลักของคุณ
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-8">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-xl mb-1 block">🔐</span>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">เข้ารหัสขั้นสูงสุด</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">AES-256-GCM พร้อม Salt และ Scrypt เฉพาะบุคคล</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-xl mb-1 block">⏱️</span>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">ล็อกอัตโนมัติ</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">ระบบจะล็อกทันทีเมื่อไม่มีการใช้งานตามเวลาที่ตั้งไว้</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-xl mb-1 block">🔑</span>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">สร้างรหัสผ่านแกร่ง</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">เครื่องมือสุ่มสร้างรหัสผ่านที่มีความปลอดภัยสูง</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsChangePinMode(false);
                setSetupModalOpen(true);
              }}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-95 transition"
            >
              🔒 ตั้งค่ารหัส Master PIN 6 หลักเพื่อเริ่มต้น
            </button>
          </div>
        )}

        {/* STATE 3: Vault Configured, but Currently LOCKED */}
        {!statusLoading && status?.isConfigured && !isUnlocked && (
          <div className="max-w-md mx-auto">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl text-center">
              {/* Padlock graphic with glowing ring */}
              <div className="relative w-20 h-20 mx-auto mb-5">
                <div className="absolute inset-0 rounded-3xl bg-blue-500/20 blur-xl animate-pulse" />
                <div className="relative w-full h-full rounded-3xl bg-gradient-to-tr from-slate-900 to-slate-800 dark:from-blue-950 dark:to-slate-900 text-white flex items-center justify-center text-3xl shadow-lg border border-slate-700">
                  🔐
                </div>
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                ปลดล็อกตู้นิรภัยส่วนตัว
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                กรุณากรอกรหัส Master PIN 6 หลักเพื่อถอดรหัสข้อมูล
              </p>

              {/* Lockout Notice if applicable */}
              {status?.isLocked && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400">
                  ⚠️ ระบบถูกระงับชั่วคราวเนื่องจากใส่รหัสผิดเกิน 5 ครั้ง กรุณารอสักครู่
                </div>
              )}

              {/* PIN Dots Indicator */}
              <div className="flex justify-center items-center gap-3.5 my-6">
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const isFilled = index < pinInput.length;
                  return (
                    <div
                      key={index}
                      className={`w-4 h-4 rounded-full transition-all duration-200 ${
                        isFilled
                          ? 'bg-blue-600 scale-125 shadow-md shadow-blue-500/50'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Error message */}
              {pinError && (
                <div className="text-xs font-medium text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 py-2 px-3 rounded-lg mb-4 animate-shake">
                  {pinError}
                </div>
              )}

              {/* Numeric Keypad */}
              <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={isSubmittingPin || status?.isLocked}
                    onClick={() => handleDigitPress(String(num))}
                    className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 text-lg font-bold text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 active:scale-95 transition shadow-sm"
                  >
                    {num}
                  </button>
                ))}

                {/* Clear button */}
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isSubmittingPin || status?.isLocked}
                  className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-xs font-semibold text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700 active:scale-95 transition shadow-sm"
                >
                  ล้าง
                </button>

                {/* Digit 0 */}
                <button
                  type="button"
                  disabled={isSubmittingPin || status?.isLocked}
                  onClick={() => handleDigitPress('0')}
                  className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 text-lg font-bold text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 active:scale-95 transition shadow-sm"
                >
                  0
                </button>

                {/* Backspace button */}
                <button
                  type="button"
                  onClick={handleBackspace}
                  disabled={isSubmittingPin || status?.isLocked}
                  className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 active:scale-95 transition shadow-sm flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414-6.414a2 2 0 011.414-.586H19a2 2 0 012 2v10a2 2 0 01-2 2h-7.172a2 2 0 01-1.414-.586L3 12z"
                    />
                  </svg>
                </button>
              </div>

              {/* Submitting indicator */}
              {isSubmittingPin && (
                <div className="flex items-center justify-center gap-2 text-xs text-blue-600 font-medium mb-3">
                  <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  กำลังถอดรหัสข้อมูล...
                </div>
              )}

              {/* PIN Hint */}
              {status?.pinHint && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  {showHint ? (
                    <div className="text-slate-600 dark:text-slate-400 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                      💡 คำใบ้รหัส PIN: <strong>{status.pinHint}</strong>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowHint(true)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    >
                      💡 ดูคำใบ้รหัส PIN
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STATE 4: UNLOCKED Vault */}
        {!statusLoading && status?.isConfigured && isUnlocked && (
          <div className="space-y-6">
            {/* Active Security Banner & Auto-Lock Status */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-blue-800/40">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl border border-white/10">
                  🔓
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">ตู้นิรภัยเปิดใช้งานอยู่</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950">
                      UNLOCKED
                    </span>
                  </div>
                  <p className="text-xs text-blue-200/80">
                    ข้อมูลทั้งหมดถูกถอดรหัสในหน่วยความจำชั่วคราวอย่างปลอดภัย
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Auto-lock countdown chip */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm text-xs font-mono text-blue-200 border border-white/10">
                  <span>⏳ ล็อกอัตโนมัติใน:</span>
                  <span className="font-bold text-white">{formatTime(secondsLeft)}</span>
                </div>

                {/* Quick Tools */}
                <button
                  type="button"
                  onClick={() => setPassGenModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition flex items-center gap-1.5 border border-white/10"
                >
                  <span>🎲</span>
                  <span>สร้างรหัสผ่าน</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsChangePinMode(true);
                    setSetupModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition flex items-center gap-1.5 border border-white/10"
                >
                  <span>⚙️</span>
                  <span>เปลี่ยน PIN</span>
                </button>

                {/* Instant Lock Button */}
                <button
                  type="button"
                  onClick={lockVault}
                  className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition flex items-center gap-1.5 shadow-md shadow-red-900/30"
                >
                  <span>🔒</span>
                  <span>ล็อกทันที</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { id: 'all', label: 'ทั้งหมด', count: stats.total, icon: '📦', color: 'from-blue-500/10 to-indigo-500/10 text-blue-600' },
                { id: 'login', label: 'รหัสผ่าน', count: stats.logins, icon: '🔑', color: 'from-sky-500/10 to-blue-500/10 text-sky-600' },
                { id: 'note', label: 'โน้ตลับ', count: stats.notes, icon: '📝', color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600' },
                { id: 'card', label: 'บัตร/ตัวตน', count: stats.cards, icon: '💳', color: 'from-purple-500/10 to-pink-500/10 text-purple-600' },
                { id: 'key', label: 'API & คีย์', count: stats.keys, icon: '⚙️', color: 'from-amber-500/10 to-orange-500/10 text-amber-600' },
                { id: 'favorites', label: 'รายการโปรด', count: stats.favorites, icon: '⭐', color: 'from-rose-500/10 to-amber-500/10 text-amber-500' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveTab(m.id)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    activeTab === m.id
                      ? 'bg-white dark:bg-slate-900 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-white/70 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base">{m.icon}</span>
                    <span className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono">
                      {m.count}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block truncate">
                    {m.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Controls: Search, Tabs, Add Button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อ, บัญชี, เว็บไซต์ หรือป้ายกำกับ..."
                  className="w-full pl-10 pr-9 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Add Item Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenCreateModal(activeTab !== 'all' && activeTab !== 'favorites' ? activeTab : 'login')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>เพิ่มข้อมูลความลับ</span>
                </button>
              </div>
            </div>

            {/* Vault Items List / Grid */}
            {itemsLoading ? (
              <div className="py-20 text-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500">กำลังโหลดและถอดรหัสข้อมูลความลับ...</p>
              </div>
            ) : items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((item) => (
                  <VaultItemCard
                    key={item._id}
                    item={item}
                    pin={pin}
                    onEdit={handleOpenEditModal}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-3xl mx-auto mb-4">
                  📂
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                  ไม่พบรายการในตู้นิรภัย
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
                  {searchQuery
                    ? `ไม่พบข้อมูลที่ตรงกับ "${searchQuery}" ลองเปลี่ยนคำค้นหา`
                    : 'ยังไม่มีข้อมูลความลับในหมวดหมู่นี้ คุณสามารถเพิ่มรหัสผ่าน โน้ต หรือบัตรได้ทันที'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenCreateModal('login')}
                    className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 transition"
                  >
                    🔑 เพิ่มรหัสผ่าน
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenCreateModal('note')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 transition"
                  >
                    📝 เพิ่มโน้ตลับ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenCreateModal('card')}
                    className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-semibold hover:bg-purple-100 transition"
                  >
                    💳 เพิ่มบัตร/ตัวตน
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenCreateModal('key')}
                    className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-semibold hover:bg-amber-100 transition"
                  >
                    ⚙️ เพิ่ม API Key
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODALS */}
      {/* 1. Setup / Change Master PIN Modal */}
      <VaultPinSetupModal
        open={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        isChangeMode={isChangePinMode}
        onSuccess={(newPinCreated) => {
          setSetupModalOpen(false);
          refetchStatus();
          if (newPinCreated) {
            setPin(newPinCreated);
            setIsUnlocked(true);
          }
        }}
      />

      {/* 2. Add / Edit Vault Item Modal */}
      <VaultItemModal
        open={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        pin={pin}
        itemToEdit={itemToEdit}
        initialCategory={initialCategory}
      />

      {/* 3. Standalone Password Generator Modal */}
      <PasswordGeneratorModal
        open={passGenModalOpen}
        onClose={() => setPassGenModalOpen(false)}
      />
    </AppShell>
  );
}

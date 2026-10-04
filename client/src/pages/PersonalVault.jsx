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
        {/* Top Header & Breadcrumb (UI/UX Promax high-contrast) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1.5 font-medium">
              <span>หน้าแรก</span>
              <span>/</span>
              <span className="text-slate-800 font-bold">ตู้นิรภัยส่วนตัว</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white flex items-center justify-center text-xl shadow-md shadow-blue-500/25 border border-blue-500/40">
                🔒
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  ตู้นิรภัยส่วนตัว (Personal Vault)
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  ระบบจัดเก็บรหัสผ่านและข้อมูลความลับ เข้ารหัสแบบ Zero-Knowledge (AES-256-GCM)
                </p>
              </div>
            </div>
          </div>

          {/* Quick Security Status Badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              AES-256 End-to-End Encrypted
            </span>
          </div>
        </div>

        {/* STATE 1: Loading Status */}
        {statusLoading && (
          <div className="py-24 text-center bg-white rounded-3xl border border-slate-200/90 shadow-xs">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-600">กำลังตรวจสอบระบบรักษาความปลอดภัย...</p>
          </div>
        )}

        {/* STATE 2: Vault Not Configured Yet (Crisp Promax White Card) */}
        {!statusLoading && !status?.isConfigured && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-md text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center text-4xl mx-auto mb-6 shadow-xs border border-blue-100">
              🛡️
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
              ตั้งค่าตู้นิรภัยส่วนตัวของคุณ
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-8 max-w-lg mx-auto">
              ปกป้องข้อมูลสำคัญ รหัสผ่านระบบภายใน โน้ตลับ และคีย์ความปลอดภัยของคุณด้วยระบบเข้ารหัส
              <strong className="text-blue-700 font-semibold mx-1">Zero-Knowledge AES-256-GCM</strong>
              ที่จะไม่มีใครสามารถเข้าถึงข้อมูลของคุณได้ แม้แต่ผู้ดูแลระบบ หากไม่มี Master PIN 6 หลักของคุณ
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-8">
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-blue-300 hover:bg-white transition-all shadow-xs">
                <span className="text-2xl mb-1.5 block">🔐</span>
                <h4 className="text-xs font-bold text-slate-900">เข้ารหัสขั้นสูงสุด</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">AES-256-GCM พร้อม Salt และ Scrypt เฉพาะบุคคล</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-blue-300 hover:bg-white transition-all shadow-xs">
                <span className="text-2xl mb-1.5 block">⏱️</span>
                <h4 className="text-xs font-bold text-slate-900">ล็อกอัตโนมัติ</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">ระบบจะล็อกทันทีเมื่อไม่มีการใช้งานตามเวลาที่ตั้งไว้</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-blue-300 hover:bg-white transition-all shadow-xs">
                <span className="text-2xl mb-1.5 block">🔑</span>
                <h4 className="text-xs font-bold text-slate-900">สร้างรหัสผ่านแกร่ง</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">เครื่องมือสุ่มสร้างรหัสผ่านที่มีความปลอดภัยสูง</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsChangePinMode(false);
                setSetupModalOpen(true);
              }}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 active:scale-95 transition"
            >
              🔒 ตั้งค่ารหัส Master PIN 6 หลักเพื่อเริ่มต้น
            </button>
          </div>
        )}

        {/* STATE 3: Vault Configured, but Currently LOCKED (Tactile White Keypad Card) */}
        {!statusLoading && status?.isConfigured && !isUnlocked && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xl text-center">
              {/* Padlock graphic with glowing ring */}
              <div className="relative w-20 h-20 mx-auto mb-5">
                <div className="absolute inset-0 rounded-3xl bg-blue-500/20 blur-xl animate-pulse" />
                <div className="relative w-full h-full rounded-3xl bg-gradient-to-tr from-slate-900 to-blue-900 text-white flex items-center justify-center text-3xl shadow-lg border border-slate-800">
                  🔐
                </div>
              </div>

              <h2 className="text-xl font-black text-slate-900 mb-1 tracking-tight">
                ปลดล็อกตู้นิรภัยส่วนตัว
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                กรุณากรอกรหัส Master PIN 6 หลักเพื่อถอดรหัสข้อมูล
              </p>

              {/* Lockout Notice if applicable */}
              {status?.isLocked && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-600">
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
                          ? 'bg-blue-600 border border-blue-600 scale-125 shadow-md shadow-blue-400'
                          : 'bg-slate-200 border border-slate-300'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Error message */}
              {pinError && (
                <div className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 py-2.5 px-3 rounded-xl mb-4 animate-shake">
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
                    className="h-14 rounded-2xl bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 text-lg font-bold text-slate-900 border border-slate-200/90 active:scale-95 transition shadow-xs"
                  >
                    {num}
                  </button>
                ))}

                {/* Clear button */}
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isSubmittingPin || status?.isLocked}
                  className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-600 border border-slate-200/90 active:scale-95 transition shadow-xs"
                >
                  ล้าง
                </button>

                {/* Digit 0 */}
                <button
                  type="button"
                  disabled={isSubmittingPin || status?.isLocked}
                  onClick={() => handleDigitPress('0')}
                  className="h-14 rounded-2xl bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 text-lg font-bold text-slate-900 border border-slate-200/90 active:scale-95 transition shadow-xs"
                >
                  0
                </button>

                {/* Backspace button */}
                <button
                  type="button"
                  onClick={handleBackspace}
                  disabled={isSubmittingPin || status?.isLocked}
                  className="h-14 rounded-2xl bg-slate-50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 border border-slate-200/90 active:scale-95 transition shadow-xs flex items-center justify-center"
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
                <div className="flex items-center justify-center gap-2 text-xs text-blue-600 font-semibold mb-3">
                  <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  กำลังถอดรหัสข้อมูล...
                </div>
              )}

              {/* PIN Hint */}
              {status?.pinHint && (
                <div className="pt-2 border-t border-slate-100 text-xs">
                  {showHint ? (
                    <div className="text-slate-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      💡 คำใบ้รหัส PIN: <strong>{status.pinHint}</strong>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowHint(true)}
                      className="text-slate-500 hover:text-slate-800 transition font-medium"
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
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-blue-900/60">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl border border-white/15">
                  🔓
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">ตู้นิรภัยเปิดใช้งานอยู่</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 shadow-xs">
                      UNLOCKED
                    </span>
                  </div>
                  <p className="text-xs text-blue-200/90 mt-0.5">
                    ข้อมูลทั้งหมดถูกถอดรหัสในหน่วยความจำชั่วคราวอย่างปลอดภัย (AES-256-GCM)
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Auto-lock countdown chip */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm text-xs font-mono text-blue-100 border border-white/15">
                  <span>⏳ ล็อกอัตโนมัติใน:</span>
                  <span className="font-bold text-white">{formatTime(secondsLeft)}</span>
                </div>

                {/* Quick Tools */}
                <button
                  type="button"
                  onClick={() => setPassGenModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition flex items-center gap-1.5 border border-white/15 active:scale-95"
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
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition flex items-center gap-1.5 border border-white/15 active:scale-95"
                >
                  <span>⚙️</span>
                  <span>เปลี่ยน PIN</span>
                </button>

                {/* Instant Lock Button */}
                <button
                  type="button"
                  onClick={lockVault}
                  className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition flex items-center gap-1.5 shadow-md shadow-red-950/40 active:scale-95"
                >
                  <span>🔒</span>
                  <span>ล็อกทันที</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { id: 'all', label: 'ทั้งหมด', count: stats.total, icon: '📦' },
                { id: 'login', label: 'รหัสผ่าน', count: stats.logins, icon: '🔑' },
                { id: 'note', label: 'โน้ตลับ', count: stats.notes, icon: '📝' },
                { id: 'card', label: 'บัตร/ตัวตน', count: stats.cards, icon: '💳' },
                { id: 'key', label: 'API & คีย์', count: stats.keys, icon: '⚙️' },
                { id: 'favorites', label: 'รายการโปรด', count: stats.favorites, icon: '⭐' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveTab(m.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    activeTab === m.id
                      ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base">{m.icon}</span>
                    <span className="text-lg font-black text-slate-900 font-mono">
                      {m.count}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 block truncate">
                    {m.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Controls: Search, Tabs, Add Button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
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
                  className="w-full pl-10 pr-9 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
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
              <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/90 shadow-xs">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold text-slate-600">กำลังโหลดและถอดรหัสข้อมูลความลับ...</p>
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
              <div className="bg-white rounded-3xl p-12 border border-slate-200/90 text-center shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-3xl mx-auto mb-4">
                  📂
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  ไม่พบรายการในตู้นิรภัย
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 leading-normal">
                  {searchQuery
                    ? `ไม่พบข้อมูลที่ตรงกับ "${searchQuery}" ลองเปลี่ยนคำค้นหา`
                    : 'ยังไม่มีข้อมูลความลับในหมวดหมู่นี้ คุณสามารถเพิ่มรหัสผ่าน โน้ต หรือบัตรได้ทันที'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenCreateModal('login')}
                    className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 border border-blue-200 transition"
                  >
                    🔑 เพิ่มรหัสผ่าน
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenCreateModal('note')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 border border-emerald-200 transition"
                  >
                    📝 เพิ่มโน้ตลับ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenCreateModal('card')}
                    className="px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 border border-purple-200 transition"
                  >
                    💳 เพิ่มบัตร/ตัวตน
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenCreateModal('key')}
                    className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 border border-amber-200 transition"
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

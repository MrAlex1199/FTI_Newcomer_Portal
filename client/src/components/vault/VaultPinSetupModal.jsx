import { useState } from 'react';
import Modal from '../common/Modal.jsx';
import useLanguage from '../../hooks/useLanguage.js';
import { useToast } from '../../hooks/ToastContext.jsx';
import { useSetupVaultPin, useChangeVaultPin } from '../../hooks/useVault.js';

export default function VaultPinSetupModal({
  open,
  onClose,
  isChangeMode = false,
  onSuccess,
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const setupPinMut = useSetupVaultPin();
  const changePinMut = useChangeVaultPin();

  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinHint, setPinHint] = useState('');
  const [autoLockMinutes, setAutoLockMinutes] = useState(10);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isChangeMode && (!oldPin || !/^\d{6}$/.test(oldPin))) {
      setError('กรุณากรอกรหัส PIN ปัจจุบัน 6 หลักให้ถูกต้อง');
      return;
    }

    if (!newPin || !/^\d{6}$/.test(newPin)) {
      setError('รหัส PIN ใหม่ต้องเป็นตัวเลข 6 หลัก (0-9)');
      return;
    }

    if (newPin !== confirmPin) {
      setError('รหัส PIN ใหม่และการยืนยันไม่ตรงกัน');
      return;
    }

    try {
      if (isChangeMode) {
        await changePinMut.mutateAsync({
          oldPin,
          newPin,
          pinHint,
        });
        showToast('เปลี่ยนรหัส PIN และเข้ารหัสข้อมูลใหม่สำเร็จแล้ว', 'success');
      } else {
        await setupPinMut.mutateAsync({
          pin: newPin,
          pinHint,
          autoLockMinutes,
        });
        showToast('ตั้งค่า Master PIN ตู้นิรภัยเรียบร้อยแล้ว!', 'success');
      }

      if (onSuccess) {
        onSuccess(newPin);
      }
      onClose();
    } catch (err) {
      const apiErrors = err?.response?.data?.errors;
      const firstError = apiErrors ? (typeof apiErrors === 'string' ? apiErrors : Object.values(apiErrors)[0]) : null;
      setError(firstError || err?.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกรหัส PIN');
    }
  };

  const isPending = setupPinMut.isPending || changePinMut.isPending;

  return (
    <Modal open={open} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-2xl shadow-2xs">
            🔒
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isChangeMode
                ? 'เปลี่ยนรหัส Master PIN ตู้นิรภัย'
                : 'ตั้งค่า Master PIN ตู้นิรภัยส่วนตัว (6 หลัก)'}
            </h3>
            <p className="text-xs text-slate-500">
              รหัสผ่านหลักสำหรับปลดล็อคและถอดรหัสข้อมูลความลับของคุณ
            </p>
          </div>
        </div>

        {/* Security Warning Notice */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <span>🛡️</span>
            <span>ระบบความปลอดภัย Zero-Knowledge Encryption</span>
          </p>
          <p className="text-[11px] leading-relaxed text-amber-700">
            รหัส PIN นี้ใช้สำหรับสร้างคีย์เข้ารหัส AES-256 ข้อมูลของคุณในระดับ Client
            ระบบไม่เก็บรหัส PIN ตัวจริงบนเซิร์ฟเวอร์ กรุณาจดจำรหัส PIN ของคุณให้ดี
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form Inputs */}
        <div className="space-y-4">
          {isChangeMode && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                รหัส PIN ปัจจุบัน (Current PIN) *
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                required
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="w-full tracking-widest text-center font-mono text-lg rounded-xl border border-slate-300 px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isChangeMode ? 'รหัส PIN ใหม่ (New PIN) *' : 'กำหนดรหัส Master PIN (6 หลัก) *'}
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              required
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className="w-full tracking-widest text-center font-mono text-xl rounded-xl border border-slate-300 px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs"
            />
            <p className="mt-1 text-[11px] text-slate-400 text-center">
              กรอกตัวเลข 6 หลัก (เช่น 123456)
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ยืนยันรหัส PIN อีกครั้ง (Confirm PIN) *
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              required
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className="w-full tracking-widest text-center font-mono text-xl rounded-xl border border-slate-300 px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              คำใบ้รหัส PIN เผื่อลืม (PIN Hint - ไม่บังคับ)
            </label>
            <input
              type="text"
              value={pinHint}
              onChange={(e) => setPinHint(e.target.value)}
              placeholder="e.g. เลขท้ายวันเกิด + รหัสสาขา"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs"
            />
          </div>

          {!isChangeMode && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                เวลาล็อคอัตโนมัติเมื่อไม่ใช้งาน (Auto-Lock)
              </label>
              <select
                value={autoLockMinutes}
                onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs cursor-pointer"
              >
                <option value={5}>5 นาที (ปลอดภัยสูงมาก)</option>
                <option value={10}>10 นาที (แนะนำตามมาตรฐาน)</option>
                <option value={15}>15 นาที</option>
                <option value={30}>30 นาที</option>
              </select>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            {t('cancel')}
          </button>

          <button
            type="submit"
            disabled={isPending || newPin.length !== 6 || confirmPin.length !== 6}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-700 transition active:scale-95 disabled:opacity-50"
          >
            {isPending ? 'กำลังบันทึก...' : isChangeMode ? 'เปลี่ยนรหัส PIN' : 'ยืนยันการตั้งค่า PIN'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

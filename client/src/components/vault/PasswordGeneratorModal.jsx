import { useState, useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import useLanguage from '../../hooks/useLanguage.js';
import { useToast } from '../../hooks/ToastContext.jsx';

function generateRandomPassword(length, options) {
  let chars = '';
  if (options.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (options.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (options.numbers) chars += '0123456789';
  if (options.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz0123456789';

  let password = '';
  // Ensure at least one character from each selected set
  if (options.uppercase) password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  if (options.lowercase) password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  if (options.numbers) password += '0123456789'[Math.floor(Math.random() * 10)];
  if (options.symbols) password += '!@#$%^&*()_+-=[]{}|;:,.<>?'[Math.floor(Math.random() * 26)];

  for (let i = password.length; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }

  // Shuffle
  return password
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');
}

function calculateStrength(password) {
  if (!password) return { score: 0, label: 'None', color: 'bg-slate-200 text-slate-500' };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 3) return { score: 1, label: 'Weak (เปราะบาง)', color: 'bg-rose-500 text-white' };
  if (score <= 5) return { score: 2, label: 'Moderate (ปานกลาง)', color: 'bg-amber-500 text-white' };
  if (score === 6) return { score: 3, label: 'Strong (แข็งแกร่ง)', color: 'bg-emerald-500 text-white' };
  return { score: 4, label: 'Fortified (แข็งแกร่งสูงสุด)', color: 'bg-indigo-600 text-white' };
}

export default function PasswordGeneratorModal({ open, onClose, onSelectPassword }) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [generatedPassword, setGeneratedPassword] = useState('');

  const regenerate = () => {
    const pw = generateRandomPassword(length, options);
    setGeneratedPassword(pw);
  };

  useEffect(() => {
    if (open) {
      regenerate();
    }
  }, [open, length, options]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      showToast('คัดลอกรหัสผ่านลงคลิปบอร์ดแล้ว', 'success');
    } catch {
      showToast('ไม่สามารถคัดลอกได้', 'error');
    }
  };

  const handleUse = () => {
    if (onSelectPassword) {
      onSelectPassword(generatedPassword);
    }
    showToast('นำรหัสผ่านไปใช้งานแล้ว', 'success');
    onClose();
  };

  const strength = calculateStrength(generatedPassword);

  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-200 text-2xl shadow-2xs">
            🎲
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              สร้างรหัสผ่านสุ่มปลอดภัย (Password Generator)
            </h3>
            <p className="text-xs text-slate-500">
              สร้างรหัสผ่านที่มีความซับซ้อนสูง ป้องกันการคาดเดาและ Brute Force
            </p>
          </div>
        </div>

        {/* Display Box */}
        <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white shadow-inner">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-base sm:text-lg font-bold tracking-wider text-emerald-400 select-all break-all">
              {generatedPassword}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={regenerate}
                title="สร้างรหัสผ่านใหม่"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
              >
                🔄
              </button>
              <button
                type="button"
                onClick={handleCopy}
                title="คัดลอกรหัสผ่าน"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition active:scale-95"
              >
                📋
              </button>
            </div>
          </div>

          {/* Strength Bar */}
          <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400">ระดับความปลอดภัย:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${strength.color}`}>
              {strength.label}
            </span>
          </div>
        </div>

        {/* Controls: Length Slider */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50 p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
              <span>ความยาวของรหัสผ่าน:</span>
              <span className="font-mono text-sm font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-200">
                {length} ตัวอักษร
              </span>
            </div>
            <input
              type="range"
              min={8}
              max={32}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>8</span>
              <span>16</span>
              <span>24</span>
              <span>32</span>
            </div>
          </div>

          {/* Character Options */}
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={options.uppercase}
                onChange={(e) => setOptions((prev) => ({ ...prev, uppercase: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span>ตัวพิมพ์ใหญ่ (A-Z)</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={options.lowercase}
                onChange={(e) => setOptions((prev) => ({ ...prev, lowercase: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span>ตัวพิมพ์เล็ก (a-z)</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={options.numbers}
                onChange={(e) => setOptions((prev) => ({ ...prev, numbers: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span>ตัวเลข (0-9)</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={options.symbols}
                onChange={(e) => setOptions((prev) => ({ ...prev, symbols: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span>อักขระพิเศษ (!@#$)</span>
            </label>
          </div>
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

          {onSelectPassword ? (
            <button
              type="button"
              onClick={handleUse}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-700 transition active:scale-95"
            >
              <span>✓</span>
              <span>ใช้รหัสผ่านนี้</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition active:scale-95"
            >
              <span>📋</span>
              <span>คัดลอกรหัสผ่าน</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

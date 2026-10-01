import { useState, useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import useLanguage from '../../hooks/useLanguage.js';
import { useToast } from '../../hooks/ToastContext.jsx';
import { useCreateVaultItem, useUpdateVaultItem } from '../../hooks/useVault.js';
import PasswordGeneratorModal from './PasswordGeneratorModal.jsx';

const CATEGORIES = [
  { id: 'login', label: 'รหัสผ่านบัญชี', icon: '🔑', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'note', label: 'โน้ตความลับ', icon: '📝', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'card', label: 'บัตร/ข้อมูลตัวตน', icon: '💳', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { id: 'key', label: 'API & คีย์เทคนิค', icon: '⚙️', color: 'text-amber-600 bg-amber-50 border-amber-200' },
];

export default function VaultItemModal({
  open,
  onClose,
  pin,
  itemToEdit = null,
  initialCategory = 'login',
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const createMut = useCreateVaultItem(pin);
  const updateMut = useUpdateVaultItem(pin);

  const [category, setCategory] = useState('login');
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [url, setUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);

  // Category specific secret fields
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Note
  const [secretNote, setSecretNote] = useState('');

  // Card
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardType, setCardType] = useState('Visa / Mastercard');

  // Key
  const [keyType, setKeyType] = useState('API Key');
  const [keyValue, setKeyValue] = useState('');

  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (open) {
      if (itemToEdit) {
        setCategory(itemToEdit.category || 'login');
        setTitle(itemToEdit.title || '');
        setUsername(itemToEdit.username || '');
        setUrl(itemToEdit.url || '');
        setTagsInput((itemToEdit.tags || []).join(', '));

        const secrets = itemToEdit.secrets || {};
        setPassword(secrets.password || '');
        setSecretNote(secrets.secretNote || '');
        setCardHolder(secrets.cardHolder || '');
        setCardNumber(secrets.cardNumber || '');
        setCardExpiry(secrets.cardExpiry || '');
        setCardCvv(secrets.cardCvv || '');
        setCardType(secrets.cardType || 'Visa / Mastercard');
        setKeyType(secrets.keyType || 'API Key');
        setKeyValue(secrets.keyValue || '');
      } else {
        setCategory(initialCategory || 'login');
        setTitle('');
        setUsername('');
        setUrl('');
        setTagsInput('');
        setPassword('');
        setSecretNote('');
        setCardHolder('');
        setCardNumber('');
        setCardExpiry('');
        setCardCvv('');
        setCardType('Visa / Mastercard');
        setKeyType('API Key');
        setKeyValue('');
      }
      setServerError('');
      setShowPassword(false);
    }
  }, [open, itemToEdit, initialCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!title.trim()) {
      setServerError('กรุณากรอกชื่อรายการ');
      return;
    }

    // Assemble category specific secrets
    let secrets = {};
    if (category === 'login') {
      secrets = { password };
    } else if (category === 'note') {
      secrets = { secretNote };
    } else if (category === 'card') {
      secrets = { cardHolder, cardNumber, cardExpiry, cardCvv, cardType };
    } else if (category === 'key') {
      secrets = { keyType, keyValue };
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (itemToEdit) {
        await updateMut.mutateAsync({
          id: itemToEdit._id,
          payload: {
            category,
            title,
            username: category === 'login' ? username : '',
            url: category === 'login' ? url : '',
            tags,
            secrets,
          },
        });
        showToast('อัปเดตข้อมูลความลับในตู้นิรภัยเรียบร้อยแล้ว', 'success');
      } else {
        await createMut.mutateAsync({
          category,
          title,
          username: category === 'login' ? username : '',
          url: category === 'login' ? url : '',
          tags,
          secrets,
        });
        showToast('บันทึกข้อมูลเข้าสู่ตู้นิรภัยอย่างปลอดภัยแล้ว', 'success');
      }
      onClose();
    } catch (err) {
      const apiErrors = err?.response?.data?.errors;
      const firstError = apiErrors ? (typeof apiErrors === 'string' ? apiErrors : Object.values(apiErrors)[0]) : null;
      setServerError(firstError || err?.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <>
      <Modal open={open} onClose={onClose} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">
                {CATEGORIES.find((c) => c.id === category)?.icon || '🔒'}
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {itemToEdit ? 'แก้ไขข้อมูลความลับ' : 'เพิ่มข้อมูลใหม่เข้าสู่ตู้นิรภัย'}
                </h3>
                <p className="text-xs text-slate-500">
                  ข้อมูลจะถูกเข้ารหัสด้วย AES-256-GCM ทันทีก่อนบันทึกลงฐานข้อมูล
                </p>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {serverError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <span>⚠️</span>
              <span>{serverError}</span>
            </div>
          )}

          {/* Category Tabs */}
          {!itemToEdit && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                เลือกประเภทข้อมูล (Category)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-bold transition shadow-2xs ${
                      category === cat.id
                        ? `${cat.color} ring-2 ring-primary-500/20 shadow-xs`
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Primary Details */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ชื่อรายการ (Title) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  category === 'login'
                    ? 'e.g. Google Workspace / GitHub Account / ธนาคาร'
                    : category === 'note'
                    ? 'e.g. รหัสผ่านตู้นิรภัยเอกสาร / ข้อมูลสัญญาสำคัญ'
                    : category === 'card'
                    ? 'e.g. บัตรเครดิตบริษัท FTI Corporate / บัตรพนักงาน'
                    : 'e.g. AWS Production Token / OpenAI API Key / Wi-Fi สำนักงาน'
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs"
              />
            </div>

            {/* Category: LOGIN */}
            {category === 'login' && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ชื่อผู้ใช้ / อีเมล (Username / Email)
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      เว็บไซต์ (Website URL)
                    </label>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      รหัสผ่าน (Password) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPasswordGenerator(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:text-primary-700 hover:underline"
                    >
                      <span>🎲</span>
                      <span>สุ่มรหัสผ่านปลอดภัย</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full font-mono rounded-xl border border-slate-300 pr-10 pl-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-sm p-1"
                      title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Category: NOTE */}
            {category === 'note' && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ข้อความความลับ (Secret Note) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={secretNote}
                    onChange={(e) => setSecretNote(e.target.value)}
                    placeholder="พิมพ์ข้อความสำคัญ หรือข้อมูลความลับที่ต้องการเข้ารหัสจัดเก็บ..."
                    className="w-full rounded-xl border border-slate-300 p-3 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* Category: CARD */}
            {category === 'card' && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ชื่อผู้ถือบัตร (Cardholder Name)
                    </label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="KRITTAPAS THIPSANGWONG"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ประเภทบัตร (Card Type)
                    </label>
                    <select
                      value={cardType}
                      onChange={(e) => setCardType(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs cursor-pointer"
                    >
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="JCB">JCB</option>
                      <option value="Corporate Fleet Card">บัตรเติมน้ำมัน / Fleet Card</option>
                      <option value="ID Card / Driving License">บัตรประชาชน / ใบขับขี่</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    หมายเลขบัตร (Card Number) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    className="w-full font-mono rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      วันหมดอายุ (MM/YY)
                    </label>
                    <input
                      type="text"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="12/28"
                      className="w-full font-mono text-center rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      รหัสความปลอดภัย (CVV/CVC)
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="•••"
                      className="w-full font-mono text-center rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Category: KEY */}
            {category === 'key' && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ประเภทคีย์ (Key Type)
                  </label>
                  <select
                    value={keyType}
                    onChange={(e) => setKeyType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs cursor-pointer"
                  >
                    <option value="API Key">API Key</option>
                    <option value="SSH Private Key">SSH Private Key</option>
                    <option value="Access Token / Secret">Access Token / Secret</option>
                    <option value="License Key">License Key (สิทธิ์โปรแกรม)</option>
                    <option value="Wi-Fi Password">รหัสผ่าน Wi-Fi สำนักงาน</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ค่ารหัสลับ / คีย์ (Secret Key Value) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={keyValue}
                    onChange={(e) => setKeyValue(e.target.value)}
                    placeholder="sk_live_... หรือใส่ Private Key หรือรหัสผ่าน"
                    className="w-full font-mono rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs"
                  />
                </div>
              </div>
            )}

            {/* Tags Input */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                แท็กสำหรับจัดกลุ่ม (Tags - คั่นด้วยเครื่องหมายจุลภาค ,)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="work, personal, finance, dev"
                className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Actions */}
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
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-700 transition active:scale-95 disabled:opacity-50"
            >
              {isPending ? 'กำลังเข้ารหัสและบันทึก...' : itemToEdit ? 'บันทึกการแก้ไข' : 'บันทึกเข้าสู่ตู้นิรภัย'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Embedded Password Generator Helper */}
      <PasswordGeneratorModal
        open={showPasswordGenerator}
        onClose={() => setShowPasswordGenerator(false)}
        onSelectPassword={(newPass) => {
          setPassword(newPass);
          setShowPassword(true);
        }}
      />
    </>
  );
}

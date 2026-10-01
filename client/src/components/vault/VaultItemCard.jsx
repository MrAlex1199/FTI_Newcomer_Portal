import { useState } from 'react';
import { useToast } from '../../hooks/ToastContext.jsx';
import { useToggleVaultFavorite, useDeleteVaultItem } from '../../hooks/useVault.js';

const CATEGORY_MAP = {
  login: {
    label: 'รหัสผ่าน',
    enLabel: 'Login',
    icon: '🔑',
    badge: 'text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800',
  },
  note: {
    label: 'โน้ตความลับ',
    enLabel: 'Secure Note',
    icon: '📝',
    badge: 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800',
  },
  card: {
    label: 'บัตร/ตัวตน',
    enLabel: 'Card / ID',
    icon: '💳',
    badge: 'text-purple-700 bg-purple-50 dark:text-purple-300 dark:bg-purple-900/40 border-purple-200 dark:border-purple-800',
  },
  key: {
    label: 'API & คีย์',
    enLabel: 'API / Key',
    icon: '⚙️',
    badge: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800',
  },
};

export default function VaultItemCard({
  item,
  pin,
  onEdit,
}) {
  const { showToast } = useToast();
  const toggleFavMut = useToggleVaultFavorite();
  const deleteMut = useDeleteVaultItem();

  const [showSecret, setShowSecret] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const secrets = item.secrets || {};
  const cat = CATEGORY_MAP[item.category] || CATEGORY_MAP.login;

  const copyToClipboard = async (text, fieldName = 'ข้อมูล') => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      showToast(`คัดลอก ${fieldName} สำเร็จ`, 'success');
      setTimeout(() => {
        setCopiedField('');
      }, 2000);
    } catch {
      showToast('ไม่สามารถคัดลอกลงคลิปบอร์ดได้', 'error');
    }
  };

  const handleFavoriteToggle = (e) => {
    e.stopPropagation();
    toggleFavMut.mutate(item._id);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await deleteMut.mutateAsync(item._id);
      showToast('ลบรายการออกจากตู้นิรภัยแล้ว', 'success');
    } catch {
      showToast('เกิดข้อผิดพลาดในการลบรายการ', 'error');
    }
  };

  return (
    <div className="relative group bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 flex flex-col justify-between">
      {/* Top row: Category badge, Favorite, and Actions */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cat.badge}`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </span>

          <div className="flex items-center gap-1">
            {/* Star Favorite */}
            <button
              type="button"
              onClick={handleFavoriteToggle}
              title={item.favorite ? 'นำออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
              className={`p-1.5 rounded-lg transition-colors ${
                item.favorite
                  ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                  : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <svg
                className="w-4 h-4"
                fill={item.favorite ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>

            {/* Edit button */}
            <button
              type="button"
              onClick={() => onEdit(item)}
              title="แก้ไขข้อมูล"
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>

            {/* Delete button */}
            {confirmDelete ? (
              <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/40 p-0.5 rounded-lg border border-red-200 dark:border-red-900">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteMut.isPending}
                  className="px-2 py-0.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded transition"
                >
                  ยืนยัน
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="p-1 text-xs text-slate-500 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                title="ลบรายการ"
                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 mb-1">
          {item.title}
        </h3>

        {/* URL link if available */}
        {item.url && (
          <div className="mb-2">
            <a
              href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline truncate max-w-full"
            >
              <span>{item.url.replace(/^https?:\/\//, '')}</span>
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}

        {/* Category Specific Display */}
        <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800 my-3 text-xs space-y-2">
          {/* LOGIN Category */}
          {item.category === 'login' && (
            <>
              {item.username && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400 select-none">ชื่อผู้ใช้:</span>
                  <div className="flex items-center gap-1.5 font-mono text-slate-800 dark:text-slate-200 truncate">
                    <span className="truncate">{item.username}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(item.username, 'ชื่อผู้ใช้')}
                      className="text-slate-400 hover:text-blue-600 p-0.5 transition"
                      title="คัดลอกชื่อผู้ใช้"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400 select-none">รหัสผ่าน:</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-slate-900 dark:text-slate-100 font-semibold tracking-wider">
                    {showSecret && secrets.password ? secrets.password : '••••••••••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 transition"
                    title={showSecret ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showSecret ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(secrets.password, 'รหัสผ่าน')}
                    className="text-slate-400 hover:text-blue-600 p-0.5 transition"
                    title="คัดลอกรหัสผ่าน"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* NOTE Category */}
          {item.category === 'note' && (
            <div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span>เนื้อหาข้อความ:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {showSecret ? 'ซ่อน' : 'เปิดอ่าน'}
                  </button>
                  {secrets.secretNote && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(secrets.secretNote, 'ข้อความโน้ต')}
                      className="text-slate-400 hover:text-emerald-600 ml-1"
                      title="คัดลอกโน้ต"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded p-2 text-slate-700 dark:text-slate-300 font-sans whitespace-pre-wrap max-h-24 overflow-y-auto leading-relaxed border border-slate-200/50 dark:border-slate-800">
                {showSecret
                  ? secrets.secretNote || '(ไม่มีเนื้อหา)'
                  : '••••••••••••••••••••••••••••••••••••••••••••••••'}
              </div>
            </div>
          )}

          {/* CARD Category */}
          {item.category === 'card' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">ประเภท:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{secrets.cardType || 'บัตร'}</span>
              </div>
              {secrets.cardHolder && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">ผู้ถือบัตร:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{secrets.cardHolder}</span>
                </div>
              )}
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-500 dark:text-slate-400">หมายเลข:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {showSecret && secrets.cardNumber
                      ? secrets.cardNumber
                      : secrets.cardNumber
                      ? `•••• •••• •••• ${secrets.cardNumber.replace(/\s+/g, '').slice(-4)}`
                      : '•••• •••• •••• ••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    {showSecret ? '🙈' : '👁️'}
                  </button>
                  {secrets.cardNumber && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(secrets.cardNumber, 'หมายเลขบัตร')}
                      className="text-slate-400 hover:text-purple-600 p-0.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {(secrets.cardExpiry || secrets.cardCvv) && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50 font-mono">
                  <span>EXP: {secrets.cardExpiry || '--/--'}</span>
                  <span>CVV: {showSecret ? secrets.cardCvv : '•••'}</span>
                </div>
              )}
            </div>
          )}

          {/* KEY Category */}
          {item.category === 'key' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">ประเภทคีย์:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200">
                  {secrets.keyType || 'API Key'}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-500 dark:text-slate-400">ค่าคีย์:</span>
                <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                  <span className="truncate text-slate-800 dark:text-slate-200">
                    {showSecret && secrets.keyValue
                      ? secrets.keyValue
                      : '••••••••••••••••••••••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 flex-shrink-0"
                  >
                    {showSecret ? '🙈' : '👁️'}
                  </button>
                  {secrets.keyValue && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(secrets.keyValue, 'ค่าคีย์ลับ')}
                      className="text-slate-400 hover:text-amber-600 p-0.5 flex-shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Custom Notes if any */}
          {secrets.customNotes && item.category !== 'note' && (
            <div className="pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 line-clamp-2">
              <span className="font-semibold mr-1">หมายเหตุ:</span>
              {secrets.customNotes}
            </div>
          )}
        </div>
      </div>

      {/* Bottom tags & Updated time */}
      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex flex-wrap gap-1 max-w-[80%]">
          {item.tags && item.tags.length > 0 ? (
            item.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md font-mono"
              >
                #{tag}
              </span>
            ))
          ) : (
            <span className="italic text-slate-400">ไม่มีป้ายกำกับ</span>
          )}
        </div>
        <span>{new Date(item.updatedAt || item.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

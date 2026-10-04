import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLanguage from '../../hooks/useLanguage.js';
import { RichTextRenderer } from '../content/RichText.jsx';

function getEstReadingTime(content = '', summary = '') {
  const text = `${content} ${summary}`.replace(/<[^>]*>?/gm, '').trim();
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 180));
}

export default function GuideReaderModal({
  article,
  isOpen = false,
  isRead = false,
  onToggleRead,
  onClose,
}) {
  const { t, currentLanguage, label } = useLanguage();
  const navigate = useNavigate();

  // Handle escape key & lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !article) return null;

  const estMinutes = getEstReadingTime(article.content, article.summary);

  // Determine quick launch suggestion based on subcategory
  const quickLinks = {
    first_day: [
      { labelTh: 'เปิดผังอาคาร 20 ไร่', labelEn: 'Campus Map', path: '/floor-plans', icon: '🗺️' },
      { labelTh: 'ตั้ง PIN ใน Vault', labelEn: 'Personal Vault', path: '/vault', icon: '🔐' },
    ],
    first_week: [
      { labelTh: 'คู่มือ Wi-Fi & IT Helpdesk', labelEn: 'IT Services', path: '/it-help', icon: '💻' },
      { labelTh: 'นโยบายและข้อบังคับ', labelEn: 'Policies', path: '/policies', icon: '📜' },
    ],
    before_leaving: [
      { labelTh: 'ส่งคืนอุปกรณ์ IT', labelEn: 'IT Asset Return', path: '/it-help', icon: '💻' },
    ],
  };

  const suggestions = quickLinks[article.subcategory] || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reader-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 dark:bg-primary-950/60 px-2.5 py-0.5 text-xs font-bold text-primary-700 dark:text-primary-300 border border-primary-200/50 dark:border-primary-800">
              🔖 {label(article.subcategory)}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              ⏱️ {t('estReadTime', { min: estMinutes })}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Reader Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 space-y-6">
          {/* Cover image if available */}
          {article.coverImage && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 max-h-72">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Article Title */}
          <div>
            <h1
              id="reader-title"
              className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight"
            >
              {article.title}
            </h1>

            {/* Target roles and tags */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {article.targetRoles?.length > 0 ? (
                article.targetRoles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800"
                  >
                    👤 {label(role)}
                  </span>
                ))
              ) : (
                <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                  👥 {currentLanguage === 'th' ? 'สำหรับทุกคน' : 'All Roles'}
                </span>
              )}

              {article.tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs text-slate-500 dark:text-slate-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Summary Callout Box */}
          {article.summary && (
            <div className="rounded-2xl border border-primary-200/70 dark:border-primary-900/60 bg-gradient-to-r from-primary-50/70 to-teal-50/40 dark:from-primary-950/30 dark:to-teal-950/20 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="text-xl">💡</span>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                    {currentLanguage === 'th' ? 'สาระสำคัญโดยสังเขป' : 'Key Summary'}
                  </h4>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {article.summary}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Full Markdown/RichText Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none pt-2">
            <RichTextRenderer content={article.content} />
          </div>

          {/* Quick suggested tool links */}
          {suggestions.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                {currentLanguage === 'th' ? 'ระบบและเครื่องมือที่เกี่ยวข้อง' : 'Related Tools & Links'}
              </h4>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(item.path);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-primary-500 hover:text-primary-600 transition-all shadow-2xs hover:shadow-xs active:scale-95"
                  >
                    <span>{item.icon}</span>
                    <span>{currentLanguage === 'th' ? item.labelTh : item.labelEn}</span>
                    <span>↗</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/70 dark:bg-slate-900/70">
          {/* Understood status toggle */}
          <button
            type="button"
            onClick={() => onToggleRead(article._id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all active:scale-95 ${
              isRead
                ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
            }`}
          >
            <span>{isRead ? '✓' : '○'}</span>
            <span>{isRead ? t('understoodBadge') : t('markAsRead')}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {t('closeReader')}
          </button>
        </div>
      </div>
    </div>
  );
}

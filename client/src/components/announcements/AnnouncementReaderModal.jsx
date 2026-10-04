import { useState, useEffect } from 'react';
import useLanguage from '../../hooks/useLanguage.js';
import { RichTextRenderer } from '../content/RichText.jsx';

function getEstReadingTime(content = '', summary = '') {
  const text = `${content} ${summary}`.replace(/<[^>]*>?/gm, '').trim();
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 180));
}

const CATEGORY_STYLES = {
  urgent: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
  news: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
  event: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900',
  training: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
  holiday: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
  maintenance: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  welcome: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900',
};

export default function AnnouncementReaderModal({ announcement, isOpen = false, onClose }) {
  const { t, label, locale, currentLanguage } = useLanguage();
  const [copied, setCopied] = useState(false);

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

  if (!isOpen || !announcement) return null;

  const isUrgent = announcement.category === 'urgent';
  const isPinned = announcement.isPinned;
  const estMinutes = getEstReadingTime(announcement.content, announcement.summary);

  const formattedDate = announcement.publishAt
    ? new Date(announcement.publishAt).toLocaleString(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '';

  const expiry = announcement.expireAt
    ? new Date(announcement.expireAt).toLocaleString(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '';

  const author = announcement.authorId?.username;
  const badgeStyle = CATEGORY_STYLES[announcement.category] || CATEGORY_STYLES.news;

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-reader-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${badgeStyle}`}
            >
              <span>{isUrgent ? '🚨' : '🏷️'}</span>
              <span>{label(announcement.category)}</span>
            </span>

            {isPinned && (
              <span className="inline-flex items-center rounded-full bg-amber-500 text-white px-2 py-0.5 text-xs font-bold shadow-xs">
                📌 {t('pinned')}
              </span>
            )}

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
          {announcement.coverImage && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 max-h-80">
              <img
                src={announcement.coverImage}
                alt={announcement.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Title & Author Meta */}
          <div>
            <h1
              id="announcement-reader-title"
              className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-snug"
            >
              {announcement.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {author && <span>✍️ {t('announcementAuthor', { name: author })}</span>}
              {formattedDate && <span>📅 {t('publishedAt', { date: formattedDate })}</span>}
              {expiry && <span>⏳ {t('expiresAt', { date: expiry })}</span>}
            </div>

            {/* Target roles badges */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {currentLanguage === 'th' ? 'กลุ่มเป้าหมาย:' : 'Target audience:'}
              </span>
              {announcement.targetRoles?.length > 0 ? (
                announcement.targetRoles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800"
                  >
                    👤 {label(role)}
                  </span>
                ))
              ) : (
                <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                  👥 {currentLanguage === 'th' ? 'ทุกคนในองค์กร' : 'All Organization'}
                </span>
              )}
            </div>
          </div>

          {/* Summary Box */}
          {announcement.summary && (
            <div
              className={`rounded-2xl border p-4 sm:p-5 ${
                isUrgent
                  ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30'
                  : 'border-primary-200/70 dark:border-primary-900/60 bg-gradient-to-r from-primary-50/70 to-teal-50/40 dark:from-primary-950/30 dark:to-teal-950/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{isUrgent ? '🚨' : '💡'}</span>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {currentLanguage === 'th' ? 'สาระสำคัญโดยสรุป' : 'Key Summary'}
                  </h4>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {announcement.summary}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Markdown/RichText Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none pt-2">
            <RichTextRenderer content={announcement.content} />
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/80 dark:bg-slate-900/80">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors active:scale-95 shadow-2xs"
          >
            <span>🔗</span>
            <span>{copied ? t('linkCopied') : t('shareAnnouncement')}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-2 text-xs sm:text-sm font-bold hover:bg-slate-800 dark:hover:bg-white transition-colors"
          >
            {t('closeAnnouncementReader')}
          </button>
        </div>
      </div>
    </div>
  );
}

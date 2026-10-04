import { useState } from 'react';
import useLanguage from '../../hooks/useLanguage.js';
import ContentBadge from '../content/ContentBadge.jsx';

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

export default function AnnouncementListItem({
  announcement,
  canManage = false,
  onOpenReader,
  onEdit,
  onToggleStatus,
  onDelete,
}) {
  const { t, label, locale } = useLanguage();
  const [imageError, setImageError] = useState(false);

  const isUrgent = announcement.category === 'urgent';
  const isPinned = announcement.isPinned;
  const estMinutes = getEstReadingTime(announcement.content, announcement.summary);

  const formattedDate = announcement.publishAt
    ? new Date(announcement.publishAt).toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  const author = announcement.authorId?.username;
  const badgeStyle = CATEGORY_STYLES[announcement.category] || CATEGORY_STYLES.news;

  return (
    <div
      className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md transition-all duration-200 ${
        isUrgent
          ? 'border-rose-200 dark:border-rose-900/60'
          : isPinned
          ? 'border-amber-200 dark:border-amber-900/60'
          : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Left: Thumbnail & Details */}
      <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
        {/* Small thumbnail */}
        <div
          onClick={() => onOpenReader(announcement)}
          className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 cursor-pointer border border-slate-200/80 dark:border-slate-700"
        >
          {announcement.coverImage && !imageError ? (
            <img
              src={announcement.coverImage}
              alt=""
              onError={() => setImageError(true)}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-xl">
              {isUrgent ? '🚨' : isPinned ? '📌' : '📢'}
            </div>
          )}
        </div>

        {/* Text info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold border ${badgeStyle}`}
            >
              {label(announcement.category)}
            </span>

            {isPinned && (
              <span className="inline-flex items-center rounded-full bg-amber-500 text-white px-2 py-0.5 text-[10px] font-bold">
                📌 {t('pinned')}
              </span>
            )}

            {canManage && (
              <ContentBadge value={announcement.displayStatus || announcement.status} />
            )}

            {formattedDate && (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                • {formattedDate}
              </span>
            )}

            {author && (
              <span className="text-xs text-slate-400 dark:text-slate-500 hidden md:inline">
                • {author}
              </span>
            )}
          </div>

          <h3
            onClick={() => onOpenReader(announcement)}
            className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 cursor-pointer truncate transition-colors"
          >
            {announcement.title}
          </h3>

          {announcement.summary && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-2xl">
              {announcement.summary}
            </p>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
        <span className="text-xs text-slate-400 hidden lg:inline">
          ⏱️ {t('estReadTime', { min: estMinutes })}
        </span>

        {/* Read button */}
        <button
          type="button"
          onClick={() => onOpenReader(announcement)}
          className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 dark:hover:text-white px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all active:scale-95"
        >
          <span>{t('readAnnouncement')}</span>
          <span>→</span>
        </button>

        {/* Admin controls */}
        {canManage && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => onEdit(announcement)}
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              {t('edit')}
            </button>
            <button
              type="button"
              onClick={() => onToggleStatus(announcement)}
              className="text-amber-600 dark:text-amber-400 hover:underline"
            >
              {announcement.status === 'published' ? t('unpublish') : t('publish')}
            </button>
            <button
              type="button"
              onClick={() => onDelete(announcement)}
              className="text-rose-600 dark:text-rose-400 hover:underline"
            >
              {t('delete')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

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

const CATEGORY_GRADIENTS = {
  urgent: 'from-rose-600 via-red-500 to-amber-500',
  news: 'from-blue-600 via-sky-500 to-cyan-400',
  event: 'from-violet-600 via-purple-500 to-indigo-400',
  training: 'from-amber-600 via-orange-500 to-yellow-400',
  holiday: 'from-emerald-600 via-teal-500 to-cyan-400',
  maintenance: 'from-slate-700 via-zinc-600 to-slate-500',
  welcome: 'from-teal-600 via-emerald-500 to-cyan-400',
};

export default function AnnouncementCard({
  announcement,
  canManage = false,
  onOpenReader,
  onEdit,
  onToggleStatus,
  onDelete,
}) {
  const { t, label, locale, currentLanguage } = useLanguage();
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
  const gradient = CATEGORY_GRADIENTS[announcement.category] || CATEGORY_GRADIENTS.news;

  return (
    <article
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
        isUrgent
          ? 'border-rose-300/80 dark:border-rose-900/60 ring-1 ring-rose-500/10'
          : isPinned
          ? 'border-amber-300/80 dark:border-amber-900/60 ring-1 ring-amber-500/10'
          : 'border-slate-200/90 dark:border-slate-800 hover:border-primary-400/80 dark:hover:border-primary-600'
      }`}
    >
      {/* Tier 1: Visual Cover Header */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {announcement.coverImage && !imageError ? (
          <img
            src={announcement.coverImage}
            alt={announcement.title}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className={`h-full w-full bg-gradient-to-tr ${gradient} opacity-90 flex items-center justify-center p-6 text-white text-center`}
          >
            <div>
              <span className="text-4xl drop-shadow-md">
                {isUrgent ? '🚨' : isPinned ? '📌' : '📢'}
              </span>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-white/90">
                {label(announcement.category)}
              </p>
            </div>
          </div>
        )}

        {/* Ambient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Floating top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          {/* Category Pill */}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow-xs border backdrop-blur-md ${badgeStyle}`}
          >
            <span>{isUrgent ? '🚨' : '🏷️'}</span>
            <span>{label(announcement.category)}</span>
          </span>

          <div className="flex items-center gap-1.5">
            {isPinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 text-white px-2.5 py-0.5 text-xs font-bold shadow-xs">
                📌 {t('pinned')}
              </span>
            )}
            {canManage && (
              <ContentBadge value={announcement.displayStatus || announcement.status} />
            )}
          </div>
        </div>

        {/* Floating bottom read time */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-xs font-medium text-white shadow-xs">
            ⏱️ {t('estReadTime', { min: estMinutes })}
          </span>
        </div>
      </div>

      {/* Tier 2 & 3: Body & Metadata */}
      <div className="flex flex-1 flex-col p-5">
        {/* Title */}
        <h3
          onClick={() => onOpenReader(announcement)}
          className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 cursor-pointer transition-colors line-clamp-2 leading-snug"
        >
          {announcement.title}
        </h3>

        {/* Summary */}
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed flex-1">
          {announcement.summary ||
            (currentLanguage === 'th'
              ? 'ไม่มีคำสรุปย่อ คลิกเพื่ออ่านประกาศฉบับเต็ม'
              : 'No summary provided. Click to view full announcement.')}
        </p>

        {/* Author, Date, and Roles Metadata */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            {formattedDate && <span>📅 {formattedDate}</span>}
            {author && <span>✍️ {author}</span>}
          </div>

          {/* Role Target Pills */}
          <div className="flex items-center gap-1">
            {announcement.targetRoles?.length > 0 ? (
              announcement.targetRoles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50"
                >
                  {label(role)}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-500 dark:text-slate-400">
                {currentLanguage === 'th' ? 'ทุกคน' : 'All'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tier 4: Footer Actions */}
      <div className="flex flex-col gap-2 p-4 sm:px-5 sm:pb-5 pt-0">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onOpenReader(announcement)}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 dark:hover:text-white px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all duration-200 active:scale-95 group/btn"
          >
            <span>{t('readAnnouncement')}</span>
            <span className="transition-transform group-hover/btn:translate-x-0.5">→</span>
          </button>
        </div>

        {/* Admin controls */}
        {canManage && (
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs font-medium">
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
    </article>
  );
}

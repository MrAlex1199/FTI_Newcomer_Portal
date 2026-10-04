import { useState } from 'react';
import useLanguage from '../../hooks/useLanguage.js';
import ContentBadge from '../content/ContentBadge.jsx';

function getEstReadingTime(content = '', summary = '') {
  const text = `${content} ${summary}`.replace(/<[^>]*>?/gm, '').trim();
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 180));
}

export default function GuideCard({
  article,
  isRead = false,
  onToggleRead,
  onOpenReader,
  canManage = false,
  onEdit,
  onToggleStatus,
  onDelete,
}) {
  const { t, currentLanguage, label } = useLanguage();
  const [imageError, setImageError] = useState(false);

  const estMinutes = getEstReadingTime(article.content, article.summary);

  const phaseColors = {
    first_day: 'from-blue-600 via-cyan-500 to-teal-400',
    first_week: 'from-indigo-600 via-primary-500 to-sky-400',
    before_leaving: 'from-amber-600 via-orange-500 to-rose-400',
  };

  const gradientClass = phaseColors[article.subcategory] || 'from-primary-600 to-cyan-500';

  return (
    <article
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
        isRead
          ? 'border-emerald-200/90 dark:border-emerald-900/60 ring-1 ring-emerald-500/10'
          : 'border-slate-200/90 dark:border-slate-800 hover:border-primary-400/80 dark:hover:border-primary-600'
      }`}
    >
      {/* Tier 1: Visual Header */}
      <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {article.coverImage && !imageError ? (
          <img
            src={article.coverImage}
            alt={article.title}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-tr ${gradientClass} opacity-90 flex items-center justify-center p-6 text-white`}>
            <div className="text-center">
              <span className="text-4xl sm:text-5xl drop-shadow-md">📖</span>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/90">
                {label(article.subcategory)}
              </p>
            </div>
          </div>
        )}

        {/* Ambient Gradient Overlay for text contrast */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          {/* Subcategory Pill */}
          <span className="inline-flex items-center gap-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs border border-white/20">
            <span>🔖</span>
            <span>{label(article.subcategory)}</span>
          </span>

          <div className="flex items-center gap-1.5">
            {/* Reading Time Pill */}
            <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-xs font-medium text-white shadow-xs">
              <span>⏱️</span>
              <span>{t('estReadTime', { min: estMinutes })}</span>
            </span>

            {/* Admin status badge */}
            {canManage && <ContentBadge value={article.status} />}
          </div>
        </div>

        {/* Read Status Watermark */}
        {isRead && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-white shadow-xs">
            <span>✓</span>
            <span>{t('understoodBadge')}</span>
          </div>
        )}
      </div>

      {/* Tier 2 & 3: Body & Tags */}
      <div className="flex flex-1 flex-col p-5">
        {/* Title */}
        <h3
          onClick={() => onOpenReader(article)}
          className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 cursor-pointer transition-colors line-clamp-2 leading-snug"
        >
          {article.title}
        </h3>

        {/* Summary */}
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed flex-1">
          {article.summary || (currentLanguage === 'th' ? 'ไม่มีคำสรุปย่อ คลิกเพื่ออ่านรายละเอียดฉบับเต็ม' : 'No summary provided. Click to view full guide content.')}
        </p>

        {/* Role Target Pills & Tags */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-1.5">
          {article.targetRoles?.length > 0 ? (
            article.targetRoles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center rounded-md bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 text-[11px] font-semibold text-primary-700 dark:text-primary-300 border border-primary-200/50 dark:border-primary-800/50"
              >
                👤 {label(role)}
              </span>
            ))
          ) : (
            <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
              👥 {currentLanguage === 'th' ? 'สำหรับทุกคน' : 'All Roles'}
            </span>
          )}

          {article.tags?.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] text-slate-500 dark:text-slate-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Tier 4: Footer Actions */}
      <div className="flex flex-col gap-2.5 p-4 sm:px-5 sm:pb-5 pt-0">
        <div className="flex items-center justify-between gap-2">
          {/* Mark as Understood button */}
          <button
            type="button"
            onClick={() => onToggleRead(article._id)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
              isRead
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>{isRead ? '✓' : '○'}</span>
            <span>{isRead ? t('understoodBadge') : t('markAsRead')}</span>
          </button>

          {/* Open full reader button */}
          <button
            type="button"
            onClick={() => onOpenReader(article)}
            className="inline-flex items-center gap-1 rounded-xl bg-primary-600 dark:bg-primary-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary-700 dark:hover:bg-primary-600 transition-all hover:gap-1.5 active:scale-95"
          >
            <span>{t('readArticle')}</span>
            <span>→</span>
          </button>
        </div>

        {/* Admin CRUD controls */}
        {canManage && (
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs font-medium">
            <button
              type="button"
              onClick={() => onEdit(article)}
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              {t('edit')}
            </button>
            <button
              type="button"
              onClick={() => onToggleStatus(article)}
              className="text-amber-600 dark:text-amber-400 hover:underline"
            >
              {article.status === 'published' ? t('unpublish') : t('publish')}
            </button>
            <button
              type="button"
              onClick={() => onDelete(article)}
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

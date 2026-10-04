import { useState } from 'react';
import useLanguage from '../../hooks/useLanguage.js';

function getEstReadingTime(content = '', summary = '') {
  const text = `${content} ${summary}`.replace(/<[^>]*>?/gm, '').trim();
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 180));
}

export default function AnnouncementHero({ spotlightAnnouncement, onOpenReader }) {
  const { t, currentLanguage, locale, label } = useLanguage();
  const [imageError, setImageError] = useState(false);

  if (!spotlightAnnouncement) return null;

  const isUrgent = spotlightAnnouncement.category === 'urgent';
  const isPinned = spotlightAnnouncement.isPinned;
  const estMinutes = getEstReadingTime(
    spotlightAnnouncement.content,
    spotlightAnnouncement.summary
  );

  const formattedDate = spotlightAnnouncement.publishAt
    ? new Date(spotlightAnnouncement.publishAt).toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  const author = spotlightAnnouncement.authorId?.username;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50/70 to-slate-100/50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-800/80 p-6 sm:p-8 shadow-sm transition-all duration-300 mb-8">
      {/* Decorative ambient lights */}
      <div
        className={`pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full blur-3xl opacity-30 ${
          isUrgent ? 'bg-rose-500' : 'bg-primary-500'
        }`}
      />
      <div className="pointer-events-none absolute -bottom-20 left-1/4 h-64 w-64 rounded-full bg-teal-400/15 blur-3xl" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
        {/* Left Column: Text content */}
        <div className="lg:col-span-7 space-y-4">
          {/* Top badges */}
          <div className="flex flex-wrap items-center gap-2">
            {isUrgent ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 text-white px-3.5 py-1 text-xs font-bold shadow-xs animate-pulse">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                🚨 {t('urgentSpotlight')}
              </span>
            ) : isPinned ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 text-white px-3.5 py-1 text-xs font-bold shadow-xs">
                📌 {t('pinnedSpotlight')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-600 text-white px-3.5 py-1 text-xs font-bold shadow-xs">
                ✨ {t('latestUpdate')}
              </span>
            )}

            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
              🏷️ {label(spotlightAnnouncement.category)}
            </span>

            <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              ⏱️ {t('estReadTime', { min: estMinutes })}
            </span>
          </div>

          {/* Heading */}
          <h2
            onClick={() => onOpenReader(spotlightAnnouncement)}
            className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors line-clamp-2"
          >
            {spotlightAnnouncement.title}
          </h2>

          {/* Summary */}
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed line-clamp-3">
            {spotlightAnnouncement.summary ||
              (currentLanguage === 'th'
                ? 'คลิกอ่านรายละเอียดประกาศฉบับเต็มเพื่อรับทราบข้อมูลสำคัญและการปฏิบัติตน'
                : 'Click to view full announcement details and updates.')}
          </p>

          {/* Metadata & Action */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200/70 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              {formattedDate && <span>📅 {formattedDate}</span>}
              {author && <span>✍️ {t('announcementAuthor', { name: author })}</span>}
            </div>

            <button
              type="button"
              onClick={() => onOpenReader(spotlightAnnouncement)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs transition-all hover:gap-2.5 active:scale-95 ${
                isUrgent
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              <span>{t('readNow')}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Visual Cover */}
        <div className="lg:col-span-5">
          <div
            onClick={() => onOpenReader(spotlightAnnouncement)}
            className="group relative h-56 sm:h-64 lg:h-72 w-full overflow-hidden rounded-2xl cursor-pointer shadow-md border border-slate-200/80 dark:border-slate-800"
          >
            {spotlightAnnouncement.coverImage && !imageError ? (
              <img
                src={spotlightAnnouncement.coverImage}
                alt={spotlightAnnouncement.title}
                onError={() => setImageError(true)}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div
                className={`h-full w-full flex items-center justify-center bg-gradient-to-tr ${
                  isUrgent
                    ? 'from-rose-600 via-red-500 to-amber-500'
                    : 'from-primary-600 via-indigo-600 to-cyan-500'
                } p-6 text-white text-center`}
              >
                <div>
                  <span className="text-5xl drop-shadow-md">
                    {isUrgent ? '🚨' : isPinned ? '📌' : '📢'}
                  </span>
                  <p className="mt-2 text-sm font-bold tracking-wide uppercase text-white/90">
                    {label(spotlightAnnouncement.category)}
                  </p>
                </div>
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

            <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-medium text-white">
              <span>{t('viewFullAnnouncement')}</span>
              <span>↗</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

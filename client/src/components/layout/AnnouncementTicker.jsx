import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAnnouncements } from '../../hooks/useAnnouncements.js';
import useLanguage from '../../hooks/useLanguage.js';

export default function AnnouncementTicker() {
  const { t } = useLanguage();
  const [paused, setPaused] = useState(false);
  const { data, isLoading, isError } = useAnnouncements({ limit: 8, audience: 'live' });
  const announcements = data?.data || [];

  if (isLoading) {
    return <div className="h-9 bg-primary-950" role="status" aria-label={t('loadingAnnouncements')} />;
  }

  if (isError || announcements.length === 0) {
    return null;
  }

  const items = [...announcements, ...announcements];
  return (
    <div
      className="overflow-hidden border-b-2 border-amber-300 bg-gradient-to-r from-primary-950 via-primary-900 to-primary-950 text-white shadow-sm"
      aria-label={t('tickerLabel')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <div className="mx-auto flex min-h-12 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-amber-300 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-primary-950 shadow-sm">
          <span aria-hidden="true">📣</span>
          <span className="hidden sm:inline">{t('tickerLabel')}</span>
        </span>
        <div className="min-w-0 overflow-hidden" role="region" aria-live="polite">
          <div className={`ticker-track flex min-w-max items-center gap-12 py-3 ${paused ? 'ticker-paused' : ''}`}>
            {items.map((item, index) => (
              <Link
                key={`${item._id}-${index}`}
                to="/announcements"
                className="inline-flex max-w-[min(34rem,78vw)] items-center gap-2 truncate text-base font-semibold text-white transition hover:text-amber-200 focus-visible:text-amber-200"
              >
                {item.isPinned && <span aria-label={t('pinned')}>📌</span>}
                <span className="truncate">{item.title}</span>
                <span className="text-amber-300" aria-hidden="true">•</span>
                <span className="text-sm font-medium text-primary-100">{t(item.category)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

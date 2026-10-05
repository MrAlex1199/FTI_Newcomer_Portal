import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAnnouncements } from '../../hooks/useAnnouncements.js';
import useLanguage from '../../hooks/useLanguage.js';

const ROTATION_MS = 6500;

const CATEGORY_GRADIENTS = {
  urgent: 'from-rose-600 via-red-500 to-amber-500',
  news: 'from-blue-600 via-indigo-600 to-cyan-500',
  event: 'from-violet-600 via-purple-500 to-indigo-500',
  training: 'from-amber-600 via-orange-500 to-yellow-500',
  holiday: 'from-emerald-600 via-teal-500 to-cyan-500',
  maintenance: 'from-slate-800 via-zinc-700 to-slate-600',
  welcome: 'from-teal-600 via-emerald-500 to-cyan-500',
};

const CATEGORY_EMOJIS = {
  urgent: '🚨',
  news: '📢',
  event: '🎉',
  training: '🎓',
  holiday: '🌴',
  maintenance: '🛠️',
  welcome: '👋',
};

export default function AnnouncementCarousel() {
  const { t, label } = useLanguage();
  const { data, isLoading, isError } = useAnnouncements({ limit: 12, audience: 'live' });
  const [imageErrors, setImageErrors] = useState({});

  const slides = useMemo(() => {
    const list = data?.data || [];
    if (!list.length) return [];
    // Prioritize announcements with cover images, or include all live announcements
    const withImages = list.filter((announcement) => Boolean(announcement.coverImage));
    return withImages.length > 0 ? withImages : list;
  }, [data]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (activeIndex >= slides.length) setActiveIndex(0);
  }, [activeIndex, slides.length]);

  useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % slides.length), ROTATION_MS);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  if (isLoading) return <CarouselPlaceholder t={t} message={t('loadingAnnouncements')} />;
  if (isError || slides.length === 0) return <CarouselPlaceholder t={t} message={t('carouselEmptyMessage')} />;

  const currentIndex = activeIndex % slides.length;
  const active = slides[currentIndex];
  const goTo = (index) => setActiveIndex((index + slides.length) % slides.length);

  const gradientClass = CATEGORY_GRADIENTS[active.category] || CATEGORY_GRADIENTS.news;
  const categoryEmoji = CATEGORY_EMOJIS[active.category] || '📢';
  const hasCover = Boolean(active.coverImage) && !imageErrors[active._id];

  return (
    <section
      className="mt-8 animate-fade-up"
      aria-labelledby="announcement-carousel-heading"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">{t('featuredNews')}</p>
          <h2 id="announcement-carousel-heading" className="mt-1 text-lg font-semibold text-gray-800">{t('featuredAnnouncements')}</h2>
        </div>
        <Link to="/announcements" className="shrink-0 text-sm font-medium text-primary-600 hover:underline">{t('viewAnnouncements')} →</Link>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gray-900 shadow-lift">
        <div className="grid min-h-[16rem] md:grid-cols-[1.1fr_0.9fr]">
          <div className="relative order-2 flex flex-col justify-end p-6 text-white sm:p-8 md:order-1">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-primary-900 to-gray-900" aria-hidden="true" />
            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-primary-200">
                  {label(active.category)}
                </span>
                {active.isPinned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/90 text-amber-950 px-2 py-0.5 text-[10px] font-bold shadow-xs">
                    📌 {t('pinned')}
                  </span>
                )}
              </div>
              <h3 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">{active.title}</h3>
              {active.summary && <p className="mt-3 line-clamp-3 max-w-xl text-sm leading-6 text-primary-100">{active.summary}</p>}
              <Link to="/announcements" className="mt-5 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary-800 transition hover:bg-primary-50 focus-visible:ring-white">{t('readAnnouncement')} <span className="ml-2" aria-hidden="true">→</span></Link>
            </div>
          </div>
          <div className="relative order-1 min-h-[12rem] overflow-hidden md:order-2 md:min-h-0">
            {hasCover ? (
              <img
                src={active.coverImage}
                alt={active.title}
                onError={() => setImageErrors((prev) => ({ ...prev, [active._id]: true }))}
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
              />
            ) : (
              <div className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-tr ${gradientClass} p-6 text-white text-center`}>
                <span className="text-5xl drop-shadow-md">{categoryEmoji}</span>
                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-white/90">{label(active.category)}</p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent md:bg-gradient-to-r md:from-gray-900/20" aria-hidden="true" />
          </div>
        </div>

        {slides.length > 1 && (
          <div className="absolute bottom-4 right-5 z-20 flex items-center gap-2 rounded-full bg-black/30 px-2 py-1 backdrop-blur-sm" aria-label={t('carouselControls')}>
            <button type="button" onClick={() => goTo(currentIndex - 1)} className="flex h-7 w-7 items-center justify-center rounded-full text-white hover:bg-white/20 focus-visible:ring-white" aria-label={t('previous')}>
              ‹
            </button>
            {slides.map((slide, index) => <button key={slide._id} type="button" onClick={() => goTo(index)} className={`h-2 rounded-full transition-all ${index === currentIndex ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`} aria-label={`${t('goToSlide')} ${index + 1}`} aria-current={index === currentIndex ? 'true' : undefined} />)}
            <button type="button" onClick={() => goTo(currentIndex + 1)} className="flex h-7 w-7 items-center justify-center rounded-full text-white hover:bg-white/20 focus-visible:ring-white" aria-label={t('next')}>
              ›
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function CarouselPlaceholder({ t, message }) {
  return (
    <section className="mt-8 animate-fade-up" aria-labelledby="announcement-carousel-heading">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">{t('featuredNews')}</p>
          <h2 id="announcement-carousel-heading" className="mt-1 text-lg font-semibold text-gray-800">{t('featuredAnnouncements')}</h2>
        </div>
        <Link to="/announcements" className="shrink-0 text-sm font-medium text-primary-600 hover:underline">{t('viewAnnouncements')} →</Link>
      </div>
      <div className="flex min-h-[15rem] items-center justify-center rounded-2xl border-2 border-dashed border-primary-200 bg-gradient-to-br from-primary-50 via-white to-cyan-50 px-6 py-10 text-center shadow-card">
        <div>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-4xl shadow-sm" aria-hidden="true">🎞️</div>
          <p className="mt-4 text-base font-semibold text-gray-800">{message}</p>
          <p className="mt-1 text-sm text-gray-500">{t('carouselEmptyHint')}</p>
        </div>
      </div>
    </section>
  );
}

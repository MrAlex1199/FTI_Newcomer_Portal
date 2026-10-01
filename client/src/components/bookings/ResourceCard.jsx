import useLanguage from '../../hooks/useLanguage.js';

export default function ResourceCard({
  resource,
  isOngoing,
  onBook,
  onViewSchedule,
  onOpenDetails,
}) {
  const { t } = useLanguage();

  const isRoom = resource.type === 'room';
  const statusColor = isOngoing
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : resource.status === 'active'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-slate-100 text-slate-600 border-slate-200';

  const statusLabel = isOngoing
    ? t('inUse')
    : resource.status === 'active'
    ? t('availableNow')
    : t('underMaintenance');

  const handleCardClick = () => {
    if (onOpenDetails) {
      onOpenDetails(resource);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary-400 hover:shadow-xl hover:ring-2 hover:ring-primary-100/50 cursor-pointer"
    >
      <div>
        {/* Tier 1: Top Bar - Icon + Badges Cluster */}
        <div className="flex items-center justify-between gap-3">
          {/* Left: Icon Squircle */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl text-2xl sm:text-3xl shadow-xs transition-transform duration-200 group-hover:scale-105"
              style={{
                backgroundColor: `${resource.color || '#3b82f6'}15`,
                border: `1px solid ${resource.color || '#3b82f6'}30`,
              }}
            >
              {resource.icon || (isRoom ? '🏢' : '🚗')}
            </span>

            {/* Category Tag */}
            {resource.category && (
              <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 truncate max-w-[140px]">
                {resource.category}
              </span>
            )}
          </div>

          {/* Right: Availability Status + Capacity Badge */}
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <span className="inline-flex items-center gap-1 rounded-xl bg-blue-50 border border-blue-200/70 px-2.5 py-1 text-xs font-bold text-blue-700 shadow-2xs">
              👥 {resource.capacity} {t('seats')}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold shadow-2xs ${statusColor}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isOngoing
                    ? 'bg-amber-500 animate-pulse'
                    : resource.status === 'active'
                    ? 'bg-emerald-500'
                    : 'bg-slate-400'
                }`}
              />
              <span>{statusLabel}</span>
            </span>
          </div>
        </div>

        {/* Tier 2: Resource Title */}
        <div className="mt-3.5">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors leading-snug line-clamp-2">
            {resource.name}
          </h3>
        </div>

        {/* Tier 3: Location or License Plate Chip */}
        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700 border border-slate-100">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-slate-400">{isRoom ? '📍' : '🏷️'}</span>
            <span className="font-semibold truncate">
              {resource.locationOrPlate || (isRoom ? 'FTI Headquarters' : 'Corporate Fleet')}
            </span>
          </div>

          {resource.driverAvailable && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 shrink-0">
              ✓ {t('driverAvailable')}
            </span>
          )}
        </div>

        {/* Tier 4: Description */}
        {resource.description && (
          <p className="mt-2.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {resource.description}
          </p>
        )}

        {/* Tier 5: Amenities / Specifications Tags */}
        {resource.amenities && resource.amenities.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {resource.amenities.slice(0, 3).map((amenity, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-100/90 border border-slate-200/60 px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-2xs"
              >
                <span className="text-slate-400">•</span>
                <span className="truncate max-w-[170px]">{amenity}</span>
              </span>
            ))}
            {resource.amenities.length > 3 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenDetails) onOpenDetails(resource);
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-primary-50 border border-primary-200/90 px-2 py-1 text-[11px] font-bold text-primary-700 hover:bg-primary-100 hover:text-primary-800 transition-colors shadow-2xs cursor-pointer group/more"
                title="คลิกเพื่อดูอุปกรณ์และสเปกทั้งหมด"
              >
                <span>+{resource.amenities.length - 3}</span>
                <span className="text-[10px] text-primary-600 font-semibold group-hover/more:underline">ดูทั้งหมด</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tier 6: Footer Actions Bar */}
      <div
        className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1 min-w-0">
          <button
            type="button"
            onClick={() => onOpenDetails && onOpenDetails(resource)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-primary-600 hover:bg-slate-50 rounded-xl px-2 py-1.5 transition-colors whitespace-nowrap shrink-0"
            title="ดูรายละเอียดและสเปกทั้งหมด"
          >
            <span>ℹ️</span>
            <span>{t('viewDetails') || 'รายละเอียด'}</span>
          </button>

          <button
            type="button"
            onClick={() => onViewSchedule(resource)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-primary-600 hover:bg-slate-50 rounded-xl px-2 py-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <span>📅</span>
            <span>{t('viewTimeline')}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onBook(resource)}
          className="inline-flex items-center gap-1 rounded-xl bg-primary-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-primary-700 active:scale-95 shrink-0 whitespace-nowrap"
        >
          <span>+</span>
          <span>{t('bookNow')}</span>
        </button>
      </div>
    </div>
  );
}


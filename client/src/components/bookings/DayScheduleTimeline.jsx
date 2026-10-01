import { useMemo } from 'react';
import useLanguage from '../../hooks/useLanguage.js';

const START_HOUR = 8; // 08:00
const END_HOUR = 18; // 18:00
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60; // 600 minutes

export default function DayScheduleTimeline({
  resources = [],
  bookings = [],
  selectedDate,
  onDateChange,
  onBookSlot,
}) {
  const { t } = useLanguage();

  // Generate hourly markers: 08:00, 09:00, ..., 18:00
  const hours = useMemo(() => {
    const list = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      list.push(`${String(h).padStart(2, '0')}:00`);
    }
    return list;
  }, []);

  // Format date navigation
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    onDateChange(new Date().toISOString().split('T')[0]);
  };

  // Group bookings by resourceId
  const bookingsByResource = useMemo(() => {
    const map = {};
    resources.forEach((r) => {
      map[r._id] = [];
    });
    bookings.forEach((b) => {
      const resId = typeof b.resourceId === 'object' ? b.resourceId?._id : b.resourceId;
      if (map[resId]) {
        map[resId].push(b);
      }
    });
    return map;
  }, [resources, bookings]);

  // Compute block placement on timeline (percent left and width)
  const getBookingStyle = (booking) => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);

    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();

    // Clamp between START_HOUR and END_HOUR
    const dayStartMinutes = START_HOUR * 60;
    const dayEndMinutes = END_HOUR * 60;

    const clampedStart = Math.max(dayStartMinutes, Math.min(dayEndMinutes, startMinutes));
    const clampedEnd = Math.max(dayStartMinutes, Math.min(dayEndMinutes, endMinutes));

    const left = ((clampedStart - dayStartMinutes) / TOTAL_MINUTES) * 100;
    const width = Math.max(2, ((clampedEnd - clampedStart) / TOTAL_MINUTES) * 100);

    return {
      left: `${left}%`,
      width: `${width}%`,
    };
  };

  const formatTimeStr = (dateStr) => {
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
      {/* Top Header: Date Controls & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">📅</span>
          <div>
            <h3 className="text-base font-bold text-slate-900">{t('viewTimeline')}</h3>
            <p className="text-xs text-slate-500">08:00 - 18:00 (Click an empty time slot to book)</p>
          </div>
        </div>

        {/* Date Selector buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevDay}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
            title="Previous Day"
          >
            ←
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />

          <button
            type="button"
            onClick={handleNextDay}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
            title="Next Day"
          >
            →
          </button>

          <button
            type="button"
            onClick={handleToday}
            className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
          >
            Today
          </button>
        </div>
      </div>

      {/* Timeline Grid Container (Horizontal scroll for mobile) */}
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Hours Header Row */}
          <div className="flex items-center pb-2 text-xs font-semibold text-slate-400 border-b border-slate-100">
            <div className="w-56 shrink-0 pr-4">Resource</div>
            <div className="flex-1 grid grid-cols-10 text-center">
              {hours.slice(0, -1).map((h, i) => (
                <div key={i} className="border-l border-slate-100 pl-1 text-left text-[11px]">
                  {h}
                </div>
              ))}
            </div>
          </div>

          {/* Resource Rows */}
          <div className="divide-y divide-slate-100">
            {resources.map((res) => {
              const resBookings = bookingsByResource[res._id] || [];

              return (
                <div key={res._id} className="flex items-center py-3.5 group/row hover:bg-slate-50/50 transition">
                  {/* Left Label: Resource Info */}
                  <div className="w-56 shrink-0 pr-4 flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base shadow-2xs"
                      style={{
                        backgroundColor: `${res.color || '#3b82f6'}20`,
                      }}
                    >
                      {res.icon || (res.type === 'room' ? '🏢' : '🚗')}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate" title={res.name}>
                        {res.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        👥 {res.capacity} {t('seats')} · {res.locationOrPlate}
                      </p>
                    </div>
                  </div>

                  {/* Right: Timeline Track */}
                  <div
                    className="relative flex-1 h-10 rounded-xl bg-slate-100/70 border border-slate-200/60 overflow-hidden cursor-pointer"
                    onClick={(e) => {
                      // Calculate clicked time slot
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const percent = clickX / rect.width;
                      const clickedMinutes = START_HOUR * 60 + percent * TOTAL_MINUTES;
                      const hour = Math.floor(clickedMinutes / 60);
                      const minute = Math.floor((clickedMinutes % 60) / 30) * 30; // Snap to 30 min

                      const startSlot = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                      const endHour = minute === 30 ? hour + 1 : hour + 1;
                      const endMin = minute === 30 ? 30 : 0;
                      const endSlot = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

                      onBookSlot(res, selectedDate, startSlot, endSlot);
                    }}
                  >
                    {/* Hour grid vertical dividers */}
                    <div className="absolute inset-0 grid grid-cols-10 pointer-events-none">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="border-l border-slate-200/50 h-full" />
                      ))}
                    </div>

                    {/* Booked Interval Blocks */}
                    {resBookings.map((b) => {
                      const style = getBookingStyle(b);
                      const timeStr = `${formatTimeStr(b.startTime)} - ${formatTimeStr(b.endTime)}`;

                      return (
                        <div
                          key={b._id}
                          onClick={(e) => {
                            e.stopPropagation(); // Avoid triggering row click
                          }}
                          className="absolute inset-y-1 rounded-lg px-2 text-white flex items-center justify-between text-xs font-semibold shadow-xs overflow-hidden transition hover:ring-2 hover:ring-white/80 cursor-default"
                          style={{
                            ...style,
                            backgroundColor: res.color || '#2563eb',
                          }}
                          title={`${b.title} (${timeStr})\n${b.contactName} (${b.department || 'FTI'})`}
                        >
                          <span className="truncate text-[11px] font-bold">
                            {b.title}
                          </span>
                          <span className="text-[10px] opacity-85 shrink-0 hidden sm:inline font-mono">
                            {timeStr}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

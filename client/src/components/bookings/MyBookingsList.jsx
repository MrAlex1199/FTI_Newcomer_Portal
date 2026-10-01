import { useState } from 'react';
import useLanguage from '../../hooks/useLanguage.js';
import { useToast } from '../../hooks/ToastContext.jsx';
import { useCancelBooking } from '../../hooks/useBookings.js';

export default function MyBookingsList({ bookings = [], onBookNew }) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const cancelMut = useCancelBooking();

  const [filterType, setFilterType] = useState('upcoming'); // 'upcoming' | 'all'
  const [cancellingId, setCancellingId] = useState(null);

  const now = new Date();

  const filtered = bookings.filter((b) => {
    if (filterType === 'upcoming') {
      return b.status === 'confirmed' && new Date(b.endTime) >= now;
    }
    return true;
  });

  const handleCancel = async (booking) => {
    if (!window.confirm(t('cancelBookingConfirm'))) return;

    setCancellingId(booking._id);
    try {
      await cancelMut.mutateAsync({
        id: booking._id,
        payload: { cancellationReason: 'Cancelled by user' },
      });
      showToast(t('bookingCancelled'), 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not cancel booking', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Buttons */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterType('upcoming')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterType === 'upcoming'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            การจองที่กำลังจะมาถึง ({bookings.filter((b) => b.status === 'confirmed' && new Date(b.endTime) >= now).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterType === 'all'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            ประวัติทั้งหมด ({bookings.length})
          </button>
        </div>

        <button
          type="button"
          onClick={onBookNew}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary-700 transition"
        >
          <span>+</span>
          <span>{t('bookNow')}</span>
        </button>
      </div>

      {/* Bookings List Cards */}
      {filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => {
            const res = b.resourceId || {};
            const isRoom = b.resourceType === 'room';
            const isPast = new Date(b.endTime) < now;

            return (
              <div
                key={b._id}
                className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700">
                      {b.bookingNo}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        b.status === 'cancelled'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : isPast
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          b.status === 'cancelled'
                            ? 'bg-rose-500'
                            : isPast
                            ? 'bg-slate-400'
                            : 'bg-emerald-500'
                        }`}
                      />
                      {b.status === 'cancelled'
                        ? 'ยกเลิกแล้ว'
                        : isPast
                        ? 'เสร็จสิ้น'
                        : 'ยืนยันแล้ว'}
                    </span>
                  </div>

                  {/* Resource Info */}
                  <div className="mt-3 flex items-center gap-2.5">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl shadow-2xs"
                      style={{
                        backgroundColor: `${res.color || '#3b82f6'}20`,
                      }}
                    >
                      {res.icon || (isRoom ? '🏢' : '🚗')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {res.name || 'Resource'}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {res.locationOrPlate || (isRoom ? 'ห้องประชุม' : 'รถยนต์')}
                      </p>
                    </div>
                  </div>

                  {/* Title & Details */}
                  <div className="mt-3 rounded-xl bg-slate-50/80 p-2.5 border border-slate-100 text-xs space-y-1">
                    <p className="font-bold text-slate-800 line-clamp-1">
                      {b.title}
                    </p>
                    <p className="text-slate-500">
                      🕒 {formatDateTime(b.startTime)} - {new Date(b.endTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {b.destination && (
                      <p className="text-slate-600 truncate">
                        📍 ปลายทาง: {b.destination} {b.needDriver ? '(ขอคนขับ)' : ''}
                      </p>
                    )}
                    {b.roomSetup && (
                      <p className="text-slate-600 truncate">
                        🪑 จัดห้อง: {b.roomSetup} ({b.attendeesCount} คน)
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                {b.status === 'confirmed' && !isPast && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      disabled={cancellingId === b._id}
                      onClick={() => handleCancel(b)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
                    >
                      {cancellingId === b._id ? 'กำลังยกเลิก...' : t('cancelBooking')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center">
          <span className="text-4xl">📋</span>
          <p className="mt-3 text-sm font-bold text-slate-700">ไม่มีรายการจองในส่วนนี้</p>
          <p className="mt-1 text-xs text-slate-400">คุณสามารถเริ่มจองห้องประชุมหรือรถยนต์บริษัทได้ทันที</p>
          <button
            type="button"
            onClick={onBookNew}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-700 transition"
          >
            <span>+</span>
            <span>{t('bookNow')}</span>
          </button>
        </div>
      )}
    </div>
  );
}

import Modal from '../common/Modal.jsx';
import useLanguage from '../../hooks/useLanguage.js';

// Helper to assign intuitive icons to amenities
function getAmenityIcon(text = '') {
  const lower = text.toLowerCase();
  if (lower.includes('hybrid') || lower.includes('ประหยัดพลังงาน')) return '🌿';
  if (lower.includes('ไฟฟ้า') || lower.includes('ev') || lower.includes('ชาร์จ')) return '⚡';
  if (lower.includes('เบาะ') || lower.includes('ที่นั่ง')) return '💺';
  if (lower.includes('easy pass') || lower.includes('ทางด่วน')) return '🛣️';
  if (lower.includes('ความปลอดภัย') || lower.includes('tss') || lower.includes('gps')) return '🛡️';
  if (lower.includes('คนขับ') || lower.includes('พนักงานขับ')) return '👨‍✈️';
  if (lower.includes('จอ') || lower.includes('tv') || lower.includes('display')) return '📺';
  if (lower.includes('ไมค์') || lower.includes('ไมโครโฟน')) return '🎙️';
  if (lower.includes('ลำโพง') || lower.includes('เสียง')) return '🔊';
  if (lower.includes('กล้อง') || lower.includes('video') || lower.includes('webex')) return '📹';
  if (lower.includes('กระดาน') || lower.includes('ไวท์บอร์ด')) return '📋';
  if (lower.includes('ปลั๊ก') || lower.includes('usb')) return '🔌';
  return '✨';
}

export default function ResourceDetailModal({
  open,
  onClose,
  resource,
  isOngoing = false,
  onBook,
  onViewSchedule,
}) {
  const { t } = useLanguage();

  if (!resource) return null;

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

  const brandColor = resource.color || (isRoom ? '#2563eb' : '#d97706');

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-slate-50/50 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* Resource Squircle Icon */}
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-sm ring-1 ring-black/5"
                style={{
                  backgroundColor: `${brandColor}18`,
                  borderColor: `${brandColor}35`,
                }}
              >
                {resource.icon || (isRoom ? '🏢' : '🚗')}
              </div>

              {/* Title & Identity */}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-slate-200/80 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                    {resource.category || (isRoom ? 'Meeting Room' : 'Corporate Vehicle')}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${statusColor}`}
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
                    {statusLabel}
                  </span>
                </div>

                <h2 className="mt-2 text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                  {resource.name}
                </h2>

                <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <span>{isRoom ? '📍' : '🏷️'}</span>
                  <span>{resource.locationOrPlate}</span>
                </p>
              </div>
            </div>

            {/* Quick Capacity Pill */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200/80 px-3.5 py-1.5 text-xs font-bold text-blue-700 shadow-2xs">
                <span>👥</span>
                <span>{resource.capacity} {t('seats')}</span>
              </span>

              {resource.driverAvailable && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100/90 text-emerald-800 text-[11px] font-bold px-2.5 py-1">
                  ✓ {t('driverAvailable')}
                </span>
              )}
            </div>
          </div>

          {/* Description Snippet */}
          {resource.description && (
            <div className="mt-4 pt-3.5 border-t border-slate-200/70">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {resource.description}
              </p>
            </div>
          )}
        </div>

        {/* Specifications & Key Information Grid */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            ข้อมูลจำเพาะ (Key Specifications)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
              <span className="text-[11px] font-medium text-slate-400 block">ความจุรองรับ</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                {resource.capacity} {t('seats')}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
              <span className="text-[11px] font-medium text-slate-400 block">
                {isRoom ? 'อาคาร / ชั้น' : 'ป้ายทะเบียน'}
              </span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block truncate">
                {resource.locationOrPlate}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
              <span className="text-[11px] font-medium text-slate-400 block">
                {isRoom ? 'รูปแบบห้อง' : 'บริการคนขับ'}
              </span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block truncate">
                {isRoom
                  ? 'ปรับเปลี่ยนได้ 5 แบบ'
                  : resource.driverAvailable
                  ? 'มีคนขับประจำรถ'
                  : 'ขับเอง'}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
              <span className="text-[11px] font-medium text-slate-400 block">สถานะปัจจุบัน</span>
              <span
                className={`text-sm font-bold mt-0.5 block truncate ${
                  isOngoing
                    ? 'text-amber-600'
                    : resource.status === 'active'
                    ? 'text-emerald-600'
                    : 'text-slate-500'
                }`}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {/* All Amenities / Full Feature Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              อุปกรณ์และสิ่งอำนวยความสะดวก ({resource.amenities?.length || 0} รายการ)
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
              ● พร้อมใช้งานทุกรายการ
            </span>
          </div>

          {resource.amenities && resource.amenities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {resource.amenities.map((amenity, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-base">
                      {getAmenityIcon(amenity)}
                    </span>
                    <span className="text-xs font-bold text-slate-800 leading-snug">
                      {amenity}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 shrink-0 border border-emerald-200/60">
                    ✓ มีให้
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-3 text-center">ไม่มีข้อมูลสิ่งอำนวยความสะดวก</p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200/80">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            {t('close')}
          </button>

          <div className="flex items-center gap-2">
            {onViewSchedule && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewSchedule(resource);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition shadow-2xs"
              >
                <span>📅</span>
                <span>{t('viewTimeline')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onBook(resource);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-700 transition active:scale-95"
            >
              <span>+</span>
              <span>{t('bookNow')}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

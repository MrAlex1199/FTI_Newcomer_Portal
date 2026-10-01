import { useState, useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import useLanguage from '../../hooks/useLanguage.js';
import useAuth from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/ToastContext.jsx';
import { useCreateBooking } from '../../hooks/useBookings.js';
import bookingService from '../../services/bookingService.js';

const TIME_OPTIONS = [];
for (let h = 8; h <= 18; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 18) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`);
  }
}

// Helper to calculate end time from start time and minutes
function calculateEndTime(startTimeStr, minutesToAdd) {
  if (!startTimeStr) return '10:30';
  const [h, m] = startTimeStr.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutesToAdd;
  let newH = Math.floor(totalMinutes / 60);
  let newM = totalMinutes % 60;

  if (newH > 18 || (newH === 18 && newM > 0)) {
    return '18:00';
  }
  // Snap to nearest 30 mins
  if (newM > 0 && newM <= 30) newM = 30;
  else if (newM > 30) {
    newH = Math.min(18, newH + 1);
    newM = 0;
  }
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

export default function BookingModal({
  open,
  onClose,
  initialResource = null,
  initialDate = '',
  initialStartTime = '09:00',
  initialEndTime = '10:30',
  allResources = [],
}) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useToast();
  const createBookingMut = useCreateBooking();

  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [attendeesCount, setAttendeesCount] = useState(1);

  // Vehicle specifics
  const [destination, setDestination] = useState('');
  const [needDriver, setNeedDriver] = useState(false);

  // Room specifics
  const [roomSetup, setRoomSetup] = useState('Boardroom');
  const [requestedEquipment, setRequestedEquipment] = useState([]);

  // Contact info
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // Conflict state
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [conflictWarning, setConflictWarning] = useState('');
  const [serverError, setServerError] = useState('');

  // Pre-populate fields on open or prop changes
  useEffect(() => {
    if (open) {
      const activeRes = initialResource || allResources[0];
      if (activeRes) {
        setSelectedResourceId(activeRes._id);
        if (activeRes.type === 'vehicle' && activeRes.driverAvailable) {
          setNeedDriver(true);
        } else {
          setNeedDriver(false);
        }
      }

      setDate(initialDate || new Date().toISOString().split('T')[0]);
      setStartTime(initialStartTime || '09:00');
      setEndTime(initialEndTime || '10:30');
      setTitle('');
      setDescription('');
      setDestination('');
      setConflictWarning('');
      setServerError('');

      // Auto pre-fill user contact info
      if (user) {
        const emp = user.employeeId;
        const name = emp
          ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim()
          : user.username;
        setContactName(name);
        setContactEmail(user.email || emp?.workEmail || '');
        setContactPhone(emp?.extension || emp?.phone || '');
        setDepartment(emp?.departmentId?.name || '');
      }
    }
  }, [open, initialResource, initialDate, initialStartTime, initialEndTime, allResources, user]);

  const currentResource = allResources.find((r) => r._id === selectedResourceId) || initialResource;
  const isRoom = currentResource?.type === 'room';
  const brandColor = currentResource?.color || (isRoom ? '#2563eb' : '#d97706');

  // Conflict check whenever resource, date, or time changes
  useEffect(() => {
    if (!open || !selectedResourceId || !date || !startTime || !endTime) return;

    if (startTime >= endTime) {
      setConflictWarning('เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น');
      return;
    }

    let isMounted = true;
    const check = async () => {
      setIsCheckingConflict(true);
      try {
        const startISO = `${date}T${startTime}:00`;
        const endISO = `${date}T${endTime}:00`;

        const res = await bookingService.checkAvailability({
          resourceId: selectedResourceId,
          startTime: startISO,
          endTime: endISO,
        });

        if (isMounted) {
          if (!res.available) {
            setConflictWarning(t('conflictError') || 'ช่วงเวลานี้มีผู้จองไว้แล้ว กรุณาเลือกช่วงเวลาอื่น');
          } else {
            setConflictWarning('');
          }
        }
      } catch {
        // Silently catch check error
      } finally {
        if (isMounted) setIsCheckingConflict(false);
      }
    };

    const timer = setTimeout(check, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [open, selectedResourceId, date, startTime, endTime, t]);

  const toggleEquipment = (eq) => {
    setRequestedEquipment((prev) =>
      prev.includes(eq) ? prev.filter((item) => item !== eq) : [...prev, eq]
    );
  };

  const handleApplyDuration = (minutes) => {
    const calculatedEnd = calculateEndTime(startTime, minutes);
    setEndTime(calculatedEnd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (startTime >= endTime) {
      setServerError('เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น');
      return;
    }

    if (conflictWarning) {
      setServerError(conflictWarning);
      return;
    }

    try {
      const startISO = `${date}T${startTime}:00`;
      const endISO = `${date}T${endTime}:00`;

      await createBookingMut.mutateAsync({
        resourceId: selectedResourceId,
        title,
        description,
        department,
        startTime: startISO,
        endTime: endISO,
        attendeesCount,
        destination: isRoom ? '' : destination,
        needDriver: isRoom ? false : needDriver,
        roomSetup: isRoom ? roomSetup : '',
        requestedEquipment: isRoom ? requestedEquipment : [],
        contactName,
        contactPhone,
        contactEmail,
      });

      showToast(t('bookingSuccess'), 'success');
      onClose();
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Unable to complete reservation');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 0: Modal Header & Resource Selection Hero (Zero collision layout) */}
        <div>
          {/* Top Title Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{isRoom ? '🏢' : '🚗'}</span>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  {isRoom
                    ? 'จองห้องประชุม (Meeting Room Reservation)'
                    : 'จองรถยนต์บริษัท (Company Vehicle Reservation)'}
                </h2>
                <p className="text-xs text-slate-500">
                  กรอกรายละเอียดการใช้งาน ตรวจสอบช่วงเวลาว่างแบบเรียลไทม์
                </p>
              </div>
            </div>
          </div>

          {/* Error / Conflict Alert Banner */}
          {(conflictWarning || serverError) && (
            <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs font-semibold text-rose-800 flex items-start gap-2.5 shadow-2xs">
              <span className="text-base leading-none">⚠️</span>
              <div className="flex-1">
                <p className="font-bold">ไม่สามารถทำการจองในช่วงเวลานี้ได้</p>
                <p className="mt-0.5 font-normal text-rose-700">{serverError || conflictWarning}</p>
              </div>
            </div>
          )}

          {/* Resource Selector & Hero Card Container */}
          <div className="mt-4 rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-5 shadow-xs">
            {/* Row 1: Resource Switcher (When multiple resources exist) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 mb-3.5 border-b border-slate-200/70">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span>🔄</span>
                <span>เปลี่ยนทรัพยากรที่ต้องการจอง:</span>
              </label>

              <select
                value={selectedResourceId}
                onChange={(e) => setSelectedResourceId(e.target.value)}
                className="w-full sm:w-auto min-w-[280px] rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
              >
                {allResources
                  .filter((r) => r.type === (currentResource?.type || 'room'))
                  .map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.icon} {r.name} ({r.capacity} ที่นั่ง - {r.locationOrPlate})
                    </option>
                  ))}
              </select>
            </div>

            {/* Row 2: Selected Resource Snapshot (Full details, spacious layout, zero text collision) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <span
                  className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl text-2xl sm:text-3xl shadow-xs ring-1 ring-black/5"
                  style={{
                    backgroundColor: `${brandColor}18`,
                    border: `1px solid ${brandColor}35`,
                  }}
                >
                  {currentResource?.icon || (isRoom ? '🏢' : '🚗')}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                      {currentResource?.category || (isRoom ? 'Meeting Room' : 'Fleet')}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>พร้อมให้บริการ</span>
                    </span>
                  </div>

                  <h3 className="mt-1 text-base sm:text-lg font-bold text-slate-900 truncate">
                    {currentResource?.name}
                  </h3>

                  <p className="text-xs text-slate-500 flex items-center gap-1 truncate mt-0.5">
                    <span>{isRoom ? '📍' : '🏷️'}</span>
                    <span>{currentResource?.locationOrPlate}</span>
                  </p>
                </div>
              </div>

              {/* Right: Badges summary */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200/80 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-2xs">
                  <span>👥</span>
                  <span>{currentResource?.capacity} {t('seats')}</span>
                </span>

                {currentResource?.driverAvailable && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100/90 text-emerald-800 text-[11px] font-bold px-2 py-0.5">
                    ✓ {t('driverAvailable')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: 📅 วันและเวลาที่ใช้งาน (Schedule & Time Slot with Quick Duration Chips) */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <span>📅</span>
              <span>กำหนดวันและเวลาใช้งาน</span>
            </h3>

            {/* Conflict Check Status Badge */}
            <div>
              {isCheckingConflict ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  <span className="h-2 w-2 animate-spin rounded-full border-2 border-slate-600 border-t-transparent" />
                  <span>กำลังตรวจสอบ...</span>
                </span>
              ) : conflictWarning ? (
                <span className="inline-flex items-center gap-1 rounded-lg bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                  ✕ เวลาชนกับผู้อื่น
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                  ✓ ช่วงเวลานี้ว่าง พร้อมจอง
                </span>
              )}
            </div>
          </div>

          {/* Date & Time Input Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('selectDate')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('startTime')} <span className="text-rose-500">*</span>
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 font-mono shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {time} น.
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('endTime')} <span className="text-rose-500">*</span>
              </label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 font-mono shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {time} น.
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Duration Preset Chips */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              เลือกระยะเวลาด่วน:
            </span>
            {[
              { label: '+30 นาที', minutes: 30 },
              { label: '+1 ชั่วโมง', minutes: 60 },
              { label: '+1.5 ชั่วโมง', minutes: 90 },
              { label: '+2 ชั่วโมง', minutes: 120 },
              { label: '+3 ชั่วโมง', minutes: 180 },
              { label: 'ครึ่งวัน (4 ชม.)', minutes: 240 },
            ].map((dur) => (
              <button
                key={dur.label}
                type="button"
                onClick={() => handleApplyDuration(dur.minutes)}
                className="rounded-lg border border-slate-200 bg-slate-50 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 px-2.5 py-1 text-xs font-semibold text-slate-700 transition shadow-2xs"
              >
                {dur.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: 📋 วัตถุประสงค์และรายละเอียด (Purpose & Requirements) */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <span>📋</span>
            <span>รายละเอียดการจองและการจัดเตรียม</span>
          </h3>

          {/* Booking Title / Purpose */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t('bookingPurpose')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                isRoom
                  ? 'e.g. ประชุมวางแผนงานฝ่ายไอทีประจำเดือน / ติดต่อลูกค้ารายสำคัญ'
                  : 'e.g. เดินทางไปร่วมงานสัมมนาสภาอุตสาหกรรมฯ ณ ศูนย์ประชุมไบเทค'
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Room Specific Fields: Setup & Equipment */}
          {isRoom ? (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('roomSetup')}
                  </label>
                  <select
                    value={roomSetup}
                    onChange={(e) => setRoomSetup(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                  >
                    <option value="Boardroom">Boardroom (โต๊ะประชุมกลางมาตรฐาน)</option>
                    <option value="Classroom">Classroom (โต๊ะแถวห้องเรียน)</option>
                    <option value="U-Shape">U-Shape (รูปตัว U สำหรับสัมมนา)</option>
                    <option value="Theater">Theater (เก้าอี้แถวบรรยาย)</option>
                    <option value="Workshop">Workshop (จัดกลุ่มย่อยระดมสมอง)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    จำนวนผู้เข้าร่วมประชุม (คน)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={currentResource?.capacity || 50}
                    value={attendeesCount}
                    onChange={(e) => setAttendeesCount(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    ความจุห้องนี้สูงสุด {currentResource?.capacity || 50} ที่นั่ง
                  </p>
                </div>
              </div>

              {/* Special Equipment Checklist */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  {t('equipmentRequest')} (คลิกเพื่อเลือกเพิ่มเติม)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'ไมโครโฟนเสริม',
                    'จอโปรเจกเตอร์ 4K',
                    'ระบบบันทึกการประชุม',
                    'กระดานไวท์บอร์ดเพิ่มเติม',
                    'อาหารว่าง / เบรคกาแฟ',
                  ].map((eq) => (
                    <button
                      key={eq}
                      type="button"
                      onClick={() => toggleEquipment(eq)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition shadow-2xs flex items-center gap-1.5 ${
                        requestedEquipment.includes(eq)
                          ? 'bg-primary-50 border-primary-400 text-primary-800'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{requestedEquipment.includes(eq) ? '✓' : '+'}</span>
                      <span>{eq}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Vehicle Specific Fields: Destination & Driver */
            <div className="space-y-3.5 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('destination')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. ศูนย์ประชุมไบเทค บางนา / ทำเนียบรัฐบาล"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    จำนวนผู้โดยสาร (คน)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={currentResource?.capacity || 10}
                    value={attendeesCount}
                    onChange={(e) => setAttendeesCount(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    รองรับผู้โดยสารสูงสุด {currentResource?.capacity || 10} ที่นั่ง
                  </p>
                </div>
              </div>

              {/* Need Driver Checkbox Card */}
              <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-3.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>👨‍✈️</span>
                    <span>{t('needDriver')}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {currentResource?.driverAvailable
                      ? 'มีพนักงานขับรถส่วนกลางประจำรถคันนี้พร้อมให้บริการเดินทาง'
                      : 'ขับเอง หรือระบุชื่อผู้ขับในรายละเอียดเพิ่มเติม'}
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={needDriver}
                    onChange={(e) => setNeedDriver(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: 👤 ข้อมูลผู้ติดต่อ / ผู้ประสานงาน (Contact Information) */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3.5 flex items-center gap-1.5">
            <span>👤</span>
            <span>ข้อมูลผู้ประสานงาน / ผู้จอง</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('contactPerson')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('contactPhone')}
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Ext. 1101 / 081-xxx-xxxx"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('department')}
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Information Technology"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition shadow-2xs"
          >
            {t('cancel')}
          </button>

          <button
            type="submit"
            disabled={createBookingMut.isPending || isCheckingConflict || Boolean(conflictWarning)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-primary-700 transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {createBookingMut.isPending ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>กำลังบันทึกข้อมูลการจอง...</span>
              </>
            ) : (
              <>
                <span>✓</span>
                <span>ยืนยันการจองทันที</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

import { useState, useMemo } from 'react';
import AppShell from '../components/layout/AppShell.jsx';
import useLanguage from '../hooks/useLanguage.js';
import useAuth from '../hooks/useAuth.js';
import {
  useBookingResources,
  useBookings,
  useBookingStats,
} from '../hooks/useBookings.js';
import ResourceCard from '../components/bookings/ResourceCard.jsx';
import ResourceDetailModal from '../components/bookings/ResourceDetailModal.jsx';
import DayScheduleTimeline from '../components/bookings/DayScheduleTimeline.jsx';
import BookingModal from '../components/bookings/BookingModal.jsx';
import MyBookingsList from '../components/bookings/MyBookingsList.jsx';
import AdminBookingsList from '../components/bookings/AdminBookingsList.jsx';

export default function Bookings() {
  const { t } = useLanguage();
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('admin') || hasRole('super_admin');

  // Navigation tab: 'rooms' | 'vehicles' | 'my-bookings' | 'admin'
  const [activeTab, setActiveTab] = useState('rooms');
  // View mode for rooms/vehicles: 'cards' | 'timeline'
  const [viewMode, setViewMode] = useState('cards');

  // Date selection for timeline and bookings query
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');

  // Booking Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedResourceForBooking, setSelectedResourceForBooking] = useState(null);
  const [modalInitialStartTime, setModalInitialStartTime] = useState('09:00');
  const [modalInitialEndTime, setModalInitialEndTime] = useState('10:30');

  // Resource Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedResourceForDetail, setSelectedResourceForDetail] = useState(null);

  // Data fetching
  const { data: resources = [], isLoading: loadingResources } = useBookingResources();
  const { data: dateBookings = [], isLoading: loadingBookings } = useBookings({ date: selectedDate });
  const { data: myBookings = [] } = useBookings({ myOnly: 'true' });
  const { data: stats = {} } = useBookingStats();

  // Filter resources by active tab and search
  const filteredResources = useMemo(() => {
    const type = activeTab === 'rooms' ? 'room' : 'vehicle';
    return resources.filter((r) => {
      if (r.type !== type) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.name?.toLowerCase().includes(q);
        const matchCat = r.category?.toLowerCase().includes(q);
        const matchLoc = r.locationOrPlate?.toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchLoc) return false;
      }
      return true;
    });
  }, [resources, activeTab, searchQuery]);

  const ongoingIds = new Set(stats.ongoingResourceIds || []);

  const handleOpenBooking = (resource, date = '', start = '09:00', end = '10:30') => {
    setSelectedResourceForBooking(resource);
    setModalInitialStartTime(start);
    setModalInitialEndTime(end);
    setModalOpen(true);
  };

  const handleOpenDetails = (resource) => {
    setSelectedResourceForDetail(resource);
    setDetailModalOpen(true);
  };

  const handleViewSchedule = (resource) => {
    setViewMode('timeline');
  };

  return (
    <AppShell>
      <div className="space-y-6 pb-12">
        {/* Top Hero Banner with Promax Aesthetics */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 p-6 sm:p-8 text-white shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,white,transparent_50%)] opacity-20 pointer-events-none" />
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-white/20 px-3 py-1 text-xs font-mono font-bold text-white shadow-xs backdrop-blur-md border border-white/20">
                  FTI CORPORATE SERVICES
                </span>
                <span className="rounded-xl bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 px-2.5 py-1 text-xs font-semibold backdrop-blur-md">
                  ● Real-time Availability
                </span>
              </div>

              <h1 className="mt-2.5 text-2xl sm:text-3xl font-black tracking-tight">
                {t('bookingsTitle')}
              </h1>
              <p className="mt-1 text-sm text-blue-100 max-w-2xl leading-relaxed">
                {t('bookingsSubtitle')}
              </p>
            </div>

            {/* Quick Action Button */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => handleOpenBooking(filteredResources[0] || resources[0])}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-md transition-all hover:bg-slate-50 hover:shadow-xl active:scale-95"
              >
                <span>+</span>
                <span>{t('bookNow')}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Badges Bar */}
          <div className="relative z-10 mt-6 pt-5 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-xl bg-white/10 backdrop-blur-md p-3 border border-white/10">
              <span className="text-blue-200 font-medium block">🏢 {t('availableRooms')}</span>
              <span className="text-lg font-black text-white mt-0.5 block">
                {stats.availableRoomsNow ?? 0} / {stats.totalRooms ?? 0}
              </span>
            </div>

            <div className="rounded-xl bg-white/10 backdrop-blur-md p-3 border border-white/10">
              <span className="text-blue-200 font-medium block">🚗 {t('availableVehicles')}</span>
              <span className="text-lg font-black text-white mt-0.5 block">
                {stats.availableVehiclesNow ?? 0} / {stats.totalVehicles ?? 0}
              </span>
            </div>

            <div className="rounded-xl bg-white/10 backdrop-blur-md p-3 border border-white/10">
              <span className="text-blue-200 font-medium block">📅 {t('todayReservations')}</span>
              <span className="text-lg font-black text-white mt-0.5 block">
                {stats.todayBookingsCount ?? 0} รายการ
              </span>
            </div>

            <div className="rounded-xl bg-white/10 backdrop-blur-md p-3 border border-white/10">
              <span className="text-blue-200 font-medium block">📋 {t('myBookings')}</span>
              <span className="text-lg font-black text-white mt-0.5 block">
                {stats.myActiveBookingsCount ?? 0} รายการ
              </span>
            </div>
          </div>
        </div>

        {/* Main Tab Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-3">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => {
                setActiveTab('rooms');
                if (viewMode === 'timeline') setViewMode('cards');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all shrink-0 ${
                activeTab === 'rooms'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>🏢</span>
              <span>{t('meetingRooms')}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-mono ${
                  activeTab === 'rooms' ? 'bg-primary-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {resources.filter((r) => r.type === 'room').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('vehicles');
                if (viewMode === 'timeline') setViewMode('cards');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all shrink-0 ${
                activeTab === 'vehicles'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>🚗</span>
              <span>{t('companyVehicles')}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-mono ${
                  activeTab === 'vehicles' ? 'bg-primary-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {resources.filter((r) => r.type === 'vehicle').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('my-bookings')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all shrink-0 ${
                activeTab === 'my-bookings'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>📋</span>
              <span>{t('myBookings')}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-mono ${
                  activeTab === 'my-bookings' ? 'bg-primary-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {myBookings.length}
              </span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all shrink-0 ${
                  activeTab === 'admin'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <span>🛡️</span>
                <span>{t('resourceManagement')}</span>
              </button>
            )}
          </div>

          {/* Sub Toolbar: Search & View Mode Switcher (Shown on Rooms and Vehicles tabs) */}
          {(activeTab === 'rooms' || activeTab === 'vehicles') && (
            <div className="flex items-center gap-2 shrink-0">
              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อ, ขนาด, ชั้น..."
                  className="w-44 sm:w-56 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* View Switcher: Cards vs Timeline */}
              <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    viewMode === 'cards'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={t('viewCards')}
                >
                  ⊞ การ์ด
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('timeline')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    viewMode === 'timeline'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={t('viewTimeline')}
                >
                  📅 ตารางเวลา
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tab Content: Rooms & Vehicles */}
        {(activeTab === 'rooms' || activeTab === 'vehicles') && (
          <div>
            {loadingResources ? (
              <div className="py-20 text-center">
                <div className="inline-flex h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
                <p className="mt-3 text-xs font-medium text-slate-500">กำลังโหลดรายการทรัพยากร...</p>
              </div>
            ) : viewMode === 'cards' ? (
              /* Dual View 1: Resource Cards Grid */
              filteredResources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredResources.map((res) => (
                    <ResourceCard
                      key={res._id}
                      resource={res}
                      isOngoing={ongoingIds.has(String(res._id))}
                      onBook={(r) => handleOpenBooking(r)}
                      onViewSchedule={(r) => handleViewSchedule(r)}
                      onOpenDetails={(r) => handleOpenDetails(r)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center">
                  <span className="text-4xl">{activeTab === 'rooms' ? '🏢' : '🚗'}</span>
                  <p className="mt-3 text-base font-bold text-slate-800">ไม่พบรายการที่ตรงกับคำค้นหา</p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-3 rounded-xl bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    ล้างการค้นหา
                  </button>
                </div>
              )
            ) : (
              /* Dual View 2: Day Schedule Timeline */
              <DayScheduleTimeline
                resources={filteredResources}
                bookings={dateBookings}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onBookSlot={(res, date, start, end) => handleOpenBooking(res, date, start, end)}
              />
            )}
          </div>
        )}

        {/* Tab Content: My Bookings */}
        {activeTab === 'my-bookings' && (
          <MyBookingsList
            bookings={myBookings}
            onBookNew={() => {
              setActiveTab('rooms');
              setViewMode('cards');
            }}
          />
        )}

        {/* Tab Content: Admin Management */}
        {activeTab === 'admin' && isAdmin && (
          <AdminBookingsList
            bookings={dateBookings}
            resources={resources}
          />
        )}

        {/* Resource Full Specifications & Details Modal */}
        <ResourceDetailModal
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          resource={selectedResourceForDetail}
          isOngoing={ongoingIds.has(String(selectedResourceForDetail?._id))}
          onBook={(r) => {
            setDetailModalOpen(false);
            handleOpenBooking(r);
          }}
          onViewSchedule={(r) => {
            setDetailModalOpen(false);
            setViewMode('timeline');
          }}
        />

        {/* Reservation Modal */}
        <BookingModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          initialResource={selectedResourceForBooking}
          initialDate={selectedDate}
          initialStartTime={modalInitialStartTime}
          initialEndTime={modalInitialEndTime}
          allResources={resources}
        />
      </div>
    </AppShell>
  );
}

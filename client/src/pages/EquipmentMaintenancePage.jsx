import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.jsx';
import useAuth from '../hooks/useAuth.js';
import useLanguage from '../hooks/useLanguage.js';
import maintenanceService from '../services/maintenanceService.js';
import { exportMaintenanceTicketsToExcel } from '../utils/exportMaintenanceExcel.js';
import FloorPlanAssetPickerModal from '../components/floorplan/FloorPlanAssetPickerModal.jsx';

const ASSET_ICONS = {
  cctv: '📹',
  computer: '💻',
  printer: '🖨️',
  desk: '🪑',
  meeting_table: '👥',
  emergency: '🧯',
  vehicle_car: '🚗',
  vehicle_truck: '🚛',
  vehicle_motorcycle: '🛵',
  vehicle_forklift: '🚜',
  parking_bay: '🅿️',
  ev_charger: '⚡',
  other: '📦',
};

const ASSET_TYPE_LABELS = {
  th: {
    cctv: 'กล้อง CCTV',
    computer: 'คอมพิวเตอร์ / โน้ตบุ๊ก',
    printer: 'เครื่องพิมพ์ / พริ้นเตอร์',
    desk: 'โต๊ะทำงาน',
    meeting_table: 'โต๊ะประชุม',
    emergency: 'ถังดับเพลิง / อุปกรณ์ฉุกเฉิน',
    vehicle_car: 'รถยนต์ส่วนกลาง',
    vehicle_truck: 'รถบรรทุก / ขนส่ง',
    vehicle_motorcycle: 'รถจักรยานยนต์',
    vehicle_forklift: 'รถโฟล์คลิฟท์',
    parking_bay: 'ช่องจอดรถ',
    ev_charger: 'จุดชาร์จ EV',
    other: 'อุปกรณ์อื่นๆ',
  },
  en: {
    cctv: 'CCTV Camera',
    computer: 'Computer / Laptop',
    printer: 'Printer / Copier',
    desk: 'Workstation / Desk',
    meeting_table: 'Meeting Table',
    emergency: 'Fire Extinguisher / Safety',
    vehicle_car: 'Company Car',
    vehicle_truck: 'Truck / Logistics',
    vehicle_motorcycle: 'Motorcycle',
    vehicle_forklift: 'Forklift',
    parking_bay: 'Parking Bay',
    ev_charger: 'EV Charger Station',
    other: 'Other Equipment',
  },
};

const SLA_HOURS_MAP = {
  critical: 4,
  high: 24,
  medium: 48,
  low: 72,
};

export default function EquipmentMaintenancePage() {
  const { user, hasRole, hasPermission } = useAuth();
  const { t, language, locale } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  // Parse query parameters
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const defaultTab = queryParams.get('tab') || (queryParams.get('action') === 'report' ? 'report' : 'tickets');

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [tickets, setTickets] = useState([]);
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [myTicketsOnly, setMyTicketsOnly] = useState(false);

  // Modals
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [statusModalTicket, setStatusModalTicket] = useState(null);
  const [newStatus, setNewStatus] = useState('in_progress');
  const [assignedTech, setAssignedTech] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    assetId: queryParams.get('assetId') || '',
    assetCode: queryParams.get('assetCode') || '',
    assetName: queryParams.get('assetName') || '',
    assetType: queryParams.get('assetType') || 'computer',
    buildingId: queryParams.get('buildingId') || 'hq',
    buildingName: queryParams.get('buildingName') || (language === 'th' ? 'อาคารสำนักงานใหญ่ (HQ)' : 'Headquarters (HQ)'),
    floorNumber: Number(queryParams.get('floor')) || 1,
    roomName: queryParams.get('roomName') || (language === 'th' ? 'พื้นที่ส่วนกลาง' : 'Common Area'),
    floorPlanId: queryParams.get('floorPlanId') || '',
    title: '',
    description: '',
    urgency: 'medium',
    reporterName: user?.name || user?.employeeId?.firstName ? `${user?.employeeId?.firstName || ''} ${user?.employeeId?.lastName || ''}`.trim() : (language === 'th' ? 'พนักงาน' : 'Staff'),
    reporterEmail: user?.email || '',
    reporterPhone: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(null);
  const [formError, setFormError] = useState('');

  // Department / Role Permissions Check
  // Authorized roles and maintenance/IT department staff who can view company-wide KPI and manage tickets
  const isPrivilegedRole =
    hasRole('super_admin') ||
    hasRole('admin') ||
    hasRole('editor') ||
    hasPermission('knowledge:manage') ||
    hasPermission('feedback:manage');

  const userDepartmentName = (
    user?.department ||
    user?.employeeId?.departmentId?.name ||
    user?.employeeId?.department ||
    ''
  ).toLowerCase();

  const isMaintenanceOrItDept =
    userDepartmentName.includes('it') ||
    userDepartmentName.includes('information') ||
    userDepartmentName.includes('สารสนเทศ') ||
    userDepartmentName.includes('maintenance') ||
    userDepartmentName.includes('ซ่อมบำรุง') ||
    userDepartmentName.includes('facility') ||
    userDepartmentName.includes('วิศวกรรม') ||
    userDepartmentName.includes('engineering') ||
    userDepartmentName.includes('admin');

  const canViewCompanyKpi = isPrivilegedRole || isMaintenanceOrItDept;
  const canManageTickets = isPrivilegedRole || isMaintenanceOrItDept;

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const promises = [
        maintenanceService.getAll({
          status: statusFilter,
          urgency: urgencyFilter,
          buildingId: buildingFilter,
          search: search.trim() || undefined,
          myTicketsOnly: myTicketsOnly ? 'true' : undefined,
        }),
      ];

      if (canViewCompanyKpi) {
        promises.push(
          maintenanceService.getKpiSummary({
            buildingId: buildingFilter !== 'all' ? buildingFilter : undefined,
          })
        );
      }

      const [ticketList, kpi] = await Promise.all(promises);
      setTickets(ticketList || []);
      if (kpi) setKpiData(kpi);
    } catch (err) {
      console.error('Failed to load maintenance data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, urgencyFilter, buildingFilter, myTicketsOnly, canViewCompanyKpi]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleSelectAssetFromPicker = (asset) => {
    setFormData((prev) => ({
      ...prev,
      assetId: asset.assetId,
      assetCode: asset.assetCode,
      assetName: asset.assetName,
      assetType: asset.assetType,
      buildingId: asset.buildingId,
      buildingName: asset.buildingName,
      floorNumber: asset.floorNumber,
      roomName: asset.roomName,
      floorPlanId: asset.floorPlanId || '',
    }));
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.assetId || !formData.assetName.trim()) {
      setFormError('กรุณาระบุหรือเลือกอุปกรณ์ที่ต้องการแจ้งซ่อม');
      return;
    }
    if (!formData.title.trim()) {
      setFormError('กรุณากรอกหัวข้อปัญหาที่พบ');
      return;
    }
    if (!formData.reporterPhone.trim()) {
      setFormError('กรุณากรอกเบอร์โทรศัพท์หรือเบอร์ต่อเพื่อให้ช่างติดต่อกลับได้');
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await maintenanceService.create(formData);
      setFormSuccess(res.message || 'ส่งคำขอแจ้งซ่อมเรียบร้อยแล้ว');
      // Reset
      setFormData({
        assetId: '',
        assetCode: '',
        assetName: '',
        assetType: 'computer',
        buildingId: 'hq',
        buildingName: 'อาคารสำนักงานใหญ่ (HQ)',
        floorNumber: 1,
        roomName: 'พื้นที่ส่วนกลาง',
        floorPlanId: '',
        title: '',
        description: '',
        urgency: 'medium',
        reporterName: user?.name || 'พนักงาน',
        reporterEmail: user?.email || '',
        reporterPhone: '',
      });
      loadData();
      setTimeout(() => {
        setFormSuccess(null);
        setActiveTab('tickets');
      }, 1500);
    } catch (err) {
      setFormError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกคำขอ');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!statusModalTicket) return;
    setSubmittingStatus(true);
    try {
      await maintenanceService.updateStatus(statusModalTicket._id, {
        status: newStatus,
        assignedTechnician: assignedTech,
        resolutionNotes,
      });
      setStatusModalTicket(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'ไม่สามารถอัปเดตสถานะได้');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleDeleteTicket = async (ticket) => {
    const isHistory = ['resolved', 'cancelled'].includes(ticket.status);
    const confirmKey = isHistory ? 'deleteHistoryConfirm' : 'deleteTicketConfirm';
    const fallbackMsgTh = isHistory 
      ? `คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการซ่อม ${ticket.ticketNo}?`
      : `คุณแน่ใจหรือไม่ว่าต้องการลบใบแจ้งซ่อม ${ticket.ticketNo}?`;
    const fallbackMsgEn = isHistory
      ? `Are you sure you want to delete repair history ${ticket.ticketNo}?`
      : `Are you sure you want to delete repair ticket ${ticket.ticketNo}?`;

    let confirmMsg = t(confirmKey, { ticketNo: ticket.ticketNo });
    if (confirmMsg === confirmKey || !confirmMsg) {
      confirmMsg = language === 'th' ? fallbackMsgTh : fallbackMsgEn;
    }

    if (!window.confirm(confirmMsg)) return;
    try {
      await maintenanceService.deleteTicket(ticket._id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || (language === 'th' ? 'ไม่สามารถลบใบแจ้งซ่อมได้' : 'Could not delete ticket'));
    }
  };

  const handleExportExcel = () => {
    exportMaintenanceTicketsToExcel({
      tickets,
      kpiData: canViewCompanyKpi ? kpiData : null,
      buildingFilterName: buildingFilter === 'all' ? (language === 'th' ? 'ทุกอาคารในวิทยาเขต' : 'All Campus Buildings') : buildingFilter,
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-primary-900 to-blue-900 p-6 sm:p-8 text-white shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-200 backdrop-blur-md border border-blue-400/30">
                <span>🏢 FTI Campus Facility</span>
                <span>•</span>
                <span>Service Desk & Maintenance</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {t('maintenancePortalTitle')}
              </h1>
              <p className="text-sm text-blue-100/80 leading-relaxed">
                {t('maintenancePortalSubtitle')}
              </p>
            </div>

            {/* Top Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    reporterName: user?.name || prev.reporterName,
                    reporterEmail: user?.email || prev.reporterEmail,
                  }));
                  setActiveTab('report');
                }}
                className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-blue-400 active:scale-95"
              >
                <span>➕</span>
                <span>{t('reportNewIssue')}</span>
              </button>

              <Link
                to="/floor-plan"
                className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95 border border-white/20"
              >
                <span>🗺️</span>
                <span>{t('floorPlan')}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            <button
              type="button"
              onClick={() => {
                setActiveTab('tickets');
                setStatusFilter('all');
              }}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition whitespace-nowrap ${activeTab === 'tickets'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
              <span>📋 {t('activeTicketsTab') || t('ticketsQueue')}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {tickets.filter(t => ['pending', 'in_progress'].includes(t.status)).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('history');
                setStatusFilter('all');
              }}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition whitespace-nowrap ${activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
              <span>🗄️ {t('repairHistoryTab') || 'ประวัติการซ่อม'}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {tickets.filter(t => ['resolved', 'cancelled'].includes(t.status)).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('report');
                setStatusFilter('all');
              }}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition whitespace-nowrap ${activeTab === 'report'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
              <span>📝 {t('submitReportTab')}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              loadData();
            }}
            title={t('refresh')}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600"
          >
            <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
            <span className="hidden sm:inline">{refreshing ? t('refreshing') : t('refresh')}</span>
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1 & 2: TICKETS QUEUE & HISTORY */}
        {/* ------------------------------------------------------------- */}
        {(activeTab === 'tickets' || activeTab === 'history') && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-2.5 text-slate-400">🔍</span>
                  <input
                    type="text"
                    placeholder={t('searchTicketsPlaceholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">{t('allStatuses')}</option>
                    {activeTab === 'tickets' && (
                      <>
                        <option value="pending">⏳ {t('statusPending')}</option>
                        <option value="in_progress">🔧 {t('statusInProgress')}</option>
                      </>
                    )}
                    {activeTab === 'history' && (
                      <>
                        <option value="resolved">✅ {t('statusResolved')}</option>
                        <option value="cancelled">❌ {t('statusCancelled')}</option>
                      </>
                    )}
                  </select>

                  <select
                    value={urgencyFilter}
                    onChange={(e) => setUrgencyFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">{t('allUrgencies')}</option>
                    <option value="critical">🔴 {t('urgencyCritical')}</option>
                    <option value="high">🟠 {t('urgencyHigh')}</option>
                    <option value="medium">🟡 {t('urgencyMedium')}</option>
                    <option value="low">🟢 {t('urgencyLow')}</option>
                  </select>

                  <select
                    value={buildingFilter}
                    onChange={(e) => setBuildingFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">{t('allBuildings')}</option>
                    <option value="hq">HQ Office</option>
                    <option value="factory1">Factory 1</option>
                    <option value="warehouse1">Warehouse 1</option>
                    <option value="showroom">Showroom</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setMyTicketsOnly((prev) => !prev)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${myTicketsOnly
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    👤 {t('myTicketsOnly')}
                  </button>

                  <button
                    type="submit"
                    className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-900"
                  >
                    {t('search')}
                  </button>
                </div>
              </form>
            </div>

            {/* Ticket Cards List */}
            {loading ? (
              <div className="py-16 text-center text-slate-500">
                <span className="inline-block animate-spin text-3xl">⏳</span>
                <p className="mt-2 text-sm">{t('loadingData')}</p>
              </div>
            ) : tickets.filter(tItem => activeTab === 'tickets' ? ['pending', 'in_progress'].includes(tItem.status) : ['resolved', 'cancelled'].includes(tItem.status)).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-slate-400">
                <span className="text-4xl">{activeTab === 'history' ? '🗄️' : '📋'}</span>
                <h3 className="mt-2 text-base font-bold text-slate-700">
                  {activeTab === 'history' ? (t('noHistoryFound') || 'ไม่พบประวัติการซ่อม') : t('noTicketsFound')}
                </h3>
                <p className="text-xs text-slate-400">
                  {activeTab === 'history' ? (t('historyTabSubtitle') || 'ยังไม่มีรายการที่ซ่อมเสร็จหรือถูกยกเลิก') : t('noData')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.filter(tItem => activeTab === 'tickets' ? ['pending', 'in_progress'].includes(tItem.status) : ['resolved', 'cancelled'].includes(tItem.status)).map((tItem) => {
                  const slaLimit = SLA_HOURS_MAP[tItem.urgency] || 48;
                  const isResolved = tItem.status === 'resolved';
                  const createdAt = new Date(tItem.createdAt);
                  const resolvedAt = tItem.resolvedAt ? new Date(tItem.resolvedAt) : null;
                  const diffHours = resolvedAt
                    ? Math.round(((resolvedAt - createdAt) / (1000 * 60 * 60)) * 10) / 10
                    : Math.round(((new Date() - createdAt) / (1000 * 60 * 60)) * 10) / 10;
                  const isOverdue = diffHours > slaLimit;

                  return (
                    <div
                      key={tItem._id}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs transition hover:border-blue-300 hover:shadow-md"
                    >
                      {/* Left: Info */}
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-2xl shadow-inner">
                          {ASSET_ICONS[tItem.assetType] || '📦'}
                        </span>

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                              {tItem.ticketNo}
                            </span>
                            {tItem.assetCode && (
                              <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                {tItem.assetCode}
                              </span>
                            )}

                            {/* Urgency Badge */}
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${tItem.urgency === 'critical'
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : tItem.urgency === 'high'
                                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                  : tItem.urgency === 'medium'
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                            >
                              {tItem.urgency === 'critical'
                                ? `🔴 ${t('urgencyCritical')}`
                                : tItem.urgency === 'high'
                                  ? `🟠 ${t('urgencyHigh')}`
                                  : tItem.urgency === 'medium'
                                    ? `🟡 ${t('urgencyMedium')}`
                                    : `🟢 ${t('urgencyLow')}`}
                            </span>

                            {/* Status Badge */}
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${tItem.status === 'resolved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : tItem.status === 'in_progress'
                                  ? 'bg-amber-100 text-amber-800'
                                  : tItem.status === 'cancelled'
                                    ? 'bg-slate-100 text-slate-500 line-through'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                            >
                              {tItem.status === 'resolved'
                                ? `✅ ${t('statusResolved')}`
                                : tItem.status === 'in_progress'
                                  ? `🔧 ${t('statusInProgress')}`
                                  : tItem.status === 'cancelled'
                                    ? `❌ ${t('statusCancelled')}`
                                    : `⏳ ${t('statusPending')}`}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-slate-900 truncate">
                            {tItem.title}
                          </h3>

                          {tItem.description && (
                            <p className="text-xs text-slate-600 line-clamp-2">
                              {tItem.description}
                            </p>
                          )}

                          {/* Location & Reporter Info */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-1">
                            <span className="font-semibold text-slate-700">
                              {tItem.assetName}
                            </span>
                            <span>•</span>
                            <span>🏢 {tItem.buildingName} ({t('floorLabel')} {tItem.floorNumber})</span>
                            <span>•</span>
                            <span>📍 {tItem.roomName}</span>
                            <span>•</span>
                            <span>👤 {language === 'th' ? 'ผู้แจ้ง' : 'Reporter'}: {tItem.reporterName} {tItem.reporterPhone ? `(${tItem.reporterPhone})` : ''}</span>
                          </div>

                          {/* Resolution Info */}
                          {tItem.resolutionNotes && (
                            <div className="mt-2 rounded-lg bg-emerald-50/80 p-2 text-xs text-emerald-900 border border-emerald-200">
                              <strong>🛠️ {language === 'th' ? 'การแก้ไข' : 'Resolution'} ({tItem.assignedTechnician || t('assignedTech')}):</strong> {tItem.resolutionNotes}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions & SLA Indicator */}
                      <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                        <div className="text-right">
                          <p className="text-[11px] text-slate-400">
                            {t('reportedOn')}: {createdAt.toLocaleDateString(locale)} {createdAt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p
                            className={`text-xs font-bold ${isResolved
                              ? isOverdue
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                              : isOverdue
                                ? 'text-red-600 font-extrabold animate-pulse'
                                : 'text-blue-600'
                              }`}
                          >
                            {isResolved
                              ? `${t('responseTime')}: ${diffHours} ${language === 'th' ? 'ชม.' : 'hrs'} ${isOverdue ? `(${t('overdueSla')})` : `(${t('metSla')})`}`
                              : `${language === 'th' ? 'ผ่านมา' : 'Elapsed'}: ${diffHours} / ${slaLimit} ${language === 'th' ? 'ชม.' : 'hrs'} ${isOverdue ? `⚠️ ${t('overdueSla')}` : ''}`}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              navigate(
                                `/floor-plan?buildingId=${tItem.buildingId}&floor=${tItem.floorNumber}&highlight=${tItem.assetId}`
                              );
                            }}
                            title={t('floorPlan')}
                            className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 border border-blue-200"
                          >
                            <span>🎯</span>
                            <span className="hidden sm:inline">{language === 'th' ? 'ดูบนผัง' : 'Map'}</span>
                          </button>

                          {canManageTickets && (
                            <button
                              type="button"
                              onClick={() => {
                                setStatusModalTicket(tItem);
                                setNewStatus(tItem.status);
                                setAssignedTech(tItem.assignedTechnician || user?.name || '');
                                setResolutionNotes(tItem.resolutionNotes || '');
                              }}
                              className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 border border-slate-200"
                            >
                              ✏️ {t('updateStatus')}
                            </button>
                          )}

                          {(canManageTickets || (tItem.reportedBy?._id === user?._id && tItem.status === 'pending')) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTicket(tItem)}
                              title={t('delete')}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: NEW REPORT FORM (Clean & Redesigned 3-Step UI) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'report' && (
          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            {/* Form Header */}
            <div className="border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl text-blue-700 shadow-inner">
                  🛠️
                </span>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {t('maintenancePortalTitle')}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('maintenancePortalSubtitle')}
                  </p>
                </div>
              </div>
            </div>

            {/* Success / Error Alerts */}
            {formSuccess && (
              <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 border border-emerald-200 flex items-center gap-3">
                <span className="text-xl">✅</span>
                <span>{formSuccess}</span>
              </div>
            )}

            {formError && (
              <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-800 border border-red-200 flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="mt-6 space-y-6">
              {/* SECTION 1: Target Asset Card / Selector */}
              <div className="rounded-2xl border border-blue-200/80 bg-blue-50/50 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-blue-950 flex items-center gap-1.5">
                      <span>📍</span>
                      <span>{t('formStep1Title')}</span>
                    </h3>
                    <p className="text-xs text-blue-800/70 mt-0.5">
                      {t('formStep1Desc')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAssetPickerOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 border border-blue-500"
                  >
                    <span>🗺️</span>
                    <span>{t('interactiveFloorPlanBtn')}</span>
                  </button>
                </div>

                {/* Selected Asset Banner if chosen */}
                {formData.assetId && (
                  <div className="flex items-center justify-between rounded-xl border border-blue-300/80 bg-white p-3 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xl">
                        {ASSET_ICONS[formData.assetType] || '📦'}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {formData.assetCode && (
                            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-mono font-bold text-blue-800">
                              {formData.assetCode}
                            </span>
                          )}
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {formData.assetName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          🏢 {formData.buildingName} • {t('floorLabel')} {formData.floorNumber} • 📍 {formData.roomName}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAssetPickerOpen(true)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 shrink-0 px-2 py-1"
                    >
                      {t('changeAssetBtn')}
                    </button>
                  </div>
                )}

                {/* Form fields for asset details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('assetCodeLabel')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('assetCodePlaceholder')}
                      value={formData.assetCode}
                      onChange={(e) => setFormData({ ...formData, assetCode: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-mono text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('assetNameLabel')} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t('assetNamePlaceholder')}
                      value={formData.assetName}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          assetName: e.target.value,
                          assetId: formData.assetId || `asset-${Date.now()}`,
                        });
                      }}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="min-w-0">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('assetTypeLabel')}
                    </label>
                    <select
                      value={formData.assetType}
                      onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="computer">💻 {ASSET_TYPE_LABELS[language]?.computer || 'Computer'}</option>
                      <option value="cctv">📹 {ASSET_TYPE_LABELS[language]?.cctv || 'CCTV'}</option>
                      <option value="printer">🖨️ {ASSET_TYPE_LABELS[language]?.printer || 'Printer'}</option>
                      <option value="emergency">🧯 {ASSET_TYPE_LABELS[language]?.emergency || 'Emergency'}</option>
                      <option value="vehicle_car">🚗 {ASSET_TYPE_LABELS[language]?.vehicle_car || 'Vehicle'}</option>
                      <option value="parking_bay">🅿️ {ASSET_TYPE_LABELS[language]?.parking_bay || 'Parking Bay'}</option>
                      <option value="other">📦 {ASSET_TYPE_LABELS[language]?.other || 'Other'}</option>
                    </select>
                  </div>

                  <div className="min-w-0">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('buildingInstalledLabel')}
                    </label>
                    <input
                      type="text"
                      value={formData.buildingName}
                      onChange={(e) => setFormData({ ...formData, buildingName: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('floorAndRoomLabel')}
                    </label>
                    <div className="flex gap-2 min-w-0">
                      <input
                        type="number"
                        min="1"
                        max="15"
                        title={t('floorPlaceholder')}
                        placeholder={t('floorPlaceholder')}
                        value={formData.floorNumber}
                        onChange={(e) => setFormData({ ...formData, floorNumber: e.target.value === '' ? '' : Number(e.target.value) })}
                        className="w-14 sm:w-16 shrink-0 rounded-xl border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 text-center focus:border-blue-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder={t('roomPlaceholder')}
                        value={formData.roomName}
                        onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
                        className="flex-1 min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Issue Details & Urgency */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>{t('formStep2Title')}</span>
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('issueTitleLabel')} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('issueTitlePlaceholder')}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('issueDescLabel')}
                  </label>
                  <textarea
                    rows="3"
                    placeholder={t('issueDescPlaceholder')}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Urgency Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    {t('urgencyLevelDesc')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {[
                      { key: 'critical', label: `🔴 ${t('urgencyCritical')}`, sla: t('urgencySlaWithin', { hours: 4 }), desc: t('urgencyCriticalDesc') },
                      { key: 'high', label: `🟠 ${t('urgencyHigh')}`, sla: t('urgencySlaWithin', { hours: 24 }), desc: t('urgencyHighDesc') },
                      { key: 'medium', label: `🟡 ${t('urgencyMedium')}`, sla: t('urgencySlaWithin', { hours: 48 }), desc: t('urgencyMediumDesc') },
                      { key: 'low', label: `🟢 ${t('urgencyLow')}`, sla: t('urgencySlaWithin', { hours: 72 }), desc: t('urgencyLowDesc') },
                    ].map((u) => (
                      <button
                        key={u.key}
                        type="button"
                        onClick={() => setFormData({ ...formData, urgency: u.key })}
                        className={`rounded-2xl border p-3 text-left transition ${formData.urgency === u.key
                          ? 'border-blue-600 bg-blue-50/90 ring-2 ring-blue-300/80 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                      >
                        <p className="text-xs font-bold text-slate-900">{u.label}</p>
                        <p className="text-xs font-extrabold text-blue-700 mt-0.5">{u.sla}</p>
                        <p className="text-[11px] text-slate-500 mt-1 leading-tight">{u.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 3: Reporter Contacts */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span>👤</span>
                  <span>{t('formStep3Title')}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('reporterNameLabel')}
                    </label>
                    <input
                      type="text"
                      value={formData.reporterName}
                      onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('reporterPhoneLabel')} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t('reporterPhonePlaceholder')}
                      value={formData.reporterPhone}
                      onChange={(e) => setFormData({ ...formData, reporterPhone: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('tickets')}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>{t('submittingTicket')}</span>
                    </>
                  ) : (
                    <>
                      <span>📨</span>
                      <span>{t('submitTicketBtn')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Status Update Modal (Admin / Tech) */}
        {statusModalTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {t('updateStatusModalTitle', { ticketNo: statusModalTicket.ticketNo })}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {statusModalTicket.title} ({statusModalTicket.assetName})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusModalTicket(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveStatus} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {t('maintenanceStatusLabel')}
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm font-medium text-slate-800"
                  >
                    <option value="pending">⏳ {t('statusPending')}</option>
                    <option value="in_progress">🔧 {t('statusInProgress')}</option>
                    <option value="resolved">✅ {t('statusResolved')}</option>
                    <option value="cancelled">❌ {t('statusCancelled')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {t('assignedTechLabel')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('assignedTechPlaceholder')}
                    value={assignedTech}
                    onChange={(e) => setAssignedTech(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {t('resolutionNotesLabel')}
                  </label>
                  <textarea
                    rows="3"
                    placeholder={t('resolutionNotesPlaceholder')}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStatusModalTicket(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingStatus}
                    className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submittingStatus ? t('savingStatus') : t('saveChangesBtn')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Floor Plan Asset Picker Modal */}
        <FloorPlanAssetPickerModal
          isOpen={assetPickerOpen}
          onClose={() => setAssetPickerOpen(false)}
          onSelectAsset={handleSelectAssetFromPicker}
        />
      </div>
    </AppShell>
  );
}

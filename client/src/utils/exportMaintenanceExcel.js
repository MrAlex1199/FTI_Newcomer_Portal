import * as XLSX from 'xlsx';

/**
 * SLA Target reference in hours
 */
const SLA_LIMITS = {
  critical: 4,
  high: 24,
  medium: 48,
  low: 72,
};

const ASSET_TYPE_LABELS = {
  cctv: 'กล้อง CCTV',
  computer: 'คอมพิวเตอร์ / โน้ตบุ๊ก',
  printer: 'เครื่องพิมพ์ / พริ้นเตอร์',
  desk: 'โต๊ะทำงาน',
  meeting_table: 'โต๊ะประชุม',
  emergency: 'อุปกรณ์ฉุกเฉิน / ถังดับเพลิง',
  vehicle_car: 'รถยนต์ส่วนกลาง',
  vehicle_truck: 'รถบรรทุก / ขนส่ง',
  vehicle_motorcycle: 'รถจักรยานยนต์',
  vehicle_forklift: 'รถโฟล์คลิฟท์',
  parking_bay: 'ช่องจอดรถ',
  ev_charger: 'จุดชาร์จ EV',
  other: 'อุปกรณ์อื่นๆ',
};

const URGENCY_LABELS = {
  critical: '🔴 วิกฤต (Critical - 4 ชม.)',
  high: '🟠 สูง (High - 24 ชม.)',
  medium: '🟡 ปานกลาง (Medium - 48 ชม.)',
  low: '🟢 ต่ำ (Low - 72 ชม.)',
};

const STATUS_LABELS = {
  pending: '⏳ รอรับเรื่อง (Pending)',
  in_progress: '🔧 กำลังดำเนินการ (In Progress)',
  resolved: '✅ ซ่อมเสร็จสิ้น (Resolved)',
  cancelled: '❌ ยกเลิก (Cancelled)',
};

/**
 * Format Date to readable Thai string
 */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Calculate duration in hours between two dates
 */
function getDurationHours(startStr, endStr) {
  if (!startStr || !endStr) return null;
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffMs = end - start;
  if (diffMs < 0) return 0;
  return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
}

/**
 * Determine SLA Compliance text
 */
function getSlaStatus(ticket) {
  const slaLimit = SLA_LIMITS[ticket.urgency] || 48;
  if (ticket.status === 'resolved') {
    if (!ticket.resolvedAt) return '✅ ซ่อมเสร็จ (ไม่ระบุเวลา)';
    const dur = getDurationHours(ticket.createdAt, ticket.resolvedAt);
    return dur <= slaLimit ? `✅ ผ่าน SLA (${dur} ชม. / ${slaLimit} ชม.)` : `⚠️ เกิน SLA (${dur} ชม. / ${slaLimit} ชม.)`;
  }
  if (ticket.status === 'cancelled') {
    return '➖ ยกเลิก';
  }
  // Open ticket
  const openHours = getDurationHours(ticket.createdAt, new Date());
  return openHours > slaLimit
    ? `🚨 เกินกำหนดแล้ว (${openHours} ชม. / ${slaLimit} ชม.)`
    : `⏳ อยู่ในเกณฑ์ (${openHours} ชม. / ${slaLimit} ชม.)`;
}

/**
 * Export tickets and KPI summary to Excel (.xlsx)
 */
export function exportMaintenanceTicketsToExcel({ tickets = [], kpiData = null, buildingFilterName = 'ทุกอาคาร' }) {
  const workbook = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // Sheet 1: รายการแจ้งซ่อม (Tickets Data)
  // -------------------------------------------------------------
  const ticketRows = tickets.map((t, index) => {
    const duration = t.resolvedAt ? getDurationHours(t.createdAt, t.resolvedAt) : null;
    return {
      'ลำดับ': index + 1,
      'รหัสใบแจ้งซ่อม': t.ticketNo || '-',
      'วันที่แจ้ง': formatDate(t.createdAt),
      'วันที่ซ่อมเสร็จ': formatDate(t.resolvedAt),
      'เวลาที่ใช้ซ่อม (ชม.)': duration !== null ? duration : '-',
      'การปฏิบัติตาม SLA': getSlaStatus(t),
      'ระดับความเร่งด่วน': URGENCY_LABELS[t.urgency] || t.urgency || '-',
      'สถานะปัจจุบัน': STATUS_LABELS[t.status] || t.status || '-',
      'รหัสทรัพย์สิน': t.assetCode || '-',
      'ชื่ออุปกรณ์': t.assetName || '-',
      'ประเภทอุปกรณ์': ASSET_TYPE_LABELS[t.assetType] || t.assetType || '-',
      'อาคาร': t.buildingName || t.buildingId || '-',
      'ชั้น': t.floorNumber ? `ชั้น ${t.floorNumber}` : '-',
      'ห้อง/ตำแหน่ง': t.roomName || 'พื้นที่ส่วนกลาง',
      'หัวข้อปัญหา': t.title || '-',
      'รายละเอียดอาการเสีย': t.description || '-',
      'ผู้แจ้ง': t.reporterName || '-',
      'เบอร์โทรติดต่อ': t.reporterPhone || '-',
      'อีเมลผู้แจ้ง': t.reporterEmail || '-',
      'ช่างผู้รับผิดชอบ': t.assignedTechnician || 'ยังไม่มอบหมาย',
      'บันทึกการแก้ไข': t.resolutionNotes || '-',
    };
  });

  const wsTickets = XLSX.utils.json_to_sheet(ticketRows);

  // Auto-fit column widths
  const colWidths = [
    { wch: 6 },  // ลำดับ
    { wch: 16 }, // รหัสใบแจ้งซ่อม
    { wch: 18 }, // วันที่แจ้ง
    { wch: 18 }, // วันที่ซ่อมเสร็จ
    { wch: 18 }, // เวลาที่ใช้ซ่อม
    { wch: 28 }, // SLA
    { wch: 26 }, // ระดับความเร่งด่วน
    { wch: 24 }, // สถานะ
    { wch: 14 }, // รหัสทรัพย์สิน
    { wch: 22 }, // ชื่ออุปกรณ์
    { wch: 22 }, // ประเภทอุปกรณ์
    { wch: 20 }, // อาคาร
    { wch: 8 },  // ชั้น
    { wch: 20 }, // ห้อง
    { wch: 30 }, // หัวข้อปัญหา
    { wch: 35 }, // รายละเอียด
    { wch: 18 }, // ผู้แจ้ง
    { wch: 16 }, // เบอร์โทร
    { wch: 22 }, // อีเมล
    { wch: 20 }, // ช่าง
    { wch: 30 }, // บันทึก
  ];
  wsTickets['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(workbook, wsTickets, 'รายการแจ้งซ่อม');

  // -------------------------------------------------------------
  // Sheet 2: สรุปผล KPI (KPI & SLA Summary)
  // -------------------------------------------------------------
  const nowStr = formatDate(new Date());
  const metrics = kpiData?.kpiMetrics || {};
  const statusCounts = kpiData?.statusCounts || {};
  const urgency = kpiData?.urgencyBreakdown || {};
  const buildings = kpiData?.buildingBreakdown || [];

  const summaryAOA = [
    ['รายงานสรุปผลตัวชี้วัดประสิทธิภาพงานซ่อมบำรุง (Smart Campus Maintenance KPI Report)'],
    ['Function International Public Company Limited (FTI)'],
    ['ข้อมูล ณ วันที่:', nowStr, 'ขอบเขตอาคาร:', buildingFilterName],
    [],
    ['=== 1. สรุปตัวชี้วัดหลัก (Key Performance Indicators) ===', ''],
    ['ตัวชี้วัด (KPI Metric)', 'ผลการดำเนินงาน', 'เกณฑ์เป้าหมาย (Target)', 'สถานะประเมิน'],
    ['จำนวนใบแจ้งซ่อมทั้งหมด (Total Tickets)', kpiData?.total || tickets.length, '-', '-'],
    ['อัตราการแก้ไขปัญหาสำเร็จ (% Resolution Rate)', `${metrics.resolutionRate || 0}%`, '≥ 85.0%', (metrics.resolutionRate || 0) >= 85 ? '✅ ผ่านเกณฑ์' : '⚠️ ต้องปรับปรุง'],
    ['เวลาเฉลี่ยในการแก้ไข (MTTR - Mean Time to Resolve)', `${metrics.mttrHours || 0} ชั่วโมง`, '≤ 24.0 ชม.', (metrics.mttrHours || 0) <= 24 ? '✅ ยอดเยี่ยม' : '⚠️ เฝ้าระวัง'],
    ['อัตราผ่านเกณฑ์เวลา SLA (% SLA Compliance)', `${metrics.slaComplianceRate || 0}%`, '≥ 90.0%', (metrics.slaComplianceRate || 0) >= 90 ? '✅ ผ่านเกณฑ์' : '⚠️ ต่ำกว่าเป้าหมาย'],
    ['จำนวนงานที่ซ่อมทัน SLA (SLA Met)', metrics.slaMetCount || 0, '-', '-'],
    ['จำนวนงานที่เกินกำหนด SLA (SLA Breached)', metrics.slaBreachedCount || 0, '0 รายการ', (metrics.slaBreachedCount || 0) === 0 ? '✅ ดีเลิศ' : '🚨 มีงานตกค้าง'],
    ['งานระดับวิกฤตที่ยังค้างซ่อม (Active Critical)', metrics.activeCriticalCount || 0, '0 รายการ', (metrics.activeCriticalCount || 0) === 0 ? '✅ ปลอดภัย' : '🔴 วิกฤติต้องจัดการทันที'],
    [],
    ['=== 2. สรุปสถานะใบแจ้งซ่อม (Status Distribution) ===', ''],
    ['สถานะ', 'จำนวน (รายการ)', 'สัดส่วน (%)'],
    ['รอรับเรื่อง (Pending)', statusCounts.pending || 0, `${kpiData?.total ? Math.round(((statusCounts.pending || 0) / kpiData.total) * 100) : 0}%`],
    ['กำลังดำเนินการ (In Progress)', statusCounts.inProgress || 0, `${kpiData?.total ? Math.round(((statusCounts.inProgress || 0) / kpiData.total) * 100) : 0}%`],
    ['ซ่อมเสร็จสิ้น (Resolved)', statusCounts.resolved || 0, `${kpiData?.total ? Math.round(((statusCounts.resolved || 0) / kpiData.total) * 100) : 0}%`],
    ['ยกเลิก (Cancelled)', statusCounts.cancelled || 0, `${kpiData?.total ? Math.round(((statusCounts.cancelled || 0) / kpiData.total) * 100) : 0}%`],
    [],
    ['=== 3. การแจกแจงตามระดับความเร่งด่วน (Urgency Breakdown) ===', ''],
    ['ระดับความเร่งด่วน', 'เกณฑ์เวลา SLA', 'จำนวน (รายการ)'],
    ['วิกฤต (Critical)', 'ภายใน 4 ชั่วโมง', urgency.critical || 0],
    ['สูง (High)', 'ภายใน 24 ชั่วโมง', urgency.high || 0],
    ['ปานกลาง (Medium)', 'ภายใน 48 ชั่วโมง', urgency.medium || 0],
    ['ต่ำ (Low)', 'ภายใน 72 ชั่วโมง', urgency.low || 0],
    [],
    ['=== 4. สรุปสถิติรายอาคาร (Building Breakdown) ===', ''],
    ['รหัสอาคาร', 'ชื่ออาคาร', 'จำนวนทั้งหมด', 'รอดำเนินการ', 'กำลังซ่อม', 'เสร็จสิ้นแล้ว'],
  ];

  buildings.forEach((b) => {
    summaryAOA.push([
      b.buildingId,
      b.buildingName,
      b.total,
      b.pending,
      b.inProgress,
      b.resolved,
    ]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAOA);
  wsSummary['!cols'] = [
    { wch: 45 },
    { wch: 25 },
    { wch: 25 },
    { wch: 22 },
    { wch: 15 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(workbook, wsSummary, 'สรุปผล KPI');

  // -------------------------------------------------------------
  // Generate filename & trigger browser download
  // -------------------------------------------------------------
  const dateSlug = new Date().toISOString().split('T')[0];
  const filename = `FTI_Maintenance_KPI_Report_${dateSlug}.xlsx`;

  XLSX.writeFile(workbook, filename);
  return filename;
}

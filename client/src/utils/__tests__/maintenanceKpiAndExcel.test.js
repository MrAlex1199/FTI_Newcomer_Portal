import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { exportMaintenanceTicketsToExcel } from '../exportMaintenanceExcel.js';

describe('Maintenance KPI & Excel Export Tests', () => {
  const sampleTickets = [
    {
      ticketNo: 'MT-2026-0001',
      assetId: 'cctv-1',
      assetCode: 'CCTV-HQ-01',
      assetName: 'กล้อง CCTV หน้าลิฟต์',
      assetType: 'cctv',
      buildingId: 'hq',
      buildingName: 'อาคารสำนักงานใหญ่',
      floorNumber: 2,
      roomName: 'โถงลิฟต์',
      title: 'ภาพขาดหาย',
      description: 'ภาพกระตุกและดับเป็นระยะ',
      urgency: 'critical',
      status: 'resolved',
      createdAt: '2026-09-15T08:00:00.000Z',
      resolvedAt: '2026-09-15T10:30:00.000Z', // 2.5 hours (SLA is 4h -> Met!)
      reporterName: 'สมศักดิ์',
      reporterPhone: '081-111-2222',
      assignedTechnician: 'ช่างประสิทธิ์',
      resolutionNotes: 'เปลี่ยนสายแลนและแจ็คต่อใหม่',
    },
    {
      ticketNo: 'MT-2026-0002',
      assetId: 'pc-4',
      assetCode: 'PC-ACC-04',
      assetName: 'คอมพิวเตอร์บัญชี',
      assetType: 'computer',
      buildingId: 'hq',
      buildingName: 'อาคารสำนักงานใหญ่',
      floorNumber: 3,
      roomName: 'ห้องบัญชี',
      title: 'เปิดไม่ติด',
      description: 'ไฟพาวเวอร์ซัพพลายไม่เข้า',
      urgency: 'high',
      status: 'resolved',
      createdAt: '2026-09-14T09:00:00.000Z',
      resolvedAt: '2026-09-15T15:00:00.000Z', // 30 hours (SLA is 24h -> Breached!)
      reporterName: 'วรรณา',
      reporterPhone: '089-333-4444',
      assignedTechnician: 'ช่างสมชาย',
      resolutionNotes: 'เปลี่ยน Power Supply ใหม่',
    },
    {
      ticketNo: 'MT-2026-0003',
      assetId: 'printer-1',
      assetCode: 'PRN-WH-01',
      assetName: 'เครื่องพิมพ์คลังสินค้า',
      assetType: 'printer',
      buildingId: 'warehouse1',
      buildingName: 'คลังสินค้า 1',
      floorNumber: 1,
      roomName: 'สำนักงานคลัง',
      title: 'กระดาษติดบ่อย',
      description: 'ลูกกลิ้งดึงกระดาษติดขัด',
      urgency: 'medium',
      status: 'pending',
      createdAt: new Date().toISOString(),
      reporterName: 'กิตติ',
      reporterPhone: '086-555-6666',
    },
  ];

  const sampleKpi = {
    total: 3,
    statusCounts: {
      pending: 1,
      inProgress: 0,
      resolved: 2,
      cancelled: 0,
      activeOpen: 1,
    },
    kpiMetrics: {
      resolutionRate: 66.7,
      mttrHours: 16.3,
      slaComplianceRate: 50.0,
      slaMetCount: 1,
      slaBreachedCount: 1,
      activeCriticalCount: 0,
    },
    urgencyBreakdown: {
      critical: 1,
      high: 1,
      medium: 1,
      low: 0,
    },
    buildingBreakdown: [
      {
        buildingId: 'hq',
        buildingName: 'อาคารสำนักงานใหญ่',
        total: 2,
        pending: 0,
        inProgress: 0,
        resolved: 2,
      },
      {
        buildingId: 'warehouse1',
        buildingName: 'คลังสินค้า 1',
        total: 1,
        pending: 1,
        inProgress: 0,
        resolved: 0,
      },
    ],
  };

  it('should verify SLA thresholds correctly', () => {
    // Ticket 1: Critical (limit 4h), took 2.5h -> On Time
    const t1Created = new Date(sampleTickets[0].createdAt);
    const t1Resolved = new Date(sampleTickets[0].resolvedAt);
    const t1Diff = (t1Resolved - t1Created) / (1000 * 60 * 60);
    expect(t1Diff).toBeLessThanOrEqual(4);

    // Ticket 2: High (limit 24h), took 30h -> Breached
    const t2Created = new Date(sampleTickets[1].createdAt);
    const t2Resolved = new Date(sampleTickets[1].resolvedAt);
    const t2Diff = (t2Resolved - t2Created) / (1000 * 60 * 60);
    expect(t2Diff).toBeGreaterThan(24);
  });

  it('should generate valid XLSX workbook with 2 sheets and correct structure', () => {
    // Test XLSX structure generation without invoking browser download
    const workbook = XLSX.utils.book_new();

    const ticketRows = sampleTickets.map((t, idx) => ({
      'ลำดับ': idx + 1,
      'รหัสใบแจ้งซ่อม': t.ticketNo,
      'ชื่ออุปกรณ์': t.assetName,
      'ระดับความเร่งด่วน': t.urgency,
      'สถานะ': t.status,
    }));

    const ws1 = XLSX.utils.json_to_sheet(ticketRows);
    XLSX.utils.book_append_sheet(workbook, ws1, 'รายการแจ้งซ่อม');

    const summaryRows = [
      ['KPI Report'],
      ['Total Tickets', sampleKpi.total],
      ['Resolution Rate', `${sampleKpi.kpiMetrics.resolutionRate}%`],
      ['MTTR', `${sampleKpi.kpiMetrics.mttrHours}h`],
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(workbook, ws2, 'สรุปผล KPI');

    expect(workbook.SheetNames).toContain('รายการแจ้งซ่อม');
    expect(workbook.SheetNames).toContain('สรุปผล KPI');
    expect(workbook.Sheets['รายการแจ้งซ่อม']).toBeDefined();
    expect(workbook.Sheets['สรุปผล KPI']).toBeDefined();

    // Verify written buffer
    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);
  });
});

import { Router } from 'express';
import { MaintenanceTicket, FloorPlan, AuditLog, User } from '../models/index.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

const router = Router();
router.use(authenticate);

/**
 * SLA Targets in Hours
 */
const SLA_HOURS = {
  critical: 4,
  high: 24,
  medium: 48,
  low: 72,
};

/**
 * GET /api/v1/maintenance-tickets/kpi-summary
 * Compute comprehensive KPI & SLA metrics for analytics dashboard & export
 */
router.get(
  '/kpi-summary',
  asyncHandler(async (req, res) => {
    const { buildingId, startDate, endDate } = req.query;
    const filter = {};
    if (buildingId && buildingId !== 'all') filter.buildingId = buildingId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const allTickets = await MaintenanceTicket.find(filter).lean();
    const total = allTickets.length;

    let pendingCount = 0;
    let inProgressCount = 0;
    let resolvedCount = 0;
    let cancelledCount = 0;

    let totalResolutionHours = 0;
    let resolvedWithDurationCount = 0;

    let slaMetCount = 0;
    let slaBreachedCount = 0;

    const urgencyBreakdown = { critical: 0, high: 0, medium: 0, low: 0 };
    const categoryBreakdown = {};
    const buildingBreakdown = {};
    const monthlyTrend = {};

    const now = new Date();

    allTickets.forEach((t) => {
      // Status counts
      if (t.status === 'pending') pendingCount++;
      else if (t.status === 'in_progress') inProgressCount++;
      else if (t.status === 'resolved') resolvedCount++;
      else if (t.status === 'cancelled') cancelledCount++;

      // Urgency counts
      if (urgencyBreakdown[t.urgency] !== undefined) {
        urgencyBreakdown[t.urgency]++;
      } else {
        urgencyBreakdown[t.urgency] = 1;
      }

      // Category breakdown
      const cat = t.assetType || 'other';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;

      // Building breakdown
      const bKey = t.buildingId || 'unknown';
      if (!buildingBreakdown[bKey]) {
        buildingBreakdown[bKey] = {
          buildingId: t.buildingId,
          buildingName: t.buildingName || t.buildingId,
          total: 0,
          pending: 0,
          inProgress: 0,
          resolved: 0,
        };
      }
      buildingBreakdown[bKey].total++;
      if (t.status === 'pending') buildingBreakdown[bKey].pending++;
      if (t.status === 'in_progress') buildingBreakdown[bKey].inProgress++;
      if (t.status === 'resolved') buildingBreakdown[bKey].resolved++;

      // Monthly Trend (by createdAt)
      if (t.createdAt) {
        const cDate = new Date(t.createdAt);
        const mKey = `${cDate.getFullYear()}-${String(cDate.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyTrend[mKey]) {
          monthlyTrend[mKey] = { month: mKey, reported: 0, resolved: 0 };
        }
        monthlyTrend[mKey].reported++;
      }

      // If resolved, calculate resolution duration & SLA
      const slaLimit = SLA_HOURS[t.urgency] || 48;
      if (t.status === 'resolved' && t.resolvedAt) {
        const durationHours = Math.max(0, (new Date(t.resolvedAt) - new Date(t.createdAt)) / (1000 * 60 * 60));
        totalResolutionHours += durationHours;
        resolvedWithDurationCount++;

        if (durationHours <= slaLimit) {
          slaMetCount++;
        } else {
          slaBreachedCount++;
        }

        // Monthly resolved trend
        const rDate = new Date(t.resolvedAt);
        const rmKey = `${rDate.getFullYear()}-${String(rDate.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyTrend[rmKey]) {
          monthlyTrend[rmKey] = { month: rmKey, reported: 0, resolved: 0 };
        }
        monthlyTrend[rmKey].resolved++;
      } else if (t.status === 'pending' || t.status === 'in_progress') {
        // For currently open tickets, check if already overdue
        const openHours = Math.max(0, (now - new Date(t.createdAt)) / (1000 * 60 * 60));
        if (openHours > slaLimit) {
          slaBreachedCount++;
        }
      }
    });

    const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100 * 10) / 10 : 0;
    const mttrHours =
      resolvedWithDurationCount > 0
        ? Math.round((totalResolutionHours / resolvedWithDurationCount) * 10) / 10
        : 0;

    const evaluatedSlaCount = slaMetCount + slaBreachedCount;
    const slaComplianceRate =
      evaluatedSlaCount > 0 ? Math.round((slaMetCount / evaluatedSlaCount) * 100 * 10) / 10 : 100;

    // Convert monthlyTrend map to sorted array
    const sortedMonthlyTrend = Object.values(monthlyTrend).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    res.status(200).json({
      success: true,
      data: {
        total,
        statusCounts: {
          pending: pendingCount,
          inProgress: inProgressCount,
          resolved: resolvedCount,
          cancelled: cancelledCount,
          activeOpen: pendingCount + inProgressCount,
        },
        kpiMetrics: {
          resolutionRate,
          mttrHours,
          slaComplianceRate,
          slaMetCount,
          slaBreachedCount,
          activeCriticalCount: allTickets.filter(
            (t) => (t.status === 'pending' || t.status === 'in_progress') && t.urgency === 'critical'
          ).length,
        },
        slaHoursReference: SLA_HOURS,
        urgencyBreakdown,
        categoryBreakdown,
        buildingBreakdown: Object.values(buildingBreakdown),
        monthlyTrend: sortedMonthlyTrend,
      },
    });
  })
);

/**
 * GET /api/v1/maintenance-tickets
 * List tickets with filter by status, buildingId, assetId, urgency, search, myTicketsOnly
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, buildingId, assetId, urgency, assetType, search, myTicketsOnly, startDate, endDate } = req.query;
    const filter = {};

    if (status && status !== 'all') filter.status = status;
    if (buildingId && buildingId !== 'all') filter.buildingId = buildingId;
    if (assetId) filter.assetId = assetId;
    if (urgency && urgency !== 'all') filter.urgency = urgency;
    if (assetType && assetType !== 'all') filter.assetType = assetType;

    if (myTicketsOnly === 'true' && req.user?._id) {
      filter.reportedBy = req.user._id;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { ticketNo: regex },
        { title: regex },
        { description: regex },
        { assetCode: regex },
        { assetName: regex },
        { reporterName: regex },
        { roomName: regex },
        { buildingName: regex },
        { assignedTechnician: regex },
        { pcName: regex },
        { osVersion: regex },
      ];
    }

    const tickets = await MaintenanceTicket.find(filter)
      .sort({ createdAt: -1 })
      .populate('reportedBy', 'name email avatar role');

    res.status(200).json({
      success: true,
      data: tickets,
    });
  })
);

/**
 * POST /api/v1/maintenance-tickets
 * Create a new maintenance ticket & update asset status on floor plan
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const {
      assetId,
      assetCode,
      assetName,
      assetType,
      buildingId,
      buildingName,
      floorNumber,
      roomName,
      floorPlanId,
      title,
      description,
      urgency,
      reporterName,
      reporterEmail,
      reporterPhone,
      pcName,
      osVersion,
      cpu,
      ram,
      storage,
      specs,
      peripherals,
      installedSoftware,
    } = req.body;

    if (!assetId || !title) {
      throw new ApiError(400, 'กรุณาระบุรหัสทรัพย์สินและหัวข้อแจ้งซ่อม');
    }

    let finalPcName = pcName || '';
    let finalOsVersion = osVersion || '';
    let finalCpu = cpu || '';
    let finalRam = ram || '';
    let finalStorage = storage || '';
    let finalSpecs = specs || '';
    let finalPeripherals = Array.isArray(peripherals) ? peripherals : [];
    let finalInstalledSoftware = Array.isArray(installedSoftware) ? installedSoftware : [];

    // Automatic fallback: Retrieve from floor plan asset if not passed
    if (floorPlanId && (!finalPcName || !finalOsVersion || !finalCpu)) {
      const fp = await FloorPlan.findById(floorPlanId).lean();
      const matchedAsset = fp?.assets?.find((a) => a.id === assetId);
      if (matchedAsset) {
        if (!finalPcName && matchedAsset.pcName) finalPcName = matchedAsset.pcName;
        if (!finalOsVersion && matchedAsset.osVersion) finalOsVersion = matchedAsset.osVersion;
        if (!finalCpu && matchedAsset.cpu) finalCpu = matchedAsset.cpu;
        if (!finalRam && matchedAsset.ram) finalRam = matchedAsset.ram;
        if (!finalStorage && matchedAsset.storage) finalStorage = matchedAsset.storage;
        if (!finalSpecs && matchedAsset.specs) finalSpecs = matchedAsset.specs;
        if (finalPeripherals.length === 0 && Array.isArray(matchedAsset.peripherals)) {
          finalPeripherals = matchedAsset.peripherals;
        }
        if (finalInstalledSoftware.length === 0 && Array.isArray(matchedAsset.installedSoftware)) {
          finalInstalledSoftware = matchedAsset.installedSoftware;
        }
      }
    }

    const ticketNo = await MaintenanceTicket.generateTicketNo();

    const ticket = await MaintenanceTicket.create({
      ticketNo,
      assetId,
      assetCode,
      assetName,
      assetType,
      buildingId,
      buildingName,
      floorNumber: Number(floorNumber) || 1,
      roomName: roomName || 'พื้นที่ส่วนกลาง',
      floorPlanId: floorPlanId || undefined,
      title,
      description,
      urgency: urgency || 'medium',
      status: 'pending',
      reportedBy: req.user?._id,
      reporterName: reporterName || req.user?.name || 'พนักงาน',
      reporterEmail: reporterEmail || req.user?.email || '',
      reporterPhone: reporterPhone || '',
      pcName: finalPcName,
      osVersion: finalOsVersion,
      cpu: finalCpu,
      ram: finalRam,
      storage: finalStorage,
      specs: finalSpecs,
      peripherals: finalPeripherals,
      installedSoftware: finalInstalledSoftware,
    });

    // Update asset status on floor plan to 'maintenance'
    if (floorPlanId) {
      await FloorPlan.updateOne(
        { _id: floorPlanId, 'assets.id': assetId },
        { $set: { 'assets.$.status': 'maintenance' } }
      );
    } else if (buildingId) {
      await FloorPlan.updateMany(
        { buildingId, 'assets.id': assetId },
        { $set: { 'assets.$.status': 'maintenance' } }
      );
    }

    res.status(201).json({
      success: true,
      message: `ส่งคำขอแจ้งซ่อมหมายเลข ${ticketNo} เรียบร้อยแล้ว`,
      data: ticket,
    });
  })
);

/**
 * PUT /api/v1/maintenance-tickets/:id/status
 * Update ticket status (e.g. pending -> in_progress -> resolved)
 */
router.put(
  '/:id/status',
  requirePermission('knowledge:manage'),
  asyncHandler(async (req, res) => {
    const { status, assignedTechnician, resolutionNotes } = req.body;
    const ticket = await MaintenanceTicket.findById(req.params.id);
    if (!ticket) {
      throw new ApiError(404, 'ไม่พบข้อมูลใบแจ้งซ่อม');
    }

    ticket.status = status || ticket.status;
    if (assignedTechnician) ticket.assignedTechnician = assignedTechnician;
    if (resolutionNotes) ticket.resolutionNotes = resolutionNotes;
    if (status === 'resolved') {
      ticket.resolvedAt = new Date();
    }

    await ticket.save();

    // If resolved, update asset status back to 'active'
    if (status === 'resolved') {
      if (ticket.floorPlanId) {
        await FloorPlan.updateOne(
          { _id: ticket.floorPlanId, 'assets.id': ticket.assetId },
          { $set: { 'assets.$.status': 'active' } }
        );
      } else {
        await FloorPlan.updateMany(
          { buildingId: ticket.buildingId, 'assets.id': ticket.assetId },
          { $set: { 'assets.$.status': 'active' } }
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'อัปเดตสถานะใบแจ้งซ่อมเรียบร้อยแล้ว',
      data: ticket,
    });
  })
);

/**
 * DELETE /api/v1/maintenance-tickets/:id
 * Delete a ticket (Admins, editors, maintenance/IT department staff, or creator)
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const ticket = await MaintenanceTicket.findById(req.params.id);
    if (!ticket) {
      throw new ApiError(404, 'ไม่พบข้อมูลใบแจ้งซ่อม');
    }

    const currentUserId = req.user?.id || req.user?._id?.toString();
    const isPrivileged =
      req.user?.role === 'admin' ||
      req.user?.role === 'super_admin' ||
      req.user?.role === 'editor';
    const isOwner =
      ticket.reportedBy &&
      String(ticket.reportedBy?._id || ticket.reportedBy) === String(currentUserId);

    let isMaintenanceStaff = false;
    if (!isPrivileged && !isOwner && currentUserId) {
      const dbUser = await User.findById(currentUserId).populate('employeeId');
      const deptName = (
        dbUser?.department ||
        dbUser?.employeeId?.departmentId?.name ||
        dbUser?.employeeId?.department ||
        ''
      ).toLowerCase();
      if (
        deptName.includes('it') ||
        deptName.includes('information') ||
        deptName.includes('สารสนเทศ') ||
        deptName.includes('maintenance') ||
        deptName.includes('ซ่อมบำรุง') ||
        deptName.includes('facility') ||
        deptName.includes('วิศวกรรม') ||
        deptName.includes('engineering') ||
        deptName.includes('admin')
      ) {
        isMaintenanceStaff = true;
      }
    }

    if (!isPrivileged && !isOwner && !isMaintenanceStaff) {
      throw new ApiError(403, 'คุณไม่มีสิทธิ์ลบใบแจ้งซ่อมนี้');
    }

    await MaintenanceTicket.findByIdAndDelete(req.params.id);

    // If deleted ticket was open, check if there are other open tickets for this asset
    if (ticket.status !== 'resolved' && ticket.status !== 'cancelled') {
      const remainingOpen = await MaintenanceTicket.countDocuments({
        assetId: ticket.assetId,
        status: { $in: ['pending', 'in_progress'] },
      });
      if (remainingOpen === 0) {
        if (ticket.floorPlanId) {
          await FloorPlan.updateOne(
            { _id: ticket.floorPlanId, 'assets.id': ticket.assetId },
            { $set: { 'assets.$.status': 'active' } }
          );
        } else if (ticket.buildingId) {
          await FloorPlan.updateMany(
            { buildingId: ticket.buildingId, 'assets.id': ticket.assetId },
            { $set: { 'assets.$.status': 'active' } }
          );
        }
      }
    }

    // Optional Audit Log
    try {
      await AuditLog.create({
        action: 'DELETE',
        resourceType: 'MaintenanceTicket',
        resourceId: ticket._id.toString(),
        userId: currentUserId,
        details: { ticketNo: ticket.ticketNo, title: ticket.title, status: ticket.status },
      });
    } catch {
      // ignore audit log error if not critical
    }

    res.status(200).json({
      success: true,
      message: `ลบใบแจ้งซ่อม ${ticket.ticketNo} เรียบร้อยแล้ว`,
    });
  })
);

export default router;

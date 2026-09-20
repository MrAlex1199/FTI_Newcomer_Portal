import { FloorPlan, AuditLog } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { CAMPUS_FACILITIES, INITIAL_CAMPUS_PLANS } from '../data/campusFloorPlansData.js';

export const getFloorPlans = asyncHandler(async (req, res) => {
  const { buildingId } = req.query;
  const filter = {};
  if (buildingId) {
    filter.buildingId = buildingId;
  }

  let plans = await FloorPlan.find(filter).sort({ floorNumber: 1, createdAt: 1 });

  // Check if we need to seed the full 20-rai campus plans
  const totalCount = await FloorPlan.countDocuments();
  const hasCampusMaster = await FloorPlan.exists({ buildingId: 'campus' });

  if (totalCount < 20 || !hasCampusMaster) {
    // If old test data is incomplete, clear and seed the full 20-rai campus plans
    await FloorPlan.deleteMany({});
    await FloorPlan.insertMany(INITIAL_CAMPUS_PLANS);
    plans = await FloorPlan.find(filter).sort({ floorNumber: 1, createdAt: 1 });
  }

  res.status(200).json({
    success: true,
    data: {
      floorPlans: plans,
      facilities: CAMPUS_FACILITIES,
      totalCampusAreaRai: 20,
    },
  });
});

export const searchCampusAssets = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const query = (q || '').trim().toLowerCase();

  const allPlans = await FloorPlan.find().select('name buildingId buildingName floorNumber floorName assets');
  const results = [];

  for (const plan of allPlans) {
    for (const asset of plan.assets || []) {
      const match =
        !query ||
        asset.name?.toLowerCase().includes(query) ||
        asset.code?.toLowerCase().includes(query) ||
        asset.assignedTo?.toLowerCase().includes(query) ||
        asset.department?.toLowerCase().includes(query) ||
        asset.specs?.toLowerCase().includes(query) ||
        asset.type?.toLowerCase().includes(query) ||
        asset.status?.toLowerCase().includes(query) ||
        asset.licensePlate?.toLowerCase().includes(query) ||
        asset.driverName?.toLowerCase().includes(query) ||
        asset.parkingSlot?.toLowerCase().includes(query) ||
        asset.vehicleModel?.toLowerCase().includes(query);

      if (match) {
        results.push({
          ...asset.toObject(),
          floorPlanId: plan._id,
          buildingId: plan.buildingId,
          buildingName: plan.buildingName,
          floorNumber: plan.floorNumber,
          floorName: plan.floorName,
        });
      }
    }
  }

  res.status(200).json({
    success: true,
    data: { assets: results },
  });
});

export const duplicateFloorLayout = asyncHandler(async (req, res) => {
  const { id } = req.params; // target plan id
  const { sourcePlanId } = req.body;

  const targetPlan = await FloorPlan.findById(id);
  if (!targetPlan) {
    throw ApiError.notFound('Target floor plan not found');
  }

  const sourcePlan = await FloorPlan.findById(sourcePlanId);
  if (!sourcePlan) {
    throw ApiError.notFound('Source floor plan not found');
  }

  const before = targetPlan.toObject();

  // Copy walls, doors, grid dimensions and room block shapes (with new IDs)
  targetPlan.gridSize = sourcePlan.gridSize;
  targetPlan.scaleMetersPerGrid = sourcePlan.scaleMetersPerGrid;
  targetPlan.canvasWidth = sourcePlan.canvasWidth;
  targetPlan.canvasHeight = sourcePlan.canvasHeight;
  targetPlan.walls = sourcePlan.walls.map((w) => ({
    id: `wall-copy-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    points: [...w.points],
    strokeWidth: w.strokeWidth,
    stroke: w.stroke,
  }));
  targetPlan.doors = sourcePlan.doors.map((d) => ({
    id: `door-copy-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    x: d.x,
    y: d.y,
    width: d.width,
    rotation: d.rotation,
    type: d.type,
  }));
  targetPlan.rooms = sourcePlan.rooms.map((r) => ({
    id: `room-copy-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    name: `${r.name} (คัดลอก)`,
    department: r.department,
    x: r.x,
    y: r.y,
    width: r.width,
    height: r.height,
    color: r.color,
    description: r.description,
    extension: r.extension,
    capacity: r.capacity,
  }));

  targetPlan.updatedBy = req.user.id;
  await targetPlan.save();

  await AuditLog.record({
    userId: req.user.id,
    action: 'update',
    entity: 'FloorPlan',
    entityId: targetPlan._id,
    before,
    after: targetPlan.toObject(),
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  res.status(200).json({
    success: true,
    message: 'คัดลอกโครงร่างแปลนสำเร็จ',
    data: { floorPlan: targetPlan },
  });
});

export const getFloorPlanById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const plan = await FloorPlan.findById(id).populate('updatedBy', 'username');
  if (!plan) {
    throw ApiError.notFound('Floor plan not found');
  }
  res.status(200).json({
    success: true,
    data: { floorPlan: plan },
  });
});

export const createFloorPlan = asyncHandler(async (req, res) => {
  const {
    name,
    buildingId,
    buildingName,
    buildingType,
    totalFloors,
    floorNumber,
    floorName,
    gridSize,
    scaleMetersPerGrid,
    rooms,
    walls,
    doors,
    assets,
    canvasWidth,
    canvasHeight,
    backgroundImage,
    dxfLayer,
  } = req.body;
  if (!name?.trim()) {
    throw ApiError.badRequest('Floor plan name is required');
  }

  const plan = await FloorPlan.create({
    name: name.trim(),
    buildingId: buildingId || 'b1',
    buildingName: buildingName || 'อาคารสำนักงานใหญ่ (HQ)',
    buildingType: buildingType || 'office',
    totalFloors: Number(totalFloors) || 4,
    floorNumber: Number(floorNumber) || 1,
    floorName: floorName || `ชั้น ${floorNumber || 1}`,
    gridSize: Number(gridSize) || 20,
    scaleMetersPerGrid: Number(scaleMetersPerGrid) || 1.0,
    rooms: rooms || [],
    walls: walls || [],
    doors: doors || [],
    assets: assets || [],
    backgroundImage: backgroundImage || {},
    dxfLayer: dxfLayer || {},
    canvasWidth: Number(canvasWidth) || 1000,
    canvasHeight: Number(canvasHeight) || 650,
    updatedBy: req.user.id,
  });

  await AuditLog.record({
    userId: req.user.id,
    action: 'create',
    entity: 'FloorPlan',
    entityId: plan._id,
    before: null,
    after: plan.toObject(),
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  res.status(201).json({
    success: true,
    data: { floorPlan: plan },
  });
});

export const updateFloorPlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const plan = await FloorPlan.findById(id);
  if (!plan) {
    throw ApiError.notFound('Floor plan not found');
  }

  const before = plan.toObject();
  const fields = [
    'name',
    'buildingId',
    'buildingName',
    'buildingType',
    'totalFloors',
    'floorNumber',
    'floorName',
    'gridSize',
    'scaleMetersPerGrid',
    'rooms',
    'walls',
    'doors',
    'assets',
    'backgroundImage',
    'dxfLayer',
    'canvasWidth',
    'canvasHeight',
  ];
  fields.forEach((field) => {
    if (field in req.body) {
      plan[field] = req.body[field];
    }
  });
  plan.updatedBy = req.user.id;

  await plan.save();

  await AuditLog.record({
    userId: req.user.id,
    action: 'update',
    entity: 'FloorPlan',
    entityId: plan._id,
    before,
    after: plan.toObject(),
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  res.status(200).json({
    success: true,
    data: { floorPlan: plan },
  });
});

export const deleteFloorPlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const plan = await FloorPlan.findById(id);
  if (!plan) {
    throw ApiError.notFound('Floor plan not found');
  }

  const before = plan.toObject();
  await plan.deleteOne();

  await AuditLog.record({
    userId: req.user.id,
    action: 'delete',
    entity: 'FloorPlan',
    entityId: id,
    before,
    after: null,
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  res.status(200).json({
    success: true,
    message: 'Floor plan deleted successfully',
  });
});

export const uploadFloorPlanBackground = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const plan = await FloorPlan.findById(id);
  if (!plan) {
    throw ApiError.notFound('Floor plan not found');
  }

  if (!req.file) {
    throw ApiError.badRequest('กรุณาเลือกไฟล์ภาพผังอาคาร');
  }

  const fileUrl = `/uploads/floorplans/${req.file.filename}`;

  res.status(200).json({
    success: true,
    message: 'อัปโหลดภาพผังอาคารสำเร็จ',
    data: {
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    },
  });
});

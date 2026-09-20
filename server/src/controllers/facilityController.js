import { Facility, FloorPlan, AuditLog } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { CAMPUS_FACILITIES } from '../data/campusFloorPlansData.js';

export const getFacilities = asyncHandler(async (_req, res) => {
  let facilities = await Facility.find().sort({ order: 1, createdAt: 1 });

  // If fewer than 10 facilities in DB yet, seed complete set from CAMPUS_FACILITIES
  if (facilities.length < 10) {
    await Facility.deleteMany({});
    const seedData = CAMPUS_FACILITIES.map((f, idx) => ({
      facilityId: f.id,
      name: f.name,
      shortName: f.shortName,
      type: f.type,
      totalFloors: f.totalFloors || 1,
      icon: f.icon || '🏢',
      description: f.description || '',
      order: idx,
    }));
    facilities = await Facility.insertMany(seedData);
  }

  // Aggregate stats per facility
  const plans = await FloorPlan.find().select('buildingId floorNumber assets');
  const facilityStats = {};

  for (const plan of plans) {
    const bId = plan.buildingId;
    if (!facilityStats[bId]) {
      facilityStats[bId] = { floors: new Set(), totalAssets: 0, issueCount: 0 };
    }
    facilityStats[bId].floors.add(plan.floorNumber);
    for (const asset of plan.assets || []) {
      facilityStats[bId].totalAssets += 1;
      if (asset.status === 'broken' || asset.status === 'maintenance') {
        facilityStats[bId].issueCount += 1;
      }
    }
  }

  const enrichedFacilities = facilities.map((f) => {
    const stat = facilityStats[f.facilityId];
    return {
      ...f.toObject(),
      id: f.facilityId, // compatibility with frontend f.id
      actualFloorCount: stat ? stat.floors.size : f.totalFloors,
      totalAssets: stat ? stat.totalAssets : 0,
      issueCount: stat ? stat.issueCount : 0,
    };
  });

  res.status(200).json({
    success: true,
    data: { facilities: enrichedFacilities },
  });
});

export const createFacility = asyncHandler(async (req, res) => {
  const { name, shortName, type, totalFloors = 1, icon, description } = req.body;
  if (!name?.trim()) {
    throw ApiError.badRequest('กรุณาระบุชื่ออาคาร / โกดัง');
  }

  const cleanType = type || 'office';
  const prefix = cleanType === 'warehouse' ? 'w' : cleanType === 'parking' ? 'p' : 'b';
  
  // Count existing to generate unique facilityId
  const existingCount = await Facility.countDocuments({ type: cleanType });
  const facilityId = `${prefix}${existingCount + 1}`;

  const numFloors = Math.max(1, Math.min(50, Number(totalFloors) || 1));
  const finalIcon = icon || (cleanType === 'warehouse' ? '🏭' : cleanType === 'parking' ? '🅿️' : '🏢');

  const facility = await Facility.create({
    facilityId,
    name: name.trim(),
    shortName: (shortName || name).trim(),
    type: cleanType,
    totalFloors: numFloors,
    icon: finalIcon,
    description: description || '',
    order: (await Facility.countDocuments()) + 1,
    createdBy: req.user?.id,
  });

  // Automatically scaffold FloorPlan documents for Floor 1 to numFloors
  const defaultPerimeterWalls = [
    { id: 'w-perim-1', points: [40, 40, 960, 40], strokeWidth: 8, stroke: '#334155' },
    { id: 'w-perim-2', points: [960, 40, 960, 580], strokeWidth: 8, stroke: '#334155' },
    { id: 'w-perim-3', points: [960, 580, 40, 580], strokeWidth: 8, stroke: '#334155' },
    { id: 'w-perim-4', points: [40, 580, 40, 40], strokeWidth: 8, stroke: '#334155' },
  ];

  const floorPlansToInsert = [];
  for (let fNum = 1; fNum <= numFloors; fNum++) {
    floorPlansToInsert.push({
      name: `${facility.name} ชั้น ${fNum}`,
      buildingId: facilityId,
      buildingName: facility.name,
      buildingType: cleanType,
      totalFloors: numFloors,
      floorNumber: fNum,
      floorName: `ชั้น ${fNum}`,
      gridSize: 20,
      scaleMetersPerGrid: cleanType === 'warehouse' ? 1.5 : 1.0,
      canvasWidth: 1000,
      canvasHeight: 650,
      rooms: [],
      walls: defaultPerimeterWalls.map((w, idx) => ({
        ...w,
        id: `wall-init-${fNum}-${idx + 1}`,
      })),
      doors: [
        { id: `door-init-${fNum}-1`, x: 500, y: 580, width: 40, rotation: 0, type: 'double_door' },
      ],
      assets: [],
      updatedBy: req.user?.id,
    });
  }

  await FloorPlan.insertMany(floorPlansToInsert);

  // Also add a clickable room block into the 20-rai Campus Master Plan
  const campusPlan = await FloorPlan.findOne({ buildingId: 'campus' });
  if (campusPlan) {
    const existingRooms = campusPlan.rooms || [];
    // Place new building block in a suitable empty grid spot
    const newRoomX = 840;
    const newRoomY = 320 + (existingRooms.length % 3) * 120;
    
    campusPlan.rooms.push({
      id: `camp-${facilityId}`,
      name: `${finalIcon} ${facility.shortName || facility.name} (${numFloors} ชั้น)`,
      department: cleanType === 'warehouse' ? 'คลังสินค้า' : 'อาคารปฏิบัติการ',
      x: newRoomX,
      y: Math.min(newRoomY, 600),
      width: 200,
      height: 140,
      color: cleanType === 'warehouse' ? '#fed7aa' : '#e0f2fe',
      description: facility.description || `${facility.name} (คลิกเพื่อเข้าดูผังภายใน)`,
      extension: '',
      capacity: 50,
      targetBuildingId: facilityId,
    });
    await campusPlan.save();
  }

  await AuditLog.record({
    userId: req.user?.id,
    action: 'create',
    entity: 'Facility',
    entityId: facility._id,
    before: null,
    after: facility.toObject(),
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  res.status(201).json({
    success: true,
    message: `เพิ่ม${cleanType === 'warehouse' ? 'โกดัง' : 'อาคาร'} "${facility.name}" เรียบร้อยแล้ว`,
    data: { facility: { ...facility.toObject(), id: facility.facilityId } },
  });
});

export const updateFacility = asyncHandler(async (req, res) => {
  const { id } = req.params; // facilityId or _id
  const facility = await Facility.findOne({
    $or: [{ facilityId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
  });

  if (!facility) {
    throw ApiError.notFound('ไม่พบข้อมูลอาคาร');
  }

  const before = facility.toObject();
  const { name, shortName, icon, description, type, totalFloors } = req.body;

  if (name) facility.name = name.trim();
  if (shortName) facility.shortName = shortName.trim();
  if (icon) facility.icon = icon;
  if (description !== undefined) facility.description = description;
  if (type) facility.type = type;

  const prevFloors = facility.totalFloors;
  if (totalFloors && Number(totalFloors) > 0) {
    facility.totalFloors = Number(totalFloors);
  }

  await facility.save();

  // If floors were increased, create the missing floor plans
  if (facility.totalFloors > prevFloors) {
    for (let fNum = prevFloors + 1; fNum <= facility.totalFloors; fNum++) {
      const exists = await FloorPlan.findOne({
        buildingId: facility.facilityId,
        floorNumber: fNum,
      });
      if (!exists) {
        await FloorPlan.create({
          name: `${facility.name} ชั้น ${fNum}`,
          buildingId: facility.facilityId,
          buildingName: facility.name,
          buildingType: facility.type,
          totalFloors: facility.totalFloors,
          floorNumber: fNum,
          floorName: `ชั้น ${fNum}`,
          gridSize: 20,
          scaleMetersPerGrid: 1.0,
          canvasWidth: 1000,
          canvasHeight: 650,
          rooms: [],
          walls: [
            { id: 'w-perim-1', points: [40, 40, 960, 40], strokeWidth: 8, stroke: '#334155' },
            { id: 'w-perim-2', points: [960, 40, 960, 580], strokeWidth: 8, stroke: '#334155' },
            { id: 'w-perim-3', points: [960, 580, 40, 580], strokeWidth: 8, stroke: '#334155' },
            { id: 'w-perim-4', points: [40, 580, 40, 40], strokeWidth: 8, stroke: '#334155' },
          ],
          doors: [
            { id: `door-init-${fNum}-1`, x: 500, y: 580, width: 40, rotation: 0, type: 'double_door' },
          ],
          assets: [],
          updatedBy: req.user?.id,
        });
      }
    }
  }

  // Update buildingName and totalFloors in all existing FloorPlans for this facility
  await FloorPlan.updateMany(
    { buildingId: facility.facilityId },
    { $set: { buildingName: facility.name, totalFloors: facility.totalFloors } }
  );

  // Update name in campus master plan room block if exists
  const campusPlan = await FloorPlan.findOne({ buildingId: 'campus' });
  if (campusPlan) {
    const room = campusPlan.rooms.find((r) => r.targetBuildingId === facility.facilityId);
    if (room) {
      room.name = `${facility.icon} ${facility.shortName || facility.name} (${facility.totalFloors} ชั้น)`;
      await campusPlan.save();
    }
  }

  await AuditLog.record({
    userId: req.user?.id,
    action: 'update',
    entity: 'Facility',
    entityId: facility._id,
    before,
    after: facility.toObject(),
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  res.status(200).json({
    success: true,
    message: 'อัปเดตข้อมูลอาคารสำเร็จ',
    data: { facility: { ...facility.toObject(), id: facility.facilityId } },
  });
});

export const deleteFacility = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const facility = await Facility.findOne({
    $or: [{ facilityId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
  });

  if (!facility) {
    throw ApiError.notFound('ไม่พบข้อมูลอาคาร');
  }

  if (facility.facilityId === 'campus') {
    throw ApiError.badRequest('ไม่สามารถลบผังบริเวณโครงการหลัก 20 ไร่ได้');
  }

  const before = facility.toObject();
  const facilityId = facility.facilityId;

  // Delete facility document
  await facility.deleteOne();

  // Cascade delete all floor plans of this facility
  await FloorPlan.deleteMany({ buildingId: facilityId });

  // Remove clickable building block from campus master plan
  const campusPlan = await FloorPlan.findOne({ buildingId: 'campus' });
  if (campusPlan) {
    campusPlan.rooms = campusPlan.rooms.filter((r) => r.targetBuildingId !== facilityId);
    await campusPlan.save();
  }

  await AuditLog.record({
    userId: req.user?.id,
    action: 'delete',
    entity: 'Facility',
    entityId: facility._id,
    before,
    after: null,
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  res.status(200).json({
    success: true,
    message: `ลบอาคาร ${facility.name} และแปลนชั้นทั้งหมดเรียบร้อยแล้ว`,
  });
});

export const addFloor = asyncHandler(async (req, res) => {
  const { id } = req.params; // facilityId
  const facility = await Facility.findOne({ facilityId: id });
  if (!facility) {
    throw ApiError.notFound('ไม่พบข้อมูลอาคาร');
  }

  const newFloorNumber = facility.totalFloors + 1;
  facility.totalFloors = newFloorNumber;
  await facility.save();

  // Create floor plan for this new floor
  const newPlan = await FloorPlan.create({
    name: `${facility.name} ชั้น ${newFloorNumber}`,
    buildingId: facility.facilityId,
    buildingName: facility.name,
    buildingType: facility.type,
    totalFloors: newFloorNumber,
    floorNumber: newFloorNumber,
    floorName: `ชั้น ${newFloorNumber}`,
    gridSize: 20,
    scaleMetersPerGrid: 1.0,
    canvasWidth: 1000,
    canvasHeight: 650,
    rooms: [],
    walls: [
      { id: 'w-perim-1', points: [40, 40, 960, 40], strokeWidth: 8, stroke: '#334155' },
      { id: 'w-perim-2', points: [960, 40, 960, 580], strokeWidth: 8, stroke: '#334155' },
      { id: 'w-perim-3', points: [960, 580, 40, 580], strokeWidth: 8, stroke: '#334155' },
      { id: 'w-perim-4', points: [40, 580, 40, 40], strokeWidth: 8, stroke: '#334155' },
    ],
    doors: [
      { id: `door-init-${newFloorNumber}-1`, x: 500, y: 580, width: 40, rotation: 0, type: 'double_door' },
    ],
    assets: [],
    updatedBy: req.user?.id,
  });

  // Update totalFloors on all existing floor plans of this facility
  await FloorPlan.updateMany(
    { buildingId: facility.facilityId },
    { $set: { totalFloors: newFloorNumber } }
  );

  res.status(201).json({
    success: true,
    message: `เพิ่มชั้น ${newFloorNumber} ให้กับ ${facility.name} เรียบร้อยแล้ว`,
    data: { floorPlan: newPlan, totalFloors: newFloorNumber },
  });
});

export const deleteFloor = asyncHandler(async (req, res) => {
  const { id, floorNumber } = req.params; // id: facilityId, floorNumber: number
  const fNum = Number(floorNumber);

  const facility = await Facility.findOne({ facilityId: id });
  if (!facility) {
    throw ApiError.notFound('ไม่พบข้อมูลอาคาร');
  }

  // Count existing floor plans for this facility
  const existingPlans = await FloorPlan.find({ buildingId: facility.facilityId }).sort({ floorNumber: 1 });
  if (existingPlans.length <= 1) {
    throw ApiError.badRequest('ไม่สามารถลบได้ เนื่องจากอาคารต้องมีอย่างน้อย 1 ชั้น');
  }

  // Find the target floor plan to delete
  const targetPlan = existingPlans.find((p) => p.floorNumber === fNum);
  if (!targetPlan) {
    throw ApiError.notFound(`ไม่พบข้อมูลแปลนชั้น ${fNum} ของอาคารนี้`);
  }

  // Delete the target floor plan
  await targetPlan.deleteOne();

  // Re-index remaining floor plans above this floor if necessary, or simply update totalFloors
  const remainingPlans = await FloorPlan.find({ buildingId: facility.facilityId }).sort({ floorNumber: 1 });
  
  // Re-number subsequent floors so there is no gap (e.g. if deleting floor 2 of 1..3, floor 3 becomes 2)
  for (let i = 0; i < remainingPlans.length; i++) {
    const plan = remainingPlans[i];
    const expectedFloor = i + 1;
    if (plan.floorNumber !== expectedFloor) {
      plan.floorNumber = expectedFloor;
      plan.name = `${facility.name} ชั้น ${expectedFloor}`;
      plan.floorName = `ชั้น ${expectedFloor}`;
      await plan.save();
    }
  }

  const newTotalFloors = remainingPlans.length;
  facility.totalFloors = newTotalFloors;
  await facility.save();

  // Update totalFloors on all floor plans of this facility
  await FloorPlan.updateMany(
    { buildingId: facility.facilityId },
    { $set: { totalFloors: newTotalFloors } }
  );

  // Update Campus Master Plan room label if it exists
  const campusPlan = await FloorPlan.findOne({ buildingId: 'campus' });
  if (campusPlan) {
    const roomInCampus = campusPlan.rooms.find((r) => r.targetBuildingId === facility.facilityId);
    if (roomInCampus) {
      roomInCampus.name = `${facility.icon || '🏢'} ${facility.shortName || facility.name} (${newTotalFloors} ชั้น)`;
      await campusPlan.save();
    }
  }

  await AuditLog.record({
    userId: req.user?.id,
    action: 'delete',
    entity: 'FloorPlan',
    entityId: targetPlan._id,
    before: targetPlan.toObject(),
    after: null,
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  res.status(200).json({
    success: true,
    message: `ลบชั้น ${fNum} ของ ${facility.name} เรียบร้อยแล้ว`,
    data: { totalFloors: newTotalFloors },
  });
});

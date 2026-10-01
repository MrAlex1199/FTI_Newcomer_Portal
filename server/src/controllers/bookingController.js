import { Booking, BookingResource, AuditLog } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

// Preset Seed Data to auto-populate if no resources exist yet
const PRESET_RESOURCES = [
  // Meeting Rooms
  {
    name: 'Boardroom Executive (ชั้น 4)',
    type: 'room',
    category: 'ห้องประชุมใหญ่ผู้บริหาร',
    capacity: 30,
    locationOrPlate: 'อาคาร A ชั้น 4',
    icon: '🏛️',
    color: '#1e40af',
    order: 1,
    amenities: [
      'จอ 4K Smart Display 85"',
      'ระบบ Hybrid Video Conference (Cisco/Zoom)',
      'ไมโครโฟนประชุมตั้งโต๊ะ 24 ตัว',
      'แท่นบรรยายดิจิทัล',
      'ห้องควบคุมระบบเสียงและแสง',
    ],
    description: 'ห้องประชุมใหญ่ระดับผู้บริหาร สำหรับการประชุมคณะกรรมการ นำเสนอวิสัยทัศน์ และต้อนรับแขกระดับสูง',
  },
  {
    name: 'Meeting Room Alpha (ชั้น 3)',
    type: 'room',
    category: 'ห้องประชุมขนาดกลาง',
    capacity: 14,
    locationOrPlate: 'อาคาร A ชั้น 3',
    icon: '💼',
    color: '#0284c7',
    order: 2,
    amenities: [
      'Smart TV 75"',
      'กล้อง AI Auto-Tracking Video Conference',
      'ไวท์บอร์ดกระจกขนาดใหญ่',
      'พอร์ต HDMI / Type-C Wireless Display',
    ],
    description: 'ห้องประชุมมาตรฐานสำหรับประชุมแผนก นำเสนอผลงาน และการสัมมนาภายใน',
  },
  {
    name: 'Meeting Room Beta (ชั้น 2)',
    type: 'room',
    category: 'ห้องประชุมทั่วไป',
    capacity: 8,
    locationOrPlate: 'อาคาร A ชั้น 2',
    icon: '👥',
    color: '#0d9488',
    order: 3,
    amenities: [
      'Smart TV 65"',
      'ลำโพงพร้อมไมค์ประชุมรอบทิศทาง',
      'กระดานกระจกแม่เหล็ก',
      'ปลั๊กไฟและชาร์จเจอร์ประจำโต๊ะ',
    ],
    description: 'เหมาะสำหรับประชุมกลุ่มย่อย ประชุมทีมงาน และสัมภาษณ์งาน',
  },
  {
    name: 'Creative Brainstorm Pod (ชั้น 2)',
    type: 'room',
    category: 'ห้องระดมสมอง & คิดงาน',
    capacity: 6,
    locationOrPlate: 'อาคาร B ชั้น 2',
    icon: '💡',
    color: '#8b5cf6',
    order: 4,
    amenities: [
      'จอมอนิเตอร์พรีเซนต์ 55"',
      'กระดานไวท์บอร์ดรอบทิศทาง',
      'โต๊ะปรับระดับและโซฟาพักผ่อน',
      'โต๊ะเขียนไอเดีย',
    ],
    description: 'ห้องสร้างสรรค์ไอเดีย ออกแบบงาน บรรยากาศผ่อนคลาย เหมาะสำหรับ Work session',
  },
  // Company Vehicles
  {
    name: 'Toyota Commuter VIP (รถตู้ VIP)',
    type: 'vehicle',
    category: 'รถตู้ผู้บริหาร VIP',
    capacity: 10,
    locationOrPlate: '1นข-9988 กทม.',
    icon: '🚐',
    color: '#d97706',
    order: 5,
    driverAvailable: true,
    amenities: [
      'เบาะหนัง VIP 9 ที่นั่ง',
      'ทีวีจอเพดาน & เครื่องเสียง',
      'พอร์ตชาร์จ USB/Type-C ทุกที่นั่ง',
      'มีพนักงานขับรถประจำรถ',
      'ระบบ GPS ติดตามและความเร็ว',
    ],
    description: 'สำหรับคณะผู้บริหาร ต้อนรับแขกวีไอพี และการเดินทางร่วมกันเป็นหมู่คณะ',
  },
  {
    name: 'Toyota Camry 2.5 HEV (รถเก๋ง Sedan)',
    type: 'vehicle',
    category: 'รถเก๋ง Sedan ผู้บริหาร',
    capacity: 5,
    locationOrPlate: '3ขพ-1234 กทม.',
    icon: '🚗',
    color: '#2563eb',
    order: 6,
    driverAvailable: true,
    amenities: [
      'ระบบ Hybrid ประหยัดพลังงาน',
      'เบาะหนังปรับไฟฟ้า',
      'ระบบความปลอดภัย TSS',
      'ขอพนักงานขับรถหรือขับเองได้',
      'บัตร Easy Pass ทางด่วน',
    ],
    description: 'สำหรับงานติดต่อธุรกิจ ประชุมหน่วยงานราชการ และเดินทางในกรุงเทพฯ และปริมณฑล',
  },
  {
    name: 'BYD Atto 3 Extended (รถยนต์ไฟฟ้า EV)',
    type: 'vehicle',
    category: 'รถยนต์ไฟฟ้า EV 100%',
    capacity: 5,
    locationOrPlate: '5กม-5678 กทม.',
    icon: '⚡',
    color: '#059669',
    order: 7,
    driverAvailable: false,
    amenities: [
      'พลังงานไฟฟ้า 100% วิ่งได้ 480 กม.',
      'จอทัชสกรีนหมุนได้ 15.6"',
      'สายชาร์จฉุกเฉินประจำรถ',
      'ขับเคลื่อนคล่องตัวในเมือง',
      'บัตร Easy Pass ทางด่วน',
    ],
    description: 'รถยนต์ไฟฟ้าสำหรับติดต่อประสานงานทั่วไป ลดการปล่อยคาร์บอน (ขับเอง)',
  },
  {
    name: 'Isuzu D-Max 4-Door (รถกระบะขนส่ง)',
    type: 'vehicle',
    category: 'รถกระบะปฏิบัติงาน & ขนส่ง',
    capacity: 5,
    locationOrPlate: '2ฒผ-7890 กทม.',
    icon: '🛻',
    color: '#475569',
    order: 8,
    driverAvailable: true,
    amenities: [
      'กระบะท้ายพร้อมฝาปิดสัมภาระ',
      'ระบบขับเคลื่อน 4 ล้อ (4WD)',
      'รองรับการขนส่งเอกสาร/อุปกรณ์งานจัดแสดง',
      'ลุยงานต่างจังหวัดได้ทุกสภาพถนน',
    ],
    description: 'สำหรับงานจัดนิทรรศการ งานขนส่งอุปกรณ์ และการลงพื้นที่ตรวจงานโรงงาน',
  },
];

// Helper: Ensure preset resources exist safely without race conditions
const ensurePresetResources = async () => {
  const count = await BookingResource.countDocuments();
  if (count < PRESET_RESOURCES.length) {
    for (const preset of PRESET_RESOURCES) {
      await BookingResource.findOneAndUpdate(
        { name: preset.name },
        { $setOnInsert: preset },
        { upsert: true, new: true }
      );
    }
  }
};

/**
 * GET /api/v1/bookings/resources
 * Returns all active booking resources (meeting rooms and vehicles).
 */
export const listResources = asyncHandler(async (req, res) => {
  await ensurePresetResources();

  const { type, status } = req.query;
  const filter = {};

  if (type && ['room', 'vehicle'].includes(type)) {
    filter.type = type;
  }

  if (status) {
    filter.status = status;
  } else if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    filter.status = 'active';
  }

  const resources = await BookingResource.find(filter).sort({ order: 1, createdAt: 1 });
  res.status(200).json({ success: true, data: resources });
});

/**
 * POST /api/v1/bookings/resources
 * Admin only: Create a new resource.
 */
export const createResource = asyncHandler(async (req, res) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    throw ApiError.forbidden('Only administrators can add booking resources');
  }

  const {
    name,
    type,
    category,
    capacity,
    locationOrPlate,
    description,
    amenities,
    driverAvailable,
    color,
    icon,
  } = req.body;

  if (!name || !type) {
    throw ApiError.badRequest('Name and type are required');
  }

  const resource = await BookingResource.create({
    name: name.trim(),
    type,
    category: category ? category.trim() : '',
    capacity: Number(capacity) || 4,
    locationOrPlate: locationOrPlate ? locationOrPlate.trim() : '',
    description: description ? description.trim() : '',
    amenities: Array.isArray(amenities) ? amenities : [],
    driverAvailable: Boolean(driverAvailable),
    color: color || '#3b82f6',
    icon: icon || (type === 'room' ? '🏢' : '🚗'),
    createdBy: req.user.id,
  });

  await AuditLog.record({
    userId: req.user.id,
    action: 'create',
    entity: 'BookingResource',
    entityId: resource._id,
    after: resource.toObject(),
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  res.status(201).json({ success: true, data: resource });
});

/**
 * PATCH /api/v1/bookings/resources/:id
 * Admin only: Update a resource.
 */
export const updateResource = asyncHandler(async (req, res) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    throw ApiError.forbidden('Only administrators can update booking resources');
  }

  const resource = await BookingResource.findById(req.params.id);
  if (!resource) {
    throw ApiError.notFound('Resource not found');
  }

  const before = resource.toObject();
  const allowedFields = [
    'name',
    'type',
    'category',
    'capacity',
    'locationOrPlate',
    'description',
    'amenities',
    'driverAvailable',
    'status',
    'color',
    'icon',
    'order',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      resource[field] = req.body[field];
    }
  });

  await resource.save();

  await AuditLog.record({
    userId: req.user.id,
    action: 'update',
    entity: 'BookingResource',
    entityId: resource._id,
    before,
    after: resource.toObject(),
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  res.status(200).json({ success: true, data: resource });
});

/**
 * DELETE /api/v1/bookings/resources/:id
 * Admin only: Delete a resource.
 */
export const deleteResource = asyncHandler(async (req, res) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    throw ApiError.forbidden('Only administrators can delete booking resources');
  }

  const resource = await BookingResource.findById(req.params.id);
  if (!resource) {
    throw ApiError.notFound('Resource not found');
  }

  await BookingResource.findByIdAndDelete(req.params.id);

  await AuditLog.record({
    userId: req.user.id,
    action: 'delete',
    entity: 'BookingResource',
    entityId: resource._id,
    before: resource.toObject(),
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  res.status(200).json({ success: true, message: 'Resource deleted successfully' });
});

/**
 * Helper to check time conflict
 */
const findConflicts = async ({ resourceId, startTime, endTime, excludeBookingId = null }) => {
  const query = {
    resourceId,
    status: { $ne: 'cancelled' },
    $or: [
      // Starts during another booking
      { startTime: { $lt: endTime, $gte: startTime } },
      // Ends during another booking
      { endTime: { $gt: startTime, $lte: endTime } },
      // Spans over another booking
      { startTime: { $lte: startTime }, endTime: { $gte: endTime } },
    ],
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  return Booking.find(query).populate('bookedBy', 'username');
};

/**
 * GET /api/v1/bookings/check-availability
 * Checks if a specific time slot is free.
 */
export const checkAvailability = asyncHandler(async (req, res) => {
  const { resourceId, startTime, endTime, excludeBookingId } = req.query;

  if (!resourceId || !startTime || !endTime) {
    throw ApiError.badRequest('resourceId, startTime, and endTime are required');
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
    throw ApiError.badRequest('Invalid start or end time');
  }

  const conflicts = await findConflicts({
    resourceId,
    startTime: start,
    endTime: end,
    excludeBookingId,
  });

  res.status(200).json({
    success: true,
    data: {
      available: conflicts.length === 0,
      conflictCount: conflicts.length,
      conflicts,
    },
  });
});

/**
 * GET /api/v1/bookings
 * List bookings with filtering by date, resource, type, or user.
 */
export const listBookings = asyncHandler(async (req, res) => {
  const { resourceId, resourceType, date, startDate, endDate, status, myOnly } = req.query;
  const filter = {};

  if (resourceId) filter.resourceId = resourceId;
  if (resourceType) filter.resourceType = resourceType;

  if (myOnly === 'true' && req.user) {
    filter.bookedBy = req.user.id;
  }

  if (status) {
    filter.status = status;
  } else {
    // Default to active bookings (exclude cancelled unless explicitly requested)
    filter.status = { $ne: 'cancelled' };
  }

  // Date range filter
  if (date) {
    // Single day: from start of day to end of day (local / UTC)
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    filter.startTime = { $lt: dayEnd };
    filter.endTime = { $gt: dayStart };
  } else if (startDate || endDate) {
    if (startDate) {
      filter.endTime = { $gte: new Date(startDate) };
    }
    if (endDate) {
      filter.startTime = { ...filter.startTime, $lte: new Date(endDate) };
    }
  }

  const bookings = await Booking.find(filter)
    .populate('resourceId')
    .populate('bookedBy', 'username role email employeeId')
    .sort({ startTime: 1 });

  res.status(200).json({ success: true, data: bookings });
});

/**
 * POST /api/v1/bookings
 * Create a new booking with instantaneous conflict prevention.
 */
export const createBooking = asyncHandler(async (req, res) => {
  const {
    resourceId,
    title,
    description,
    department,
    startTime,
    endTime,
    attendeesCount,
    destination,
    needDriver,
    driverName,
    roomSetup,
    requestedEquipment,
    contactName,
    contactPhone,
    contactEmail,
  } = req.body;

  if (!resourceId || !title || !startTime || !endTime || !contactName) {
    throw ApiError.badRequest('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (Resource, Title, Time, Contact)');
  }

  const resource = await BookingResource.findById(resourceId);
  if (!resource) {
    throw ApiError.notFound('ไม่พบข้อมูลทรัพยากรที่ต้องการจอง');
  }

  if (resource.status !== 'active') {
    throw ApiError.badRequest('ทรัพยากรนี้ไม่พร้อมให้บริการในขณะนี้');
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw ApiError.badRequest('รูปแบบวันเวลาไม่ถูกต้อง');
  }

  if (start >= end) {
    throw ApiError.badRequest('เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น');
  }

  // Conflict detection
  const conflicts = await findConflicts({ resourceId, startTime: start, endTime: end });
  if (conflicts.length > 0) {
    throw ApiError.conflict('ช่วงเวลาที่ท่านเลือกมีผู้จองไว้แล้ว กรุณาเลือกช่วงเวลาอื่น');
  }

  // Generate Booking Number: BK-YYYYMM-XXXX
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const bookingNo = `BK-${yearMonth}-${randomSuffix}`;

  const booking = await Booking.create({
    bookingNo,
    resourceId: resource._id,
    resourceType: resource.type,
    title: title.trim(),
    description: description ? description.trim() : '',
    department: department ? department.trim() : '',
    startTime: start,
    endTime: end,
    attendeesCount: Number(attendeesCount) || 1,
    destination: destination ? destination.trim() : '',
    needDriver: Boolean(needDriver),
    driverName: driverName ? driverName.trim() : '',
    roomSetup: roomSetup ? roomSetup.trim() : '',
    requestedEquipment: Array.isArray(requestedEquipment) ? requestedEquipment : [],
    bookedBy: req.user.id,
    contactName: contactName.trim(),
    contactPhone: contactPhone ? contactPhone.trim() : '',
    contactEmail: contactEmail ? contactEmail.trim() : '',
    status: 'confirmed',
  });

  await AuditLog.record({
    userId: req.user.id,
    action: 'create',
    entity: 'Booking',
    entityId: booking._id,
    after: booking.toObject(),
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  const populated = await Booking.findById(booking._id)
    .populate('resourceId')
    .populate('bookedBy', 'username role');

  res.status(201).json({ success: true, data: populated });
});

/**
 * PATCH /api/v1/bookings/:id/cancel
 * Cancel a booking. Permitted for booking owner or Admin.
 */
export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
  const isOwner = String(booking.bookedBy) === String(req.user.id);

  if (!isAdmin && !isOwner) {
    throw ApiError.forbidden('You do not have permission to cancel this booking');
  }

  const { cancellationReason } = req.body;

  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  booking.cancelledBy = req.user.id;
  booking.cancellationReason = cancellationReason ? cancellationReason.trim() : 'Cancelled by user';

  await booking.save();

  await AuditLog.record({
    userId: req.user.id,
    action: 'update',
    entity: 'Booking',
    entityId: booking._id,
    after: { status: 'cancelled', cancellationReason: booking.cancellationReason },
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  res.status(200).json({ success: true, data: booking });
});

/**
 * GET /api/v1/bookings/stats
 * Summary statistics for the dashboard or booking page banner.
 */
export const getBookingStats = asyncHandler(async (req, res) => {
  await ensurePresetResources();

  const now = new Date();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [
    totalRooms,
    totalVehicles,
    todayBookingsCount,
    myActiveBookingsCount,
    currentOngoingBookings,
  ] = await Promise.all([
    BookingResource.countDocuments({ type: 'room', status: 'active' }),
    BookingResource.countDocuments({ type: 'vehicle', status: 'active' }),
    Booking.countDocuments({
      status: 'confirmed',
      startTime: { $lt: todayEnd },
      endTime: { $gt: todayStart },
    }),
    req.user
      ? Booking.countDocuments({
          bookedBy: req.user.id,
          status: 'confirmed',
          endTime: { $gte: now },
        })
      : 0,
    Booking.find({
      status: 'confirmed',
      startTime: { $lte: now },
      endTime: { $gte: now },
    }).select('resourceId resourceType'),
  ]);

  const ongoingResourceIds = new Set(currentOngoingBookings.map((b) => String(b.resourceId)));
  const ongoingRooms = currentOngoingBookings.filter((b) => b.resourceType === 'room').length;
  const ongoingVehicles = currentOngoingBookings.filter((b) => b.resourceType === 'vehicle').length;

  res.status(200).json({
    success: true,
    data: {
      totalRooms,
      totalVehicles,
      todayBookingsCount,
      myActiveBookingsCount,
      availableRoomsNow: Math.max(0, totalRooms - ongoingRooms),
      availableVehiclesNow: Math.max(0, totalVehicles - ongoingVehicles),
      ongoingResourceIds: Array.from(ongoingResourceIds),
    },
  });
});

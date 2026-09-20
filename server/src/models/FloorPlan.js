import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true, default: 'ห้องใหม่' },
    department: { type: String, trim: true, default: '' },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    color: { type: String, default: '#dbeafe' }, // pastel blue default
    description: { type: String, trim: true, default: '' },
    extension: { type: String, trim: true, default: '' },
    capacity: { type: Number, default: 0 },
    targetBuildingId: { type: String, default: '' }, // For campus master view clickable buildings
    shapeType: { type: String, enum: ['rect', 'polygon'], default: 'rect' },
    points: { type: [Number], default: [] }, // For polygon rooms: [x1, y1, x2, y2, ...]
  },
  { _id: false }
);

const wallSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    points: { type: [Number], required: true }, // [x1, y1, x2, y2]
    strokeWidth: { type: Number, default: 8 },
    stroke: { type: String, default: '#334155' },
  },
  { _id: false }
);

const doorSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, default: 30 },
    rotation: { type: Number, default: 0 },
    type: { type: String, enum: ['door', 'double_door', 'window'], default: 'door' },
    wallId: { type: String, default: null },
  },
  { _id: false }
);

const assetSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    code: { type: String, trim: true, default: '' },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        'cctv',
        'computer',
        'printer',
        'desk',
        'meeting_table',
        'emergency',
        'vehicle_car',
        'vehicle_truck',
        'vehicle_motorcycle',
        'vehicle_forklift',
        'parking_bay',
        'ev_charger',
        'other',
      ],
      default: 'computer',
    },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    rotation: { type: Number, default: 0 },
    fovAngle: { type: Number, default: 70 }, // 60, 70, 90, 120
    rangeMeters: { type: Number, default: 8 }, // view distance in meters
    status: {
      type: String,
      enum: ['active', 'maintenance', 'broken', 'inactive'],
      default: 'active',
    },
    specs: { type: String, default: '' },
    warrantyExpiry: { type: String, default: '' },
    assignedTo: { type: String, default: '' },
    department: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    notes: { type: String, default: '' },
    // Vehicle & Logistics Fields
    licensePlate: { type: String, trim: true, default: '' },
    driverName: { type: String, trim: true, default: '' },
    parkingSlot: { type: String, trim: true, default: '' },
    vehicleModel: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const backgroundImageSchema = new mongoose.Schema(
  {
    url: { type: String, default: '' },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    opacity: { type: Number, default: 0.5 },
    locked: { type: Boolean, default: true },
    visible: { type: Boolean, default: true },
    rotation: { type: Number, default: 0 },
  },
  { _id: false }
);

const dxfLayerSchema = new mongoose.Schema(
  {
    entities: { type: [mongoose.Schema.Types.Mixed], default: [] },
    visible: { type: Boolean, default: true },
    opacity: { type: Number, default: 0.6 },
    scale: { type: Number, default: 1 },
    offsetX: { type: Number, default: 0 },
    offsetY: { type: Number, default: 0 },
    sourceFileName: { type: String, default: '' },
  },
  { _id: false }
);

const floorPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    buildingId: { type: String, required: true, default: 'b1', index: true },
    buildingName: { type: String, required: true, trim: true, default: 'อาคารสำนักงานใหญ่ (HQ - Building 1)' },
    buildingType: { type: String, enum: ['office', 'warehouse', 'campus'], default: 'office', index: true },
    totalFloors: { type: Number, default: 4 },
    floorNumber: { type: Number, required: true, default: 1 },
    floorName: { type: String, trim: true, default: 'ชั้น 1' },
    gridSize: { type: Number, default: 20 },
    scaleMetersPerGrid: { type: Number, default: 1.0 }, // 20px = 1.0 meter
    rooms: { type: [roomSchema], default: [] },
    walls: { type: [wallSchema], default: [] },
    doors: { type: [doorSchema], default: [] },
    assets: { type: [assetSchema], default: [] },
    backgroundImage: { type: backgroundImageSchema, default: () => ({}) },
    dxfLayer: { type: dxfLayerSchema, default: () => ({}) },
    canvasWidth: { type: Number, default: 1000 },
    canvasHeight: { type: Number, default: 650 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const FloorPlan = mongoose.model('FloorPlan', floorPlanSchema);

export default FloorPlan;

import mongoose from 'mongoose';

const maintenanceTicketSchema = new mongoose.Schema(
  {
    ticketNo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    // Related Asset Details
    assetId: { type: String, required: true, trim: true },
    assetCode: { type: String, trim: true, default: '' },
    assetName: { type: String, required: true, trim: true },
    assetType: {
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
    // Location Context
    buildingId: { type: String, required: true, trim: true },
    buildingName: { type: String, required: true, trim: true },
    floorNumber: { type: Number, default: 1 },
    roomName: { type: String, trim: true, default: 'พื้นที่ส่วนกลาง' },
    floorPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'FloorPlan' },

    // Issue Description & Priority
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'cancelled'],
      default: 'pending',
      index: true,
    },

    // Reporter & Assignee
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reporterName: { type: String, trim: true, default: 'พนักงาน' },
    reporterEmail: { type: String, trim: true, default: '' },
    reporterPhone: { type: String, trim: true, default: '' },
    assignedTechnician: { type: String, trim: true, default: '' },
    resolutionNotes: { type: String, trim: true, default: '' },
    resolvedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Helper to generate Ticket No like MT-2026-0001
maintenanceTicketSchema.statics.generateTicketNo = async function () {
  const year = new Date().getFullYear();
  const count = await this.countDocuments();
  const sequence = String(count + 1).padStart(4, '0');
  return `MT-${year}-${sequence}`;
};

const MaintenanceTicket = mongoose.model('MaintenanceTicket', maintenanceTicketSchema);
export default MaintenanceTicket;

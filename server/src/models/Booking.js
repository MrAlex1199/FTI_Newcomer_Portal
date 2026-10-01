import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    bookingNo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookingResource',
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      enum: ['room', 'vehicle'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
      index: true,
    },
    attendeesCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    // Vehicle specific fields
    destination: {
      type: String,
      trim: true,
      default: '',
    },
    needDriver: {
      type: Boolean,
      default: false,
    },
    driverName: {
      type: String,
      trim: true,
      default: '',
    },
    // Room specific fields
    roomSetup: {
      type: String,
      trim: true,
      default: '',
    },
    requestedEquipment: {
      type: [String],
      default: [],
    },
    // Booked by user
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contactName: {
      type: String,
      required: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '',
    },
    contactEmail: {
      type: String,
      trim: true,
      default: '',
    },
    // Booking lifecycle
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'completed'],
      default: 'confirmed',
      index: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: '',
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for overlap detection
bookingSchema.index({ resourceId: 1, status: 1, startTime: 1, endTime: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;

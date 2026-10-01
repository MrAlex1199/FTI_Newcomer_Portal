import mongoose from 'mongoose';

const bookingResourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    type: {
      type: String,
      enum: ['room', 'vehicle'],
      required: true,
      index: true,
    },
    category: {
      type: String,
      trim: true,
      default: '',
    },
    capacity: {
      type: Number,
      default: 4,
      min: 1,
    },
    locationOrPlate: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    amenities: {
      type: [String],
      default: [],
    },
    driverAvailable: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'maintenance', 'inactive'],
      default: 'active',
      index: true,
    },
    image: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '#3b82f6',
    },
    order: {
      type: Number,
      default: 0,
    },
    createdBy: {
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

bookingResourceSchema.index({ type: 1, status: 1, order: 1 });

const BookingResource = mongoose.model('BookingResource', bookingResourceSchema);
export default BookingResource;

import mongoose from 'mongoose';

const facilitySchema = new mongoose.Schema(
  {
    facilityId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    shortName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    type: {
      type: String,
      enum: ['office', 'warehouse', 'campus', 'parking', 'other'],
      default: 'office',
      index: true,
    },
    totalFloors: {
      type: Number,
      default: 1,
      min: 1,
      max: 50,
    },
    icon: {
      type: String,
      default: '🏢',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
    canvasRoomId: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const Facility = mongoose.model('Facility', facilitySchema);

export default Facility;

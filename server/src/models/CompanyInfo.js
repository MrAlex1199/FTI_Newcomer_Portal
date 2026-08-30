import mongoose from 'mongoose';

const officePointSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    contact: { type: String, trim: true, maxlength: 120, default: '' },
    extension: { type: String, trim: true, maxlength: 20, default: '' },
    category: { type: String, trim: true, maxlength: 50, default: 'general' },
    latitude: { type: Number, min: -90, max: 90, required: true },
    longitude: { type: Number, min: -180, max: 180, required: true },
  },
  { _id: false }
);

const companyInfoSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'default', immutable: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    tagline: { type: String, trim: true, maxlength: 300, default: '' },
    overview: { type: String, trim: true, maxlength: 5000, default: '' },
    mission: { type: String, trim: true, maxlength: 3000, default: '' },
    vision: { type: String, trim: true, maxlength: 3000, default: '' },
    history: { type: String, trim: true, maxlength: 5000, default: '' },
    address: { type: String, trim: true, maxlength: 500, default: '' },
    phone: { type: String, trim: true, maxlength: 50, default: '' },
    email: { type: String, trim: true, maxlength: 200, default: '' },
    website: { type: String, trim: true, maxlength: 300, default: '' },
    latitude: { type: Number, min: -90, max: 90, default: null },
    longitude: { type: Number, min: -180, max: 180, default: null },
    mapProvider: { type: String, enum: ['openstreetmap'], default: 'openstreetmap' },
    officePoints: { type: [officePointSchema], default: [] },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const CompanyInfo = mongoose.model('CompanyInfo', companyInfoSchema);

export default CompanyInfo;

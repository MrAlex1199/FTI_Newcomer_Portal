import mongoose from 'mongoose';

const searchEventSchema = new mongoose.Schema(
  {
    query: { type: String, required: true, trim: true, maxlength: 100 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, required: true },
    resultCount: { type: Number, required: true, min: 0 },
    resultTypes: { type: [String], default: [] },
    latencyMs: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

// Search analytics are operational data, not audit history. Retain for 90 days.
searchEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
searchEventSchema.index({ query: 1, createdAt: -1 });

const SearchEvent = mongoose.model('SearchEvent', searchEventSchema);

export default SearchEvent;

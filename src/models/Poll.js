import mongoose from 'mongoose';
const { Schema } = mongoose;

const OptionSchema = new Schema({
  optionId: { type: String, required: true }, // human-readable, e.g. 'OPT1'
  text: { type: String, required: true },
  votes: { type: Number, default: 0 }
}, { _id: true });

const PollSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'General' },
  options: { type: [OptionSchema], required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'closed', 'upcoming'], default: 'active' },
  startDate: { type: Date },
  endDate: { type: Date },
  // track users who have voted to prevent duplicates
  voted: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  // denormalized total for quick read; kept in sync via pre-save hook
  totalVotes: { type: Number, default: 0 }
}, { timestamps: true });

// Keep totalVotes in sync with option votes
PollSchema.pre('save', function (next) {
  try {
    this.totalVotes = Array.isArray(this.options) ? this.options.reduce((s, o) => s + (o.votes || 0), 0) : 0;
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model('Poll', PollSchema);

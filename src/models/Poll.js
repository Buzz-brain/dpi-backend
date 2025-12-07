import mongoose from 'mongoose';
const { Schema } = mongoose;

const OptionSchema = new Schema({
  text: { type: String, required: true },
  votes: { type: Number, default: 0 }
});

const PollSchema = new Schema({
  question: { type: String, required: true },
  options: [OptionSchema],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  active: { type: Boolean, default: true },
  expiresAt: { type: Date },
  voted: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export default mongoose.model('Poll', PollSchema);

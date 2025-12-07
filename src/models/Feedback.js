import mongoose from 'mongoose';
const { Schema } = mongoose;

const FeedbackSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['bug', 'suggestion', 'other'], default: 'other' },
  resolved: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Feedback', FeedbackSchema);

import mongoose from 'mongoose';
const { Schema } = mongoose;

const FeedbackSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  // category allows frontend to group feedbacks (technical, suggestion, complaint, inquiry...)
  category: { type: String, default: 'other', enum: ['technical', 'suggestion', 'complaint', 'inquiry', 'other'] },
  // original 'type' kept for backwards compatibility (bug/suggestion/other)
  type: { type: String, enum: ['bug', 'suggestion', 'other'], default: 'other' },
  // admin-facing priority and status
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'low' },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
  // optional response from admin
  response: {
    text: { type: String },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date }
  },
  // keep resolved boolean for minimal breaking changes (synced with status)
  resolved: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Feedback', FeedbackSchema);

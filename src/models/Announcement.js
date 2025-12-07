import mongoose from 'mongoose';
const { Schema } = mongoose;

const AnnouncementSchema = new Schema({
  title: { type: String, required: true },
  // use `content` instead of `body` to match frontend naming
  content: { type: String, required: true },
  category: { type: String, enum: ['disbursement', 'update', 'maintenance', 'general'], default: 'general' },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'low' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  published: { type: Boolean, default: false },
  publishedAt: { type: Date },
}, { timestamps: true });

export default mongoose.model('Announcement', AnnouncementSchema);

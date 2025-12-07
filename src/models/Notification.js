import mongoose from 'mongoose';
const { Schema } = mongoose;

const NotificationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  type: { type: String, enum: ['info', 'alert', 'reminder', 'other'], default: 'info' },
  data: { type: Object },
}, { timestamps: true });

export default mongoose.model('Notification', NotificationSchema);

import mongoose from 'mongoose';
const { Schema } = mongoose;

const NinInfoSchema = new Schema({
  nin: { type: String, unique: true, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('NinInfo', NinInfoSchema);

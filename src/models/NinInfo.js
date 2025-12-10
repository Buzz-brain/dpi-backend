import mongoose from 'mongoose';
const { Schema } = mongoose;

const NinInfoSchema = new Schema({
  nin: { type: String, unique: true, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  // Optional demographic fields commonly returned by NIN or collected during verification
  state: { type: String },
  region: { type: String },
  occupation: { type: String },
  gender: { type: String },
  dob: { type: Date },
  address: { type: String },
  lga: { type: String },
  tribe: { type: String }
}, { timestamps: true });

export default mongoose.model('NinInfo', NinInfoSchema);

import mongoose from 'mongoose';

const { Schema } = mongoose;


const UserSchema = new Schema({
  username: { type: String, unique: true, required: true },
  fullName: { type: String }, // Required for citizen, optional for admin
  nin: { type: String, unique: true, sparse: true }, // Required for citizen, not for admin
  email: { type: String, unique: true, sparse: true },
  phone: { type: String },
  password: { type: String },
  role: { type: String, default: 'citizen' },
  verifiedNIN: { type: Boolean, default: false },
  ninVerificationRef: { type: String },
  emailVerified: { type: Boolean, default: false },
  ninVerified: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('User', UserSchema);

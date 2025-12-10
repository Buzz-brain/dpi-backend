import mongoose from 'mongoose';

const { Schema } = mongoose;


const UserSchema = new Schema({
  username: { type: String, unique: true, required: true },
  nin: { type: String, unique: true, sparse: true }, // Required for citizen, not for admin
  // Note: demographic/contact fields are stored on NinInfo and referenced via `ninInfo`.
  // Keep `nin` here for lookup and backward compatibility.
  password: { type: String },
  role: { type: String, default: 'citizen' },
  // Reference to NIN information document (keeps demographic data authoritative)
  ninInfo: { type: Schema.Types.ObjectId, ref: 'NinInfo' },
  // Account status for admin control (active/inactive/suspended)
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  verifiedNIN: { type: Boolean, default: false },
  ninVerificationRef: { type: String },
  emailVerified: { type: Boolean, default: false },
  ninVerified: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('User', UserSchema);

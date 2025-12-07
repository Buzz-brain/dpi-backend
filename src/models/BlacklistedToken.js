import mongoose from 'mongoose';

const BlacklistedTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

// TTL index to remove expired blacklist entries automatically
BlacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const BlacklistedToken = mongoose.model('BlacklistedToken', BlacklistedTokenSchema);

export default BlacklistedToken;

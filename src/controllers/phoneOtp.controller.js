import bcrypt from 'bcrypt';
import Otp from '../models/Otp.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendPhoneOtp(req, res) {
  try {
    const { phone, purpose } = req.body;
    if (!phone || !purpose) return res.status(400).json({ message: 'Phone and purpose required' });
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min
    await Otp.create({ phone, otpHash, expiresAt, purpose });
    // TODO: Integrate SMS provider here. For now, return OTP in dev
    logger.info(`OTP for ${phone} [${purpose}]: ${otp}`);
    res.json({ message: 'OTP sent', otp: process.env.NODE_ENV !== 'production' ? otp : undefined });
  } catch (err) {
    logger.error('Send phone OTP error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function verifyPhoneOtp(req, res) {
  try {
    const { phone, otp, purpose } = req.body;
    if (!phone || !otp || !purpose) return res.status(400).json({ message: 'Missing fields' });
    const record = await Otp.findOne({ phone, purpose });
    if (!record) return res.status(400).json({ message: 'OTP not found' });
    if (record.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' });
    const match = await bcrypt.compare(otp, record.otpHash);
    if (!match) return res.status(400).json({ message: 'Invalid OTP' });
    await Otp.deleteOne({ _id: record._id });
    // For phone verification, mark user as phoneVerified (if you add this field)
    // await User.updateOne({ phone }, { $set: { phoneVerified: true } });
    res.json({ message: 'OTP verified' });
  } catch (err) {
    logger.error('Verify phone OTP error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

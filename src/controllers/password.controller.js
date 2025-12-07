import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import logger from '../utils/logger.js';

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Reuse OTP send logic
    req.body.purpose = 'reset-password';
    return await import('./otp.controller.js').then(({ sendEmailOtp }) => sendEmailOtp(req, res));
  } catch (err) {
    logger.error('Forgot password error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ message: 'Missing fields' });
    // Verify OTP
    const record = await Otp.findOne({ email, purpose: 'reset-password' });
    if (!record) return res.status(400).json({ message: 'OTP not found' });
    if (record.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' });
    const match = await bcrypt.compare(otp, record.otpHash);
    if (!match) return res.status(400).json({ message: 'Invalid OTP' });
    // Update password
    const hashed = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email }, { $set: { password: hashed } });
    await Otp.deleteOne({ _id: record._id });
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    logger.error('Reset password error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

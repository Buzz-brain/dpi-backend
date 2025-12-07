import crypto from 'crypto';
import bcrypt from 'bcrypt';
import Otp from '../models/Otp.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendEmailOtp(req, res) {
  try {
    const { email, purpose } = req.body;
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await Otp.create({ email, code, purpose, expiresAt });
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${code}`
    });
    res.json({ message: 'OTP sent' });
  } catch (err) {
    logger.error('Send email OTP error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function verifyEmailOtp(req, res) {
  try {
    const { email, code, purpose } = req.body;
    const otp = await Otp.findOne({ email, code, purpose, used: false, expiresAt: { $gt: new Date() } });
    if (!otp) return res.status(400).json({ message: 'Invalid or expired OTP' });
    otp.used = true;
    await otp.save();
    if (purpose === 'email_verification') {
      await User.findOneAndUpdate({ email }, { emailVerified: true });
    }
    res.json({ message: 'OTP verified' });
  } catch (err) {
    logger.error('Verify email OTP error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function sendPasswordResetOtp(req, res) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await Otp.create({ email, code, purpose: 'password_reset', expiresAt });
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Password Reset OTP',
      text: `Your password reset OTP is: ${code}`
    });
    res.json({ message: 'Password reset OTP sent' });
  } catch (err) {
    logger.error('Send password reset OTP error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function resetPasswordWithOtp(req, res) {
  try {
    const { email, code, newPassword } = req.body;
    const otp = await Otp.findOne({ email, code, purpose: 'password_reset', used: false, expiresAt: { $gt: new Date() } });
    if (!otp) return res.status(400).json({ message: 'Invalid or expired OTP' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = newPassword; // Should hash in pre-save hook
    await user.save();
    otp.used = true;
    await otp.save();
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    logger.error('Reset password with OTP error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

import express from 'express';
import { register, login, logout, me } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { sendEmailOtp, verifyEmailOtp } from '../controllers/otp.controller.js';
import { forgotPassword, resetPassword } from '../controllers/password.controller.js';
import { sendPhoneOtp, verifyPhoneOtp } from '../controllers/phoneOtp.controller.js';
import { verifyNin } from '../controllers/nin.controller.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, me);
router.post('/verify-email', protect, sendEmailOtp); // send OTP for email verification
router.post('/verify-email/confirm', protect, verifyEmailOtp); // verify OTP
router.post('/forgot-password', protect, forgotPassword);
router.post('/reset-password', protect, resetPassword);
router.post('/send-otp', protect, sendPhoneOtp);
router.post('/verify-otp', protect, verifyPhoneOtp);
// router.post('/verify-nin', verifyNin);

export default router;

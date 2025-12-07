import express from 'express';
import {
  sendEmailOtp,
  verifyEmailOtp,
  sendPasswordResetOtp,
  resetPasswordWithOtp
} from '../controllers/otp.controller.js';

const router = express.Router();

router.post('/send', sendEmailOtp);
router.post('/verify', verifyEmailOtp);
router.post('/password-reset/send', sendPasswordResetOtp);
router.post('/password-reset/verify', resetPasswordWithOtp);

export default router;

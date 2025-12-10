import express from 'express';
import { createWithdrawal, getUserWithdrawals } from '../controllers/withdrawal.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Create a withdrawal (authenticated)
router.post('/', protect, createWithdrawal);

// Get current user's withdrawals
router.get("/user", protect, getUserWithdrawals);

export default router;

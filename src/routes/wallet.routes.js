import express from 'express';
import { getWallet, topupWallet } from '../controllers/wallet.controller.js';
// import { fundWallet, verifyWalletFunding } from '../controllers/paystack.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Specific routes first (before parameterized routes)
// router.post('/fund', fundWallet);
// router.get('/verify/:reference', verifyWalletFunding);

// Parameterized routes last
router.get('/:userId', protect, getWallet);
router.post('/:userId/topup', protect, topupWallet);

export default router;

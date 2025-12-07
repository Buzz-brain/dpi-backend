import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { sendTransaction, withdrawTransaction, getTransactions } from '../controllers/transaction.controller.js';

const router = express.Router();

router.post('/send', protect, sendTransaction);
router.post('/withdraw', protect, withdrawTransaction);
router.get('/', protect, getTransactions);

export default router;

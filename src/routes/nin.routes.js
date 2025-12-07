import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { verifyNin } from '../controllers/nin.controller.js';

const router = express.Router();

router.post('/verify', protect, verifyNin);

export default router;

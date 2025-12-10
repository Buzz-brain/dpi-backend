import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';
import {
  createFeedback,
  getFeedbacks,
  getFeedback,
  getMyFeedbacks,
  updateFeedback,
  deleteFeedback
} from '../controllers/feedback.controller.js';

const router = express.Router();

router.get('/mine', protect, getMyFeedbacks);
router.get('/', protect, requireAdmin, getFeedbacks);
router.get('/:id', protect, requireAdmin, getFeedback);
router.post('/', protect, createFeedback);
router.put('/:id', protect, requireAdmin, updateFeedback);
router.delete('/:id', protect, requireAdmin, deleteFeedback);

export default router;

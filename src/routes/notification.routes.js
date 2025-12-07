import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';
import {
  createNotification,
  getNotifications,
  getNotification,
  markAsRead,
  deleteNotification
} from '../controllers/notification.controller.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.get('/:id', protect, getNotification);
router.post('/', protect, requireAdmin, createNotification);
router.patch('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteNotification);

export default router;

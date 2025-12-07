import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';
import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncement,
  getAnnouncementsAdmin,
  updateAnnouncement,
  deleteAnnouncement
} from '../controllers/announcement.controller.js';

const router = express.Router();

// Admin route to fetch all announcements (including drafts)
router.get('/all', protect, requireAdmin, getAnnouncementsAdmin);

// Public listing (published only)
router.get('/', getAnnouncements);
router.get('/:id', getAnnouncement);
router.post('/', protect, requireAdmin, createAnnouncement);
router.put('/:id', protect, requireAdmin, updateAnnouncement);
router.delete('/:id', protect, requireAdmin, deleteAnnouncement);

export default router;

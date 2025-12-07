import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';
import {
  getProfile,
  updateProfile,
  getUser,
  updateUser,
  deleteUser
} from '../controllers/user.controller.js';

const router = express.Router();

// User profile endpoints
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Admin user management
router.get('/:id', protect, requireAdmin, getUser);
router.put('/:id', protect, requireAdmin, updateUser);
router.delete('/:id', protect, requireAdmin, deleteUser);

export default router;

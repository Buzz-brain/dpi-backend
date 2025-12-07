import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';
import multer from 'multer';
import {
  getAllUsers,
  deleteUser,
  exportUsers,
  bulkDisburse
} from '../controllers/admin.controller.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.get('/users', protect, requireAdmin, getAllUsers);
router.delete('/users/:id', protect, requireAdmin, deleteUser);
router.get('/users/export', protect, requireAdmin, exportUsers);
router.post('/bulk-disburse', protect, requireAdmin, upload.single('file'), bulkDisburse);

export default router;

import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';
import {
  createNinInfo,
  getNinInfo,
  updateNinInfo,
  deleteNinInfo
} from '../controllers/nininfo.controller.js';

const router = express.Router();

router.post('/', protect, requireAdmin, createNinInfo);
router.get('/:nin', getNinInfo);
router.put('/:nin', protect, requireAdmin, updateNinInfo);
router.delete('/:nin', protect, requireAdmin, deleteNinInfo);

export default router;

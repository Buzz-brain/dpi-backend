import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';
import { upload, uploadFile, downloadFile, deleteFile } from '../controllers/file.controller.js';

const router = express.Router();

router.post('/upload', protect, upload.single('file'), uploadFile);
router.get('/download/:filename', protect, downloadFile);
router.delete('/:filename', protect, requireAdmin, deleteFile);

export default router;

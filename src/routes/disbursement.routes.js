import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';
import {
  getDisbursements,
  getDisbursement,
  createDisbursement,
  retryDisbursement
  ,getDisbursementFilters, previewDisbursement
} from '../controllers/disbursement.controller.js';

const router = express.Router();

// All routes are admin-only
router.use(protect, requireAdmin);

router.get('/', getDisbursements);
router.get('/filters', getDisbursementFilters);
router.post('/preview', previewDisbursement);
router.get('/:id', getDisbursement);
router.post('/', createDisbursement);
router.post('/:id/retry', retryDisbursement);

export default router;

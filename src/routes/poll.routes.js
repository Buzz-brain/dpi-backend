import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';
import {
  createPoll,
  getPolls,
  getPoll,
  votePoll,
  updatePoll,
  deletePoll
} from '../controllers/poll.controller.js';

const router = express.Router();

router.get("/", protect, getPolls);
router.get("/:id", protect, getPoll);
router.post('/', protect, requireAdmin, createPoll);
router.post('/:id/vote', protect, votePoll);
router.put('/:id', protect, requireAdmin, updatePoll);
router.delete('/:id', protect, requireAdmin, deletePoll);

export default router;

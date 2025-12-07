import Feedback from '../models/Feedback.js';
import logger from '../utils/logger.js';

export async function createFeedback(req, res) {
  try {
    const { message, type } = req.body;
    const feedback = await Feedback.create({
      user: req.user.sub,
      message,
      type
    });
    res.status(201).json(feedback);
  } catch (err) {
    logger.error('Create feedback error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getFeedbacks(req, res) {
  try {
    const feedbacks = await Feedback.find().populate('user', 'email').sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    logger.error('Get feedbacks error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getFeedback(req, res) {
  try {
    const feedback = await Feedback.findById(req.params.id).populate('user', 'email');
    if (!feedback) return res.status(404).json({ message: 'Not found' });
    res.json(feedback);
  } catch (err) {
    logger.error('Get feedback error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function updateFeedback(req, res) {
  try {
    const updates = req.body;
    const feedback = await Feedback.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!feedback) return res.status(404).json({ message: 'Not found' });
    res.json(feedback);
  } catch (err) {
    logger.error('Update feedback error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function deleteFeedback(req, res) {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Feedback deleted' });
  } catch (err) {
    logger.error('Delete feedback error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

import Feedback from '../models/Feedback.js';
import logger from '../utils/logger.js';
import Joi from 'joi';

export async function createFeedback(req, res) {
  try {
    const schema = Joi.object({
      message: Joi.string().min(5).max(2000).required(),
      type: Joi.string().valid('bug', 'suggestion', 'other').optional(),
      category: Joi.string().valid('technical', 'suggestion', 'complaint', 'inquiry', 'other').optional(),
      priority: Joi.string().valid('high', 'medium', 'low').optional()
    });
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { message, type, category, priority } = value;
    const feedback = await Feedback.create({
      user: req.user.sub,
      message,
      type: type || 'other',
      category: category || 'other',
      priority: priority || 'low',
      status: 'pending',
      resolved: false
    });
    res.status(201).json(feedback);
  } catch (err) {
    logger.error('Create feedback error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getMyFeedbacks(req, res) {
  try {
    const feedbacks = await Feedback.find({ user: req.user.sub })
      .populate('user', 'fullName email')
      .populate('response.by', 'fullName email')
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    logger.error('Get my feedbacks error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getFeedbacks(req, res) {
  try {
    const feedbacks = await Feedback.find()
      .populate('user', 'fullName email')
      .populate('response.by', 'fullName email')
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    logger.error('Get feedbacks error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getFeedback(req, res) {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('user', 'fullName email')
      .populate('response.by', 'fullName email');
    if (!feedback) return res.status(404).json({ message: 'Not found' });
    res.json(feedback);
  } catch (err) {
    logger.error('Get feedback error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function updateFeedback(req, res) {
  try {
    // Only allow certain fields to be updated by admins here
    const schema = Joi.object({
      status: Joi.string().valid('pending', 'reviewed', 'resolved').optional(),
      priority: Joi.string().valid('high', 'medium', 'low').optional(),
      response: Joi.string().min(1).max(2000).optional(),
      category: Joi.string().valid('technical', 'suggestion', 'complaint', 'inquiry', 'other').optional(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const updates = { ...value };
    if (updates.status) updates.resolved = updates.status === 'resolved';

    if (typeof updates.response === 'string' && updates.response.trim()) {
      updates.response = {
        text: updates.response.trim(),
        by: req.user.sub,
        at: new Date()
      };
      if (!updates.status) updates.status = 'reviewed';
      updates.resolved = updates.status === 'resolved';
    }

    const feedback = await Feedback.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('user', 'fullName email')
      .populate('response.by', 'fullName email');
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

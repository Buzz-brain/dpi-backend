import Poll from '../models/Poll.js';
import logger from '../utils/logger.js';

export async function createPoll(req, res) {
  try {
    const { question, options, expiresAt } = req.body;
    const poll = await Poll.create({
      question,
      options: options.map(text => ({ text })),
      createdBy: req.user.sub,
      expiresAt
    });
    res.status(201).json(poll);
  } catch (err) {
    logger.error('Create poll error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getPolls(req, res) {
  try {
    const polls = await Poll.find().sort({ createdAt: -1 });
    res.json(polls);
  } catch (err) {
    logger.error('Get polls error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getPoll(req, res) {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Not found' });
    res.json(poll);
  } catch (err) {
    logger.error('Get poll error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function votePoll(req, res) {
  try {
    const { optionIndex } = req.body;
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Not found' });
    if (!poll.active || (poll.expiresAt && new Date() > poll.expiresAt)) {
      return res.status(400).json({ message: 'Poll is closed' });
    }
    if (poll.voted.includes(req.user.sub)) {
      return res.status(400).json({ message: 'Already voted' });
    }
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ message: 'Invalid option' });
    }
    poll.options[optionIndex].votes += 1;
    poll.voted.push(req.user.sub);
    await poll.save();
    res.json(poll);
  } catch (err) {
    logger.error('Vote poll error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function updatePoll(req, res) {
  try {
    const updates = req.body;
    const poll = await Poll.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!poll) return res.status(404).json({ message: 'Not found' });
    res.json(poll);
  } catch (err) {
    logger.error('Update poll error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function deletePoll(req, res) {
  try {
    const poll = await Poll.findByIdAndDelete(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Poll deleted' });
  } catch (err) {
    logger.error('Delete poll error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

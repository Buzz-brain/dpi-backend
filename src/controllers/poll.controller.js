import Poll from '../models/Poll.js';
import logger from '../utils/logger.js';

function computeStatus(poll) {
  const now = new Date();
  if (poll.startDate && new Date(poll.startDate) > now) return 'upcoming';
  if (poll.endDate && new Date(poll.endDate) < now) return 'closed';
  return poll.status || 'active';
}

function shapePoll(pollDoc, userId) {
  const poll = pollDoc.toObject ? pollDoc.toObject() : pollDoc;
  const totalVotes = Array.isArray(poll.options) ? poll.options.reduce((s, o) => s + (o.votes || 0), 0) : 0;
  const votedByUser = !!(userId && Array.isArray(poll.voted) && poll.voted.find(id => id.toString() === userId.toString()));
  return {
    id: poll._id,
    title: poll.title,
    description: poll.description,
    category: poll.category,
    options: (poll.options || []).map((o, idx) => ({
      id: o._id,
      optionId: o.optionId || `OPT${idx + 1}`,
      text: o.text,
      votes: o.votes || 0
    })),
    status: computeStatus(poll),
    startDate: poll.startDate,
    endDate: poll.endDate,
    totalVotes,
    createdBy: poll.createdBy,
    createdAt: poll.createdAt,
    updatedAt: poll.updatedAt,
    voted: votedByUser
  };
}

export async function createPoll(req, res) {
  try {
    const { title, description, options = [], startDate, endDate, category, status } = req.body;
    if (!title || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ message: 'Invalid poll data: title and at least 2 options required' });
    }
    // Assign optionId as 'OPT1', 'OPT2', ...
    const pollOptions = options.map((text, idx) => ({
      optionId: `OPT${idx + 1}`,
      text
    }));
    const poll = await Poll.create({
      title,
      description: description || '',
      category: category || 'General',
      options: pollOptions,
      createdBy: req.user.sub,
      status: status || 'active',
      startDate: startDate || undefined,
      endDate: endDate || undefined
    });
    res.status(201).json(shapePoll(poll, req.user && req.user.sub));
  } catch (err) {
    logger.error('Create poll error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getPolls(req, res) {
  try {
    const polls = await Poll.find().sort({ createdAt: -1 });
    res.json(polls.map(p => shapePoll(p, req.user && req.user.sub)));
  } catch (err) {
    logger.error('Get polls error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getPoll(req, res) {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Not found' });
    res.json(shapePoll(poll, req.user && req.user.sub));
  } catch (err) {
    logger.error('Get poll error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function votePoll(req, res) {
  try {
    const { optionId, optionIndex } = req.body;
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Not found' });

    // Check poll status by dates and status flag
    if (computeStatus(poll) === 'closed') {
      return res.status(400).json({ message: 'Poll is closed' });
    }

    // Prevent duplicate voting
    if (poll.voted && poll.voted.find(id => id.toString() === req.user.sub)) {
      return res.status(400).json({ message: 'Already voted' });
    }

    let option = null;
    if (optionId) {
      // Try to find by MongoDB _id first
      option = poll.options.id(optionId);
      // If not found, try by human-readable optionId
      if (!option) {
        option = poll.options.find(o => o.optionId === optionId);
      }
    } else if (typeof optionIndex === 'number') {
      option = poll.options[optionIndex];
    }

    if (!option) return res.status(400).json({ message: 'Invalid option' });

    option.votes = (option.votes || 0) + 1;
    poll.voted = poll.voted || [];
    poll.voted.push(req.user.sub);
    // totalVotes will be recomputed in pre-save
    await poll.save();
    res.json(shapePoll(poll, req.user && req.user.sub));
  } catch (err) {
    logger.error('Vote poll error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function updatePoll(req, res) {
  try {
    const updates = req.body;
    // Only allow safe updates; if options are provided, replace options array
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Not found' });

    if (updates.title !== undefined) poll.title = updates.title;
    if (updates.description !== undefined) poll.description = updates.description;
    if (updates.category !== undefined) poll.category = updates.category;
    if (updates.startDate !== undefined) poll.startDate = updates.startDate;
    if (updates.endDate !== undefined) poll.endDate = updates.endDate;
    if (updates.status !== undefined) poll.status = updates.status;
    if (Array.isArray(updates.options)) {
      // Replace options: assign optionId as 'OPT1', 'OPT2', ...
      poll.options = updates.options.map((o, idx) => {
        if (typeof o === 'string') {
          return { optionId: `OPT${idx + 1}`, text: o, votes: 0 };
        } else {
          return {
            optionId: o.optionId || `OPT${idx + 1}`,
            text: o.text || '',
            votes: o.votes || 0
          };
        }
      });
      // Reset voted list when options change to avoid inconsistency
      poll.voted = [];
    }

    await poll.save();
    res.json(shapePoll(poll, req.user && req.user.sub));
  } catch (err) {
    logger.error('Update poll error', err);
    res.status(500).json({ message: 'Server error', error: err.message });
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

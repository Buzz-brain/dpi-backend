import Announcement from '../models/Announcement.js';
import logger from '../utils/logger.js';

export async function createAnnouncement(req, res) {
  try {
    const { title, content, category, priority, published } = req.body;
    const data = {
      title,
      content,
      category,
      priority,
      createdBy: req.user.sub,
      published: !!published,
    };
    if (published) data.publishedAt = new Date();
    const announcement = await Announcement.create(data);
    res.status(201).json(announcement);
  } catch (err) {
    logger.error('Create announcement error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getAnnouncements(req, res) {
  try {
    // Public endpoint: only return published announcements ordered by publish date
    const announcements = await Announcement.find({ published: true }).sort({ publishedAt: -1, createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    logger.error('Get announcements error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Admin-only: return all announcements including unpublished/drafts
export async function getAnnouncementsAdmin(req, res) {
  try {
    const announcements = await Announcement.find({}).sort({ createdAt: -1, publishedAt: -1 });
    res.json(announcements);
  } catch (err) {
    logger.error('Get admin announcements error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getAnnouncement(req, res) {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Not found' });

    // If request is unauthenticated (public), hide unpublished announcements
    if (!req.user && !announcement.published) return res.status(404).json({ message: 'Not found' });

    // If authenticated as admin, allow viewing unpublished announcements as well
    if (announcement.published || (req.user && req.user.role && req.user.role.startsWith('super')) || (req.user && req.user.isAdmin)) {
      return res.json(announcement);
    }

    // Otherwise treat as not found
    return res.status(404).json({ message: 'Not found' });
  } catch (err) {
    logger.error('Get announcement error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function updateAnnouncement(req, res) {
  try {
    const updates = req.body || {};
    // Normalize possible `body` field to `content` for backward compatibility
    if (updates.body && !updates.content) updates.content = updates.body;

    // Load existing announcement to handle publishedAt logic
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Not found' });

    // Apply updates
    ['title', 'content', 'category', 'priority', 'published'].forEach((f) => {
      if (typeof updates[f] !== 'undefined') announcement[f] = updates[f];
    });

    if (updates.published === true && !announcement.publishedAt) {
      announcement.publishedAt = new Date();
    }
    if (updates.published === false) {
      // leave publishedAt as-is or clear it to null if you want draft state without date
      announcement.publishedAt = announcement.publishedAt || null;
    }

    await announcement.save();
    res.json(announcement);
  } catch (err) {
    logger.error('Update announcement error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function deleteAnnouncement(req, res) {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    logger.error('Delete announcement error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

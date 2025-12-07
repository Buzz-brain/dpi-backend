import Notification from '../models/Notification.js';
import logger from '../utils/logger.js';

import User from '../models/User.js';

export async function createNotification(req, res) {
  try {
    const { user, title, message, type, data } = req.body;
    if (user) {
      // User-specific notification
      const notification = await Notification.create({
        user,
        title,
        message,
        type,
        data
      });
      return res.status(201).json(notification);
    } else {
      // Broadcast: create notification for all users
      const users = await User.find({}, '_id');
      const notifications = await Notification.insertMany(
        users.map(u => ({
          user: u._id,
          title,
          message,
          type,
          data
        }))
      );
      return res.status(201).json({ message: 'Broadcast sent', count: notifications.length });
    }
  } catch (err) {
    logger.error('Create notification error', err);
    console.log(err)
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getNotifications(req, res) {
  try {
    const filter = req.user && req.user.role !== 'admin' ? { user: req.user.sub } : {};
    const notifications = await Notification.find(filter).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    logger.error('Get notifications error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getNotification(req, res) {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Not found' });
    if (req.user.role !== 'admin' && notification.user.toString() !== req.user.sub) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(notification);
  } catch (err) {
    logger.error('Get notification error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function markAsRead(req, res) {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Not found' });
    if (req.user.role !== 'admin' && notification.user.toString() !== req.user.sub) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (err) {
    logger.error('Mark notification as read error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function deleteNotification(req, res) {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Not found' });
    if (req.user.role !== 'admin' && notification.user.toString() !== req.user.sub) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await notification.deleteOne();
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    logger.error('Delete notification error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

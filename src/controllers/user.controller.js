import User from '../models/User.js';
import logger from '../utils/logger.js';

// Get logged-in user profile
export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.sub).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    logger.error('Get profile error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Update logged-in user profile
export async function updateProfile(req, res) {
  try {
    const updates = req.body;
    delete updates.password;
    const user = await User.findByIdAndUpdate(req.user.sub, updates, { new: true, select: '-password' });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    logger.error('Update profile error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Admin: get single user by id
export async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    logger.error('Get user by id error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Admin: get all users
export async function getAllUsers(req, res) {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    logger.error('Get all users error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Admin: update user by id
export async function updateUserById(req, res) {
  try {
    const updates = req.body;
    delete updates.password;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, select: '-password' });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    logger.error('Update user by id error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Admin: delete user by id
export async function deleteUserById(req, res) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    logger.error('Delete user by id error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Self: get user by id
export async function getUser(req, res) {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    logger.error('Get user error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Self: update user by id
export async function updateUser(req, res) {
  try {
    const updates = req.body;
    delete updates.password;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, select: '-password' });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    logger.error('Update user error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Self: delete user by id
export async function deleteUser(req, res) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    logger.error('Delete user error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

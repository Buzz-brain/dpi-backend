import Joi from 'joi';
import Wallet from '../models/Wallet.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const topupSchema = Joi.object({ amount: Joi.number().positive().required(), note: Joi.string().optional() });

export async function getWallet(req, res) {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: 'userId required' });
    const wallet = await Wallet.findOne({ user: userId }).populate('user', 'username fullName nin');
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
    res.json({ balance: wallet.balance, ledger: wallet.ledger, user: wallet.user });
  } catch (err) {
    logger.error('Get wallet error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Admin top-up: increments balance and adds ledger entry
export async function topupWallet(req, res) {
  try {
    const { userId } = req.params;
    const { error, value } = topupSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    // Basic RBAC check: require role=admin in req.user (middleware to populate req.user expected)
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const wallet = await Wallet.findOneAndUpdate(
      { user: userId },
      { $inc: { balance: value.amount }, $push: { ledger: { type: 'topup', amount: value.amount, by: req.user.sub, note: value.note } } },
      { new: true, upsert: true }
    );

    res.json({ message: 'Top-up successful', balance: wallet.balance });
  } catch (err) {
    logger.error('Topup error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

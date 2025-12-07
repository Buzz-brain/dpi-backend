import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Wallet from '../models/Wallet.js';
import logger from '../utils/logger.js';
import csv from 'csv-parser';
import fs from 'fs';

export async function getStats(req, res) {
  try {
    const totalUsers = await User.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    const totalFeedback = 0; // implement if feedback model exists
    res.json({ totalUsers, totalTransactions, totalFeedback });
  } catch (err) {
    logger.error('Admin stats error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getAllTransactions(req, res) {
  try {
    const txs = await Transaction.find().sort({ createdAt: -1 });
    res.json(txs);
  } catch (err) {
    logger.error('Admin get transactions error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getPayouts(req, res) {
  try {
    // Placeholder: implement payout model or logic
    res.json([]);
  } catch (err) {
    logger.error('Admin get payouts error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getBeneficiaries(req, res) {
  try {
    // For now, all users with role 'citizen' and verifiedNIN
    const users = await User.find({ role: 'citizen', verifiedNIN: true });
    res.json(users);
  } catch (err) {
    logger.error('Admin get beneficiaries error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function disbursePayouts(req, res) {
  try {
    // Placeholder: implement CSV upload and bulk wallet top-up
    res.json({ message: 'Bulk disbursement - to implement' });
  } catch (err) {
    logger.error('Admin disburse payouts error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getAllUsers(req, res) {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    logger.error('Get all users error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function deleteUser(req, res) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await Wallet.findOneAndDelete({ user: user._id });
    res.json({ message: 'User deleted' });
  } catch (err) {
    logger.error('Delete user error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function exportUsers(req, res) {
  try {
    const users = await User.find();
    const csvRows = [
      'id,email,phone,nin,ninVerified,emailVerified,createdAt',
      ...users.map(u => `${u._id},${u.email},${u.phone || ''},${u.nin || ''},${u.ninVerified},${u.emailVerified},${u.createdAt.toISOString()}`)
    ];
    res.header('Content-Type', 'text/csv');
    res.attachment('users.csv');
    res.send(csvRows.join('\n'));
  } catch (err) {
    logger.error('Export users error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function bulkDisburse(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: 'No CSV uploaded' });
    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        for (const row of results) {
          const user = await User.findOne({ email: row.email });
          if (user) {
            await Wallet.findOneAndUpdate(
              { user: user._id },
              { $inc: { balance: parseFloat(row.amount) } }
            );
          }
        }
        res.json({ message: 'Bulk disbursement complete', count: results.length });
      });
  } catch (err) {
    logger.error('Bulk disbursement error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

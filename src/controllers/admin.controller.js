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
    // Return citizen users with wallet aggregates (balance, totalReceived, totalWithdrawn)
    const users = await User.aggregate([
      { $match: { role: 'citizen', verifiedNIN: true } },
      { $lookup: { from: 'wallets', localField: '_id', foreignField: 'user', as: 'wallet' } },
      { $unwind: { path: '$wallet', preserveNullAndEmptyArrays: true } },
      { $addFields: {
        balance: { $ifNull: ['$wallet.balance', 0] },
        totalReceived: {
          $reduce: {
            input: { $filter: { input: { $ifNull: ['$wallet.ledger', []] }, as: 'l', cond: { $eq: ['$$l.type', 'credit'] } } },
            initialValue: 0,
            in: { $add: ['$$value', { $ifNull: ['$$this.amount', 0] }] }
          }
        },
        totalWithdrawn: {
          $reduce: {
            input: { $filter: { input: { $ifNull: ['$wallet.ledger', []] }, as: 'l', cond: { $eq: ['$$l.type', 'debit'] } } },
            initialValue: 0,
            in: { $add: ['$$value', { $ifNull: ['$$this.amount', 0] }] }
          }
        }
      } },
      { $project: { wallet: 0 } }
    ]);
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
    const users = await User.aggregate([
      { $match: {} },
      { $lookup: { from: 'wallets', localField: '_id', foreignField: 'user', as: 'wallet' } },
      { $unwind: { path: '$wallet', preserveNullAndEmptyArrays: true } },
      { $addFields: {
        balance: { $ifNull: ['$wallet.balance', 0] },
        totalReceived: {
          $reduce: {
            input: { $filter: { input: { $ifNull: ['$wallet.ledger', []] }, as: 'l', cond: { $eq: ['$$l.type', 'credit'] } } },
            initialValue: 0,
            in: { $add: ['$$value', { $ifNull: ['$$this.amount', 0] }] }
          }
        },
        totalWithdrawn: {
          $reduce: {
            input: { $filter: { input: { $ifNull: ['$wallet.ledger', []] }, as: 'l', cond: { $eq: ['$$l.type', 'debit'] } } },
            initialValue: 0,
            in: { $add: ['$$value', { $ifNull: ['$$this.amount', 0] }] }
          }
        }
      } },
      { $project: { wallet: 0 } }
    ]);
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

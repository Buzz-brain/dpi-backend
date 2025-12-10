import Disbursement from '../models/Disbursement.js';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import logger from '../utils/logger.js';
import Joi from 'joi';
import NinInfo from '../models/NinInfo.js';

// Get all disbursements (admin only)
export async function getDisbursements(req, res) {
  try {
    const disbursements = await Disbursement.find()
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });
    res.json(disbursements);
  } catch (err) {
    logger.error('Get disbursements error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Get available filter options (states from NinInfo, roles from Users)
export async function getDisbursementFilters(req, res) {
  try {
    const states = await NinInfo.distinct('state');
    const occupations = await NinInfo.distinct('occupation');
    res.json({ states: states.filter(Boolean), occupations: occupations.filter(Boolean) });
  } catch (err) {
    logger.error('Get disbursement filters error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Get a single disbursement with details
export async function getDisbursement(req, res) {
  try {
    const disbursement = await Disbursement.findById(req.params.id)
      .populate('createdBy', 'fullName email')
      .populate('results.beneficiaryId', 'fullName email nin');
    if (!disbursement) return res.status(404).json({ message: 'Not found' });
    res.json(disbursement);
  } catch (err) {
    logger.error('Get disbursement error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Create and trigger a new disbursement batch
export async function createDisbursement(req, res) {
  try {
    const schema = Joi.object({
      batchName: Joi.string().min(3).max(200).required(),
      amount: Joi.number().min(1).required(),
      disbursementDate: Joi.date().required(),
        filters: Joi.object({
          status: Joi.string().valid('all', 'active', 'inactive', 'verified').optional(),
          state: Joi.string().optional(),
          occupation: Joi.string().optional(),
          minBalance: Joi.number().min(0).optional()
        }).optional(),
      description: Joi.string().max(500).optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { batchName, amount, disbursementDate, filters = {}, description } = value;

    // Build aggregation pipeline to find matching beneficiaries.
    // We join NinInfo (demographic fields) and Wallet (balance) so filters like state and minBalance work.
    const pipeline = [];

    // Initial match on user status/role
    const userMatch = {};
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'active') userMatch.status = 'active';
      if (filters.status === 'inactive') userMatch.status = 'inactive';
      if (filters.status === 'verified') {
        // we'll filter by NinInfo.isVerified below
      }
    }
    // Note: occupation filter is on NinInfo, not User.role
    if (Object.keys(userMatch).length) pipeline.push({ $match: userMatch });

    // Lookup NinInfo
    pipeline.push({
      $lookup: {
        from: 'nininfos',
        localField: 'ninInfo',
        foreignField: '_id',
        as: 'ninInfo'
      }
    });
    pipeline.push({ $unwind: { path: '$ninInfo', preserveNullAndEmptyArrays: true } });

    // Apply NinInfo-based filters
    if (filters.state) pipeline.push({ $match: { 'ninInfo.state': filters.state } });
    if (filters.status === 'verified') pipeline.push({ $match: { 'ninInfo.isVerified': true } });
    // occupation filter comes from NinInfo. Use filters.occupation when provided.
    if (filters.occupation && filters.occupation !== 'all') pipeline.push({ $match: { 'ninInfo.occupation': filters.occupation } });

    // Lookup Wallet to check balance
    pipeline.push({
      $lookup: {
        from: 'wallets',
        localField: '_id',
        foreignField: 'user',
        as: 'wallet'
      }
    });
    pipeline.push({ $unwind: { path: '$wallet', preserveNullAndEmptyArrays: true } });

    // Apply minBalance filter if provided
    if (filters.minBalance && Number(filters.minBalance) > 0) {
      pipeline.push({ $match: { 'wallet.balance': { $gte: Number(filters.minBalance) } } });
    }

    // Only select user id
    pipeline.push({ $project: { _id: 1 } });

    const beneficiariesAgg = await User.aggregate(pipeline).exec();
    const beneficiaries = beneficiariesAgg.map(b => ({ _id: b._id }));
    const beneficiaryCount = beneficiaries.length;

    if (beneficiaryCount === 0) {
      return res.status(400).json({ message: 'No beneficiaries match the selected filters' });
    }

    // Create disbursement record
    const disbursement = await Disbursement.create({
      batchName,
      description,
      amount,
      totalAmount: amount * beneficiaryCount,
      beneficiaryCount,
      disbursementDate: new Date(disbursementDate),
      filters: {
        status: filters.status || 'all',
        state: filters.state || 'all',
        occupation: filters.occupation || 'all',
        minBalance: filters.minBalance || 0
      },
      createdBy: req.user.sub,
      status: 'pending',
      results: beneficiaries.map(b => ({ beneficiaryId: b._id, status: 'pending' }))
    });

    // Queue for processing (in real app, use a job queue like Bull or Agenda)
    processDisbursementBatch(disbursement._id).catch(err => {
      logger.error('Async disbursement processing error', err);
    });

    res.status(201).json({
      message: 'Disbursement batch created and queued for processing',
      disbursement
    });
  } catch (err) {
    logger.error('Create disbursement error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Preview matching beneficiary count for given filters (admin-only)
export async function previewDisbursement(req, res) {
  try {
    const { filters = {} } = req.body;

    // Build aggregation pipeline similar to createDisbursement
    const pipeline = [];

    const userMatch = {};
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'active') userMatch.status = 'active';
      if (filters.status === 'inactive') userMatch.status = 'inactive';
      if (filters.status === 'verified') {
        // handled via ninInfo below
      }
    }
    if (Object.keys(userMatch).length) pipeline.push({ $match: userMatch });

    pipeline.push({
      $lookup: {
        from: 'nininfos',
        localField: 'ninInfo',
        foreignField: '_id',
        as: 'ninInfo'
      }
    });
    pipeline.push({ $unwind: { path: '$ninInfo', preserveNullAndEmptyArrays: true } });

    if (filters.state) pipeline.push({ $match: { 'ninInfo.state': filters.state } });
    if (filters.status === 'verified') pipeline.push({ $match: { 'ninInfo.isVerified': true } });
    if (filters.occupation && filters.occupation !== 'all') pipeline.push({ $match: { 'ninInfo.occupation': filters.occupation } });

    pipeline.push({
      $lookup: {
        from: 'wallets',
        localField: '_id',
        foreignField: 'user',
        as: 'wallet'
      }
    });
    pipeline.push({ $unwind: { path: '$wallet', preserveNullAndEmptyArrays: true } });

    if (filters.minBalance && Number(filters.minBalance) > 0) {
      pipeline.push({ $match: { 'wallet.balance': { $gte: Number(filters.minBalance) } } });
    }

    // Count matching users
    pipeline.push({ $count: 'count' });

    const agg = await User.aggregate(pipeline).exec();
    const count = (agg && agg[0] && agg[0].count) ? agg[0].count : 0;
    res.json({ count });
  } catch (err) {
    logger.error('Preview disbursement error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Process disbursement batch asynchronously
async function processDisbursementBatch(disbursementId) {
  try {
    const disbursement = await Disbursement.findById(disbursementId);
    if (!disbursement) return;

    disbursement.status = 'processing';
    disbursement.startedAt = new Date();
    await disbursement.save();

    let successCount = 0;
    let failedCount = 0;

    // Process each beneficiary
    for (let i = 0; i < disbursement.results.length; i++) {
      const result = disbursement.results[i];
      try {
        // Get or create wallet for beneficiary
        let wallet = await Wallet.findOne({ user: result.beneficiaryId });
        if (!wallet) {
          wallet = await Wallet.create({ user: result.beneficiaryId, balance: 0 });
        }

        // Credit the wallet
        wallet.balance += disbursement.amount;
        await wallet.save();

        // Mark as success
        result.status = 'success';
        result.transactionId = `TXN-${Date.now()}-${i}`;
        successCount++;
      } catch (err) {
        logger.error(`Failed to disburse to beneficiary ${result.beneficiaryId}`, err);
        result.status = 'failed';
        result.error = err.message;
        failedCount++;
      }
    }

    // Update disbursement status
    disbursement.status = 'completed';
    disbursement.successCount = successCount;
    disbursement.failedCount = failedCount;
    disbursement.processedCount = successCount + failedCount;
    disbursement.completedAt = new Date();
    await disbursement.save();

    logger.info(`Disbursement batch ${disbursementId} completed: ${successCount} success, ${failedCount} failed`);
  } catch (err) {
    logger.error('Process disbursement batch error', err);
    await Disbursement.findByIdAndUpdate(disbursementId, { status: 'failed' });
  }
}

// Retry failed disbursements
export async function retryDisbursement(req, res) {
  try {
    const disbursement = await Disbursement.findById(req.params.id);
    if (!disbursement) return res.status(404).json({ message: 'Not found' });

    // Reset failed results to pending
    disbursement.results = disbursement.results.map(r => ({
      ...r,
      status: r.status === 'failed' ? 'pending' : r.status,
      error: null
    }));
    disbursement.status = 'pending';
    disbursement.processedCount = 0;
    disbursement.successCount = 0;
    disbursement.failedCount = 0;
    await disbursement.save();

    // Requeue processing
    processDisbursementBatch(disbursement._id).catch(err => {
      logger.error('Async retry processing error', err);
    });

    res.json({ message: 'Disbursement queued for retry' });
  } catch (err) {
    logger.error('Retry disbursement error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

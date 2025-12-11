import Joi from 'joi';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import Wallet from '../models/Wallet.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Helper to generate a unique reference like DigiPayG2C-TRF-2025-003
function generateReference(type = 'TRF') {
  const now = new Date();
  const year = now.getFullYear();
  const rand = Math.floor(Math.random() * 9000 + 1000); // 4-digit random
  return `DigiPayG2C-${type}-${year}-${rand}`;
}

// Frontend sends { recipient: <NIN>, amount, description }
const transferSchema = Joi.object({
  recipient: Joi.string().required(),
  amount: Joi.number().positive().required(),
  description: Joi.string().optional()
});

const withdrawSchema = Joi.object({
  amount: Joi.number().positive().required(),
  note: Joi.string().optional()
});

export async function sendTransaction(req, res) {
  try {
    const { error, value } = transferSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    const fromUserId = req.user.sub;
    const recipientNin = value.recipient;

    // Lookup recipient user by NIN
    const toUser = await User.findOne({ nin: recipientNin });
    if (!toUser) return res.status(404).json({ message: 'Recipient not found' });
    const toUserId = toUser._id.toString();
    if (fromUserId === toUserId) return res.status(400).json({ message: 'Cannot transfer to self' });

    // Use mongoose transactions properly: start a session and run reads/writes within the transaction
    const session = await mongoose.startSession();
    try {
      let senderTx = null;
      let receiverTx = null;
      await session.withTransaction(async () => {
        const fromWallet = await Wallet.findOne({ user: fromUserId }).session(session);
        const toWallet = await Wallet.findOne({ user: toUserId }).session(session);
        if (!fromWallet || !toWallet) throw new Error('Wallet not found');
        if (fromWallet.balance < value.amount) throw new Error('Insufficient balance');

        fromWallet.balance = Number(fromWallet.balance) - Number(value.amount);
        fromWallet.ledger.push({ type: 'transfer_out', amount: value.amount, counterparty: toUserId, description: value.description });
        await fromWallet.save({ session });

        toWallet.balance = Number(toWallet.balance) + Number(value.amount);
        toWallet.ledger.push({ type: 'transfer_in', amount: value.amount, counterparty: fromUserId, description: value.description });
        await toWallet.save({ session });

        // Create two transactions: sender (debit), receiver (credit)
        const senderRef = generateReference('DEB');
        const receiverRef = generateReference('CRD');
        const senderDesc = value.description || `Transfer to ${toUser.username || toUser.nin}`;
        const receiverDesc = value.description || `Transfer from ${req.user.username || ''}`;

        const [debitTx, creditTx] = await Promise.all([
          Transaction.create([{
            from: fromUserId,
            to: toUserId,
            type: 'debit',
            amount: value.amount,
            description: senderDesc,
            reference: senderRef,
            status: 'completed'
          }], { session }),
          Transaction.create([{
            from: fromUserId,
            to: toUserId,
            type: 'credit',
            amount: value.amount,
            description: receiverDesc,
            reference: receiverRef,
            status: 'completed'
          }], { session })
        ]);
        senderTx = debitTx && debitTx[0] ? debitTx[0] : null;
        receiverTx = creditTx && creditTx[0] ? creditTx[0] : null;
      });

      session.endSession();
      if (!senderTx || !receiverTx) return res.status(500).json({ message: 'Transfer failed' });

      // Fetch updated balances to return to client (post-transaction)
      const updatedFromWallet = await Wallet.findOne({ user: fromUserId });
      const updatedToWallet = await Wallet.findOne({ user: toUserId });

      // Return both transactions and updated balances
      res.status(201).json({
        message: 'Transfer successful',
        transactions: [senderTx, receiverTx],
        balances: {
          from: updatedFromWallet ? updatedFromWallet.balance : null,
          to: updatedToWallet ? updatedToWallet.balance : null,
        }
      });
    } catch (err) {
      session.endSession();
      logger.error('Transfer error', err);
      // If thrown errors are business errors (message text), return appropriate codes
      if (err.message === 'Wallet not found') return res.status(404).json({ message: 'Wallet not found' });
      if (err.message === 'Insufficient balance') return res.status(400).json({ message: 'Insufficient balance' });
      res.status(500).json({ message: 'Transfer failed' });
    }
  } catch (err) {
    logger.error('Send transaction error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function withdrawTransaction(req, res) {
  try {
    const { error, value } = withdrawSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    const userId = req.user.sub;
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
    if (wallet.balance < value.amount) return res.status(400).json({ message: 'Insufficient balance' });
    wallet.balance -= value.amount;
    wallet.ledger.push({ type: 'withdrawal', amount: value.amount, note: value.note });
    await wallet.save();
    const reference = generateReference('WDR');
    const description = value.note || 'Withdrawal';
    const tx = await Transaction.create({
      from: userId,
      to: userId,
      type: 'withdrawal',
      amount: value.amount,
      description,
      reference,
      status: 'completed'
    });
    res.status(201).json({ message: 'Withdrawal successful', transaction: tx });
  } catch (err) {
    logger.error('Withdraw error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getTransactions(req, res) {
  try {
    const userId = req.user.sub;
    const txs = await Transaction.find({ $or: [{ from: userId }, { to: userId }] }).sort({ createdAt: -1 });
    // Map to mockData format
    const mapped = txs.map(tx => ({
      id: tx._id,
      type: tx.type,
      amount: tx.amount,
      description: tx.description || '',
      date: tx.createdAt,
      status: tx.status,
      reference: tx.reference,
      from: tx.from,
      to: tx.to
    }));
    res.json({ transactions: mapped });
  } catch (err) {
    logger.error('Get transactions error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

import Withdrawal from '../models/Withdrawal.js';
import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { sendEmail, creditAlertTemplate } from '../utils/mailer.js';
import Joi from 'joi';

// Create a simulated withdrawal: deduct wallet, create transaction and withdrawal record, send email.
export async function createWithdrawal(req, res) {
  try {
    const schema = Joi.object({
      amount: Joi.number().min(1).required(),
      bankInfo: Joi.object({
        accountName: Joi.string().optional(),
        accountNumber: Joi.string().optional(),
        bankName: Joi.string().optional()
      }).optional(),
      note: Joi.string().max(500).optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const userId = req.user && req.user.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { amount, bankInfo, note } = value;

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) return res.status(400).json({ message: 'Wallet not found' });

    const balanceBefore = wallet.balance || 0;
    if (balanceBefore < amount) return res.status(400).json({ message: 'Insufficient wallet balance' });

    // Deduct amount and push ledger entry
    wallet.balance = balanceBefore - amount;
    wallet.ledger.push({ type: 'withdrawal', amount: -Math.abs(amount), description: note || 'Withdrawal', by: userId, createdAt: new Date() });
    await wallet.save();

    // Create transaction record
    const reference = `wd-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;
    let transaction = null;
    let withdrawal = null;
    let emailSent = false;
    try {
      transaction = await Transaction.create({
        from: userId,
        to: userId,
        type: 'withdrawal',
        amount,
        description: note || 'User withdrawal (simulated)',
        reference,
        status: 'completed'
      });

      withdrawal = await Withdrawal.create({ user: userId, amount, bankInfo, status: 'completed', reference, note });

      // Send real credit alert email to user (fetch user and NinInfo for email/name)
      const user = await User.findById(userId).populate('ninInfo', 'email fullName');
      const balanceAfter = wallet.balance;
      const tpl = creditAlertTemplate({ fullName: user?.ninInfo?.fullName || user?.username || '', amount, reference, balanceBefore, balanceAfter });
      if (user?.ninInfo?.email) {
        await sendEmail(user.ninInfo.email, tpl.subject, tpl.html);
        emailSent = true;
        logger.info(`[WITHDRAWAL] Email sent to ${user.ninInfo.email} for withdrawal ref ${reference}`);
      } else {
        logger.warn(`[WITHDRAWAL] No email found in NinInfo for user ${userId}, withdrawal not sent`);
        throw new Error('User email not found');
      }
    } catch (emailErr) {
      logger.error(`[WITHDRAWAL] Failed to send withdrawal email or create records for ref ${reference}`, emailErr);
      // Rollback: restore wallet balance and remove transaction/withdrawal
      wallet.balance = balanceBefore;
      wallet.ledger.pop();
      await wallet.save();
      if (transaction && transaction._id) await Transaction.findByIdAndDelete(transaction._id);
      if (withdrawal && withdrawal._id) await Withdrawal.findByIdAndDelete(withdrawal._id);
      logger.info(`[WITHDRAWAL] Withdrawal rolled back for user ${userId}, ref ${reference}`);
      return res.status(500).json({ message: 'Withdrawal failed: could not send email. No funds were deducted.' });
    }

    logger.info(`[WITHDRAWAL] Withdrawal completed for user ${userId}, ref ${reference}`);
    res.status(201).json({ message: 'Withdrawal processed (simulated)', withdrawal, transaction });
  } catch (err) {
    logger.error('Create withdrawal error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getUserWithdrawals(req, res) {
  try {
    const userId = req.user && req.user.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const list = await Withdrawal.find({ user: userId }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    logger.error('Get user withdrawals error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

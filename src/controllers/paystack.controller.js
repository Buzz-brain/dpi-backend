import Wallet from '../models/Wallet.js';
import User from '../models/User.js';
import { initializePaystackTransaction, verifyPaystackTransaction } from '../utils/paystackHelper.js';
import logger from '../utils/logger.js';

export async function fundWallet(req, res) {
  try {
    const { email, amount } = req.body;
    if (!email || !amount) return res.status(400).json({ message: 'Email and amount required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const tx = await initializePaystackTransaction(email, amount);
    res.json({ authorization_url: tx.authorization_url, reference: tx.reference });
  } catch (err) {
      console.log('Fund wallet error', err);
      logger.error('Fund wallet error', err);
      // If error is an axios error or has response, show details
      if (err.response && err.response.data) {
        res.status(err.response.status || 500).json({ message: 'Paystack error', details: err.response.data });
      } else {
        res.status(500).json({ message: err.message || 'Server error', details: err });
      }
  }
}

export async function verifyWalletFunding(req, res) {
  try {
    const { reference } = req.params;
    if (!reference) return res.status(400).json({ message: 'Reference required' });
    const tx = await verifyPaystackTransaction(reference);
    if (tx.status === 'success') {
      // Find user by email
      const user = await User.findOne({ email: tx.customer.email });
      if (!user) return res.status(404).json({ message: 'User not found' });
      // Credit wallet
      const wallet = await Wallet.findOneAndUpdate(
        { user: user._id },
        { $inc: { balance: tx.amount / 100 }, $push: { ledger: { type: 'paystack_fund', amount: tx.amount / 100, reference } } },
        { new: true, upsert: true }
      );
      return res.json({ message: 'Wallet funded', wallet });
    } else {
      return res.status(400).json({ message: 'Payment not successful' });
    }
  } catch (err) {
    logger.error('Verify wallet funding error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

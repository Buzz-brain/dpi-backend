import mongoose from 'mongoose';

const { Schema } = mongoose;

const LedgerEntry = new Schema({
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  // Optional structured fields replacing the previous `meta` flexible object
  counterparty: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  description: { type: String, required: false },
  note: { type: String, required: false },
  reference: { type: String, required: false },
  by: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const WalletSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  balance: { type: Number, default: 0 },
  ledger: { type: [LedgerEntry], default: [] }
}, { timestamps: true });

export default mongoose.model('Wallet', WalletSchema);

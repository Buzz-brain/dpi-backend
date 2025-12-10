import mongoose from 'mongoose';

const { Schema } = mongoose;

const BankInfoSchema = new Schema({
  accountName: { type: String },
  accountNumber: { type: String },
  bankName: { type: String }
}, { _id: false });

const WithdrawalSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  bankInfo: { type: BankInfoSchema, required: false },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
  reference: { type: String, required: true, unique: true },
  note: { type: String },
}, { timestamps: true });

export default mongoose.model('Withdrawal', WithdrawalSchema);

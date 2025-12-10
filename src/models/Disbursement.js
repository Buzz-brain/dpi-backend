import mongoose from 'mongoose';
const { Schema } = mongoose;

const DisbursementSchema = new Schema({
  // Batch identification
  batchName: { type: String, required: true },
  description: { type: String },
  
  // Admin who created the batch
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Disbursement details
  amount: { type: Number, required: true }, // Amount per beneficiary
  totalAmount: { type: Number, required: true }, // amount * beneficiaryCount
  beneficiaryCount: { type: Number, default: 0 },
  disbursementDate: { type: Date, required: true },
  
  // Filters applied to select recipients
  filters: {
    status: { type: String, default: 'all', enum: ['all', 'active', 'inactive', 'verified'] },
    state: { type: String, default: 'all' },
    role: { type: String, default: 'all', enum: ['all', 'farmer', 'student', 'artisan', 'vendor'] },
    minBalance: { type: Number, default: 0 }
  },
  
  // Processing details
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  processedCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  successCount: { type: Number, default: 0 },
  
  // Processing results
  results: [{
    beneficiaryId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['success', 'failed', 'pending'], default: 'pending' },
    error: { type: String },
    transactionId: { type: String }
  }],
  
  // Metadata
  startedAt: { type: Date },
  completedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('Disbursement', DisbursementSchema);

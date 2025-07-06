import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for this transaction.'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Please provide an amount.'],
  },
  type: {
    type: String,
    enum: ['Income', 'Expense', 'Deposit', 'Withdrawal'],
    required: true,
  },
  category: {
    type: String,
    trim: true,
    default: 'General',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  description: {
    type: String,
    trim: true,
  },
  loggedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
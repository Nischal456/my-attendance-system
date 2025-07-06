import mongoose from 'mongoose';

const BankAccountSchema = new mongoose.Schema({
  accountName: {
    type: String,
    required: true,
    unique: true,
    default: 'Main Account',
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
  },
}, { timestamps: true });

export default mongoose.models.BankAccount || mongoose.model('BankAccount', BankAccountSchema);
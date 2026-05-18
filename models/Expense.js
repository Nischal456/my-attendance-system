import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title for the expense.'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Please provide the expense amount.'],
      min: [0, 'Amount must be a positive number.'],
    },
    category: {
      type: String,
      required: [true, 'Please select an expense category.'],
      enum: ['Tea & Snacks', 'Stationery', 'Transport', 'Meals', 'Office Supplies', 'Internet/Comm', 'Maintenance', 'Other'],
      default: 'Other',
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Digital Wallet', 'Card'],
      default: 'Cash',
    },
    nepaliDate: {
      type: String,
      required: [true, 'Nepali date is required.'], // Format: YYYY-MM-DD (BS)
    },
    englishDate: {
      type: Date,
      required: [true, 'English date is required.'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot be more than 500 characters'],
    },
    receiptUrl: {
      type: String,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
  }
);
if (mongoose.models.Expense) {
  delete mongoose.models.Expense;
}

export default mongoose.model('Expense', ExpenseSchema);

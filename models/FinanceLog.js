import mongoose from 'mongoose';

const FinanceLogSchema = new mongoose.Schema({
    action: { type: String, enum: ['Added', 'Edited', 'Deleted'], required: true },
    entity: { type: String, enum: ['Transaction', 'Dollar Fund'], required: true },
    details: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isRead: { type: Boolean, default: false },
    date: { type: Date, default: Date.now, expires: '7d' } // Automatically delete after 7 days
});

export default mongoose.models.FinanceLog || mongoose.model('FinanceLog', FinanceLogSchema);

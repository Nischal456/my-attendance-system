import mongoose from 'mongoose';

const HRAuditLogSchema = new mongoose.Schema({
    action: { type: String, enum: ['Edited', 'Deleted', 'Approved', 'Rejected'], required: true },
    entity: { type: String, enum: ['Attendance', 'Leave Request'], required: true },
    details: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isRead: { type: Boolean, default: false },
    date: { type: Date, default: Date.now, expires: '7d' } // Automatically delete after 7 days
});

export default mongoose.models.HRAuditLog || mongoose.model('HRAuditLog', HRAuditLogSchema);

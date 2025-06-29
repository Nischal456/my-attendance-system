import mongoose from 'mongoose';

const LeaveBalanceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // Each user has only one leave balance document
    },
    sickLeaveAvailable: {
        type: Number,
        default: 12, // Default sick leave days per year
    },
    homeLeaveAvailable: {
        type: Number,
        default: 18, // Default home leave days per year
    },
    year: {
        type: Number,
        default: () => new Date().getFullYear(),
    }
}, { timestamps: true });

export default mongoose.models.LeaveBalance || mongoose.model('LeaveBalance', LeaveBalanceSchema);
import mongoose from 'mongoose';

const LeaveRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    leaveType: {
        type: String,
        enum: ['Sick Leave', 'Home Leave'],
        required: [true, 'Please select a leave type.'],
    },
    startDate: {
        type: Date,
        required: [true, 'Please provide a start date.'],
    },
    endDate: {
        type: Date,
        required: [true, 'Please provide an end date.'],
    },
    reason: {
        type: String,
        required: [true, 'Please provide remarks for your leave request.'],
        trim: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
    },
    hrComments: {
        type: String,
        trim: true,
    }
}, { timestamps: true });

export default mongoose.models.LeaveRequest || mongoose.model('LeaveRequest', LeaveRequestSchema);
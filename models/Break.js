import mongoose from 'mongoose';

const BreakSchema = new mongoose.Schema({
  attendanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendance', required: true },
  breakInTime: { type: Date, required: true },
  breakOutTime: { type: Date },
});

export default mongoose.models.Break || mongoose.model('Break', BreakSchema);

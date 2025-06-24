import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  checkInTime: {
    type: Date,
    required: true,
  },
  checkOutTime: {
    type: Date,
  },
  description: {
    type: String,
    trim: true,
  },
  // This will now store NET work duration in seconds
  duration: {
    type: Number, 
  },
  // --- NEW: An array to store all break intervals ---
  breaks: [
    {
      breakInTime: { type: Date },
      breakOutTime: { type: Date },
    }
  ],
  // --- NEW: To store the calculated total break time in seconds ---
  totalBreakDuration: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);

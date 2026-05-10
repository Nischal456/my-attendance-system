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
  workLocation: {
        type: String,
        required: [true, 'Work location is required.'],
        enum: ['Office', 'Home'], // Only allows these two values
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
  },
  // --- NEW: Flag to track if the user was already notified about overtime (e.g. 7+ hours) ---
  overtimeNotified: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);

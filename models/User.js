import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name.'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email.'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password.'],
  },
  role: {
    type: String,
    enum: ['Staff', 'Intern', 'Manager', 'HR'], 
    default: 'Staff',
  },
  // --- NEW: Add the phoneNumber field ---
  // We use 'String' because phone numbers can include '+', '-', etc.
  phoneNumber: {
    type: String,
    required: false, // Making it optional for now
    maxlength: [20, 'Phone number cannot be more than 20 characters'],
  },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);

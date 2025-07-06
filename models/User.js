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
     enum: ['Staff', 'Intern', 'Manager', 'Project Manager', 'HR', 'Finance'], 
    default: 'Staff',
  },
  phoneNumber: {
    type: String,
    required: false,
    maxlength: [20, 'Phone number cannot be more than 20 characters'],
  },
  avatar: {
    type: String,
    default: 'https://res.cloudinary.com/demo/image/upload/v1620297675/samples/people/smiling-man.jpg',
  },
  readNotifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification'
  }],
  // --- NEW FIELDS FOR PASSWORD RESET ---
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
}, { 
  // This is a professional enhancement that automatically adds `createdAt` and `updatedAt` fields
  timestamps: true 
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
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
    // --- MODIFIED: Added 'Project Manager' to the list ---
    enum: ['Staff', 'Intern', 'Manager', 'Project Manager', 'HR'], 
    default: 'Staff',
  },
  phoneNumber: {
    type: String,
    required: false,
    maxlength: [20, 'Phone number cannot be more than 20 characters'],
  },
  avatar: {
    type: String,
    // A default avatar for new users or those without a picture
    default: 'https://res.cloudinary.com/demo/image/upload/v1620297675/samples/people/smiling-man.jpg',
  },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
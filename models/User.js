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
    enum: ['Staff', 'Intern', 'Trainee', 'Manager', 'Project Manager', 'HR', 'Finance', 'Superadmin'],
    default: 'Staff',
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  promotedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  accessRoles: [{
    type: String,
    enum: ['Project Manager', 'HR', 'Finance', 'Superadmin', 'Expense Manager'],
  }],
  phoneNumber: {
    type: String,
    required: false,
    maxlength: [20, 'Phone number cannot be more than 20 characters'],
  },
  avatar: {
    type: String,
    default: 'https://res.cloudinary.com/demo/image/upload/v1620297675/samples/people/smiling-man.jpg',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  readNotifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification'
  }],
  pushSubscriptions: {
    type: Array,
    default: [],
  },
  // --- NEW FIELDS FOR PASSWORD RESET ---
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  // --- NEW FIELDS FOR WEBAUTHN / BIOMETRICS ---
  passkeys: {
    type: Array,
    default: [],
  },
  currentChallenge: {
    type: String,
  },
  // --- NEW FIELDS FOR PROMOTION CELEBRATION ---
  hasUnseenPromotion: {
    type: Boolean,
    default: false,
  },
  promotionDetails: {
    type: Object,
    default: null,
  },
}, {
  // This is a professional enhancement that automatically adds `createdAt` and `updatedAt` fields
  timestamps: true
});

// Delete the model if it already exists to ensure schema updates are applied during Next.js Hot Reload
if (mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.model('User', UserSchema);
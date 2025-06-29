import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  content: { 
    type: String, 
    required: true 
  },
  author: { 
    type: String, 
    required: true 
  },
  // NEW: The user who should receive this notification
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // NEW: To track if the specific user has read it
  isRead: {
    type: Boolean,
    default: false,
  },
  // NEW: An optional link for when the user clicks the notification
  link: {
    type: String,
  },
}, { timestamps: true });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
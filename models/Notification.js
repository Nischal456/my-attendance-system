import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    author: {
        type: String, // e.g., "John Doe (Project Manager)" or "System Security"
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    link: {
        type: String, // e.g., '/tasks/123'
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    createdAt: { 
      type: Date,
      default: Date.now,
      expires: '7d', // Automatically delete notifications after 30 days
    },
}, { 
  timestamps: { createdAt: false, updatedAt: true } 
});

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
import dbConnect from '../../../../lib/dbConnect';
import Conversation from '../../../../models/Conversation';
import Message from '../../../../models/Message';
import jwt from 'jsonwebtoken';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    await dbConnect();
    
    try {
        const { token } = req.cookies;
        if (!token) return res.status(401).json({ message: 'Not authenticated' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const currentUserId = decoded.userId;

        const { conversationId } = req.body;
        if (!conversationId) return res.status(400).json({ message: 'Conversation ID is required.' });

        const conversation = await Conversation.findById(conversationId).select('messages');
        if (!conversation) return res.status(404).json({ message: 'Conversation not found.' });

        const updateResult = await Message.updateMany(
            { _id: { $in: conversation.messages }, senderId: { $ne: currentUserId } },
            { $addToSet: { readBy: currentUserId } }
        );

        if (updateResult.modifiedCount > 0) {
            await pusher.trigger(`chat-${conversationId}`, 'messages-seen', {
                readerId: currentUserId,
                conversationId: conversationId
            });
        }

        res.status(200).json({ success: true, message: 'Messages marked as read.' });
    } catch (error) {
        console.error("Mark as Read API Error:", error);
        res.status(500).json({ message: 'Server error.' });
    }
}
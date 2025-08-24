import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Conversation from '../../../../models/Conversation';
import Message from '../../../../models/Message';
import jwt from 'jsonwebtoken';
import Pusher from 'pusher';

// Initialize Pusher for real-time events
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

export default async function handler(req, res) {
    await dbConnect();

    // --- Authentication ---
    const { token } = req.cookies;
    if (!token) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    
    let currentUserId;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentUserId = decoded.userId;
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    // --- GET Request Handler ---
    // Handles fetching conversations, messages, and unread counts
    if (req.method === 'GET') {
        try {
            const { conversationId, getTotalUnread } = req.query;

            // 1. Get total unread count for the notification dot
            if (getTotalUnread) {
                const totalUnreadCount = await Message.countDocuments({
                    receiverId: currentUserId,
                    readBy: { $ne: currentUserId } // Count messages where current user is not in readBy array
                });
                return res.status(200).json({ success: true, totalUnreadCount });
            }
            
            // 2. Get messages for a single, active conversation
            if (conversationId) {
                const conversation = await Conversation.findById(conversationId).populate({
                    path: 'messages',
                    populate: { path: 'senderId', select: 'name avatar' }
                });

                if (!conversation) {
                    return res.status(404).json({ message: "Conversation not found." });
                }

                // Mark all messages in this conversation as read by the current user
                await Message.updateMany(
                    { _id: { $in: conversation.messages }, readBy: { $ne: currentUserId } },
                    { $addToSet: { readBy: currentUserId } }
                );

                return res.status(200).json({ success: true, messages: conversation.messages });
            }

            // 3. Get all conversations for the sidebar
            let conversations = await Conversation.find({ participants: currentUserId })
                .populate({ path: 'participants', select: 'name avatar role' })
                .populate({ path: 'lastMessage' }) // Populate the last message reference
                .sort({ updatedAt: -1 })
                .lean(); // Use .lean() for better performance
            
            // Calculate unread count for each conversation
            const conversationsWithUnread = await Promise.all(conversations.map(async (conv) => {
                const unreadCount = await Message.countDocuments({
                    _id: { $in: conv.messages },
                    senderId: { $ne: currentUserId }, // Message was sent by the other person
                    readBy: { $ne: currentUserId }   // And I haven't read it yet
                });
                return { ...conv, unreadCount };
            }));

            // Get all other users for starting new conversations
            const users = await User.find({ _id: { $ne: currentUserId } }).select('name avatar role').sort({ name: 1 }).lean();

            res.status(200).json({ success: true, conversations: conversationsWithUnread, users });

        } catch (error) {
            console.error("Chat GET API Error:", error);
            res.status(500).json({ message: 'Server error fetching chat data.' });
        }
    } 
    // --- POST Request Handler ---
    // Handles sending a new message
    else if (req.method === 'POST') {
        try {
            const { receiverId, message } = req.body;
            if (!receiverId || !message) {
                return res.status(400).json({ message: 'Receiver and message are required.' });
            }

            // Find or create a conversation between the two users
            let conversation = await Conversation.findOne({
                participants: { $all: [currentUserId, receiverId] }
            });

            if (!conversation) {
                conversation = await Conversation.create({ participants: [currentUserId, receiverId] });
            }

            // Create the new message
            const newMessage = new Message({
                senderId: currentUserId,
                receiverId: receiverId,
                message: message,
                readBy: [currentUserId] // The sender has implicitly "read" the message
            });
            await newMessage.save();
            
            // Update the conversation with the new message
            conversation.messages.push(newMessage._id);
            conversation.lastMessage = newMessage._id; // Set as the last message
            await conversation.save();
            
            // Populate sender info for the real-time event
            const populatedMessage = await Message.findById(newMessage._id).populate('senderId', 'name avatar').lean();

            // Trigger Pusher event to notify the client
            await pusher.trigger(`chat-${conversation._id}`, 'new-message', populatedMessage);

            res.status(201).json({ success: true, message: 'Message sent!', data: populatedMessage });
        } catch (error) {
            console.error("Chat POST API Error:", error);
            res.status(500).json({ message: 'Server error sending message.' });
        }
    }
    // --- DELETE Request Handler ---
    // Handles deleting a conversation and its messages
    else if (req.method === 'DELETE') {
        try {
            const { conversationId } = req.query;
            if (!conversationId) {
                return res.status(400).json({ message: 'Conversation ID is required.' });
            }

            // Security check: Find the conversation and ensure the current user is a participant
            const conversation = await Conversation.findOne({
                _id: conversationId,
                participants: currentUserId 
            });

            if (!conversation) {
                return res.status(404).json({ message: 'Conversation not found or access denied.' });
            }

            // Delete all messages associated with the conversation
            await Message.deleteMany({ _id: { $in: conversation.messages } });

            // Delete the conversation itself
            await Conversation.findByIdAndDelete(conversationId);

            res.status(200).json({ success: true, message: 'Conversation deleted successfully.' });

        } catch (error) {
            console.error("Chat DELETE API Error:", error);
            res.status(500).json({ message: 'Server error deleting conversation.' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

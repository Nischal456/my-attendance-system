import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Notification from '../../../../models/Notification'; // Import Notification model

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    
    await dbConnect();

    try {
        const { token } = req.cookies;
        if (!token) return res.status(401).json({ message: 'Not authenticated' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Update notifications where the recipient matches the logged-in user
        await Notification.updateMany(
            { recipient: decoded.userId, isRead: false }, // Find unread notifications for this user
            { $set: { isRead: true } } // Set them to read
        );

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Mark as read error:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
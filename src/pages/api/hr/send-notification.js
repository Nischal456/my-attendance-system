import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Notification from '../../../../models/Notification';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    await dbConnect();

    try {
        // 1. Authenticate and authorize the HR user
        const { token } = req.cookies;
        if (!token) return res.status(401).json({ message: 'Not authenticated' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const hrUser = await User.findById(decoded.userId);
        if (!hrUser || hrUser.role !== 'HR') {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action.' });
        }
        
        // 2. Get the message content from the request body
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ message: 'Content is required.' });
        }

        // 3. Find all users who are NOT HRs to send the notification to
        const targetUsers = await User.find({ role: { $ne: 'HR' } }).select('_id');
        
        if (targetUsers.length === 0) {
            return res.status(200).json({ success: true, message: 'No users to notify.' });
        }

        // 4. Create a personalized notification document for each target user
        const notificationsToCreate = targetUsers.map(user => ({
            content: content,
            author: hrUser.name, // Use the HR user's name as the author
            recipient: user._id, // Set the specific recipient for each notification
            link: '#', // General announcements don't need a specific link
        }));

        // 5. Insert all the new notifications into the database in one go
        await Notification.insertMany(notificationsToCreate);
        
        res.status(201).json({ success: true, message: `Notification sent to ${targetUsers.length} users.` });

    } catch (error) {
        console.error("Error sending notification:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
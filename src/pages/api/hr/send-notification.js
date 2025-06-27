import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Notification from '../../../../models/Notification';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    await dbConnect();
    try {
        const { token } = req.cookies;
        if (!token) return res.status(401).json({ message: 'Not authenticated' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const hrUser = await User.findById(decoded.userId);
        if (!hrUser || hrUser.role !== 'HR') return res.status(403).json({ message: 'Forbidden' });
        
        const { content } = req.body;
        if (!content) return res.status(400).json({ message: 'Content is required.' });

        const newNotification = new Notification({ content, author: hrUser.name });
        await newNotification.save();
        
        res.status(201).json({ success: true, message: 'Notification sent successfully.' });
    } catch (error) { res.status(500).json({ message: 'Internal Server Error' }) }
}
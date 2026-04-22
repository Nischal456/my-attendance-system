import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Notification from '../../../../models/Notification';
import { sendPushNotification } from '../../../../lib/webPush';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
    await dbConnect();
    try {
        const { token } = req.cookies;
        if (!token) return res.status(401).json({ message: 'Not authenticated' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const financeUser = await User.findById(decoded.userId);
        if (!financeUser || financeUser.role !== 'Finance') {
            return res.status(403).json({ message: 'Forbidden: You do not have permission.' });
        }

        const { content, targetUser } = req.body;
        if (!content || !targetUser) {
            return res.status(400).json({ message: 'A selected user and content are required.' });
        }

        await Notification.create({ content, author: "Finance Department", recipient: targetUser });

        // Send Native Web Push to the selected user
        const recipientUser = await User.findById(targetUser).select('pushSubscriptions name');
        if (recipientUser && recipientUser.pushSubscriptions && recipientUser.pushSubscriptions.length > 0) {
            const pushPromises = recipientUser.pushSubscriptions.map(sub =>
                sendPushNotification(sub, {
                    title: `Finance Update`,
                    body: content,
                    url: '/dashboard',
                    icon: '/finance.png'
                })
            );
            await Promise.allSettled(pushPromises);
        }

        res.status(201).json({ success: true, message: `Notification sent successfully.` });

    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
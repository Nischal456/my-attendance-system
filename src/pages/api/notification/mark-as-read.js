import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    await dbConnect();
    try {
        const { token } = req.cookies;
        if (!token) return res.status(401).json({ message: 'Not authenticated' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        await User.findByIdAndUpdate(decoded.userId, {
            $addToSet: { readNotifications: { $each: req.body.notificationIds } }
        });
        res.status(200).json({ success: true });
    } catch (error) { res.status(500).json({ message: 'Internal Server Error' }) }
}
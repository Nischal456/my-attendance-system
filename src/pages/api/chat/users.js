import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    await dbConnect();
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const currentUserId = decoded.userId;

        // Fetch all users except the currently logged-in one
        const users = await User.find({ 
            _id: { $ne: currentUserId } 
        }).select('name avatar role').sort({ name: 1 }).lean();

        res.status(200).json({ success: true, users });

    } catch (error) {
        console.error("Get Users API Error:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
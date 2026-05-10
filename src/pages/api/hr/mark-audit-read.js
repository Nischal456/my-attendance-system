import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import HRAuditLog from '../../../../models/HRAuditLog';
import mongoose from 'mongoose';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
    await dbConnect();
    try {
        const { token } = req.cookies;
        if (!token) return res.status(401).json({ message: 'Not authenticated' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const hrUser = await User.findById(decoded.userId);
        if (!hrUser || ![hrUser.role, ...(hrUser.accessRoles || [])].some(r => ['HR', 'Superadmin'].includes(r))) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { logId } = req.body;
        if (logId) {
            await HRAuditLog.collection.updateOne(
                { _id: new mongoose.Types.ObjectId(logId) },
                { $set: { isRead: true } }
            );
        } else {
            await HRAuditLog.collection.updateMany(
                { isRead: false },
                { $set: { isRead: true } }
            );
        }
        res.status(200).json({ success: true, message: 'Audit log(s) marked as read' });
    } catch (error) {
        console.error("Mark HR Audit Read Error:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

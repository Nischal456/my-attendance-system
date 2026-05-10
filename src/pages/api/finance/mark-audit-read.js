import dbConnect from '../../../../lib/dbConnect';
import FinanceLog from '../../../../models/FinanceLog';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    await dbConnect();
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        if (req.method === 'POST') {
            await FinanceLog.updateMany({ isRead: { $ne: true } }, { $set: { isRead: true } }, { strict: false });
            res.status(200).json({ success: true });
        } else {
            res.status(405).json({ message: 'Method not allowed' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Transaction from '../../../../models/Transaction';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    await dbConnect();
    try {
        const { token } = req.cookies;
        if (!token) return res.status(401).json({ message: 'Not authenticated' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user || user.role !== 'Finance') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { reportType, year, month } = req.query;
        if (!reportType || !year) {
            return res.status(400).json({ message: 'Report type and year are required.' });
        }

        let startDate, endDate;
        if (reportType === 'monthly' && month) {
            startDate = new Date(Date.UTC(year, parseInt(month), 1));
            endDate = new Date(Date.UTC(year, parseInt(month) + 1, 1));
            endDate.setMilliseconds(endDate.getMilliseconds() - 1);
        } else if (reportType === 'yearly') {
            startDate = new Date(Date.UTC(year, 0, 1));
            endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
        } else {
            return res.status(400).json({ message: 'Invalid report parameters.' });
        }

        const transactions = await Transaction.find({
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 'asc' });

        res.status(200).json({ success: true, data: transactions });

    } catch (error) {
        console.error("Error generating statement:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
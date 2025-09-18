import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import Transaction from '../../../models/Transaction';
import BankAccount from '../../../models/BankAccount';
import Notification from '../../../models/Notification';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    await dbConnect();
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user || user.role !== "Finance") {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const [transactions, bankAccount, allUsers, notifications] = await Promise.all([
            Transaction.find({}).sort({ date: -1 }).limit(500).lean(),
            BankAccount.findOne({ accountName: 'Main Account' }).lean(),
            User.find({ role: { $ne: 'Finance' } }).select('name role').sort({ name: 1 }).lean(),
            Notification.find({ recipient: user._id }).sort({ createdAt: -1 }).limit(50).lean()
        ]);

        const initialBankAccount = bankAccount || await BankAccount.create({ accountName: 'Main Account', balance: 0 });

        res.status(200).json({
            success: true,
            transactions,
            bankAccount: initialBankAccount,
            allUsers,
            notifications
        });

    } catch (error) {
        console.error("Finance Data API Error:", error);
        res.status(500).json({ message: 'Server error fetching finance data.' });
    }
}
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Transaction from '../../../../models/Transaction';
import BankAccount from '../../../../models/BankAccount';
import Notification from '../../../../models/Notification';
import FinanceLog from '../../../../models/FinanceLog';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    await dbConnect();
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(403).json({ message: 'Forbidden' });
        
        const allUserRoles = [user.role, ...(user.accessRoles || [])];
        if (!allUserRoles.some(r => ['Finance', 'Superadmin'].includes(r))) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        // 1. Fetch all transactions and populate the Digital Fingerprints
        const transactions = await Transaction.find({})
            .populate('createdBy', 'name avatar role')
            .populate('updatedBy', 'name avatar role')
            .populate('loggedBy', 'name avatar role')
            .sort({ date: -1, createdAt: -1 })
            .lean();
        
        // 2. ✅ FIX: Calculate the REAL balance from scratch (Self-Healing)
        const realBalance = transactions.reduce((acc, t) => {
            if (t.type === 'Income' || t.type === 'Deposit') {
                return acc + t.amount;
            } else {
                return acc - t.amount;
            }
        }, 0);

        // 3. Update or Create the Bank Account with the corrected balance
        let bankAccount = await BankAccount.findOne({ accountName: 'Main Account' });
        if (!bankAccount) {
            bankAccount = await BankAccount.create({ accountName: 'Main Account', balance: realBalance });
        } else {
            // Force update the balance to be correct
            if (bankAccount.balance !== realBalance) {
                bankAccount.balance = realBalance;
                await bankAccount.save();
            }
        }

        const allUsers = await User.find({ role: { $ne: 'Finance' } }).select('name role').sort({ name: 1 }).lean();
        const notifications = await Notification.find({ recipient: user._id }).sort({ createdAt: -1 }).limit(50).lean();
        
        // Fetch Audit Logs (latest 10)
        const auditLogs = await FinanceLog.find({}).populate('user', 'name avatar').sort({ date: -1 }).limit(10).lean();
        // Count unread logs (isRead is false or missing)
        const unreadAuditCount = await FinanceLog.countDocuments({ isRead: { $ne: true } });

        res.status(200).json({
            success: true,
            transactions,
            bankAccount, // This now sends the 100% accurate balance
            allUsers,
            notifications,
            auditLogs,
            unreadAuditCount
        });

    } catch (error) {
        console.error("Finance Data API Error:", error);
        res.status(500).json({ message: 'Server error fetching finance data.' });
    }
}
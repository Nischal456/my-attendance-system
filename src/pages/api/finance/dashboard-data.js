import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Transaction from '../../../../models/Transaction';
import BankAccount from '../../../../models/BankAccount';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
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

    const [transactions, bankAccount] = await Promise.all([
        Transaction.find({}).sort({ date: -1 }).limit(500).lean(),
        BankAccount.findOne({ accountName: 'Main Account' }).lean()
    ]);
    
    const finalBankAccount = bankAccount || { accountName: 'Main Account', balance: 0 };

    res.status(200).json({
      success: true,
      transactions: transactions,
      bankAccount: finalBankAccount,
    });

  } catch (error) {
    console.error("Error fetching finance dashboard data:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Transaction from '../../../../models/Transaction';
import BankAccount from '../../../../models/BankAccount';
export default async function handler(req, res) {
  await dbConnect();
  
  const { token } = req.cookies;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'Finance') {
      return res.status(403).json({ message: 'Forbidden: Access denied.' });
    }
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token.' });
  }

  if (req.method === 'POST') {
    try {
      const { amount, type } = req.body;
      if (!amount || !type) {
        return res.status(400).json({ message: 'Amount and type are required.' });
      }

      const newTransaction = await Transaction.create({ ...req.body, loggedBy: decoded.userId });

      // Update bank balance only for deposits and withdrawals
      if (type === 'Deposit') {
        await BankAccount.findOneAndUpdate({ accountName: 'Main Account' }, { $inc: { balance: amount } }, { upsert: true, new: true });
      } else if (type === 'Withdrawal') {
        await BankAccount.findOneAndUpdate({ accountName: 'Main Account' }, { $inc: { balance: -amount } }, { upsert: true, new: true });
      }

      res.status(201).json({ success: true, data: newTransaction });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create transaction.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
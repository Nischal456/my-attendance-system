import dbConnect from '../../../../lib/dbConnect';
import Transaction from '../../../../models/Transaction';
import BankAccount from '../../../../models/BankAccount';
import FinanceLog from '../../../../models/FinanceLog';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    await dbConnect();
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        // Decode the token to get the User ID
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (req.method === 'POST') {
            const { title, amount, category, type, date, description } = req.body;
            const numAmount = parseFloat(amount);

            // 1. Update Bank Balance based on transaction type
            const bank = await BankAccount.findOne({ accountName: 'Main Account' });
            if (bank) {
                if (type === 'Income' || type === 'Deposit') {
                    bank.balance += numAmount;
                } else {
                    bank.balance -= numAmount;
                }
                await bank.save();
            } else {
                // If account doesn't exist yet, create it
                const initialBalance = (type === 'Income' || type === 'Deposit') ? numAmount : -numAmount;
                await BankAccount.create({ accountName: 'Main Account', balance: initialBalance });
            }

            // 2. Create the Transaction (The Ledger)
            const transaction = await Transaction.create({
                title,
                amount: numAmount,
                category,
                type,
                date,
                description,
                loggedBy: decoded.userId, // Legacy support
                createdBy: decoded.userId // THE DIGITAL FINGERPRINT
            });

            // 3. Audit Log
            await FinanceLog.create({
                action: 'Added',
                entity: 'Transaction',
                details: `Added transaction: ${title} (${type} - Rs. ${numAmount})`,
                user: decoded.userId
            });

            res.status(201).json({ success: true, data: transaction });
        } 
        else if (req.method === 'DELETE') {
            const { id } = req.query;
            
            const transaction = await Transaction.findById(id);
            if (!transaction) return res.status(404).json({ message: "Transaction not found" });

            // Reverse the effect on Bank Balance
            const bank = await BankAccount.findOne({ accountName: 'Main Account' });
            if (bank) {
                if (transaction.type === 'Income' || transaction.type === 'Deposit') {
                    bank.balance -= transaction.amount; // Remove income
                } else {
                    bank.balance += transaction.amount; // Refund expense
                }
                await bank.save();
            }

            await Transaction.findByIdAndDelete(id);
            
            // Audit Log
            await FinanceLog.create({
                action: 'Deleted',
                entity: 'Transaction',
                details: `Deleted transaction: ${transaction.title} (${transaction.type} - Rs. ${transaction.amount})`,
                user: decoded.userId
            });

            res.status(200).json({ success: true, message: "Transaction deleted" });
        }
        else {
            res.status(405).json({ message: 'Method not allowed' });
        }
    } catch (error) {
        console.error("Transaction API Error:", error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
}
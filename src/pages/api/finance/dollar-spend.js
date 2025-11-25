import dbConnect from '../../../../lib/dbConnect';
import DollarSpend from '../../../../models/DollarSpend';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    await dbConnect();
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (req.method === 'GET') {
            const spends = await DollarSpend.find({}).sort({ date: -1 }).limit(100);
            
            // 100% Accurate Balance Calculation
            const totalLoaded = spends.filter(s => s.type === 'Load').reduce((acc, s) => acc + s.amount, 0);
            const totalSpent = spends.filter(s => s.type === 'Spend').reduce((acc, s) => acc + s.amount, 0);
            const balance = totalLoaded - totalSpent;

            res.status(200).json({ success: true, data: spends, balance });
        } 
        else if (req.method === 'POST') {
            const { type, companyName, platform, campaignName, amount, exchangeRate } = req.body;
            if (!amount) return res.status(400).json({ message: 'Amount is required.' });

            const newRecord = await DollarSpend.create({
                type, 
                companyName: (type === 'Spend' && companyName) ? companyName : 'Manual Load',
                platform: (type === 'Spend' && platform) ? platform : 'Manual Entry',
                campaignName: campaignName || '', 
                amount: parseFloat(amount),
                exchangeRate: parseFloat(exchangeRate || 0),
                nprEquivalent: parseFloat(amount) * parseFloat(exchangeRate || 0),
                addedBy: decoded.userId
            });
            
            res.status(201).json({ success: true, message: 'Success!', data: newRecord });
        }
        // ✅ NEW: DELETE Method
        else if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id) return res.status(400).json({ message: 'ID required' });
            
            await DollarSpend.findByIdAndDelete(id);
            res.status(200).json({ success: true, message: 'Record deleted successfully' });
        }
        else {
            res.status(405).json({ message: 'Method not allowed' });
        }
    } catch (error) {
        console.error("Dollar API Error:", error);
        res.status(500).json({ message: error.message || 'Server error.' });
    }
}
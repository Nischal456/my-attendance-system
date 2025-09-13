import jwt from 'jsonwebtoken';
import User from '../../../../models/User';
import LeaveBalance from '../../../../models/LeaveBalance';
import LeaveRequest from '../../../../models/LeaveRequest';
import dbConnect from '../../../../lib/dbConnect';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    await dbConnect();
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        let leaveBalance = await LeaveBalance.findOne({ user: user._id, year: new Date().getFullYear() });
        if (!leaveBalance) {
            leaveBalance = await LeaveBalance.create({ 
                user: user._id,
                year: new Date().getFullYear(),
                sickLeaveAvailable: 15, // Default value
                homeLeaveAvailable: 15  // Default value
            });
        }

        const approvedRequests = await LeaveRequest.find({ 
            user: user._id, 
            status: 'Approved' 
        }).lean();
        
        let sickLeaveTaken = 0;
        let homeLeaveTaken = 0;

        approvedRequests.forEach(req => {
            const startDate = new Date(req.startDate);
            const endDate = new Date(req.endDate);
            const duration = ((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            
            if (req.leaveType === 'Sick Leave') sickLeaveTaken += duration;
            else if (req.leaveType === 'Home Leave') homeLeaveTaken += duration;
        });
        
        res.status(200).json({
            success: true,
            balance: leaveBalance,
            takenLeave: { sick: sickLeaveTaken, home: homeLeaveTaken }
        });

    } catch (error) {
        console.error("Leave Balance API Error:", error);
        res.status(500).json({ message: 'Server error fetching leave balance.' });
    }
}
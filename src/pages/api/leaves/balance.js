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

        const currentYear = new Date().getFullYear();

        // 1. Get Balance (Safe Fetch)
        let leaveBalance = await LeaveBalance.findOne({ user: user._id, year: currentYear });

        // 2. If not found, create it (With Race Condition Protection)
        if (!leaveBalance) {
            try {
                leaveBalance = await LeaveBalance.create({ 
                    user: user._id,
                    year: currentYear,
                    sickLeaveAvailable: 15, // Default Value
                    homeLeaveAvailable: 15  // Default Value
                });
            } catch (createError) {
                // FIX: If duplicate key error (E11000), it means another request just created it.
                // We simply fetch the existing one instead of crashing.
                if (createError.code === 11000) {
                    leaveBalance = await LeaveBalance.findOne({ user: user._id, year: currentYear });
                } else {
                    throw createError; // If it's a real DB error, let it crash
                }
            }
        }

        // Safety Fallback: In the extremely rare case it's still null, default it to avoid 500 error
        if (!leaveBalance) {
             leaveBalance = { sickLeaveAvailable: 15, homeLeaveAvailable: 15 };
        }

        // 3. Calculate Taken Leaves (Filtered by CURRENT YEAR only)
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

        const approvedRequests = await LeaveRequest.find({ 
            user: user._id, 
            status: 'Approved',
            startDate: { $gte: startOfYear, $lte: endOfYear } // Only count this year's leaves
        }).lean();
        
        let sickLeaveTaken = 0;
        let homeLeaveTaken = 0;

        approvedRequests.forEach(req => {
            const startDate = new Date(req.startDate);
            const endDate = new Date(req.endDate);
            // Calculate days inclusive
            const duration = Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            
            if (req.leaveType === 'Sick Leave') {
                sickLeaveTaken += duration;
            } else if (req.leaveType === 'Home Leave') {
                homeLeaveTaken += duration;
            }
        });
        
        // 4. Return Data
        res.status(200).json({
            success: true,
            balance: leaveBalance,
            takenLeave: { sick: sickLeaveTaken, home: homeLeaveTaken },
            remaining: {
                // Use || 15 fallback just in case DB field is missing
                sick: (leaveBalance.sickLeaveAvailable || 15) - sickLeaveTaken,
                home: (leaveBalance.homeLeaveAvailable || 15) - homeLeaveTaken
            }
        });

    } catch (error) {
        console.error("Leave Balance API Error:", error);
        res.status(500).json({ message: 'Server error fetching leave balance.' });
    }
}
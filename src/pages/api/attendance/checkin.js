import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Attendance from '../../../../models/Attendance';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }
    await dbConnect();
    try {
        const { token } = req.cookies;
        if (!token) return res.status(401).json({ message: 'Not authenticated' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const existingActiveCheckin = await Attendance.findOne({ user: decoded.userId, checkOutTime: null });
        if (existingActiveCheckin) {
            return res.status(400).json({ message: 'You are already checked in.' });
        }

        // ✅ FIX: Get workLocation and optional client timestamp to prevent clock drift issues
        const { workLocation, checkInTime: clientTime } = req.body;
        if (!workLocation || !['Office', 'Home'].includes(workLocation)) {
            return res.status(400).json({ message: 'A valid work location ("Office" or "Home") is required.' });
        }

        // Validate client timestamp (within +/- 10 minutes of server time to prevent clock drift)
        let finalCheckInTime = new Date();
        if (clientTime) {
            const parsedClientTime = new Date(clientTime);
            if (!isNaN(parsedClientTime.getTime())) {
                const diffMs = Math.abs(parsedClientTime.getTime() - Date.now());
                if (diffMs <= 10 * 60 * 1000) {
                    finalCheckInTime = parsedClientTime;
                }
            }
        }

        const newAttendance = new Attendance({
            user: decoded.userId,
            checkInTime: finalCheckInTime,
            workLocation: workLocation,
        });

        await newAttendance.save();
        
        // Return the full record so the UI can update instantly
        const populatedAttendance = await Attendance.findById(newAttendance._id).lean();

        res.status(201).json({ success: true, message: `Checked in from ${workLocation}.`, data: populatedAttendance });

    } catch (error) {
        console.error("Check-in API error:", error);
        res.status(500).json({ message: 'Server error during check-in.' });
    }
}
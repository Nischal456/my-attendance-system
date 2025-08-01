import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Attendance from '../../../../models/Attendance';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    await dbConnect();

    try {
        // Authenticate and Authorize HR
        const { token } = req.cookies;
        if (!token) return res.status(401).json({ message: 'Not authenticated' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const hrUser = await User.findById(decoded.userId);
        if (!hrUser || hrUser.role !== 'HR') {
            return res.status(403).json({ message: 'Forbidden: Access denied.' });
        }

        const { attendanceId, newCheckoutTime } = req.body;
        if (!attendanceId || !newCheckoutTime) {
            return res.status(400).json({ message: 'Attendance ID and new checkout time are required.' });
        }

        const record = await Attendance.findById(attendanceId);
        if (!record) {
            return res.status(404).json({ message: 'Attendance record not found.' });
        }
        
        const checkIn = new Date(record.checkInTime);
        const newCheckout = new Date(newCheckoutTime);

        if (newCheckout <= checkIn) {
            return res.status(400).json({ message: 'Checkout time must be after the check-in time.' });
        }

        // Update the checkout time
        record.checkOutTime = newCheckout;

        // Recalculate the duration
        const totalDurationSeconds = (newCheckout.getTime() - checkIn.getTime()) / 1000;
        record.duration = totalDurationSeconds - (record.totalBreakDuration || 0);
        
        await record.save();
        
        const updatedRecord = await Attendance.findById(attendanceId).populate("user").lean();

        res.status(200).json({ success: true, message: 'Checkout time updated successfully.', data: updatedRecord });

    } catch (error) {
        console.error('ADJUST CHECKOUT API ERROR:', error);
        res.status(500).json({ message: 'An error occurred. Please try again later.' });
    }
}
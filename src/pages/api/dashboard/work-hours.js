import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import Attendance from '../../../../models/Attendance';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    await dbConnect();
    try {
        const { token } = req.cookies;
        if (!token) return res.status(401).json({ message: 'Not authenticated' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const year = parseInt(req.query.year);
        const month = parseInt(req.query.month);
        
        const startDate = new Date(Date.UTC(year, month - 1, 1));
        const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

        const attendanceRecords = await Attendance.find({
            user: userId,
            checkInTime: { $gte: startDate, $lte: endDate },
            duration: { $ne: null }
        }).lean();

        const totalSeconds = attendanceRecords.reduce((acc, record) => acc + record.duration, 0);
        const totalHours = totalSeconds / 3600;

        res.status(200).json({ success: true, totalHours: totalHours });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}
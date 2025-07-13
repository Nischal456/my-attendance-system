import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Attendance from '../../../../models/Attendance';
import Task from '../../../../models/Task';
import Note from '../../../../models/Note';
import Notification from '../../../../models/Notification';

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
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const [attendanceHistory, tasks, notes, userNotifications, activeCheckIn] = await Promise.all([
            Attendance.find({ user: user._id }).sort({ checkInTime: -1 }).limit(10).lean(),
            Task.find({ $or: [{ assignedTo: user._id }, { assistedBy: user._id }] })
                .populate('assignedBy', 'name')
                .populate('assignedTo', 'name avatar')
                .populate('assistedBy', 'name avatar')
                .populate('attachments.uploadedBy', 'name')
                .sort({ createdAt: -1 })
                .lean(),
            Note.find({ user: user._id }).sort({ createdAt: -1 }).limit(50).lean(),
            Notification.find({ recipient: user._id }).sort({ createdAt: -1 }).limit(50).lean(),
            Attendance.findOne({ user: user._id, checkOutTime: null }).lean()
        ]);

        const initialIsOnBreak = activeCheckIn ? activeCheckIn.breaks.some(b => !b.breakOutTime) : false;

        res.status(200).json({
            success: true,
            initialAttendance: attendanceHistory,
            initialTasks: tasks,
            initialNotes: notes,
            initialNotifications: userNotifications,
            activeCheckIn: activeCheckIn,
            initialIsOnBreak: initialIsOnBreak
        });

    } catch (error) {
        console.error("Dashboard Data API Error:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
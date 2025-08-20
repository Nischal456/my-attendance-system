import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Attendance from '../../../../models/Attendance';
import Task from '../../../../models/Task';
import Note from '../../../../models/Note';
import Notification from '../../../../models/Notification';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    await dbConnect();
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Please Login Again' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = new mongoose.Types.ObjectId(decoded.userId);

        const [attendanceHistory, tasks, notes, userNotifications, activeCheckIn] = await Promise.all([
            Attendance.find({ user: userId })
                .sort({ checkInTime: -1 })
                .limit(7)
                // ✅ FIX: Added 'workLocation' to the select statement
                .select('checkInTime checkOutTime duration totalBreakDuration description workLocation')
                .lean(),

            Task.find({ $or: [{ assignedTo: userId }, { assistedBy: userId }] })
                .sort({ createdAt: -1 })
                .select('title description status deadline assignedTo assignedBy assistedBy attachments completedAt submissionDescription comments')
                .populate({ path: 'assignedBy', select: 'name avatar' })
                .populate({ path: 'assignedTo', select: 'name avatar' })
                .populate({ path: 'assistedBy', select: 'name avatar' })
                .populate({ path: 'attachments.uploadedBy', select: 'name' })
                .populate({ path: 'comments.author', select: 'name avatar' })
                .lean(),

            Note.find({ user: userId }).sort({ createdAt: -1 }).limit(20).select('content createdAt').lean(),
            Notification.find({ recipient: userId }).sort({ createdAt: -1 }).limit(20).select('content author link isRead createdAt').lean(),
            Attendance.findOne({ user: userId, checkOutTime: null }).lean()
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
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import Attendance from '../../../../models/Attendance';
import Task from '../../../../models/Task';
import Note from '../../../../models/Note';
import Notification from '../../../../models/Notification';
import mongoose from 'mongoose';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    await dbConnect();
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Optimization: No need to query the User model here, the userId is in the token.
        const userId = new mongoose.Types.ObjectId(decoded.userId);

        const [attendanceHistory, tasks, notes, userNotifications, activeCheckIn] = await Promise.all([
            // Optimization: Select only the fields needed for the attendance table.
            Attendance.find({ user: userId })
                .sort({ checkInTime: -1 })
                .limit(7) // Fetch only 7 for the initial view
                .select('checkInTime checkOutTime duration totalBreakDuration description')
                .lean(),

            // Optimization: Heavily select fields for tasks and populated documents.
            Task.find({ $or: [{ assignedTo: userId }, { assistedBy: userId }] })
                .sort({ createdAt: -1 })
                .select('title description status deadline assignedTo assignedBy assistedBy attachments completedAt submissionDescription')
                .populate({ path: 'assignedBy', select: 'name' })
                .populate({ path: 'assignedTo', select: 'name avatar' })
                .populate({ path: 'assistedBy', select: 'name avatar' })
                .populate({ path: 'attachments.uploadedBy', select: 'name' })
                .lean(),

            // Optimization: Select only necessary note fields.
            Note.find({ user: userId })
                .sort({ createdAt: -1 })
                .limit(20)
                .select('content createdAt')
                .lean(),

            // Optimization: Select only necessary notification fields.
            Notification.find({ recipient: userId })
                .sort({ createdAt: -1 })
                .limit(20)
                .select('content author link isRead createdAt')
                .lean(),
            
            // This query is efficient, especially with the recommended sparse index.
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
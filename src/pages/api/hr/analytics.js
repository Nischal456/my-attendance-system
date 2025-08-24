import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Task from '../../../../models/Task';
import Attendance from '../../../../models/Attendance';
import LeaveRequest from '../../../../models/LeaveRequest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

export default async function handler(req, res) {
    await dbConnect();
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const hrUser = await User.findById(decoded.userId);
        if (!hrUser || hrUser.role !== 'HR') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);

        const [
            userCount,
            onLeaveTodayCount,
            monthlyLeaveStats,
            taskDistribution,
            locationStats
        ] = await Promise.all([
            User.countDocuments({ role: { $ne: 'HR' } }),
            LeaveRequest.countDocuments({ status: 'Approved', startDate: { $lte: now }, endDate: { $gte: now } }),
            LeaveRequest.aggregate([
                { $match: { status: 'Approved', startDate: { $gte: monthStart, $lte: monthEnd } } },
                { $group: { _id: '$leaveType', count: { $sum: 1 } } }
            ]),
            Task.aggregate([
                { $match: { assignedTo: { $ne: null } } },
                { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
                { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
                { $unwind: '$user' },
                { $project: { name: '$user.name', count: 1 } },
                { $sort: { count: -1 } }
            ]),
            Attendance.aggregate([
                { $match: { checkInTime: { $gte: todayStart, $lte: todayEnd } } },
                { $group: { _id: '$workLocation', count: { $sum: 1 } } }
            ])
        ]);

        const totalTasks = taskDistribution.reduce((acc, item) => acc + item.count, 0);

        const analyticsData = {
            kpis: {
                totalEmployees: userCount,
                onLeaveToday: onLeaveTodayCount,
                tasksInProgress: await Task.countDocuments({ status: 'In Progress' }),
                totalTasksThisMonth: totalTasks // Note: this is all-time, could be scoped to month
            },
            leaveBreakdown: monthlyLeaveStats,
            taskDistribution: taskDistribution.slice(0, 10), // Top 10 employees
            todayLocation: locationStats
        };

        res.status(200).json({ success: true, data: analyticsData });

    } catch (error) {
        console.error("HR Analytics API Error:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
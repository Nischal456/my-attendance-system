import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Task from '../../../../models/Task';
import Attendance from '../../../../models/Attendance';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { startOfWeek, subWeeks, eachWeekOfInterval, format, differenceInCalendarDays, startOfDay } from 'date-fns';

// ✅ FIX: Re-added the helper function to calculate the streak
const calculateStreak = (dates) => {
    if (dates.length === 0) return 0;
    let streak = 0;
    let today = startOfDay(new Date());

    const todayLogin = dates.some(d => differenceInCalendarDays(today, d) === 0);
    if (todayLogin) {
        streak = 1;
        for (let i = 1; i < dates.length; i++) {
            const prevDay = new Date(today);
            prevDay.setDate(today.getDate() - i);
            const hasLoginForPrevDay = dates.some(d => differenceInCalendarDays(prevDay, d) === 0);
            if (hasLoginForPrevDay) {
                streak++;
            } else {
                break;
            }
        }
    }
    return streak;
};

export default async function handler(req, res) {
    await dbConnect();
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = new mongoose.Types.ObjectId(decoded.userId);

        const [taskStats, monthlyHours, weeklyTasks, locationHours, recentAttendance] = await Promise.all([
            // --- STATS AGGREGATION ---
            Task.aggregate([
                { $match: { assignedTo: userId, status: 'Completed' } },
                { $group: { _id: null, totalCompleted: { $sum: 1 }, onTime: { $sum: { $cond: [{ $lte: ["$completedAt", "$deadline"] }, 1, 0] } } } }
            ]),
            // --- MONTHLY HOURS AGGREGATION ---
            Attendance.aggregate([
                { $match: { user: userId, duration: { $ne: null } } },
                { $group: { _id: { year: { $year: "$checkInTime" }, month: { $month: "$checkInTime" } }, totalSeconds: { $sum: "$duration" } } },
                { $sort: { "_id.year": -1, "_id.month": -1 } },
                { $limit: 6 }
            ]),
            // --- WEEKLY TASK COMPLETION AGGREGATION ---
            Task.aggregate([
                { $match: { assignedTo: userId, status: 'Completed', completedAt: { $gte: subWeeks(new Date(), 12) } } },
                { $group: { _id: { $week: "$completedAt" }, count: { $sum: 1 } } },
                { $sort: { "_id": 1 } }
            ]),
            // --- LOCATION-BASED HOURS AGGREGATION ---
            Attendance.aggregate([
                { $match: { user: userId, duration: { $ne: null } } },
                { $group: { _id: "$workLocation", totalSeconds: { $sum: "$duration" } } }
            ]),
            // ✅ FIX: Re-added the query to fetch attendance for the streak calculation
            Attendance.find({ user: userId }).sort({ checkInTime: -1 }).limit(90).select('checkInTime').lean(),
        ]);

        const stats = {
            totalCompleted: taskStats[0]?.totalCompleted || 0,
            onTimeRate: (taskStats[0]?.totalCompleted > 0) ? ((taskStats[0]?.onTime / taskStats[0]?.totalCompleted) * 100).toFixed(0) : 0,
        };

        const hoursChartData = monthlyHours.reverse().map(month => ({
            month: `${month._id.year}-${String(month._id.month).padStart(2, '0')}`,
            hours: month.totalSeconds / 3600
        }));

        const weeksInterval = eachWeekOfInterval({ start: subWeeks(new Date(), 11), end: new Date() }, { weekStartsOn: 1 });
        const tasksChartData = weeksInterval.map(weekStart => {
            const weekNumber = parseInt(format(weekStart, 'w'));
            const weekData = weeklyTasks.find(w => w._id === weekNumber);
            return { week: format(weekStart, 'MMM d'), count: weekData ? weekData.count : 0 };
        });
        
        const locationData = {
            officeHours: locationHours.find(loc => loc._id === 'Office')?.totalSeconds / 3600 || 0,
            homeHours: locationHours.find(loc => loc._id === 'Home')?.totalSeconds / 3600 || 0,
        };
        
        // ✅ FIX: Re-added the full achievements logic
        const uniqueCheckinDays = [...new Set(recentAttendance.map(a => startOfDay(new Date(a.checkInTime)).toISOString()))].map(iso => new Date(iso));
        const checkInStreak = calculateStreak(uniqueCheckinDays);

        const achievements = {
            onFire: weeklyTasks.some(w => w.count >= 5),
            taskMaster: stats.totalCompleted >= 50,
            loginStreak: checkInStreak,
        };

        res.status(200).json({ success: true, stats, hoursChartData, tasksChartData, locationData, achievements });
    } catch (error) {
        console.error("Performance Stats API Error:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
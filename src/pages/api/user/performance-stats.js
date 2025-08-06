import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Task from '../../../../models/Task';
import Attendance from '../../../../models/Attendance';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { startOfWeek, subWeeks, eachWeekOfInterval, format, differenceInCalendarDays, startOfDay } from 'date-fns';

// Helper to calculate the consecutive day login streak
const calculateStreak = (dates) => {
    // Sort dates in descending order to start from the most recent
    dates.sort((a, b) => b - a);

    if (dates.length === 0) return 0;

    let streak = 0;
    let expectedDate = startOfDay(new Date());

    // Check if the most recent login was today or yesterday
    const lastLoginDay = startOfDay(dates[0]);
    const today = startOfDay(new Date());
    const yesterday = startOfDay(new Date(new Date().setDate(new Date().getDate() - 1)));

    if (differenceInCalendarDays(today, lastLoginDay) > 1) {
        // If the last login was neither today nor yesterday, the streak is 0
        return 0;
    }
    
    // If the last login was yesterday, start the check from yesterday
    if (differenceInCalendarDays(today, lastLoginDay) === 1) {
        expectedDate = yesterday;
    }

    // Iterate through the sorted, unique login dates
    for (const date of dates) {
        const currentLoginDay = startOfDay(date);
        if (differenceInCalendarDays(expectedDate, currentLoginDay) === 0) {
            streak++;
            // Set the next expected date to the previous day
            expectedDate = startOfDay(new Date(expectedDate.setDate(expectedDate.getDate() - 1)));
        } else if (differenceInCalendarDays(expectedDate, currentLoginDay) > 0) {
            // A day was missed, so the streak is broken
            break;
        }
        // If difference is < 0, it means multiple logins on the same day, just continue
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

        const [taskStats, monthlyHours, weeklyTasks, recentAttendance] = await Promise.all([
            // --- STATS AGGREGATION ---
            Task.aggregate([
                { $match: { assignedTo: userId, status: 'Completed' } },
                {
                    $group: {
                        _id: null,
                        totalCompleted: { $sum: 1 },
                        onTime: { $sum: { $cond: [{ $lte: ["$completedAt", "$deadline"] }, 1, 0] } }
                    }
                }
            ]),
            // --- MONTHLY HOURS AGGREGATION ---
            Attendance.aggregate([
                { $match: { user: userId, duration: { $ne: null } } },
                {
                    $group: {
                        _id: { year: { $year: "$checkInTime" }, month: { $month: "$checkInTime" } },
                        totalSeconds: { $sum: "$duration" }
                    }
                },
                { $sort: { "_id.year": -1, "_id.month": -1 } },
                { $limit: 6 }
            ]),
            // --- WEEKLY TASK COMPLETION AGGREGATION ---
            Task.aggregate([
                { $match: { assignedTo: userId, status: 'Completed', completedAt: { $gte: subWeeks(new Date(), 12) } } },
                {
                    $group: {
                        _id: { $week: "$completedAt" },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { "_id": 1 } }
            ]),
            // --- RECENT ATTENDANCE FOR STREAK CALCULATION ---
            Attendance.find({ user: userId }).sort({ checkInTime: -1 }).limit(90).select('checkInTime').lean(),
        ]);

        // --- STREAK CALCULATION ---
        const uniqueCheckinDays = [...new Set(recentAttendance.map(a => startOfDay(new Date(a.checkInTime)).toISOString()))]
                                  .map(iso => new Date(iso));
        const checkInStreak = calculateStreak(uniqueCheckinDays);
        
        // --- DATA SHAPING ---
        const stats = {
            totalCompleted: taskStats[0]?.totalCompleted || 0,
            onTime: taskStats[0]?.onTime || 0,
            onTimeRate: (taskStats[0]?.totalCompleted > 0) ? ((taskStats[0]?.onTime / taskStats[0]?.totalCompleted) * 100).toFixed(0) : 0,
        };

        const hoursChartData = monthlyHours.reverse().map(month => ({
            month: `${month._id.year}-${String(month._id.month).padStart(2, '0')}`,
            hours: month.totalSeconds / 3600
        }));

        const weeksInterval = eachWeekOfInterval({
            start: subWeeks(new Date(), 11),
            end: new Date()
        }, { weekStartsOn: 1 });

        const tasksChartData = weeksInterval.map(weekStart => {
            const weekNumber = parseInt(format(weekStart, 'w'));
            const weekData = weeklyTasks.find(w => w._id === weekNumber);
            return {
                week: format(weekStart, 'MMM d'),
                count: weekData ? weekData.count : 0
            };
        });
        
        // --- ACHIEVEMENTS LOGIC ---
        const achievements = {
            onFire: weeklyTasks.some(w => w.count >= 5),
            taskMaster: stats.totalCompleted >= 50,
            loginStreak: checkInStreak, // Added login streak
        };

        res.status(200).json({ success: true, stats, hoursChartData, tasksChartData, achievements });
    } catch (error) {
        console.error("Performance Stats API Error:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Project from '../../../../models/Project'; // ✅ We use Project to access tasks
import Attendance from '../../../../models/Attendance';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { 
    startOfWeek, 
    subWeeks, 
    eachWeekOfInterval, 
    format, 
    differenceInCalendarDays, 
    startOfDay, 
    isSameDay
} from 'date-fns';

// --- Helper: Calculate Streak ---
const calculateStreak = (dates) => {
    if (!dates || dates.length === 0) return 0;
    
    // Sort dates descending
    const sortedDates = dates.map(d => startOfDay(new Date(d))).sort((a, b) => b - a);
    
    // Remove duplicates
    const uniqueDates = [];
    sortedDates.forEach(d => {
        if (!uniqueDates.some(ud => isSameDay(ud, d))) {
            uniqueDates.push(d);
        }
    });

    if (uniqueDates.length === 0) return 0;

    const today = startOfDay(new Date());
    const lastLogin = uniqueDates[0];
    
    // If last login was not today or yesterday, streak is broken
    const diffToLast = differenceInCalendarDays(today, lastLogin);
    if (diffToLast > 1) return 0;

    let streak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
        const current = uniqueDates[i];
        const next = uniqueDates[i + 1];
        const diff = differenceInCalendarDays(current, next);

        if (diff === 1) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
};

export default async function handler(req, res) {
    await dbConnect();
    const { token } = req.cookies;
    
    if (!token) return res.status(401).json({ success: false, message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = new mongoose.Types.ObjectId(decoded.userId);

        // --- 1. Aggregations (Parallel for Speed) ---
        const [
            attendanceData, 
            taskData, 
            recentAttendanceLogs
        ] = await Promise.all([
            
            // A. Attendance Aggregation
            Attendance.aggregate([
                { $match: { user: userId } },
                { 
                    $project: {
                        duration: 1,
                        checkInTime: 1,
                        workLocation: 1, 
                        month: { $month: "$checkInTime" }
                    }
                }
            ]),

            // B. Project/Task Aggregation (Unwind embedded tasks)
            Project.aggregate([
                { $unwind: "$tasks" },
                { $match: { "tasks.createdBy": userId } },
                { 
                    $project: {
                        isCompleted: "$tasks.isCompleted",
                        createdAt: "$tasks.createdAt"
                    }
                }
            ]),

            // C. Recent Logs for Streak
            Attendance.find({ user: userId })
                .sort({ checkInTime: -1 })
                .limit(60)
                .select('checkInTime')
                .lean()
        ]);

        // --- 2. Process Task Stats ---
        const totalTasks = taskData.length;
        const completedTasks = taskData.filter(t => t.isCompleted).length;
        const onTimeRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Weekly Velocity (Last 4 Weeks)
        const weeklyStats = {};
        const weeksInterval = eachWeekOfInterval({ start: subWeeks(new Date(), 4), end: new Date() });
        
        weeksInterval.forEach(week => { weeklyStats[format(week, 'w')] = 0; });

        taskData.forEach(task => {
            if(task.isCompleted && task.createdAt) {
                const weekNum = format(new Date(task.createdAt), 'w');
                if (weeklyStats[weekNum] !== undefined) weeklyStats[weekNum]++;
            }
        });

        const tasksChartData = weeksInterval.map(week => ({
            week: format(week, 'd'), // Label
            count: weeklyStats[format(week, 'w')] || 0
        }));

        // --- 3. Process Attendance Hours ---
        const monthlyHoursMap = {};
        let officeSeconds = 0;
        let homeSeconds = 0;

        attendanceData.forEach(record => {
            const monthKey = `${format(new Date(0, record.month - 1), 'MMM')}`;
            const seconds = record.duration || 0;
            
            monthlyHoursMap[monthKey] = (monthlyHoursMap[monthKey] || 0) + seconds;

            if (record.workLocation === 'Office' || !record.workLocation) officeSeconds += seconds;
            else homeSeconds += seconds;
        });

        const hoursChartData = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = format(d, 'MMM');
            hoursChartData.push({
                month: key,
                hours: ((monthlyHoursMap[key] || 0) / 3600).toFixed(1)
            });
        }

        // --- 4. Process Streak ---
        const streakDates = recentAttendanceLogs.map(log => log.checkInTime);
        const loginStreak = calculateStreak(streakDates);

        // --- 5. Return Data ---
        res.status(200).json({
            success: true,
            stats: {
                totalCompleted: completedTasks,
                onTimeRate
            },
            locationData: {
                officeHours: (officeSeconds / 3600),
                homeHours: (homeSeconds / 3600)
            },
            hoursChartData,
            tasksChartData,
            achievements: {
                loginStreak,
                onFire: completedTasks > 5,
                taskMaster: completedTasks > 50
            }
        });

    } catch (error) {
        console.error("Performance Stats API Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
}
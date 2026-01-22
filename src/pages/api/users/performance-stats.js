import dbConnect from '../../../../lib/dbConnect';
import Project from '../../../../models/Project';
import Attendance from '../../../../models/Attendance';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { 
    subWeeks, 
    eachWeekOfInterval, 
    format, 
    startOfDay, 
    differenceInCalendarDays, 
    isSameDay
} from 'date-fns';

// --- Helper: Calculate Streak ---
const calculateStreak = (dates) => {
    if (!dates || dates.length === 0) return 0;
    const sortedDates = dates.map(d => startOfDay(new Date(d))).sort((a, b) => b - a);
    const uniqueDates = [];
    sortedDates.forEach(d => {
        if (!uniqueDates.some(ud => isSameDay(ud, d))) uniqueDates.push(d);
    });
    if (uniqueDates.length === 0) return 0;
    const today = startOfDay(new Date());
    const lastLogin = uniqueDates[0];
    if (differenceInCalendarDays(today, lastLogin) > 1) return 0; // Streak broken if not today/yesterday

    let streak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
        if (differenceInCalendarDays(uniqueDates[i], uniqueDates[i+1]) === 1) streak++;
        else break;
    }
    return streak;
};

export default async function handler(req, res) {
    await dbConnect();
    const { token } = req.cookies;
    
    if (!token) return res.status(401).json({ success: false, message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId; // Keep as string for safe comparison

        // 1. Fetch Data
        // We fetch ALL projects the user is involved in (Leader OR Member)
        const [attendanceData, projects] = await Promise.all([
            Attendance.find({ user: userId }).lean(),
            Project.find({
                $or: [{ leader: userId }, { assignedTo: userId }, { "tasks.createdBy": userId }]
            }).lean()
        ]);

        // 2. Robust Task Calculation (JavaScript Filter)
        let totalTasks = 0;
        let completedTasks = 0;
        const weeklyStats = {};
        const weeksInterval = eachWeekOfInterval({ start: subWeeks(new Date(), 4), end: new Date() });
        weeksInterval.forEach(week => { weeklyStats[format(week, 'w')] = 0; });

        projects.forEach(project => {
            if (project.tasks && Array.isArray(project.tasks)) {
                project.tasks.forEach(task => {
                    // LOGIC: You get credit if:
                    // A) You created the task
                    // B) OR You are the Project Leader (Team Velocity)
                    // C) OR You are assigned to the project (Member contribution)
                    const isMyTask = 
                        String(task.createdBy) === String(userId) || 
                        String(project.leader) === String(userId) ||
                        (project.assignedTo && project.assignedTo.some(id => String(id) === String(userId)));

                    if (isMyTask) {
                        totalTasks++;
                        
                        if (task.isCompleted) {
                            completedTasks++;
                            
                            // Weekly Velocity
                            if (task.createdAt) {
                                const weekNum = format(new Date(task.createdAt), 'w');
                                if (weeklyStats[weekNum] !== undefined) weeklyStats[weekNum]++;
                            }
                        }
                    }
                });
            }
        });

        const onTimeRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const tasksChartData = weeksInterval.map(week => ({
            week: format(week, 'd'),
            count: weeklyStats[format(week, 'w')] || 0
        }));

        // 3. Process Attendance Hours (Monthly)
        const monthlyHoursMap = {};
        let officeSeconds = 0;
        let homeSeconds = 0;

        attendanceData.forEach(record => {
            const date = new Date(record.checkInTime);
            const monthKey = format(date, 'MMM');
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

        // 4. Streak
        const streakDates = attendanceData.map(log => log.checkInTime);
        const loginStreak = calculateStreak(streakDates);

        // 5. Final Response
        res.status(200).json({
            success: true,
            stats: {
                totalCompleted: completedTasks,
                totalTasks: totalTasks, // Added total for context
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
                taskMaster: completedTasks > 20
            }
        });

    } catch (error) {
        console.error("Performance API Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
}
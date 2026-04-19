import dbConnect from '../../../../lib/dbConnect';
import Task from '../../../../models/Task';
import Project from '../../../../models/Project';
import Attendance from '../../../../models/Attendance';
import jwt from 'jsonwebtoken';
import { 
    subWeeks, 
    eachWeekOfInterval, 
    format, 
    startOfDay, 
    differenceInCalendarDays, 
    isSameDay
} from 'date-fns';

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
    if (differenceInCalendarDays(today, lastLogin) > 1) return 0;

    let streak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
        if (differenceInCalendarDays(uniqueDates[i], uniqueDates[i+1]) === 1) streak++;
        else break;
    }
    return streak;
};

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
    
    await dbConnect();
    const { token } = req.cookies;
    
    if (!token) return res.status(401).json({ success: false, message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        // Fetch exactly from real Tasks, Attendance, and Projects
        const [attendanceData, tasksData, projects] = await Promise.all([
            Attendance.find({ user: userId }).lean(),
            Task.find({
                $or: [
                    { assignedTo: userId },
                    { assistedBy: userId }
                ]
            }).lean(),
            Project.find({
                $or: [{ leader: userId }, { assignedTo: userId }, { "tasks.createdBy": userId }]
            }).lean()
        ]);

        // Integrate Canvas Sub-tasks into the dataset
        projects.forEach(project => {
            if (project.tasks && Array.isArray(project.tasks)) {
                project.tasks.forEach(task => {
                    const isMyTask = 
                        String(task.createdBy) === String(userId) || 
                        String(project.leader) === String(userId) ||
                        (project.assignedTo && project.assignedTo.some(id => String(id) === String(userId)));

                    if (isMyTask) {
                        tasksData.push({
                            status: task.isCompleted ? 'Completed' : 'To Do',
                            completedAt: task.isCompleted ? task.createdAt : null,
                            deadline: null
                        });
                    }
                });
            }
        });

        let totalTasks = tasksData.length;
        let completedTasks = 0;
        let inProgressTasks = 0;
        let toDoTasks = 0;
        let overdueTasks = 0;

        const weeklyStats = {};
        const weeksInterval = eachWeekOfInterval({ start: subWeeks(new Date(), 4), end: new Date() });
        weeksInterval.forEach(week => { weeklyStats[format(week, 'w')] = 0; });

        const today = new Date();

        tasksData.forEach(task => {
            if (task.status === 'Completed') {
                completedTasks++;
                if (task.completedAt) {
                    const weekNum = format(new Date(task.completedAt), 'w');
                    if (weeklyStats[weekNum] !== undefined) weeklyStats[weekNum]++;
                }
            } else if (task.status === 'In Progress') {
                inProgressTasks++;
            } else {
                toDoTasks++;
            }

            if (task.status !== 'Completed' && task.deadline && new Date(task.deadline) < today) {
                overdueTasks++;
            }
        });

        const onTimeRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const tasksChartData = weeksInterval.map(week => ({
            week: format(week, 'd'),
            count: weeklyStats[format(week, 'w')] || 0
        }));

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

        const streakDates = attendanceData.map(log => log.checkInTime);
        const loginStreak = calculateStreak(streakDates);

        // --- NEW GAMIFICATION LOGIC ---
        const xp = (completedTasks * 150) + (loginStreak * 50) + (totalTasks * 25);
        const currentLevel = Math.floor(xp / 500) + 1;
        const xpForCurrentLevel = xp % 500;
        const levelProgress = (xpForCurrentLevel / 500) * 100;

        let productivityPersona = "Warming Up";
        let personaColor = "text-slate-500 bg-slate-100";
        
        if (onTimeRate >= 90 && completedTasks > 10) {
            productivityPersona = "Elite Executor ⚡";
            personaColor = "text-amber-700 bg-amber-100";
        } else if (onTimeRate >= 70 && completedTasks > 5) {
            productivityPersona = "Rising Star 🌟";
            personaColor = "text-indigo-700 bg-indigo-100";
        } else if (loginStreak > 5) {
            productivityPersona = "Unbreakable 🏔️";
            personaColor = "text-emerald-700 bg-emerald-100";
        } else if (totalTasks > 0) {
            productivityPersona = "Active Explorer 🚀";
            personaColor = "text-blue-700 bg-blue-100";
        }

        res.status(200).json({
            success: true,
            gamification: {
                xp,
                currentLevel,
                levelProgress: Math.round(levelProgress),
                xpToNextLevel: 500 - xpForCurrentLevel,
                persona: productivityPersona,
                personaColor
            },
            stats: {
                totalTasks,
                completedTasks,
                inProgressTasks,
                toDoTasks,
                overdueTasks,
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
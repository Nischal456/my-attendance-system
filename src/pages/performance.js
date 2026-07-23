import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import {
    CheckCircle, Award, ArrowLeft, Clock, Zap, Star, GitCommit, Home,
    Briefcase, TrendingUp, AlertCircle, Loader, List, AlertTriangle,
    Shield, Mail, Calendar, UserCheck, BarChart2, Target, Compass,
    CheckSquare, ArrowUpRight, Activity, Layers
} from 'react-feather';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement } from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement);

// --- Sub-Components ---

const StatCard = ({ title, value, icon, unit = '', subtitle = '' }) => (
    <motion.div
        whileHover={{ y: -5, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)" }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 h-full relative overflow-hidden group"
    >
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
            {icon}
        </div>
        <div className="flex items-center gap-5 relative z-10">
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl shadow-sm group-hover:bg-emerald-100 transition-colors">
                {icon}
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
                <p className="text-3xl font-extrabold text-slate-800 tracking-tight">
                    {value}<span className="text-lg font-medium text-slate-400 ml-1">{unit}</span>
                </p>
                {subtitle && <p className="text-[10px] font-bold text-slate-400 mt-1">{subtitle}</p>}
            </div>
        </div>
    </motion.div>
);

const AchievementCard = ({ title, description, achieved, value, icon }) => (
    <motion.div
        whileHover={{ scale: 1.02, x: 5 }}
        className={`flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 ${achieved ? 'bg-gradient-to-br from-emerald-50/80 to-white border-emerald-100 shadow-sm' : 'bg-slate-50/50 border-slate-100 opacity-60 grayscale'}`}
    >
        <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${achieved ? 'bg-white text-emerald-600' : 'bg-white text-slate-400'}`}>
            {icon}
        </div>
        <div>
            <h4 className={`font-bold text-base ${achieved ? 'text-slate-800' : 'text-slate-500'}`}>
                {title} {achieved && value > 0 && <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-extrabold">{value} {value > 1 ? 'Days' : 'Day'}</span>}
            </h4>
            <p className="text-xs font-medium text-slate-500 mt-0.5 leading-snug">{description}</p>
        </div>
    </motion.div>
);

const PerformancePageSkeleton = () => (
    <div className="min-h-screen bg-slate-50 animate-pulse">
        <header className="bg-white h-20 border-b border-slate-100 p-4 lg:px-10 flex items-center justify-between">
            <div className="h-8 bg-slate-200 rounded-lg w-48"></div>
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
            </div>
        </header>
        <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="h-12 bg-slate-200 rounded-xl w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-white rounded-[2rem] border border-slate-100"></div>)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 h-96 bg-white rounded-[2rem] border border-slate-100"></div>
                <div className="lg:col-span-2 h-96 bg-white rounded-[2rem] border border-slate-100"></div>
            </div>
        </main>
    </div>
);

export default function PerformancePage({ user }) {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/users/performance-stats');
                if (!res.ok) throw new Error("Could not load performance data.");
                const data = await res.json();
                if (data.success) {
                    setStats(data);
                } else {
                    throw new Error(data.message || "Failed to load data");
                }
            } catch (error) {
                console.error("Failed to load stats:", error);
                setError(error.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- Memoized Chart Data ---
    const hoursChartData = useMemo(() => {
        if (!stats?.hoursChartData) return { labels: [], datasets: [] };
        const labels = stats.hoursChartData.map(d => d.month);
        const data = stats.hoursChartData.map(d => d.hours);
        return {
            labels,
            datasets: [{
                label: 'Hours',
                data,
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 2,
                borderRadius: 8,
                hoverBackgroundColor: 'rgba(16, 185, 129, 0.4)'
            }]
        };
    }, [stats]);

    const tasksChartData = useMemo(() => {
        if (!stats?.tasksChartData) return { labels: [], datasets: [] };
        const labels = stats.tasksChartData.map(d => `Week ${d.week}`);
        const data = stats.tasksChartData.map(d => d.count);
        return {
            labels,
            datasets: [{
                label: 'Tasks Completed',
                data,
                fill: true,
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
                    gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
                    return gradient;
                },
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 3,
                tension: 0.4,
                pointBackgroundColor: '#fff',
                pointBorderColor: 'rgba(16, 185, 129, 1)',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            }]
        };
    }, [stats]);

    const locationChartData = useMemo(() => {
        if (!stats?.locationData) return { labels: [], datasets: [] };
        return {
            labels: ['Office', 'Home'],
            datasets: [{
                data: [stats.locationData.officeHours, stats.locationData.homeHours],
                backgroundColor: ['#10b981', '#6366f1'],
                hoverOffset: 12,
                borderWidth: 0,
                borderRadius: 4
            }]
        };
    }, [stats]);

    const taskStatusChartData = useMemo(() => {
        if (!stats?.stats) return { labels: [], datasets: [] };
        const { completedTasks, inProgressTasks, toDoTasks } = stats.stats;
        return {
            labels: ['Completed', 'In Progress', 'To Do'],
            datasets: [{
                data: [completedTasks || 0, inProgressTasks || 0, toDoTasks || 0],
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
                hoverOffset: 12,
                borderWidth: 0,
                borderRadius: 4
            }]
        };
    }, [stats]);

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 800, easing: 'easeOutQuart' },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1e293b',
                padding: 12,
                titleFont: { size: 13 },
                bodyFont: { size: 13, weight: 'bold' },
                cornerRadius: 12,
                displayColors: false
            }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f1f5f9', borderDash: [4, 4] }, border: { display: false } },
            x: { grid: { display: false }, border: { display: false } }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { animateScale: true, animateRotate: true },
        plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { size: 12, weight: '700' }, color: '#64748b' } }
        },
        cutout: '75%',
    };

    if (isLoading) return <PerformancePageSkeleton />;

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-600">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm text-center border border-slate-100 max-w-md w-full">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} />
                </div>
                <h2 className="text-xl font-black mb-2 text-slate-800">Unable to load data</h2>
                <p className="mb-6 text-sm font-medium text-slate-400">{error}</p>
                <Link href="/workspace" className="block w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95">
                    Return to Dashboard
                </Link>
            </div>
        </div>
    );

    const userInfo = stats?.userInfo || user;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-emerald-100 selection:text-emerald-800">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-100/30 rounded-full blur-[120px] opacity-40"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-100/30 rounded-full blur-[120px] opacity-40"></div>
            </div>

            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40 transition-all">
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10 h-20 flex justify-between items-center">
                    <Link href="/workspace" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors bg-white px-4 py-2.5 rounded-2xl border border-slate-100 hover:border-slate-300 shadow-sm group">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Dashboard
                    </Link>

                    <div className="flex items-center gap-3 pl-4 border-l border-slate-200 h-10">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-800 leading-tight">{userInfo.name}</p>
                            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{userInfo.role}</p>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-400 rounded-full blur-sm opacity-20"></div>
                            <Image src={userInfo.avatar || '/default-avatar.png'} width={40} height={40} className="rounded-full object-cover border-2 border-white shadow-sm relative z-10" alt="User Avatar" />
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10 py-10 relative z-10">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    {/* --- HIGH-IMPACT STAFF PRODUCTIVITY HERO CARD --- */}
                    <motion.div variants={itemVariants} className="mb-10 bg-white p-8 rounded-[2.5rem] shadow-md border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-50 to-emerald-50 rounded-bl-[10rem] opacity-70 z-0 pointer-events-none"></div>

                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">

                            {/* Left Side: Staff Avatar & Role */}
                            <div className="flex flex-col sm:flex-row items-center sm:items-start lg:items-center gap-6 w-full lg:w-auto">
                                <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 group">
                                    <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 rounded-[2rem] group-hover:opacity-40 transition-opacity duration-500"></div>
                                    <div className="absolute -bottom-3 -right-3 bg-slate-900 text-white font-black text-xs sm:text-sm w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl shadow-xl z-20 ring-4 ring-white border-b-2 border-slate-700 transform group-hover:-rotate-12 transition-transform duration-300">
                                        L{stats?.gamification?.currentLevel ?? 1}
                                    </div>
                                    <Image src={userInfo.avatar || '/default-avatar.png'} fill className="rounded-[1.5rem] object-cover ring-4 ring-white shadow-sm transform -rotate-3 group-hover:rotate-0 transition-all duration-300 z-10" alt={userInfo.name} />
                                </div>

                                <div className="text-center sm:text-left">
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">

                                        {stats?.audit?.grade && (
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${stats.audit.gradeColor}`}>
                                                {stats.audit.grade}
                                            </span>
                                        )}
                                    </div>

                                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-2">{userInfo.name}</h1>

                                    <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mb-3">
                                        <span className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-xl">
                                            {userInfo.role}
                                        </span>
                                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-xl border border-slate-200">
                                            {userInfo.department || 'Operations'}
                                        </span>
                                        {stats?.gamification && (
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-xl border ${stats.gamification.personaColor}`}>
                                                {stats.gamification.persona}
                                            </span>
                                        )}
                                    </div>

                                    {/* Quick Productivity Action Bar */}
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                        <Link href="/workspace" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95">
                                            <Briefcase size={14} /> Open Workspace
                                        </Link>
                                        <Link href="/projects" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all active:scale-95">
                                            <Layers size={14} /> Canvas Projects
                                        </Link>
                                        <Link href="/leaves/apply" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all">
                                            <Calendar size={14} /> Leave Portal
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Productivity Score & Tier */}
                            <div className="w-full lg:w-auto flex flex-row lg:flex-col justify-between items-center lg:items-end pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-8">
                                <div className="text-left lg:text-right">
                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Productivity XP Score</p>
                                    <p className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-600 tracking-tighter">
                                        {stats?.gamification?.xp?.toLocaleString() || 0} <span className="text-base text-slate-300 font-bold tracking-normal">XP</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-end gap-1.5">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> Live Productivity Tracker
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* XP Progress Bar */}
                        {stats?.gamification && (
                            <div className="w-full mt-8 pt-6 border-t border-slate-100">
                                <div className="flex justify-between items-end mb-2 px-1">
                                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Level {stats.gamification.currentLevel} Progress ({stats.gamification.levelProgress}%)</span>
                                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                                        +{stats.gamification.xpToNextLevel} XP to Next Level
                                    </span>
                                </div>
                                <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/60 p-0.5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stats.gamification.levelProgress}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                                        className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                    />
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* --- SMART STAFF PRODUCTIVITY ADVISOR CARDS --- */}
                    <motion.div variants={itemVariants} className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 transform scale-125 group-hover:scale-110 transition-transform">
                                <Target size={80} />
                            </div>
                            <h3 className="text-lg font-black mb-1 flex items-center gap-2">
                                <Target size={18} /> Daily Focus Goal
                            </h3>
                            <p className="text-xs font-medium text-emerald-100 leading-relaxed mb-4">
                                Target 7.0 hours daily duration. Current daily average: <span className="font-extrabold text-white">{stats?.audit?.avgDailyHours ?? '0.0'}h</span>.
                            </p>
                            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                                <div className="bg-white h-full transition-all" style={{ width: `${Math.min(100, ((stats?.audit?.avgDailyHours || 0) / 7.0) * 100)}%` }}></div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-500 to-purple-700 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 transform scale-125 group-hover:scale-110 transition-transform">
                                <Zap size={80} />
                            </div>
                            <h3 className="text-lg font-black mb-1 flex items-center gap-2">
                                <Zap size={18} /> Task Velocity
                            </h3>
                            <p className="text-xs font-medium text-indigo-100 leading-relaxed mb-4">
                                Completed <span className="font-extrabold text-white">{stats?.stats?.completedTasks ?? 0}</span> tasks on time. On-time delivery rate is <span className="font-extrabold text-white">{stats?.stats?.onTimeRate ?? 0}%</span>.
                            </p>
                            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                                <div className="bg-white h-full transition-all" style={{ width: `${stats?.stats?.onTimeRate ?? 0}%` }}></div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 transform scale-125 group-hover:scale-110 transition-transform">
                                <Activity size={80} />
                            </div>
                            <h3 className="text-lg font-black mb-1 flex items-center gap-2">
                                <Activity size={18} /> Consistency Streak
                            </h3>
                            <p className="text-xs font-medium text-amber-100 leading-relaxed mb-4">
                                You are on a <span className="font-extrabold text-white">{stats?.achievements?.loginStreak ?? 0}-day streak</span>! Punctuality score is <span className="font-extrabold text-white">{stats?.audit?.punctualityRate ?? 100}%</span>.
                            </p>
                            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                                <div className="bg-white h-full transition-all" style={{ width: `${stats?.audit?.punctualityRate ?? 100}%` }}></div>
                            </div>
                        </div>
                    </motion.div>

                    {/* --- OFFICE AUDIT SUMMARY ROW --- */}
                    <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        <motion.div variants={itemVariants}>
                            <StatCard
                                title="Punctuality Score"
                                value={stats?.audit?.punctualityRate ?? 100}
                                unit="%"
                                icon={<UserCheck size={28} />}
                                subtitle="On-time check-in rate"
                            />
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <StatCard
                                title="Daily Avg Hours"
                                value={stats?.audit?.avgDailyHours ?? '0.0'}
                                unit="h/day"
                                icon={<Clock size={28} />}
                                subtitle="Average logged daily duration"
                            />
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <StatCard
                                title="Break Time Logged"
                                value={stats?.audit?.totalBreakHours ?? '0.0'}
                                unit="h"
                                icon={<Briefcase size={28} />}
                                subtitle="Logged break duration"
                            />
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <StatCard
                                title="Canvas Projects"
                                value={stats?.audit?.projectCount ?? 0}
                                icon={<BarChart2 size={28} />}
                                subtitle={`${stats?.audit?.canvasTaskCount ?? 0} canvas tasks authored`}
                            />
                        </motion.div>
                    </motion.div>

                    {/* --- TASK PRODUCTIVITY HUB --- */}
                    <motion.div variants={itemVariants} className="mb-6">
                        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                            <span className="w-10 h-10 bg-emerald-100 text-emerald-600 flex items-center justify-center rounded-[1rem]"><List size={22} /></span>
                            Task Productivity Hub
                        </h2>
                    </motion.div>

                    {/* Task Stats Row */}
                    <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <motion.div variants={itemVariants}><StatCard title="Total Tasks" value={stats.stats?.totalTasks ?? 0} icon={<List size={28} />} /></motion.div>
                        <motion.div variants={itemVariants}><StatCard title="Completed" value={stats.stats?.completedTasks ?? 0} icon={<CheckCircle size={28} />} /></motion.div>
                        <motion.div variants={itemVariants}><StatCard title="Overdue" value={stats.stats?.overdueTasks ?? 0} icon={<AlertTriangle size={28} />} /></motion.div>
                        <motion.div variants={itemVariants}><StatCard title="On-Time Rate" value={stats.stats?.onTimeRate ?? 0} unit="%" icon={<Award size={28} />} /></motion.div>
                    </motion.div>

                    {/* Task Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
                        <motion.div variants={itemVariants} className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col hover:shadow-lg transition-shadow duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><TrendingUp size={20} className="text-emerald-500" /> Weekly Task Velocity</h3>
                            </div>
                            <div className="relative flex-grow min-h-[300px] w-full">
                                <Line options={lineOptions} data={tasksChartData} />
                            </div>
                        </motion.div>
                        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col hover:shadow-lg transition-shadow duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Star size={20} className="text-emerald-500" /> Task Breakdown</h3>
                            </div>
                            <div className="relative flex-grow min-h-[300px] flex items-center justify-center">
                                <Doughnut data={taskStatusChartData} options={doughnutOptions} />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center mt-[-30px]">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                                        <p className="text-4xl font-black text-slate-800 tracking-tight">
                                            {stats.stats?.totalTasks ?? 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* --- ATTENDANCE & PRESENCE HUB --- */}
                    <motion.div variants={itemVariants} className="mt-16 mb-6">
                        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                            <span className="w-10 h-10 bg-indigo-100 text-indigo-600 flex items-center justify-center rounded-[1rem]"><Clock size={22} /></span>
                            Attendance & Presence
                        </h2>
                    </motion.div>

                    {/* Attendance Stats Row */}
                    <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <motion.div variants={itemVariants}><StatCard title="Office Hours" value={(stats.locationData?.officeHours ?? 0).toFixed(1)} unit="h" icon={<Briefcase size={28} />} /></motion.div>
                        <motion.div variants={itemVariants}><StatCard title="Remote Hours" value={(stats.locationData?.homeHours ?? 0).toFixed(1)} unit="h" icon={<Home size={28} />} /></motion.div>
                        <motion.div variants={itemVariants}><StatCard title="Total Logged" value={((stats.locationData?.officeHours ?? 0) + (stats.locationData?.homeHours ?? 0)).toFixed(1)} unit="h" icon={<Clock size={28} />} /></motion.div>
                        <motion.div variants={itemVariants}><StatCard title="Login Streak" value={stats.achievements?.loginStreak ?? 0} unit=" days" icon={<Zap size={28} />} /></motion.div>
                    </motion.div>

                    {/* Attendance Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pb-10">
                        {/* Bar Chart (Span 2) */}
                        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col hover:shadow-lg transition-shadow duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Clock size={20} className="text-blue-500" /> Monthly Trend</h3>
                            </div>
                            <div className="relative flex-grow min-h-[300px] w-full">
                                <Bar options={lineOptions} data={hoursChartData} />
                            </div>
                        </motion.div>

                        {/* Location Doughnut (Span 1) */}
                        <motion.div variants={itemVariants} className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col hover:shadow-lg transition-shadow duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Home size={20} className="text-indigo-500" /> Work Env</h3>
                            </div>
                            <div className="relative flex-grow min-h-[300px] flex items-center justify-center">
                                <Doughnut data={locationChartData} options={{ ...doughnutOptions, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } }} />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center mt-[-30px]">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged</p>
                                        <p className="text-2xl font-black text-slate-800 tracking-tight">
                                            {((stats.locationData?.officeHours || 0) + (stats.locationData?.homeHours || 0)).toFixed(0)}h
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Achievements Space (Span 1) */}
                        <motion.div variants={itemVariants} className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col hover:shadow-lg transition-shadow duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Award size={20} className="text-amber-500" /> Trophy Rank</h3>
                            </div>
                            <div className="space-y-4 overflow-y-auto pr-2 flex-grow custom-scrollbar">
                                <AchievementCard
                                    title="Consistency"
                                    description="Consecutive syncs"
                                    achieved={(stats?.achievements?.loginStreak ?? 0) > 0}
                                    value={stats?.achievements?.loginStreak ?? 0}
                                    icon={<GitCommit size={20} />}
                                />
                                <AchievementCard
                                    title="On Fire"
                                    description="5+ Tasks/week."
                                    achieved={stats?.achievements?.onFire ?? false}
                                    icon={<Zap size={20} />}
                                />
                                <AchievementCard
                                    title="Veteran"
                                    description="50+ Tasks total."
                                    achieved={stats?.achievements?.taskMaster ?? false}
                                    icon={<Star size={20} />}
                                />
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}

export async function getServerSideProps(context) {
    const jwt = require('jsonwebtoken');
    const dbConnect = require('../../lib/dbConnect').default;
    const User = require('../../models/User').default;

    await dbConnect();
    const { token } = context.req.cookies;
    if (!token) {
        return { redirect: { destination: '/login', permanent: false } };
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password').lean();

        if (!user) {
            return { redirect: { destination: '/login', permanent: false } };
        }

        return { props: { user: JSON.parse(JSON.stringify(user)) } };
    } catch (error) {
        console.error("getServerSideProps Error:", error);
        return { redirect: { destination: '/login', permanent: false } };
    }
}
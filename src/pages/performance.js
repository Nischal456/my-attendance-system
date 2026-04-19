import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Award, ArrowLeft, Clock, Zap, Star, GitCommit, Home, Briefcase, TrendingUp, AlertCircle, Loader, List, AlertTriangle } from 'react-feather';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement } from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement);

// --- Sub-Components ---

const StatCard = ({ title, value, icon, unit = '' }) => (
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
                // Fetch directly from the new optimized endpoint
                const res = await fetch('/api/users/performance-stats');
                
                if (!res.ok) {
                    throw new Error("Could not load performance data.");
                }
                
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
        // Use data directly if it's already a label string, or format date
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
                <Link href="/dashboard" className="block w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95">
                    Return to Dashboard
                </Link>
            </div>
        </div>
    );

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
                    <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors bg-white px-4 py-2.5 rounded-2xl border border-slate-100 hover:border-slate-300 shadow-sm group">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
                        Dashboard
                    </Link>
                    
                    <div className="flex items-center gap-3 pl-4 border-l border-slate-200 h-10">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-800 leading-tight">{user.name}</p>
                            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{user.role}</p>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-400 rounded-full blur-sm opacity-20"></div>
                            <Image src={user.avatar || '/default-avatar.png'} width={40} height={40} className="rounded-full object-cover border-2 border-white shadow-sm relative z-10" alt="User Avatar" />
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
                    {/* Premium Profile Hero Banner */}
                    <motion.div variants={itemVariants} className="mb-12 bg-white p-8 rounded-[2.5rem] shadow-md border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-50 to-emerald-50 rounded-bl-[10rem] opacity-70 z-0 pointer-events-none"></div>
                        
                        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                            {/* Dynamic Avatar with Level Badge */}
                            <div className="relative w-32 h-32 shrink-0 group">
                                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-[2rem] group-hover:opacity-40 transition-opacity duration-500"></div>
                                <div className="absolute -bottom-3 -right-3 bg-slate-900 text-white font-black text-sm w-11 h-11 flex items-center justify-center rounded-xl shadow-xl z-20 ring-4 ring-white border-b-2 border-slate-700 transform group-hover:-rotate-12 transition-transform duration-300">
                                    L{stats?.gamification?.currentLevel ?? 1}
                                </div>
                                <Image src={user.avatar || '/default-avatar.png'} fill className="rounded-[1.5rem] object-cover ring-4 ring-white shadow-sm transform -rotate-3 group-hover:rotate-0 transition-all duration-300 z-10" alt={user.name} />
                            </div>

                            {/* Identity & Progress */}
                            <div className="text-center md:text-left flex-1 w-full max-w-xl">
                                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-3">{user.name}</h1>
                                
                                <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mb-6">
                                    <span className="bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-slate-200">
                                        {user.role}
                                    </span>
                                    {stats?.gamification && (
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-white shadow-sm ${stats.gamification.personaColor}`}>
                                            {stats.gamification.persona}
                                        </span>
                                    )}
                                </div>

                                {/* Gamified XP Progress Bar */}
                                {stats?.gamification && (
                                    <div className="w-full">
                                        <div className="flex justify-between items-end mb-2 px-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Level {stats.gamification.currentLevel} Progress</span>
                                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                                                +{stats.gamification.xpToNextLevel} XP to Next Level
                                            </span>
                                        </div>
                                        <div className="h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/60 p-0.5">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${stats.gamification.levelProgress}%` }}
                                                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                                                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Total Impact Score */}
                            <div className="hidden lg:flex flex-col items-end pr-4 pl-8 border-l border-slate-100">
                               <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Total Impact Score</p>
                               <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-emerald-500 mb-4 tracking-tighter">
                                   {stats?.gamification?.xp?.toLocaleString() || 0} <span className="text-lg text-slate-300 font-bold tracking-normal">XP</span>
                               </p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                   <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> System Active
                               </p>
                            </div>
                        </div>
                    </motion.div>
                    
                    {/* --- TASK PRODUCTIVITY HUB --- */}
                    <motion.div variants={itemVariants} className="mt-12 mb-6">
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
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><TrendingUp size={20} className="text-emerald-500"/> Weekly Task Velocity</h3>
                            </div>
                            <div className="relative flex-grow min-h-[300px] w-full">
                                <Line options={lineOptions} data={tasksChartData} />
                            </div>
                        </motion.div>
                        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col hover:shadow-lg transition-shadow duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Star size={20} className="text-emerald-500"/> Task Breakdown</h3>
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
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Clock size={20} className="text-blue-500"/> Monthly Trend</h3>
                            </div>
                            <div className="relative flex-grow min-h-[300px] w-full">
                                <Bar options={lineOptions} data={hoursChartData} />
                            </div>
                        </motion.div>

                        {/* Location Doughnut (Span 1) */}
                        <motion.div variants={itemVariants} className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col hover:shadow-lg transition-shadow duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Home size={20} className="text-indigo-500"/> Work Env</h3>
                            </div>
                            <div className="relative flex-grow min-h-[300px] flex items-center justify-center">
                                <Doughnut data={locationChartData} options={{...doughnutOptions, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } }}} />
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
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Award size={20} className="text-amber-500"/> Trophy Rank</h3>
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

// Unchanged Server Side Props (Keep this for Auth)
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
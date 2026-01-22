import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Award, ArrowLeft, Clock, Zap, Star, GitCommit, Home, Briefcase, TrendingUp, AlertCircle, Loader } from 'react-feather';
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
                hoverOffset: 10,
                borderWidth: 0,
                borderRadius: 5
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
                    <motion.div variants={itemVariants} className="mb-10">
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Performance Overview</h1>
                        <p className="text-slate-500 mt-2 text-lg font-medium">Track your productivity, attendance, and achievements.</p>
                    </motion.div>
                    
                    {/* Top Stats Row */}
                    <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <motion.div variants={itemVariants}><StatCard title="Total Tasks" value={stats.stats?.totalCompleted ?? 0} icon={<CheckCircle size={28} />} /></motion.div>
                        <motion.div variants={itemVariants}><StatCard title="On-Time Rate" value={stats.stats?.onTimeRate ?? 0} unit="%" icon={<Award size={28} />} /></motion.div>
                        <motion.div variants={itemVariants}><StatCard title="Office Hours" value={(stats.locationData?.officeHours ?? 0).toFixed(1)} unit="h" icon={<Briefcase size={28} />} /></motion.div>
                        <motion.div variants={itemVariants}><StatCard title="Remote Hours" value={(stats.locationData?.homeHours ?? 0).toFixed(1)} unit="h" icon={<Home size={28} />} /></motion.div>
                    </motion.div>

                    {/* --- Row 1: Charts --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
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
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Home size={20} className="text-indigo-500"/> Work Location</h3>
                            </div>
                            <div className="relative flex-grow min-h-[300px] flex items-center justify-center">
                                <Doughnut data={locationChartData} options={doughnutOptions} />
                                {/* Center Text Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center mt-[-30px]"> 
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</p>
                                        <p className="text-3xl font-black text-slate-800 tracking-tight">
                                            {((stats.locationData?.officeHours || 0) + (stats.locationData?.homeHours || 0)).toFixed(0)}h
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* --- Row 2: Monthly Hours & Achievements --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 pb-10">
                        <motion.div variants={itemVariants} className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col hover:shadow-lg transition-shadow duration-300">
                             <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Clock size={20} className="text-blue-500"/> Monthly Hours Trend</h3>
                            </div>
                            <div className="relative flex-grow min-h-[300px] w-full">
                                <Bar options={lineOptions} data={hoursChartData} />
                            </div>
                        </motion.div>

                         <motion.div variants={itemVariants} className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col hover:shadow-lg transition-shadow duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Award size={20} className="text-amber-500"/> Achievements</h3>
                            </div>
                            <div className="space-y-4 overflow-y-auto pr-2 max-h-[350px] custom-scrollbar">
                                <AchievementCard 
                                    title="Consistency King" 
                                    description="Logged in on consecutive workdays." 
                                    achieved={(stats?.achievements?.loginStreak ?? 0) > 0} 
                                    value={stats?.achievements?.loginStreak ?? 0} 
                                    icon={<GitCommit size={24} />} 
                                />
                                <AchievementCard 
                                    title="Productivity Master" 
                                    description="Completed 5+ tasks in a single week." 
                                    achieved={stats?.achievements?.onFire ?? false} 
                                    icon={<Zap size={24} />} 
                                />
                                <AchievementCard 
                                    title="Veteran" 
                                    description="Completed 50+ tasks in total." 
                                    achieved={stats?.achievements?.taskMaster ?? false} 
                                    icon={<Star size={24} />} 
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
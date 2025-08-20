import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Award, ArrowLeft, Clock, Zap, Star, GitCommit, Home, Briefcase } from 'react-feather';
import toast, { Toaster } from 'react-hot-toast';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement } from 'chart.js';
import { motion } from 'framer-motion';

// Register Chart.js components, now including ArcElement for the Doughnut chart
Chart.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement);

// --- Sub-Components (Unchanged) ---

const StatCard = ({ title, value, icon, unit = '' }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 h-full">
        <div className="flex items-center gap-4">
            <div className="bg-green-100 text-green-600 p-3 rounded-full">{icon}</div>
            <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <p className="text-3xl font-bold text-slate-800">{value}<span className="text-xl font-medium text-slate-500">{unit}</span></p>
            </div>
        </div>
    </div>
);

const AchievementCard = ({ title, description, achieved, value, icon }) => (
    <div className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${achieved ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${achieved ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>{icon}</div>
        <div>
            <h4 className={`font-bold ${achieved ? 'text-green-800' : 'text-slate-700'}`}>
                {title} {achieved && value > 0 ? <span className="font-semibold">{`(${value} ${value > 1 ? 'days' : 'day'})`}</span> : ''}
            </h4>
            <p className="text-sm text-slate-500">{description}</p>
        </div>
    </div>
);

// Updated skeleton to reflect the new 4-card and 2x2 chart layout
const PerformancePageSkeleton = () => (
    <div className="min-h-screen bg-slate-100 animate-pulse">
        <header className="bg-white/80 h-20 border-b p-4 lg:px-10">
              <div className="max-w-screen-xl mx-auto flex justify-between items-center h-full">
                  <div className="h-6 bg-slate-200 rounded-lg w-48"></div>
                  <div className="flex items-center gap-2">
                      <div className="h-9 w-9 bg-slate-200 rounded-full"></div>
                      <div className="h-5 bg-slate-200 rounded-lg w-24 hidden sm:block"></div>
                  </div>
              </div>
        </header>
        <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <div className="h-10 bg-slate-200 rounded-lg w-1/3 mb-4"></div>
            <div className="h-6 bg-slate-200 rounded-lg w-1/2 mb-10"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
                <div className="h-32 bg-white rounded-2xl shadow-sm"></div>
                <div className="h-32 bg-white rounded-2xl shadow-sm"></div>
                <div className="h-32 bg-white rounded-2xl shadow-sm"></div>
                <div className="h-32 bg-white rounded-2xl shadow-sm"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 h-96 bg-white rounded-2xl shadow-sm"></div>
                <div className="lg:col-span-2 h-96 bg-white rounded-2xl shadow-sm"></div>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-8">
                <div className="lg:col-span-3 h-96 bg-white rounded-2xl shadow-sm"></div>
                <div className="lg:col-span-2 h-96 bg-white rounded-2xl shadow-sm"></div>
            </div>
        </main>
    </div>
);


export default function PerformancePage({ user }) {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/user/performance-stats');
                if (!res.ok) throw new Error("Could not load performance data.");
                const data = await res.json();
                setStats(data);
            } catch (error) {
                toast.error(error.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const hoursChartData = useMemo(() => {
        // Safe check for data existence
        if (!stats?.hoursChartData) return { labels: [], datasets: [] };
        const labels = stats.hoursChartData.map(d => new Date(d.month + '-02').toLocaleString('default', { month: 'short', year: 'numeric' }));
        const data = stats.hoursChartData.map(d => d.hours);
        return {
            labels,
            datasets: [{ label: 'Work Hours', data, backgroundColor: 'rgba(34, 197, 94, 0.6)', borderColor: 'rgba(34, 197, 94, 1)', borderWidth: 1, borderRadius: 4 }]
        };
    }, [stats]);
    
    const tasksChartData = useMemo(() => {
        // Safe check for data existence
        if (!stats?.tasksChartData) return { labels: [], datasets: [] };
        const labels = stats.tasksChartData.map(d => d.week);
        const data = stats.tasksChartData.map(d => d.count);
        return {
            labels,
            datasets: [{
                label: 'Tasks Completed',
                data,
                fill: 'start',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderColor: 'rgba(34, 197, 94, 1)',
                tension: 0.4,
                pointBackgroundColor: 'rgba(34, 197, 94, 1)',
                pointBorderColor: '#fff',
                pointHoverRadius: 6,
                pointRadius: 4,
            }]
        };
    }, [stats]);

    const locationChartData = useMemo(() => {
        // Safe check for data existence
        if (!stats?.locationData) return { labels: [], datasets: [] };
        const data = [stats.locationData.officeHours, stats.locationData.homeHours];
        return {
            labels: ['Office', 'Home'],
            datasets: [{
                data,
                backgroundColor: ['rgba(79, 70, 229, 0.7)', 'rgba(34, 197, 94, 0.7)'],
                borderColor: ['rgba(79, 70, 229, 1)', 'rgba(34, 197, 94, 1)'],
                borderWidth: 1,
            }]
        };
    }, [stats]);


    const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };
    const doughnutChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }}};

    if (isLoading) return <PerformancePageSkeleton />;
    if (!stats || !stats.success) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 text-slate-600">
            <h2 className="text-2xl font-semibold mb-4">Oops! Something went wrong.</h2>
            <p className="mb-6">We couldn't load your performance data.</p>
            <Link href="/dashboard" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Go to Dashboard
            </Link>
        </div>
    );

    return (
        <>
            <Toaster position="top-center" />
            <div className="min-h-screen bg-slate-100 font-sans">
                <header className="bg-white/80 backdrop-blur-xl border-b p-4 lg:px-10 sticky top-0 z-40">
                    <div className="max-w-screen-xl mx-auto flex justify-between items-center">
                        <Link href="/dashboard" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold">
                            <ArrowLeft size={20} />
                            Back to Dashboard
                        </Link>
                        <div className="flex items-center gap-2">
                            <Image src={user.avatar} width={36} height={36} className="rounded-full object-cover" alt="User Avatar" />
                            <span className="font-semibold text-sm text-slate-700 hidden sm:block">{user.name}</span>
                        </div>
                    </div>
                </header>
                <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 className="text-4xl font-bold text-slate-800">My Performance</h1>
                        <p className="text-slate-500 mt-2">An overview of your contributions and work habits over time.</p>
                    </motion.div>
                    
                    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
                        {/* Safely access nested data with default values */}
                        <motion.div variants={{hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 }}}><StatCard title="Total Tasks Completed" value={stats?.stats?.totalCompleted ?? 0} icon={<CheckCircle size={24} />} /></motion.div>
                        <motion.div variants={{hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 }}}><StatCard title="On-Time Completion" value={stats?.stats?.onTimeRate ?? 0} unit="%" icon={<Award size={24} />} /></motion.div>
                        <motion.div variants={{hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 }}}><StatCard title="Hours from Office" value={(stats?.locationData?.officeHours ?? 0).toFixed(1)} unit=" hrs" icon={<Briefcase size={24} />} /></motion.div>
                        <motion.div variants={{hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 }}}><StatCard title="Hours from Home" value={(stats?.locationData?.homeHours ?? 0).toFixed(1)} unit=" hrs" icon={<Home size={24} />} /></motion.div>
                    </motion.div>

                    {/* --- New Layout: First Row --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
                            <h3 className="text-lg font-bold text-slate-700 mb-4">Weekly Task Completion</h3>
                            <div className="relative h-80"><Line options={chartOptions} data={tasksChartData} /></div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
                            <h3 className="text-lg font-bold text-slate-700 mb-4">Work Location Breakdown</h3>
                            <div className="relative h-80"><Doughnut data={locationChartData} options={doughnutChartOptions} /></div>
                        </motion.div>
                    </div>

                    {/* --- New Layout: Second Row --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-8">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
                             <h3 className="text-lg font-bold text-slate-700 mb-4">Monthly Work Hours</h3>
                            <div className="relative h-96"><Bar options={chartOptions} data={hoursChartData} /></div>
                        </motion.div>
                         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
                            <h3 className="text-lg font-bold text-slate-700 mb-4">Achievements</h3>
                            <div className="space-y-4">
                                {/* Safely access nested achievement data with default values */}
                                <AchievementCard title="Daily Check-in Streak" description="Log in on consecutive workdays." achieved={(stats?.achievements?.loginStreak ?? 0) > 0} value={stats?.achievements?.loginStreak ?? 0} icon={<GitCommit size={24} />} />
                                <AchievementCard title="On Fire!" description="Complete 5+ tasks in a single week." achieved={stats?.achievements?.onFire ?? false} icon={<Zap size={24} />} />
                                <AchievementCard title="Task Master" description="Complete 50+ tasks in total." achieved={stats?.achievements?.taskMaster ?? false} icon={<Star size={24} />} />
                            </div>
                        </motion.div>
                    </div>
                </main>
            </div>
        </>
    );
}

// Unchanged
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
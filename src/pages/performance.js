import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, TrendingUp, CheckCircle, BarChart2, Award, ArrowLeft, Clock, Zap, Star, GitCommit } from 'react-feather';
import { ChevronDown } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { Bar, Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { motion } from 'framer-motion';

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// --- Sub-Components ---

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
                <div className="h-32 bg-white rounded-2xl shadow-sm"></div>
                <div className="h-32 bg-white rounded-2xl shadow-sm"></div>
                <div className="h-32 bg-white rounded-2xl shadow-sm"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 h-96 bg-white rounded-2xl shadow-sm"></div>
                <div className="lg:col-span-2 h-96 bg-white rounded-2xl shadow-sm"></div>
            </div>
             <div className="h-96 bg-white rounded-2xl shadow-sm mt-8"></div>
        </main>
    </div>
);


export default function PerformancePage({ user }) {
    const router = useRouter();
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
        if (!stats) return { labels: [], datasets: [] };
        const labels = stats.hoursChartData.map(d => new Date(d.month + '-02').toLocaleString('default', { month: 'short', year: 'numeric' }));
        const data = stats.hoursChartData.map(d => d.hours);
        return {
            labels,
            datasets: [{ label: 'Work Hours', data, backgroundColor: 'rgba(34, 197, 94, 0.6)', borderColor: 'rgba(34, 197, 94, 1)', borderWidth: 1, borderRadius: 4 }]
        };
    }, [stats]);
    
    const tasksChartData = useMemo(() => {
        if (!stats) return { labels: [], datasets: [] };
        const labels = stats.tasksChartData.map(d => d.week);
        const data = stats.tasksChartData.map(d => d.count);
        return {
    labels,
    datasets: [{
        label: 'Tasks Completed',
        data,
        fill: 'start',
        backgroundColor: 'rgba(34, 197, 94, 0.1)', // light green background
        borderColor: 'rgba(34, 197, 94, 1)',       // green border
        tension: 0.4,
        pointBackgroundColor: 'rgba(34, 197, 94, 1)', // green points
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
        pointRadius: 4,
    }]
};

    }, [stats]);

    const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

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
                    
                    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
                        <motion.div variants={{hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 }}}><StatCard title="Total Tasks Completed" value={stats.stats.totalCompleted} icon={<CheckCircle size={24} />} /></motion.div>
                        <motion.div variants={{hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 }}}><StatCard title="On-Time Completion" value={stats.stats.onTimeRate} unit="%" icon={<Award size={24} />} /></motion.div>
                        <motion.div variants={{hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 }}}><StatCard title="Total Hours Logged" value={stats.hoursChartData.reduce((acc, d) => acc + d.hours, 0).toFixed(1)} unit=" hrs" icon={<Clock size={24} />} /></motion.div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
                             <h3 className="text-lg font-bold text-green-600 mb-4">Weekly Task Completion</h3>
                            <div className="relative h-80"><Line options={chartOptions} data={tasksChartData} /></div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
                            <h3 className="text-lg font-bold text-slate-700 mb-4">Achievements</h3>
                            <div className="space-y-4">
                               <AchievementCard title="Daily Check-in Streak" description="Log in on consecutive workdays." achieved={stats.achievements.loginStreak > 0} value={stats.achievements.loginStreak} icon={<GitCommit size={24} />} />
                               <AchievementCard title="On Fire!" description="Complete 5+ tasks in a single week." achieved={stats.achievements.onFire} icon={<Zap size={24} />} />
                               <AchievementCard title="Task Master" description="Complete 50+ tasks in total." achieved={stats.achievements.taskMaster} icon={<Star size={24} />} />
                            </div>
                        </motion.div>
                    </div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 mt-8">
                         <h3 className="text-lg font-bold text-slate-700 mb-4">Monthly Work Hours</h3>
                        <div className="relative h-96"><Bar options={chartOptions} data={hoursChartData} /></div>
                    </motion.div>
                </main>
            </div>
        </>
    );
}

export async function getServerSideProps(context) {
    const jwt = require('jsonwebtoken');
    // Using require for dbConnect and models to avoid ESM/CJS issues in getServerSideProps
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
            // In case the user was deleted but token is still valid
            return { redirect: { destination: '/login', permanent: false } };
        }
        
        // Serialize the user object to pass as a prop
        return { props: { user: JSON.parse(JSON.stringify(user)) } };
    } catch (error) {
        // Token is invalid or expired
        console.error("getServerSideProps Error:", error);
        return { redirect: { destination: '/login', permanent: false } };
    }
}
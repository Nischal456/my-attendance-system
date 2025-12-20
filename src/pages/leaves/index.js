import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Home, Activity, FilePlus, FileText, Calendar } from 'react-feather';
import toast from 'react-hot-toast'; // Using global Toaster
import { motion } from 'framer-motion';
import { Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
Chart.register(ArcElement, Tooltip, Legend);

// --- Donut Chart Component ---
const DonutChart = ({ total, remaining, color }) => {
    const taken = total - remaining;
    const percentage = Math.round((remaining / total) * 100);

    const data = {
        labels: ['Remaining', 'Taken'],
        datasets: [
            {
                data: [remaining, taken],
                backgroundColor: [
                    color === 'text-green-500' ? '#10b981' : '#f59e0b', // Green or Amber
                    '#e2e8f0', // Slate-200 for empty part
                ],
                borderWidth: 0,
                cutout: '75%', // Thinner ring for premium look
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false }, // Disable tooltips for cleaner look
        },
        animation: {
            animateScale: true,
            animateRotate: true,
            duration: 1500, // Smooth 1.5s animation
            easing: 'easeOutQuart'
        }
    };

    return (
        <div className="relative w-28 h-28 sm:w-32 sm:h-32">
            <Doughnut data={data} options={options} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className={`text-xl font-bold ${color}`}>{percentage}%</span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Left</span>
            </div>
        </div>
    );
};

// --- Skeleton Loader ---
const LeaveHubSkeleton = () => (
    <div className="min-h-screen bg-slate-50 font-sans animate-pulse">
      <header className="bg-white/80 backdrop-blur-xl shadow-sm sticky top-0 z-10 h-24">
        <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="h-4 w-32 bg-slate-200 rounded-md mb-3"></div>
            <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
        </div>
      </header>
      <main className="py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200/80 mb-10">
            <div className="h-6 w-64 bg-slate-200 rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-center gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-28 h-28 bg-slate-200 rounded-full shrink-0"></div>
                    <div className="flex-1 space-y-3">
                        <div className="h-5 w-32 bg-slate-200 rounded-md"></div>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                             <div className="h-10 w-full bg-slate-200 rounded-lg"></div>
                             <div className="h-10 w-full bg-slate-200 rounded-lg"></div>
                        </div>
                    </div>
                  </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="h-32 bg-slate-200 rounded-2xl"></div>
            <div className="h-32 bg-white rounded-2xl border border-slate-200"></div>
          </div>
        </div>
      </main>
    </div>
);

export default function MyLeaveHub() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
        const res = await fetch('/api/leaves/balance');
        const result = await res.json();
        if (!res.ok) throw new Error(result.message);
        setData(result);
    } catch (err) {
        toast.error(err.message || 'Failed to load leave data.');
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <LeaveHubSkeleton />;
  }

  if (!data) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-600">
              <p className="mb-4 text-lg font-semibold">Unable to load leave data.</p>
              <Link href="/dashboard" className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors">Return to Dashboard</Link>
          </div>
      );
  }

  const { balance, takenLeave } = data;
  
  // Safe defaults if data is missing
  const sickAvail = balance?.sickLeaveAvailable || 12;
  const sickTaken = takenLeave?.sick || 0;
  const sickLeaveRemaining = Math.max(0, sickAvail - sickTaken);

  const homeAvail = balance?.homeLeaveAvailable || 18;
  const homeTaken = takenLeave?.home || 0;
  const homeLeaveRemaining = Math.max(0, homeAvail - homeTaken);

  // Animation variants
  const containerVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-emerald-100 selection:text-emerald-800">
      
      {/* Background Atmosphere */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-100/30 rounded-full blur-[120px] opacity-60"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100/30 rounded-full blur-[120px] opacity-60"></div>
      </div>

      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40 transition-all">
        <div className="max-w-5xl mx-auto py-5 px-4 sm:px-6 lg:px-8">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors bg-white px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 shadow-sm mb-4 group">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
            </Link>
          <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Leave Portal</h1>
                <p className="text-slate-500 mt-1 font-medium">Manage your time off and track balances.</p>
              </div>
              <div className="hidden sm:block p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400">
                  <Calendar size={24} />
              </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 py-10">
        <motion.div 
            className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
          {/* --- Leave Balance Section --- */}
          <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2.5rem] shadow-lg shadow-slate-200/50 border border-slate-100 mb-10 overflow-hidden relative">
             <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-slate-50 to-emerald-50/50 rounded-full blur-3xl -z-10 pointer-events-none"></div>
            
            <h2 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                Leave Balance <span className="text-slate-400 font-normal text-base ml-1">{new Date().getFullYear()}</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Sick Leave Card */}
              <div className="flex items-center gap-6 p-6 rounded-3xl bg-slate-50/50 border border-slate-100 hover:border-emerald-200 transition-colors group">
                <DonutChart total={sickAvail} remaining={sickLeaveRemaining} color="text-green-500" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 mb-4">
                      <div className="p-2 bg-white rounded-xl shadow-sm text-green-600 group-hover:text-green-700 transition-colors"><Activity size={18} /></div>
                      Sick Leave
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total</p>
                      <p className="text-xl font-bold text-slate-700">{sickAvail}</p>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Used</p>
                      <p className="text-xl font-bold text-slate-700">{sickTaken}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Home Leave Card */}
              <div className="flex items-center gap-6 p-6 rounded-3xl bg-slate-50/50 border border-slate-100 hover:border-indigo-200 transition-colors group">
                <DonutChart total={homeAvail} remaining={homeLeaveRemaining} color="text-indigo-500" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 mb-4">
                      <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-600 group-hover:text-indigo-700 transition-colors"><Home size={18} /></div>
                      Home Leave
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total</p>
                      <p className="text-xl font-bold text-slate-700">{homeAvail}</p>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Used</p>
                      <p className="text-xl font-bold text-slate-700">{homeTaken}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* --- Actions Section --- */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Link href="/leaves/apply" className="group block relative overflow-hidden bg-emerald-600 p-8 rounded-[2rem] shadow-xl shadow-emerald-200 hover:shadow-2xl hover:shadow-emerald-300 transition-all duration-300 transform hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
                <div className="relative z-10 flex items-center gap-5">
                  <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/10 group-hover:rotate-12 transition-transform duration-300">
                    <FilePlus className="text-white" size={32} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xl mb-1">Apply for Leave</h3>
                    <p className="text-sm text-emerald-100 font-medium">Submit a new request instantly</p>
                  </div>
                </div>
            </Link>

            <Link href="/leaves/report" className="group block bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center gap-5">
                  <div className="bg-slate-100 group-hover:bg-white p-4 rounded-2xl transition-colors border border-slate-200 group-hover:border-emerald-100 shadow-sm">
                    <FileText className="text-slate-500 group-hover:text-emerald-600 transition-colors" size={32} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-xl mb-1 group-hover:text-emerald-700 transition-colors">History & Status</h3>
                    <p className="text-sm text-slate-500 group-hover:text-slate-600">Track all your past requests</p>
                  </div>
                </div>
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

// Server Side Props (Unchanged logic, just verified)
export async function getServerSideProps(context) {
    const jwt = require('jsonwebtoken');
    const dbConnect = require('../../../lib/dbConnect').default;
    
    await dbConnect();
    const { token } = context.req.cookies;
    if (!token) { return { redirect: { destination: '/login', permanent: false } }; }

    try {
        jwt.verify(token, process.env.JWT_SECRET);
        // We verify the token is valid, data fetching happens client-side for better UX with skeletons
        return { props: {} }; 
    } catch (error) {
        console.error("Leave Hub Auth Error:", error);
        // Clear invalid token
        context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        return { redirect: { destination: '/login', permanent: false } };
    }
}
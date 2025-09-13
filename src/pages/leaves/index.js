import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sun, Home, Activity, FilePlus, FileText } from 'react-feather';
import toast, { Toaster } from 'react-hot-toast';

const DonutChart = ({ base, total, remaining, color }) => { /* ... Unchanged ... */ };

// ✅ NEW: Professional Skeleton Loader
const LeaveHubSkeleton = () => (
    <div className="min-h-screen bg-slate-50 font-sans animate-pulse">
      <header className="bg-white/80 backdrop-blur-xl shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto py-5 px-4 sm:px-6 lg:px-8">
            <div className="h-5 w-48 bg-slate-200 rounded-md mb-2"></div>
            <div className="h-9 w-1/3 bg-slate-200 rounded-lg"></div>
            <div className="h-5 w-1/2 bg-slate-200 rounded-md mt-2"></div>
        </div>
      </header>
      <main className="py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200/80 mb-10">
            <div className="h-7 w-1/2 bg-slate-200 rounded-lg mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-center gap-6 p-6 rounded-xl bg-slate-50/70 border">
                <div className="w-32 h-32 bg-slate-200 rounded-full"></div>
                <div className="flex-1 space-y-4">
                    <div className="h-6 w-3/4 bg-slate-200 rounded-md"></div>
                    <div className="h-10 w-full bg-slate-200 rounded-md"></div>
                </div>
              </div>
              <div className="flex items-center gap-6 p-6 rounded-xl bg-slate-50/70 border">
                <div className="w-32 h-32 bg-slate-200 rounded-full"></div>
                <div className="flex-1 space-y-4">
                    <div className="h-6 w-3/4 bg-slate-200 rounded-md"></div>
                    <div className="h-10 w-full bg-slate-200 rounded-md"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="h-24 bg-slate-200 rounded-xl"></div>
            <div className="h-24 bg-white rounded-xl shadow-sm border"></div>
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
    return <div>Error loading data. Please return to the dashboard.</div>;
  }

  const { balance, takenLeave } = data;
  const sickLeaveRemaining = balance.sickLeaveAvailable - takenLeave.sick;
  const homeLeaveRemaining = balance.homeLeaveAvailable - takenLeave.home;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Toaster position="top-center" />
      <header className="bg-white/80 backdrop-blur-xl shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto py-5 px-4 sm:px-6 lg:px-8">
            <Link href="/dashboard" legacyBehavior>
                <a className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 mb-2 transition-colors">
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </a>
            </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Leave Portal</h1>
          <p className="text-slate-500 mt-1">Manage and track your leave requests and balances.</p>
        </div>
      </header>
      <main className="py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* --- Leave Balance Section --- */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200/80 mb-10">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Your Leave Balance for {new Date().getFullYear()}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Sick Leave Card */}
              <div className="flex items-center gap-6 p-6 rounded-xl bg-slate-50/70 border border-slate-200/60">
                <DonutChart total={balance.sickLeaveAvailable} remaining={sickLeaveRemaining} color="text-green-500" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Activity size={18} className="text-green-600" />Sick Leave</h3>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-left">
                    <div>
                      <p className="text-xs text-slate-500">Available</p>
                      <p className="text-xl font-semibold text-slate-700">{balance.sickLeaveAvailable} Days</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Taken</p>
                      <p className="text-xl font-semibold text-slate-700">{takenLeave.sick} Days</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Home Leave Card */}
              <div className="flex items-center gap-6 p-6 rounded-xl bg-slate-50/70 border border-slate-200/60">
                <DonutChart total={balance.homeLeaveAvailable} remaining={homeLeaveRemaining} color="text-green-500" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Home size={18} className="text-green-600" />Home Leave</h3>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-left">
                    <div>
                      <p className="text-xs text-slate-500">Available</p>
                      <p className="text-xl font-semibold text-slate-700">{balance.homeLeaveAvailable} Days</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Taken</p>
                      <p className="text-xl font-semibold text-slate-700">{takenLeave.home} Days</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- Actions Section --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Link href="/leaves/apply" legacyBehavior>
              <a className="group bg-green-600 p-6 rounded-xl shadow-lg shadow-green-500/20 hover:bg-green-700 transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <FilePlus className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Apply for Leave</h3>
                    <p className="text-sm text-green-100">Submit a new request</p>
                  </div>
                </div>
              </a>
            </Link>
            <Link href="/leaves/report" legacyBehavior>
              <a className="group bg-white p-6 rounded-xl shadow-sm border border-slate-200/80 hover:border-green-300 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 group-hover:bg-green-100 transition-colors p-3 rounded-full">
                    <FileText className="text-slate-600 group-hover:text-green-600 transition-colors" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">View Leave History</h3>
                    <p className="text-sm text-slate-500">Check status of all requests</p>
                  </div>
                </div>
              </a>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export async function getServerSideProps(context) {
    const jwt = require('jsonwebtoken');
    const dbConnect = require('../../../lib/dbConnect').default;
    const User = require('../../../models/User').default;
    
    await dbConnect();
    const { token } = context.req.cookies;
    if (!token) { return { redirect: { destination: '/login', permanent: false } }; }

    try {
        jwt.verify(token, process.env.JWT_SECRET);
        return { props: {} }; // We only need to verify the user exists
    } catch (error) {
        console.error("Leave Hub Auth Error:", error);
        return { redirect: { destination: '/login', permanent: false } };
    }
}
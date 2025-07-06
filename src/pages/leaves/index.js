import Link from 'next/link';
import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import LeaveBalance from '../../../models/LeaveBalance';
import LeaveRequest from '../../../models/LeaveRequest';
import dbConnect from '../../../lib/dbConnect';
import { FilePlus, FileText, ArrowLeft, Sun, Home, Activity } from 'react-feather';

// --- Donut Chart Component for Visualizing Leave Balance ---
const DonutChart = ({ base, total, remaining, color }) => {
    const circumference = 2 * Math.PI * 54; // 54 is the radius
    const offset = circumference - (remaining / total) * circumference;
  
    return (
      <div className="relative w-32 h-32">
        <svg className="w-full h-full" viewBox="0 0 120 120">
          <circle
            className="text-slate-200"
            strokeWidth="12"
            stroke="currentColor"
            fill="transparent"
            r="54"
            cx="60"
            cy="60"
          />
          <circle
            className={color}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="54"
            cx="60"
            cy="60"
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-slate-800">{remaining}</span>
            <span className="text-xs text-slate-500 font-medium">Days Left</span>
        </div>
      </div>
    );
};


export default function MyLeaveHub({ balance, takenLeave }) {
  const sickLeaveTaken = takenLeave.sick;
  const homeLeaveTaken = takenLeave.home;

  const sickLeaveRemaining = balance.sickLeaveAvailable - sickLeaveTaken;
  const homeLeaveRemaining = balance.homeLeaveAvailable - homeLeaveTaken;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
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
                      <p className="text-xl font-semibold text-slate-700">{sickLeaveTaken} Days</p>
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
                      <p className="text-xl font-semibold text-slate-700">{homeLeaveTaken} Days</p>
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
    await dbConnect();
    const { token } = context.req.cookies;
    if (!token) return { redirect: { destination: '/login', permanent: false } };

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return { redirect: { destination: '/login', permanent: false } };

        let leaveBalance = await LeaveBalance.findOne({ user: user._id, year: new Date().getFullYear() });
        if (!leaveBalance) {
            // If no balance record exists for the current year, create one with default values.
            leaveBalance = await LeaveBalance.create({ 
                user: user._id,
                year: new Date().getFullYear(),
                sickLeaveAvailable: 15, // Default value
                homeLeaveAvailable: 15  // Default value
            });
        }

        const approvedRequests = await LeaveRequest.find({ 
            user: user._id, 
            status: 'Approved' 
        });
        
        let sickLeaveTaken = 0;
        let homeLeaveTaken = 0;

        approvedRequests.forEach(req => {
            const startDate = new Date(req.startDate);
            const endDate = new Date(req.endDate);
            // Ensure calculation is inclusive of the end date
            const duration = ((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            
            if (req.leaveType === 'Sick Leave') sickLeaveTaken += duration;
            else if (req.leaveType === 'Home Leave') homeLeaveTaken += duration;
        });
        
        return {
            props: {
                balance: JSON.parse(JSON.stringify(leaveBalance)),
                takenLeave: { sick: sickLeaveTaken, home: homeLeaveTaken }
            },
        };
    } catch (error) {
        console.error("Leave Hub Error:", error);
        return { redirect: { destination: '/dashboard', permanent: false } };
    }
}
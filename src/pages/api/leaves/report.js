import Link from 'next/link';
import jwt from 'jsonwebtoken';
import LeaveRequest from '../../../../models/LeaveRequest';
import dbConnect from '../../../../lib/dbConnect';
import { ArrowLeft, Calendar, CheckCircle, Clock, FileText, Type, XCircle } from 'react-feather';

// Helper function to format dates professionally
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC' 
    });
};

// Helper for status styling and icons
const getStatusInfo = (status) => {
    switch (status) {
        case 'Approved':
            return {
                badge: 'bg-green-100 text-green-700 border-green-200',
                icon: <CheckCircle className="text-green-500" size={20} />,
                timeline: 'border-green-300 bg-green-500',
            };
        case 'Rejected':
            return {
                badge: 'bg-red-100 text-red-700 border-red-200',
                icon: <XCircle className="text-red-500" size={20} />,
                timeline: 'border-red-300 bg-red-500',
            };
        default: // Pending
            return {
                badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                icon: <Clock className="text-yellow-500" size={20} />,
                timeline: 'border-yellow-300 bg-yellow-500',
            };
    }
};

// Main Component for the Leave Report
export default function LeaveReportPage({ leaveHistory }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white/80 backdrop-blur-xl shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto py-5 px-4 sm:px-6 lg:px-8">
            <Link href="/leaves" legacyBehavior>
                <a className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 mb-2 transition-colors">
                    <ArrowLeft size={16} />
                    Back to Leave Portal
                </a>
            </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Leave History</h1>
          <p className="text-slate-500 mt-1">A log of all your past leave requests and their status.</p>
        </div>
      </header>
      <main className="py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
              {leaveHistory.length > 0 ? leaveHistory.map((req, index) => {
                const statusInfo = getStatusInfo(req.status);
                const isLast = index === leaveHistory.length - 1;
                return (
                    <div key={req._id} className="flex items-start gap-x-4 sm:gap-x-6 relative">
                        {/* Timeline Visual */}
                        <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusInfo.badge}`}>
                                {statusInfo.icon}
                            </div>
                            {!isLast && (
                                <div className={`w-0.5 flex-1 ${statusInfo.timeline} opacity-30`}></div>
                            )}
                        </div>

                        {/* Card Content */}
                        <div className="flex-1 pt-1.5">
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                    <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-3">
                                        <Type size={18} className="text-slate-400"/>
                                        {req.leaveType}
                                    </h2>
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusInfo.badge}`}>
                                        {req.status}
                                    </span>
                                </div>

                                <div className="mt-4 border-t border-slate-100 pt-4 space-y-4">
                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                        <Calendar size={16} className="text-slate-400 flex-shrink-0" />
                                        <span>
                                            From <span className="font-semibold text-slate-800">{formatDate(req.startDate)}</span> to <span className="font-semibold text-slate-800">{formatDate(req.endDate)}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-3 text-sm text-slate-600">
                                        <FileText size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-slate-600">{req.reason}</p>
                                    </div>
                                    {req.hrComments && (
                                        <div className="border-l-4 border-slate-200 pl-4 mt-4">
                                            <p className="text-xs font-semibold text-slate-500">HR Comments:</p>
                                            <p className="text-sm text-slate-700 italic">"{req.hrComments}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
              }) : (
                <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-slate-200/80">
                    <FileText size={48} className="mx-auto text-slate-300"/>
                    <h2 className="mt-4 text-xl font-semibold text-slate-700">No History Found</h2>
                    <p className="mt-1 text-slate-500">You have not submitted any leave requests yet.</p>
                </div>
              )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Fetch user's leave history on the server
export async function getServerSideProps(context) {
    await dbConnect();
    const { token } = context.req.cookies;
    if (!token) return { redirect: { destination: '/login', permanent: false } };

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const leaveHistory = await LeaveRequest.find({ user: decoded.userId }).sort({ createdAt: -1 });
        
        return {
            props: {
                leaveHistory: JSON.parse(JSON.stringify(leaveHistory)),
            },
        };
    } catch (error) {
        console.error("Leave Report Error:", error);
        return { redirect: { destination: '/dashboard', permanent: false } };
    }
}
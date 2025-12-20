import Link from 'next/link';
import { ArrowLeft, Calendar, CheckCircle, Clock, FileText, Type, XCircle, FilePlus } from 'react-feather';
import { motion } from 'framer-motion';

// Imports moved from getServerSideProps (Kept as requested)
import jwt from 'jsonwebtoken';
import LeaveRequest from '../../../models/LeaveRequest';
import dbConnect from '../../../lib/dbConnect';

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
                badge: 'bg-green-100 text-green-700 ring-1 ring-green-600/20',
                icon: <CheckCircle className="text-white" size={18} />,
                iconBg: 'bg-green-500 shadow-green-200',
                timeline: 'bg-green-200',
            };
        case 'Rejected':
            return {
                badge: 'bg-red-100 text-red-700 ring-1 ring-red-600/20',
                icon: <XCircle className="text-white" size={18} />,
                iconBg: 'bg-red-500 shadow-red-200',
                timeline: 'bg-red-200',
            };
        default: // Pending
            return {
                badge: 'bg-amber-100 text-amber-800 ring-1 ring-amber-600/20',
                icon: <Clock className="text-white" size={18} />,
                iconBg: 'bg-amber-500 shadow-amber-200',
                timeline: 'bg-amber-200',
            };
    }
};

// Main Component for the Leave Report
export default function LeaveReportPage({ leaveHistory }) {
  
  // Animation Variants
  const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
          opacity: 1,
          transition: { staggerChildren: 0.1 }
      }
  };

  const itemVariants = {
      hidden: { opacity: 0, x: -20 },
      visible: { 
          opacity: 1, 
          x: 0,
          transition: { type: "spring", stiffness: 100 }
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-green-100 selection:text-green-800">
      
      {/* Background Atmosphere */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-green-100/30 rounded-full blur-[120px] opacity-60"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100/30 rounded-full blur-[120px] opacity-60"></div>
      </div>

      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40 transition-all">
        <div className="max-w-5xl mx-auto py-5 px-4 sm:px-6 lg:px-8">
            <Link href="/leaves" legacyBehavior>
                <a className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors bg-white px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 shadow-sm mb-3 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Leave Portal
                </a>
            </Link>
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Leave History</h1>
                <p className="text-slate-500 mt-1 font-medium">A log of all your past leave requests and their status.</p>
            </div>
        </div>
      </header>

      <main className="relative z-10 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-0"
          >
              {leaveHistory.length > 0 ? leaveHistory.map((req, index) => {
                const statusInfo = getStatusInfo(req.status);
                const isLast = index === leaveHistory.length - 1;
                
                return (
                    <motion.div 
                        variants={itemVariants}
                        key={req._id} 
                        className="flex items-stretch gap-x-4 sm:gap-x-6 relative group"
                    >
                        {/* Timeline Visual */}
                        <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${statusInfo.iconBg} z-10 ring-4 ring-slate-50`}>
                                {statusInfo.icon}
                            </div>
                            {!isLast && (
                                <div className={`w-0.5 flex-1 ${statusInfo.timeline} my-2 rounded-full`}></div>
                            )}
                        </div>

                        {/* Card Content */}
                        <div className="flex-1 pb-10 min-w-0">
                            <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-200/80 hover:shadow-lg hover:border-slate-300 transition-all duration-300 relative overflow-hidden">
                                
                                {/* Status Chip */}
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${statusInfo.badge}`}>
                                                {req.status}
                                            </span>
                                            <span className="text-xs text-slate-400 font-medium">
                                                Requested on {formatDate(req.createdAt || new Date())}
                                            </span>
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                            {req.leaveType}
                                        </h2>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                                    <div className="group/date">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                            <Calendar size={12} /> Duration
                                        </p>
                                        <div className="flex items-center gap-2 text-sm text-slate-700 font-medium bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                                            <span>{formatDate(req.startDate)}</span>
                                            <span className="text-slate-400">→</span>
                                            <span>{formatDate(req.endDate)}</span>
                                        </div>
                                    </div>

                                    <div className="group/reason">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                            <FileText size={12} /> Reason
                                        </p>
                                        <p className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 line-clamp-2 hover:line-clamp-none transition-all">
                                            {req.reason}
                                        </p>
                                    </div>
                                </div>

                                {req.hrComments && (
                                    <div className="mt-4 bg-slate-50 border-l-4 border-slate-300 rounded-r-lg p-4">
                                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">HR Feedback</p>
                                        <p className="text-sm text-slate-700 italic">&quot;{req.hrComments}&quot;</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                );
              }) : (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20 bg-white rounded-[2.5rem] shadow-sm border border-slate-200/80 border-dashed"
                >
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                        <FilePlus className="text-slate-300" size={40}/>
                    </div>
                    <h2 className="mt-4 text-xl font-bold text-slate-800">No History Found</h2>
                    <p className="mt-2 text-slate-500">You have not submitted any leave requests yet.</p>
                    
                    <Link href="/leaves/apply" legacyBehavior>
                        <a className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 hover:shadow-xl">
                            Apply Now
                        </a>
                    </Link>
                </motion.div>
              )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

// Fetch user's leave history on the server (Unchanged)
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
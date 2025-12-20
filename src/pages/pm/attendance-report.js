import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from 'next/image';
import { useRouter } from "next/router";
import { ArrowLeft, Clock, Calendar, Filter, User as UserIcon, RefreshCw, CheckCircle, XCircle } from "react-feather";
import { motion, AnimatePresence } from 'framer-motion';

// Imports moved from getServerSideProps (Kept as requested)
import jwt from "jsonwebtoken";
import dbConnect from "../../../lib/dbConnect";
import User from "../../../models/User";
import Attendance from "../../../models/Attendance";
import NepaliDate from "nepali-date-converter";

// --- Helper Functions ---
const toNepaliDate = (gregorianDate) => {
  if (!gregorianDate) return '-';
  const nepaliDate = new NepaliDate(new Date(gregorianDate));
  return nepaliDate.format('DD MMMM, YYYY');
};

const formatDuration = (totalSeconds) => {
  if (totalSeconds == null || totalSeconds < 0) return '-';
  if (totalSeconds === 0) return '0m';
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  return parts.join(' ') || '0m';
};

const MIN_WORK_SECONDS = 21600;

const getDurationStyle = (attendanceEntry) => {
  if (attendanceEntry.checkOutTime) {
    if (attendanceEntry.duration >= MIN_WORK_SECONDS) {
      return "text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md";
    } else {
      return "text-rose-700 font-bold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md";
    }
  }
  return "font-bold text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-md animate-pulse";
};

// --- Skeleton Loader Component ---
const AttendanceSkeleton = () => (
    <div className="min-h-screen bg-slate-50 font-sans animate-pulse">
        <header className="bg-white/80 h-24 border-b border-slate-200/60 sticky top-0 z-10 flex items-center">
            <div className="max-w-7xl mx-auto w-full px-8">
                <div className="h-4 w-32 bg-slate-200 rounded-md mb-2"></div>
                <div className="h-8 w-64 bg-slate-200 rounded-lg"></div>
            </div>
        </header>
        <main className="py-10 max-w-7xl mx-auto px-8">
             <div className="h-32 bg-white rounded-[2rem] border border-slate-200 mb-8"></div>
             <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden">
                 <div className="h-16 bg-slate-50 border-b border-slate-100"></div>
                 {[...Array(5)].map((_, i) => (
                     <div key={i} className="h-20 border-b border-slate-50 flex items-center px-8 gap-4">
                         <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                         <div className="h-4 w-32 bg-slate-200 rounded"></div>
                         <div className="h-4 w-24 bg-slate-200 rounded ml-auto"></div>
                     </div>
                 ))}
             </div>
        </main>
    </div>
);

// --- Main Component ---
export default function AttendanceReportPage({ user, initialAttendance }) {
  const router = useRouter();
  const [allAttendance, setAllAttendance] = useState(initialAttendance);
  const [filteredAttendance, setFilteredAttendance] = useState(initialAttendance);
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedUser, setSelectedUser] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  // Simulate fast loading for smooth transition
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const uniqueUsers = useMemo(() => {
    const userMap = new Map();
    allAttendance.forEach((att) => {
      if (att.user) {
        userMap.set(att.user._id, { _id: att.user._id, name: att.user.name, role: att.user.role });
      }
    });
    return Array.from(userMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allAttendance]);

  useEffect(() => {
    let result = allAttendance;
    if (selectedRole !== "All") {
      result = result.filter((att) => att.user?.role === selectedRole);
    }
    if (selectedUser !== "All") {
      result = result.filter((att) => att.user?._id === selectedUser);
    }
    setFilteredAttendance(result);
  }, [selectedRole, selectedUser, allAttendance]);

  // Animation Variants
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  if (isLoading) return <AttendanceSkeleton />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-green-100 selection:text-green-800">
      
      {/* Background Atmosphere */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-green-100/30 rounded-full blur-[120px] opacity-60"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100/30 rounded-full blur-[120px] opacity-60"></div>
      </div>

      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto py-5 px-4 sm:px-6 lg:px-8">
            <Link href="/pm/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors bg-white px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 shadow-sm mb-3 group">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
            </Link>
          <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Attendance Report</h1>
                <p className="text-slate-500 mt-1 font-medium text-sm sm:text-base">Comprehensive staff logs and work hours.</p>
              </div>
              <div className="hidden sm:block p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400">
                  <Calendar size={24} />
              </div>
          </div>
        </div>
      </header>
      
      <main className="relative z-10 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Filter Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.4 }}
            className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200/80 mb-8 relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-green-50 rounded-bl-full -z-10"></div>
            <div className="flex items-center gap-2 mb-4 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <Filter size={14} /> Filter Records
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group">
                <label htmlFor="role-filter" className="block text-sm font-bold text-slate-700 mb-2 ml-1">By Role</label>
                <div className="relative">
                    <select id="role-filter" value={selectedRole} onChange={(e) => { setSelectedRole(e.target.value); setSelectedUser("All"); }} className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 focus:bg-white transition-all appearance-none cursor-pointer hover:bg-slate-100">
                      <option value="All">All Roles</option>
                      <option value="Staff">Staff</option>
                      <option value="Intern">Intern</option>
                      <option value="Manager">Manager</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                        <Filter size={16} />
                    </div>
                </div>
              </div>
              <div className="group">
                <label htmlFor="user-filter" className="block text-sm font-bold text-slate-700 mb-2 ml-1">By Employee</label>
                <div className="relative">
                    <select id="user-filter" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 focus:bg-white transition-all appearance-none cursor-pointer hover:bg-slate-100">
                      <option value="All">All Employees</option>
                      {uniqueUsers.filter((u) => selectedRole === "All" || u.role === selectedRole).map((u) => (<option key={u._id} value={u._id}>{u.name}</option>))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                        <UserIcon size={16} />
                    </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Attendance Table */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-[2.5rem] shadow-lg shadow-slate-200/50 border border-slate-200/60 overflow-hidden"
          >
            <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 bg-slate-50/30">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-green-500 rounded-full"></div> 
                  Attendance History
              </h2>
              <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 shadow-sm">
                  {filteredAttendance.length} Records Found
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                    <tr>
                        <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Staff Details</th>
                        <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Date (Nepali)</th>
                        <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Timeline</th>
                        <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Total Break</th>
                        <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Work Hours</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                    <AnimatePresence>
                        {filteredAttendance.length > 0 ? filteredAttendance.map((att, index) => (
                        <motion.tr 
                            key={att._id} 
                            variants={itemVariants}
                            initial="hidden"
                            animate="show"
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-slate-50/80 transition-colors group"
                        >
                            <td className="px-8 py-5 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-11 w-11 relative">
                                        <Image className="rounded-full object-cover border-2 border-white shadow-sm" src={att.user?.avatar || '/default-avatar.png'} alt={att.user?.name || ''} width={44} height={44}/>
                                        <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${att.checkOutTime ? 'bg-slate-400' : 'bg-green-500 animate-pulse'}`}></div>
                                    </div>
                                    <div className="ml-4">
                                        <div className="font-bold text-slate-800 text-sm group-hover:text-green-700 transition-colors">{att.user?.name || "Deleted User"}</div>
                                        <div className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md inline-block mt-1 border border-slate-100">{att.user?.role || "N/A"}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-5 whitespace-nowrap text-sm font-semibold text-slate-600">{toNepaliDate(att.checkInTime)}</td>
                            <td className="px-8 py-5 whitespace-nowrap text-sm">
                                <div className="flex flex-col gap-1">
                                    <span className="text-green-600 font-medium flex items-center gap-1.5"><ArrowLeft size={12} className="rotate-180"/> {new Date(att.checkInTime).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'})}</span>
                                    <span className="text-rose-500 font-medium flex items-center gap-1.5">
                                        {att.checkOutTime ? <><ArrowLeft size={12} /> {new Date(att.checkOutTime).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'})}</> : <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded text-[10px] uppercase border border-green-100">Active Now</span>}
                                    </span>
                                </div>
                            </td>
                            <td className="px-8 py-5 whitespace-nowrap text-sm font-medium text-slate-500">{formatDuration(att.totalBreakDuration)}</td>
                            <td className="px-8 py-5 whitespace-nowrap text-sm">
                                <span className={getDurationStyle(att)}>{formatDuration(att.duration)}</span>
                            </td>
                        </motion.tr>
                        )) : (
                        <tr>
                          <td colSpan="5" className="text-center py-20">
                            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                <Clock className="text-slate-300" size={40} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">No Records Found</h3>
                            <p className="mt-1 text-slate-500 text-sm">There is no attendance data for the selected filters.</p>
                            <button onClick={() => {setSelectedRole("All"); setSelectedUser("All");}} className="mt-4 text-green-600 font-bold text-sm hover:underline flex items-center justify-center gap-2">
                                <RefreshCw size={14}/> Reset Filters
                            </button>
                          </td>
                        </tr>
                        )}
                    </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

// Server Side Props (Unchanged logic, verified)
export async function getServerSideProps(context) {
  await dbConnect();
  const { token } = context.req.cookies;
  if (!token) return { redirect: { destination: "/login", permanent: false } };
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user || (user.role !== "Project Manager" && user.role !== "HR")) {
      return { redirect: { destination: "/dashboard", permanent: false } };
    }
    
    const allAttendance = await Attendance.find({})
      .populate("user", "name role avatar")
      .sort({ checkInTime: -1 });

    return {
      props: {
        user: JSON.parse(JSON.stringify(user)),
        initialAttendance: JSON.parse(JSON.stringify(allAttendance)),
      },
    };
  } catch (error) {
    return { redirect: { destination: "/login", permanent: false } };
  }
}
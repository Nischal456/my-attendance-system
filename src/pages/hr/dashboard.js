import { useState, useMemo, useEffect, useRef, useCallback, memo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { 
  Send, Trash2, AlertTriangle, LogOut, Check, X as XIcon, UserPlus, 
  Briefcase, Download, ChevronDown, Bell, Users, BarChart2, Clock, 
  Menu, ChevronLeft, ChevronRight, Edit, Home, PieChart, TrendingUp, 
  Search, Calendar, Filter, RefreshCw, Activity, Layers
} from 'react-feather';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, 
  Tooltip, Legend, ArcElement, PointElement, LineElement, Filler 
} from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Imports moved from getServerSideProps (Ensure these paths are correct for your project)
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import Attendance from '../../../models/Attendance';
import LeaveRequest from '../../../models/LeaveRequest';

// --- Lazy Load Charts ---
const Bar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), { ssr: false });
const Doughnut = dynamic(() => import('react-chartjs-2').then((mod) => mod.Doughnut), { ssr: false });

// --- Register Chart.js Components ---
ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, 
  ArcElement, PointElement, LineElement, Filler
);

// --- Animation Variants ---
const pageTransition = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] } },
  exit: { opacity: 0, y: -15, transition: { duration: 0.2 } }
};

const fadeInUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } }
};

const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const modalContent = {
  initial: { scale: 0.95, opacity: 0, y: 20 },
  animate: { scale: 1, opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
  exit: { scale: 0.95, opacity: 0, y: 10, transition: { duration: 0.2 } }
};

// --- Helper Functions ---
const formatEnglishDate = (dateString) => { if (!dateString) return '–'; return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); };
const formatDuration = (totalSeconds) => { 
  if (totalSeconds == null || totalSeconds < 0) return '0m'; 
  if (totalSeconds === 0) return '0m'; 
  if (totalSeconds < 60) return `${Math.round(totalSeconds)}s`; 
  const hours = Math.floor(totalSeconds / 3600); 
  const minutes = Math.floor((totalSeconds % 3600) / 60); 
  return `${hours}h ${minutes}m`; 
};
const MIN_WORK_SECONDS = 21600; // 6 hours
const getDurationStyle = (attendanceEntry) => { 
  if (attendanceEntry.checkOutTime) { 
    return attendanceEntry.duration >= MIN_WORK_SECONDS ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"; 
  } 
  return "font-bold text-blue-500"; 
};
const getStatusBadge = (status) => { 
  switch (status) { 
    case 'Approved': return 'bg-emerald-100 text-emerald-700 border border-emerald-200'; 
    case 'Rejected': return 'bg-rose-100 text-rose-700 border border-rose-200'; 
    default: return 'bg-amber-100 text-amber-700 border border-amber-200'; 
  } 
};

// --- Custom Components ---

// 1. Premium Loader
const DashboardEntryLoader = ({ userName }) => (
    <motion.div 
        className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center font-sans"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
    >
        <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative mb-8"
        >
            <div className="absolute inset-0 bg-emerald-200 blur-2xl rounded-full opacity-40 animate-pulse"></div>
            <Image src="/hr.png" alt="Logo" width={120} height={120} className="relative z-10" />
        </motion.div>
        
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">Welcome, {userName.split(' ')[0]}</h2>
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <span className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Initializing HR Command Center...
            </span>
        </div>
        
        <motion.div 
            className="mt-8 h-1.5 w-48 bg-slate-100 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
        >
            <motion.div 
                className="h-full bg-emerald-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
            />
        </motion.div>
    </motion.div>
);

const StatCard = memo(({ title, value, icon, color }) => (
  <motion.div variants={fadeInUp} className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-start gap-4 transition-all duration-300 hover:shadow-lg hover:border-emerald-100 group cursor-default">
    <div className={`w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-2xl transition-all duration-300 ${color.bg} group-hover:scale-110 shadow-sm`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-semibold text-slate-400 tracking-wide uppercase">{title}</p>
      <p className={`text-3xl font-bold mt-1 tracking-tight ${color.text}`}>{value}</p>
    </div>
  </motion.div>
));
StatCard.displayName = "StatCard";

const NavButton = memo(({ label, icon, isActive, onClick, notificationCount = 0 }) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-200 transform active:scale-95 group ${ 
      isActive 
        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-200' 
        : 'text-slate-500 hover:bg-white hover:text-emerald-600 hover:shadow-md hover:shadow-slate-100' 
    }`}
  >
    <div className="flex items-center gap-3">
      <span className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-500 transition-colors'}>{icon}</span>
      <span>{label}</span>
    </div>
    {notificationCount > 0 && (
      <span className="min-w-[1.25rem] h-5 px-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm ring-2 ring-white">
        {notificationCount}
      </span>
    )}
  </button>
));
NavButton.displayName = "NavButton";

const WorkHoursChart = memo(({ data, targetHours }) => {
  const chartData = useMemo(() => ({
    labels: data.map(d => d.name),
    datasets: [
      {
        label: 'Actual Hours',
        data: data.map(d => d.totalHours),
        backgroundColor: 'rgba(16, 185, 129, 0.8)', 
        hoverBackgroundColor: 'rgba(5, 150, 105, 1)',
        borderRadius: 8,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
        order: 2
      },
      {
        label: 'Target',
        data: data.map(() => targetHours),
        backgroundColor: 'transparent', 
        borderColor: 'rgba(148, 163, 184, 0.6)', 
        borderWidth: 2,
        borderDash: [6, 6],
        pointRadius: 0,
        type: 'line',
        order: 1,
        tension: 0.4
      }
    ]
  }), [data, targetHours]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 6, font: {family: "'Inter', sans-serif", size: 11}, color: '#64748b' } },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        titleFont: { size: 13, family: "'Inter', sans-serif", weight: 'bold' },
        bodyFont: { size: 12, family: "'Inter', sans-serif" },
        padding: 12,
        cornerRadius: 12,
        displayColors: true,
        boxPadding: 4
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9', borderDash: [4, 4] },
        border: { display: false },
        ticks: { font: { family: "'Inter', sans-serif", size: 11 }, color: '#94a3b8' }
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { font: { family: "'Inter', sans-serif", size: 11 }, color: '#64748b' }
      }
    }
  }), []);

  return <Bar data={chartData} options={options} />;
});
WorkHoursChart.displayName = "WorkHoursChart";

// --- Modals ---

const ManageLeaveModal = ({ item, comments, setComments, error, onClose, onSubmit, isSubmitting }) => (
  <AnimatePresence>
    <motion.div variants={modalBackdrop} initial="initial" animate="animate" exit="exit" className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex justify-center items-center p-4">
      <motion.div variants={modalContent} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/50" onClick={(e) => e.stopPropagation()}>
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Review Request</h3>
              <p className="text-sm text-slate-500 font-medium">Leave Application Details</p>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"><XIcon size={20}/></button>
          </div>
          
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden relative flex-shrink-0">
                  {item.user?.avatar ? (
                     <Image src={item.user.avatar} layout="fill" objectFit="cover" alt="User" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-600 font-bold text-xl">{item.user?.name?.charAt(0)}</div>
                  )}
              </div>
              <div>
                <p className="font-bold text-slate-800 text-lg leading-tight">{item.user.name}</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded-md inline-block mt-1 shadow-sm">{item.user.role}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm"><p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Leave Type</p><p className="font-bold text-slate-700">{item.leaveType}</p></div>
              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm"><p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Duration</p><p className="font-bold text-slate-700">{formatEnglishDate(item.startDate)} - {formatEnglishDate(item.endDate)}</p></div>
            </div>
            <div className="pt-2">
              <p className="text-slate-400 text-[10px] font-bold uppercase mb-2">Reason for Leave</p>
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-sm text-slate-600 italic leading-relaxed">"{item.reason}"</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">HR Remarks</label>
            <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows="3" className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm resize-none bg-slate-50 focus:bg-white" placeholder="Add a note..."></textarea>
          </div>
          {error && <div className="flex items-center gap-2 mt-4 text-rose-600 text-sm bg-rose-50 p-3 rounded-xl border border-rose-100"><AlertTriangle size={16}/> {error}</div>}
        </div>
        
        <div className="bg-slate-50 px-8 py-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-100">
          <button onClick={onClose} disabled={isSubmitting} className="px-6 py-3 text-slate-600 font-bold rounded-xl hover:bg-white hover:shadow-sm transition-all disabled:opacity-50 text-sm">Cancel</button>
          <div className="flex gap-3 w-full sm:w-auto">
            <button onClick={() => onSubmit('Rejected')} disabled={isSubmitting} className="flex-1 sm:flex-none px-6 py-3 bg-white text-rose-600 border border-rose-100 hover:bg-rose-50 hover:border-rose-200 font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 text-sm transition-all shadow-sm"><XIcon size={18}/> Reject</button>
            <button onClick={() => onSubmit('Approved')} disabled={isSubmitting} className="flex-1 sm:flex-none px-6 py-3 bg-emerald-600 text-white hover:bg-emerald-700 font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 text-sm shadow-lg shadow-emerald-200 transition-all active:scale-95"><Check size={18}/> Approve</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

const DeleteModal = ({ onConfirm, onClose, isDeleting }) => (
  <AnimatePresence>
    <motion.div variants={modalBackdrop} initial="initial" animate="animate" exit="exit" className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex justify-center items-center p-4">
      <motion.div variants={modalContent} className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-sm text-center border border-white/50">
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-rose-100">
          <Trash2 size={32} />
        </div>
        <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Delete Record?</h3>
        <p className="text-slate-500 mb-8 leading-relaxed font-medium">This action cannot be undone. Are you sure you want to proceed?</p>
        <div className="flex gap-4">
          <button onClick={onClose} disabled={isDeleting} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50">Cancel</button>
          <button onClick={onConfirm} disabled={isDeleting} className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all disabled:opacity-50 flex justify-center items-center gap-2 active:scale-95">
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

const AdjustCheckoutModal = ({ record, onClose, onUpdate, isSubmitting }) => {
  const [newCheckoutTime, setNewCheckoutTime] = useState(record.checkOutTime ? new Date(record.checkOutTime) : new Date(record.checkInTime));
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!newCheckoutTime || new Date(newCheckoutTime) <= new Date(record.checkInTime)) {
      setError('Checkout must be after check-in.');
      return;
    }
    onUpdate({ attendanceId: record._id, newCheckoutTime });
  };

  return (
    <AnimatePresence>
      <motion.div variants={modalBackdrop} initial="initial" animate="animate" exit="exit" className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex justify-center items-center p-4">
        <motion.div variants={modalContent} className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-md border border-white/50">
          <h3 className="text-xl font-extrabold mb-6 text-slate-800 border-b border-slate-100 pb-4">Modify Time Log</h3>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 flex items-center gap-4 shadow-sm">
             <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden relative flex-shrink-0">
               <Image src={record.user.avatar || '/default-avatar.png'} layout="fill" objectFit="cover" alt="avatar"/>
             </div>
             <div>
                <p className="text-slate-800 font-bold">{record.user.name}</p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <p className="text-xs text-slate-500 font-medium">In: {new Date(record.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
             </div>
          </div>
          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-bold text-slate-700 mb-2">New Checkout Time</label>
            <div className="relative">
                <DatePicker selected={newCheckoutTime} onChange={(date) => setNewCheckoutTime(date)} showTimeSelect timeFormat="h:mm aa" timeIntervals={15} dateFormat="MMM d, yyyy h:mm aa" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700 cursor-pointer hover:bg-white" wrapperClassName="w-full" />
                <Calendar className="absolute right-4 top-4 text-slate-400 pointer-events-none" size={18}/>
            </div>
            {error && <p className="text-rose-600 text-sm mt-3 flex items-center gap-2 bg-rose-50 p-3 rounded-xl font-medium"><AlertTriangle size={14}/>{error}</p>}
            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={onClose} disabled={isSubmitting} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 active:scale-95 transition-all">{isSubmitting ? 'Saving...' : 'Update'}</button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// --- View Components ---

const AnalyticsView = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/hr/analytics');
        const result = await res.json();
        if (!result.success) throw new Error("Could not load analytics.");
        setData(result.data);
      } catch (error) { toast.error(error.message); } finally { setIsLoading(false); }
    };
    fetchData();
  }, []);

  const chartOptions = useMemo(() => ({ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: {family: "'Inter', sans-serif", weight: '500'} } } }, layout: { padding: 10 } }), []);

  if (isLoading) return <div className="space-y-6 animate-pulse"><div className="h-10 w-48 bg-slate-200 rounded-xl mb-8"></div><div className="grid grid-cols-4 gap-6">{[1,2,3,4].map(i=><div key={i} className="h-32 bg-slate-200 rounded-3xl"></div>)}</div><div className="h-96 bg-slate-200 rounded-3xl mt-8"></div></div>;
  if (!data) return <div className="text-center p-10 text-slate-500">Failed to load data.</div>;

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-8">
      <div className="flex justify-between items-center">
         <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Analytics Overview</h1>
         <span className="text-sm font-bold text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm flex items-center gap-2"><Calendar size={14} className="text-emerald-500"/> {new Date().toLocaleDateString()}</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Staff" value={data.kpis.totalEmployees} icon={<Users size={24}/>} color={{ bg: 'bg-indigo-50 text-indigo-600', text: 'text-indigo-900' }} />
        <StatCard title="On Leave" value={data.kpis.onLeaveToday} icon={<Briefcase size={24}/>} color={{ bg: 'bg-rose-50 text-rose-600', text: 'text-rose-900' }} />
        <StatCard title="Active Tasks" value={data.kpis.tasksInProgress} icon={<TrendingUp size={24}/>} color={{ bg: 'bg-amber-50 text-amber-600', text: 'text-amber-900' }} />
        <StatCard title="In Office" value={data.todayLocation.find(l=>l._id==='Office')?.count||0} icon={<Home size={24}/>} color={{ bg: 'bg-emerald-50 text-emerald-600', text: 'text-emerald-900' }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-3"><Activity size={20} className="text-indigo-500"/> Task Distribution</h3>
          <div className="flex-1 min-h-[320px] relative">
            <Bar 
              data={{ 
                labels: data.taskDistribution.map(d => d.name), 
                datasets: [{ label: 'Tasks', data: data.taskDistribution.map(d => d.count), backgroundColor: '#6366f1', borderRadius: 8, barPercentage: 0.5 }] 
              }} 
              options={{ ...chartOptions, indexAxis: 'y', scales: { x: { grid: { display: false } }, y: { grid: { display: false } } } }} 
            />
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-3"><PieChart size={20} className="text-emerald-500"/> Leave Breakdown</h3>
          <div className="flex-1 min-h-[320px] relative flex justify-center items-center">
            <div className="w-full max-w-xs">
              <Doughnut 
                data={{ 
                  labels: data.leaveBreakdown.map(d => d._id), 
                  datasets: [{ data: data.leaveBreakdown.map(d => d.count), backgroundColor: ['#f43f5e', '#3b82f6', '#f59e0b', '#10b981'], borderWidth: 0, hoverOffset: 4 }] 
                }} 
                options={{ ...chartOptions, cutout: '75%' }} 
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const DashboardView = ({ workHoursData, targetHours, selectedMonth, handleMonthChange, isLoadingChart }) => (
  <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-8">
    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
      <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Dashboard</h1>
      <div className="flex items-center bg-white rounded-2xl shadow-sm border border-slate-200 p-1.5">
        <button onClick={() => handleMonthChange(-1)} className="p-2.5 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"><ChevronLeft size={18} /></button>
        <span className="font-bold text-slate-800 text-sm w-36 text-center select-none">{selectedMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</span>
        <button onClick={() => handleMonthChange(1)} className="p-2.5 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"><ChevronRight size={18} /></button>
      </div>
    </div>

    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
      <div className="flex justify-between items-center mb-8 relative z-10">
        <div>
           <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3"><Clock size={22} className="text-emerald-500"/> Team Work Hours</h2>
           <p className="text-slate-400 text-sm mt-1 font-medium">Performance vs Target ({targetHours}h/month)</p>
        </div>
        {isLoadingChart && <RefreshCw size={20} className="animate-spin text-slate-300" />}
      </div>
      <div className="h-[450px] relative w-full z-10">
        {isLoadingChart ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10"><div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          workHoursData.length > 0 ? <WorkHoursChart data={workHoursData} targetHours={targetHours} /> : <div className="h-full flex flex-col items-center justify-center text-slate-400"><BarChart2 size={64} className="mb-4 opacity-10"/><p>No attendance data recorded.</p></div>
        )}
      </div>
    </div>
  </motion.div>
);

const AttendanceView = ({ attendanceData, allUsers, openDeleteModal, openEditModal }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Instant Search (120fps feel with useMemo)
  const filteredAttendance = useMemo(() => {
    let result = attendanceData;
    const query = searchQuery.toLowerCase();
    
    if (query) { result = result.filter(att => att.user?.name.toLowerCase().includes(query) || att.user?.role.toLowerCase().includes(query)); }
    if (locationFilter) { result = result.filter(att => att.workLocation === locationFilter); }
    if (dateRange.start) { result = result.filter(att => new Date(att.checkInTime) >= new Date(dateRange.start)); }
    if (dateRange.end) { result = result.filter(att => new Date(att.checkInTime) <= new Date(new Date(dateRange.end).setHours(23, 59, 59, 999))); }
    return result;
  }, [searchQuery, locationFilter, dateRange, attendanceData]);

  const stats = useMemo(() => {
    const completed = filteredAttendance.filter(a => a.checkOutTime);
    const totalSeconds = completed.reduce((acc, att) => acc + (att.duration || 0), 0);
    return {
      totalTime: formatDuration(totalSeconds),
      onTarget: completed.filter(d => d.duration >= MIN_WORK_SECONDS).length,
      totalCount: filteredAttendance.length
    };
  }, [filteredAttendance]);

  const handleDownloadCSV = useCallback(() => {
    if (filteredAttendance.length === 0) return toast.error("No data available.");
    const headers = ["Name,Role,Date,Location,In,Out,Hours,Break(min),Note"];
    const rows = filteredAttendance.map(a => [
      `"${a.user?.name||''}"`, `"${a.user?.role||''}"`, `"${formatEnglishDate(a.checkInTime)}"`, a.workLocation,
      new Date(a.checkInTime).toLocaleTimeString(), a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString() : 'Active',
      ((a.duration||0)/3600).toFixed(2), Math.round((a.totalBreakDuration||0)/60), `"${a.description||''}"`
    ].join(','));
    const blob = new Blob([[...headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `attendance_report_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  }, [filteredAttendance]);

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Attendance Log</h1>
        <button onClick={handleDownloadCSV} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"><Download size={16}/> Export Report</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition-all cursor-default">
            <div><p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Total Hours Logged</p><p className="text-2xl font-extrabold text-slate-800 group-hover:text-emerald-600 transition-colors">{stats.totalTime}</p></div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner"><Clock size={24}/></div>
        </div>
        <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-all cursor-default">
            <div><p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">On Target</p><p className="text-2xl font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors">{stats.onTarget}</p></div>
             <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner"><Check size={24}/></div>
        </div>
        <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-all cursor-default">
            <div><p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Records Found</p><p className="text-2xl font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors">{stats.totalCount}</p></div>
             <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner"><Filter size={24}/></div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="relative"><Search className="absolute left-4 top-3.5 text-slate-400" size={18}/><input type="text" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder="Filter by name..." className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:shadow-md outline-none transition-all"/></div>
         <select value={locationFilter} onChange={(e)=>setLocationFilter(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:shadow-md transition-all text-slate-600"><option value="">All Locations</option><option value="Office">Office</option><option value="Home">Home</option></select>
         <input type="date" value={dateRange.start} onChange={(e)=>setDateRange(p=>({...p, start:e.target.value}))} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:shadow-md transition-all text-slate-600"/>
         <input type="date" value={dateRange.end} onChange={(e)=>setDateRange(p=>({...p, end:e.target.value}))} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:shadow-md transition-all text-slate-600"/>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 font-bold tracking-wider">Employee</th>
                <th className="px-6 py-5 font-bold tracking-wider">Date</th>
                <th className="px-6 py-5 font-bold tracking-wider">Timings</th>
                <th className="px-6 py-5 font-bold tracking-wider">Duration</th>
                <th className="px-6 py-5 font-bold tracking-wider">Note</th>
                <th className="px-6 py-5 font-bold text-right tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAttendance.map((att) => (
                <tr key={att._id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden relative border border-slate-200 flex-shrink-0">
                           <Image src={att.user?.avatar || '/default-avatar.png'} layout="fill" objectFit="cover" alt="avatar"/>
                        </div>
                        <div><p className="font-bold text-slate-800">{att.user?.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{att.user?.role}</p></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-slate-700 font-semibold">{formatEnglishDate(att.checkInTime)}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider mt-1 inline-block border ${att.workLocation==='Office'?'bg-emerald-50 text-emerald-600 border-emerald-100':'bg-sky-50 text-sky-600 border-sky-100'}`}>{att.workLocation}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1 text-xs text-slate-500 font-medium">
                       <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> In: {new Date(att.checkInTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                       <span className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${att.checkOutTime?'bg-rose-500':'bg-amber-400 animate-pulse'}`}></span> {att.checkOutTime? `Out: ${new Date(att.checkOutTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}` : 'Active'}</span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 font-mono text-sm ${getDurationStyle(att)}`}>{formatDuration(att.duration)}</td>
                  <td className="px-6 py-4 max-w-xs truncate text-slate-400 italic" title={att.description}>{att.description || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <button onClick={()=>openEditModal(att)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Edit size={16}/></button>
                      <button onClick={()=>openDeleteModal(att._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAttendance.length === 0 && <tr><td colSpan="6" className="text-center py-20 text-slate-400 flex flex-col items-center justify-center"><Search size={40} className="mb-4 opacity-20"/><p>No records found matching filters.</p></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

const NotificationSender = ({ allUsers, targetType, setTargetType, targetUser, setTargetUser, notificationContent, setNotificationContent, handleSendNotification, isSending }) => (
  <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="max-w-2xl mx-auto space-y-8">
    <div className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">System Broadcast</h1>
        <p className="text-slate-500 mt-2 font-medium">Send announcements to your team instantly.</p>
    </div>
    <motion.div variants={fadeInUp} className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-100 border border-white/50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
      <form onSubmit={handleSendNotification} className="space-y-8 relative z-10">
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-4">Recipient Group</label>
          <div className="grid grid-cols-2 gap-4">
             <label className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col items-center gap-3 transition-all ${targetType==='all' ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800' : 'border-slate-100 hover:border-emerald-200 text-slate-500 hover:bg-slate-50'}`}>
                <input type="radio" className="hidden" name="target" value="all" checked={targetType==='all'} onChange={()=>setTargetType('all')}/>
                <Users size={28} className={targetType==='all'?'text-emerald-600':'text-slate-300'}/>
                <span className="font-bold text-sm">Everyone</span>
             </label>
             <label className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col items-center gap-3 transition-all ${targetType==='individual' ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800' : 'border-slate-100 hover:border-emerald-200 text-slate-500 hover:bg-slate-50'}`}>
                <input type="radio" className="hidden" name="target" value="individual" checked={targetType==='individual'} onChange={()=>setTargetType('individual')}/>
                <UserPlus size={28} className={targetType==='individual'?'text-emerald-600':'text-slate-300'}/>
                <span className="font-bold text-sm">Specific Person</span>
             </label>
          </div>
        </div>

        <AnimatePresence>
          {targetType === 'individual' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
               <label className="block text-sm font-bold text-slate-700 mb-2">Select Employee</label>
               <select value={targetUser} onChange={(e)=>setTargetUser(e.target.value)} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all">
                 <option value="">-- Choose Employee --</option>
                 {allUsers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
               </select>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
           <label className="block text-sm font-bold text-slate-800 mb-2">Message</label>
           <textarea value={notificationContent} onChange={(e)=>setNotificationContent(e.target.value)} rows="5" className="w-full p-5 bg-slate-50 border-none rounded-2xl font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none resize-none transition-all placeholder:text-slate-400" placeholder="Type your announcement here..."></textarea>
        </div>

        <button type="submit" disabled={isSending} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-xl shadow-emerald-200 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed text-lg">
           {isSending ? <RefreshCw className="animate-spin" size={24}/> : <Send size={24}/>}
           {isSending ? 'Sending...' : 'Send Notification'}
        </button>
      </form>
    </motion.div>
  </motion.div>
);

const LeaveManagementView = ({ pending, approved, history, onManage }) => {
  const [activeTab, setActiveTab] = useState('pending');
  const tabs = useMemo(() => ({ pending, approved, history }), [pending, approved, history]);
  const currentData = tabs[activeTab];

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-8">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Leave Requests</h1>
          <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex self-start sm:self-auto">
             {['pending', 'approved', 'history'].map(tab => (
               <button key={tab} onClick={()=>setActiveTab(tab)} className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${activeTab===tab ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                 {tab} {tab==='pending' && pending.length > 0 && <span className="ml-2 px-1.5 py-0.5 bg-white text-emerald-600 text-[10px] rounded-full">{pending.length}</span>}
               </button>
             ))}
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <AnimatePresence mode="popLayout">
            {currentData.length > 0 ? currentData.map((req) => (
              <motion.div layout key={req._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group hover:-translate-y-1">
                 <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex-shrink-0 relative overflow-hidden">
                           {/* Display Avatar if present, else initials */}
                           {req.user?.avatar ? (
                             <Image src={req.user.avatar} layout="fill" objectFit="cover" alt={req.user.name} />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-emerald-600 font-bold bg-emerald-50">{req.user?.name?.charAt(0)}</div>
                           )}
                       </div>
                       <div><p className="font-bold text-slate-800 text-lg leading-tight">{req.user?.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{req.user?.role}</p></div>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide border ${getStatusBadge(req.status)}`}>{req.status}</span>
                 </div>
                 <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm items-center"><span className="text-slate-400 font-bold text-[10px] uppercase">Type</span><span className="font-bold text-slate-700 bg-slate-50 px-3 py-1 rounded-lg">{req.leaveType}</span></div>
                    <div className="flex justify-between text-sm items-center"><span className="text-slate-400 font-bold text-[10px] uppercase">Date</span><span className="font-bold text-slate-700">{formatEnglishDate(req.startDate)} - {formatEnglishDate(req.endDate)}</span></div>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-2xl text-sm text-slate-600 italic mb-6 border border-slate-100/50 leading-relaxed relative">
                    <span className="absolute top-2 left-2 text-slate-300 text-4xl leading-none font-serif opacity-30">"</span>
                    <p className="relative z-10 pl-3">{req.reason}</p>
                 </div>
                 {activeTab === 'pending' && (
                   <button onClick={()=>onManage(req)} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 active:scale-95">Review Request <ChevronRight size={16}/></button>
                 )}
                 {activeTab !== 'pending' && req.hrComments && (
                   <div className="text-xs text-slate-500 mt-2 border-t border-slate-100 pt-3"><span className="font-bold text-slate-700">HR Note:</span> {req.hrComments}</div>
                 )}
              </motion.div>
            )) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-24 text-center text-slate-400 flex flex-col items-center">
                 <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6"><Check size={40} className="opacity-20"/></div>
                 <p className="text-lg font-bold text-slate-400">No requests found here.</p>
              </motion.div>
            )}
         </AnimatePresence>
       </div>
    </motion.div>
  );
};

// --- MAIN LAYOUT COMPONENT ---

export default function HRDashboard({ user, initialAttendance, initialLeaveRequests, allUsers, initialConcludedLeaves, initialApprovedLeaves }) {
  const router = useRouter();
  
  // State
  const [showSplash, setShowSplash] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);

  // Splash Screen Logic
  useEffect(() => { const timer = setTimeout(() => setShowSplash(false), 2000); return () => clearTimeout(timer); }, []);

  // Data State
  const [attendanceRecords, setAttendanceRecords] = useState(initialAttendance);
  const [leaveRequests, setLeaveRequests] = useState(initialLeaveRequests);
  const [concludedLeaves, setConcludedLeaves] = useState(initialConcludedLeaves);
  const [approvedLeaves, setApprovedLeaves] = useState(initialApprovedLeaves);
  const [workHoursData, setWorkHoursData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  // Loading/Interaction States
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  // Modal States
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [currentLeaveItem, setCurrentLeaveItem] = useState(null);
  const [hrComments, setHrComments] = useState('');
  const [isSubmittingLeaveAction, setIsSubmittingLeaveAction] = useState(false);
  const [error, setError] = useState('');
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Notification State
  const [notificationContent, setNotificationContent] = useState('');
  const [targetType, setTargetType] = useState('all');
  const [targetUser, setTargetUser] = useState('');

  // --- Side Effects ---
  useEffect(() => {
    const fetchChartData = async () => {
       setIsLoadingChart(true);
       try {
         const res = await fetch(`/api/hr/work-hours?year=${selectedMonth.getFullYear()}&month=${selectedMonth.getMonth() + 1}`);
         if (!res.ok) throw new Error('Failed to fetch chart');
         const data = await res.json();
         setWorkHoursData(data.data);
       } catch (err) { toast.error("Could not update chart."); } finally { setIsLoadingChart(false); }
    };
    if(activeView === 'dashboard') fetchChartData();
  }, [selectedMonth, activeView]);

  useEffect(() => {
    const closeDrop = (e) => { if(userDropdownRef.current && !userDropdownRef.current.contains(e.target)) setIsDropdownOpen(false); };
    document.addEventListener("mousedown", closeDrop);
    return () => document.removeEventListener("mousedown", closeDrop);
  }, []);

  // --- Handlers ---
  const handleLogout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); };
  const handleMonthChange = (val) => setSelectedMonth(d => { const n = new Date(d); n.setMonth(n.getMonth() + val); return n; });
  const handleNav = (view) => { setActiveView(view); setIsMobileMenuOpen(false); };

  // Leave Handlers
  const openLeaveModal = (req) => { setCurrentLeaveItem(req); setHrComments(req.hrComments||''); setIsLeaveModalOpen(true); };
  const handleManageLeave = async (status) => {
    if (!currentLeaveItem) return;
    setIsSubmittingLeaveAction(true); setError('');
    try {
      const res = await fetch('/api/hr/manage-leave', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ leaveId: currentLeaveItem._id, status, hrComments }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      
      setLeaveRequests(prev => prev.filter(req => req._id !== currentLeaveItem._id));
      const updated = result.data;
      if (status === 'Approved' && new Date(updated.endDate) >= new Date()) {
         setApprovedLeaves(p => [updated, ...p].sort((a,b)=>new Date(a.startDate)-new Date(b.startDate)));
      }
      setConcludedLeaves(p => [updated, ...p].sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt)));
      toast.success(result.message);
      setIsLeaveModalOpen(false);
    } catch (err) { setError(err.message); } finally { setIsSubmittingLeaveAction(false); }
  };

  // Notification Handler
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notificationContent.trim() || (targetType==='individual' && !targetUser)) return toast.error('Check fields');
    setIsSending(true);
    try {
      const res = await fetch('/api/hr/send-notification', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ content: notificationContent, targetType, targetUser: targetType==='individual'?targetUser:null }) });
      if(!res.ok) throw new Error("Failed");
      toast.success('Sent successfully');
      setNotificationContent('');
    } catch (err) { toast.error("Failed to send"); } finally { setIsSending(false); }
  };

  // Attendance CRUD Handlers
  const handleDelete = async () => {
     setIsDeleting(true);
     try {
       await fetch('/api/hr/delete-attendance', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ attendanceId: recordToDelete }) });
       setAttendanceRecords(p => p.filter(a => a._id !== recordToDelete));
       toast.success("Deleted");
       setIsDeleteModalOpen(false);
     } catch (e) { toast.error("Error deleting"); } finally { setIsDeleting(false); }
  };

  const handleUpdate = async (data) => {
    setIsSubmittingEdit(true);
    try {
      const res = await fetch('/api/hr/adjust-checkout', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
      const json = await res.json();
      setAttendanceRecords(p => p.map(r => r._id === data.attendanceId ? json.data : r));
      toast.success("Updated");
      setIsEditModalOpen(false);
    } catch (e) { toast.error("Error updating"); } finally { setIsSubmittingEdit(false); }
  };

  // Render View Switcher
  const renderContent = () => {
    switch(activeView) {
        case 'dashboard': return <DashboardView workHoursData={workHoursData} targetHours={120} selectedMonth={selectedMonth} handleMonthChange={handleMonthChange} isLoadingChart={isLoadingChart} />;
        case 'analytics': return <AnalyticsView />;
        case 'attendance': return <AttendanceView attendanceData={attendanceRecords} allUsers={allUsers} openDeleteModal={(id)=>{setRecordToDelete(id);setIsDeleteModalOpen(true)}} openEditModal={(r)=>{setEditingRecord(r);setIsEditModalOpen(true)}} />;
        case 'leaves': return <LeaveManagementView pending={leaveRequests} approved={approvedLeaves} history={concludedLeaves} onManage={openLeaveModal} />;
        case 'notifications': return <NotificationSender allUsers={allUsers} targetType={targetType} setTargetType={setTargetType} targetUser={targetUser} setTargetUser={setTargetUser} notificationContent={notificationContent} setNotificationContent={setNotificationContent} handleSendNotification={handleSendNotification} isSending={isSending} />;
        default: return null;
    }
  };

const Sidebar = ({ isMobile }) => (
  <div className="h-full flex flex-col relative overflow-hidden bg-white/80 backdrop-blur-xl border-r border-white/50">

    {/* Sidebar Brand Header */}
    <div className="px-6 pt-6 pb-8 border-b border-slate-100 relative z-10">
      <Link href="/dashboard" className="flex items-center gap-3 group">
        <div className="relative">
          <div className="absolute inset-0 bg-green-200 blur-md rounded-full opacity-0 group-hover:opacity-50 transition-opacity" />
          <Image
            src="/hr.png"
            alt="Gecko HR"
            width={55}
            height={55}
            className="relative z-10"
          />
        </div>

        <div className="leading-tight">
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Gecko<span className="text-green-600"> HR</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            HR Management
          </p>
        </div>
      </Link>
    </div>

    {/* Navigation */}
    <nav className="flex-1 px-4 py-6 space-y-2 relative z-10">
      <NavButton
        label="Dashboard"
        icon={<BarChart2 size={20} />}
        isActive={activeView === "dashboard"}
        onClick={() => handleNav("dashboard")}
      />
      <NavButton
        label="Analytics"
        icon={<PieChart size={20} />}
        isActive={activeView === "analytics"}
        onClick={() => handleNav("analytics")}
      />
      <NavButton
        label="Attendance"
        icon={<Clock size={20} />}
        isActive={activeView === "attendance"}
        onClick={() => handleNav("attendance")}
      />
      <NavButton
        label="Leave Requests"
        icon={<Briefcase size={20} />}
        isActive={activeView === "leaves"}
        onClick={() => handleNav("leaves")}
        notificationCount={leaveRequests.length}
      />
      <NavButton
        label="Broadcast"
        icon={<Bell size={20} />}
        isActive={activeView === "notifications"}
        onClick={() => handleNav("notifications")}
      />
    </nav>

    {/* Footer / Logout */}
    <div className="px-4 pb-6 pt-4 border-t border-slate-100 relative z-10">
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-colors font-bold text-sm"
      >
        <LogOut size={20} />
        Sign Out
      </button>
    </div>
  </div>
);



  if (showSplash) return <AnimatePresence mode="wait"><DashboardEntryLoader key="loader" userName={user.name} /></AnimatePresence>;

  return (
    <>
      {isLeaveModalOpen && currentLeaveItem && <ManageLeaveModal item={currentLeaveItem} comments={hrComments} setComments={setHrComments} error={error} onClose={()=>setIsLeaveModalOpen(false)} onSubmit={handleManageLeave} isSubmitting={isSubmittingLeaveAction} />}
      {isDeleteModalOpen && <DeleteModal onConfirm={handleDelete} onClose={()=>setIsDeleteModalOpen(false)} isDeleting={isDeleting} />}
      {isEditModalOpen && editingRecord && <AdjustCheckoutModal record={editingRecord} onClose={()=>setIsEditModalOpen(false)} onUpdate={handleUpdate} isSubmitting={isSubmittingEdit} />}

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={()=>setIsMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 lg:hidden"/>
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 lg:hidden shadow-2xl">
              <Sidebar isMobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-600 selection:bg-emerald-100 selection:text-emerald-900">
         <aside className="hidden lg:block w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 fixed top-0 bottom-0 left-0 z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.02)]">
            <Sidebar />
         </aside>

         <main className="flex-1 lg:ml-72 flex flex-col min-h-screen relative">
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 flex justify-between items-center transition-all">
               <div className="flex items-center gap-4">
                  <button onClick={()=>setIsMobileMenuOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"><Menu size={24}/></button>
                  <h2 className="text-xl font-extrabold text-slate-800 capitalize hidden sm:block tracking-tight">{activeView.replace('-', ' ')}</h2>
               </div>
               
               {/* Premium Profile Pill */}
               <div ref={userDropdownRef} className="relative pl-4 border-l border-slate-200/60 ml-2">
                  <button onClick={()=>setIsDropdownOpen(!isDropdownOpen)} className="group flex items-center gap-3 pl-1 pr-1.5 py-1 rounded-full transition-all duration-300 hover:bg-slate-50 focus:outline-none">
                     <div className="relative">
                        <div className={`absolute inset-0 rounded-full bg-emerald-400 blur-md opacity-0 group-hover:opacity-40 transition-opacity ${isDropdownOpen ? 'opacity-40' : ''}`}></div>
                        <Image src={user.avatar || '/default-avatar.png'} layout="fixed" width={42} height={42} objectFit="cover" className="rounded-full border-2 border-white relative z-10 shadow-sm" alt="User"/>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full z-20"></div>
                     </div>
                     <div className="hidden md:flex flex-col items-start text-left">
                        <span className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{user.name.split(' ')[0]}</span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md mt-0.5 uppercase tracking-wide">HR Admin</span>
                     </div>
                     <div className="hidden md:flex items-center justify-center w-6 h-6 rounded-full bg-slate-50 group-hover:bg-emerald-50 transition-colors">
                        <ChevronDown size={14} className={`text-slate-400 group-hover:text-emerald-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                     </div>
                  </button>
                  <AnimatePresence>
                     {isDropdownOpen && (
                        <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 top-full mt-4 w-60 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden origin-top-right z-50">
                           <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-3">
                               <Image src={user.avatar || '/default-avatar.png'} width={40} height={40} className="rounded-full object-cover border border-white shadow-sm" alt="User" />
                               <div className="overflow-hidden"><p className="font-bold text-slate-800 truncate text-sm">{user.name}</p><p className="text-xs text-slate-500 truncate">{user.role}</p></div>
                           </div>
                           <div className="p-2 space-y-1">
                               <Link href="/hr/add-user" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-colors">
                                  <UserPlus size={16}/> Add New Employee
                               </Link>
                               <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors text-left">
                                  <LogOut size={16}/> Sign Out
                               </button>
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>
            </header>

            <div className="flex-1 p-4 sm:p-8 lg:p-10 overflow-y-auto">
               <AnimatePresence mode="wait">
                  {renderContent()}
               </AnimatePresence>
            </div>
         </main>
      </div>
      
      {/* Mobile Responsive Tables Styles */}
      <style jsx global>{`
        @media (max-width: 768px) {
          td { display: block; width: 100%; text-align: left; padding-left: 0 !important; padding-right: 0 !important; }
          thead { display: none; }
          tr { display: block; margin-bottom: 1.5rem; background: white; border-radius: 1.5rem; padding: 1.5rem; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          tr:last-child { margin-bottom: 0; }
        }
      `}</style>
    </>
  );
}

// Server Side Props
export async function getServerSideProps(context) {
  await dbConnect();
  
  const { token } = context.req.cookies;
  if (!token) { return { redirect: { destination: "/login", permanent: false } }; }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user || user.role !== "HR") {
      return { redirect: { destination: "/dashboard", permanent: false } };
    }
    
    // UPDATED: Removed limits to show ALL records and added 'avatar' to population
    const [allAttendance, allLeaveRequests, allUsers] = await Promise.all([
        Attendance.find({}).populate("user", "name role avatar").sort({ checkInTime: -1 }).lean(), 
        LeaveRequest.find({}).populate('user', 'name role avatar').sort({ createdAt: -1 }).lean(), // Added 'avatar' here
        User.find({ role: { $ne: 'HR' } }).select('name role avatar').sort({ name: 1 }).lean()
    ]);
    
    const now = new Date();
    const pendingLeaveRequests = allLeaveRequests.filter(l => l.status === 'Pending');
    const concludedLeaveRequests = allLeaveRequests.filter(l => l.status === 'Approved' || l.status === 'Rejected').sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    const approvedLeaves = allLeaveRequests.filter(l => l.status === 'Approved' && new Date(l.endDate) >= now).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    return {
      props: {
        user: JSON.parse(JSON.stringify(user)),
        initialAttendance: JSON.parse(JSON.stringify(allAttendance)),
        initialLeaveRequests: JSON.parse(JSON.stringify(pendingLeaveRequests)),
        initialConcludedLeaves: JSON.parse(JSON.stringify(concludedLeaveRequests)),
        initialApprovedLeaves: JSON.parse(JSON.stringify(approvedLeaves)),
        allUsers: JSON.parse(JSON.stringify(allUsers)),
      },
    };
  } catch (error) {
    console.error("HR Dashboard Error:", error);
    context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
    return { redirect: { destination: "/login", permanent: false } };
  }
}
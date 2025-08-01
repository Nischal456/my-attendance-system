import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from 'next/image';
import { Send, Trash2, AlertTriangle, LogOut, Check, X as XIcon, UserPlus, Briefcase, Download, ChevronDown, Bell, Users, BarChart2, Clock, Menu, ChevronLeft, ChevronRight, Edit } from 'react-feather';
import toast, { Toaster } from 'react-hot-toast';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Imports moved from getServerSideProps
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import Attendance from '../../../models/Attendance';
import LeaveRequest from '../../../models/LeaveRequest';


// Register Chart.js components
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- Animation Variants ---
const fadeInUp = {
  initial: { y: 30, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

const modalContent = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { scale: 0.95, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }
};

// --- Helper Functions ---
const formatEnglishDate = (dateString) => { if (!dateString) return '–'; return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }); };
const formatDuration = (totalSeconds) => { if (totalSeconds === null || totalSeconds === undefined || totalSeconds < 0) return '0m'; if (totalSeconds === 0) return '0m'; if (totalSeconds < 60) return `${totalSeconds}s`; const hours = Math.floor(totalSeconds / 3600); const minutes = Math.floor((totalSeconds % 3600) / 60); const parts = []; if (hours > 0) parts.push(`${hours}h`); if (minutes > 0) parts.push(`${minutes}m`); return parts.join(' ') || '0m'; };
const MIN_WORK_SECONDS = 21600; // 6 hours
const getDurationStyle = (attendanceEntry) => { if (attendanceEntry.checkOutTime) { return attendanceEntry.duration >= MIN_WORK_SECONDS ? "text-green-500 font-bold" : "text-red-500 font-bold"; } return "font-bold text-blue-500"; };
const getStatusBadge = (status) => { switch (status) { case 'Approved': return 'bg-green-100 text-green-700 border border-green-200'; case 'Rejected': return 'bg-red-100 text-red-700 border border-red-200'; default: return 'bg-yellow-100 text-yellow-700 border border-yellow-200'; } };

// --- UI Sub-Components ---

const StatCard = ({ title, value, icon, color }) => (
    <motion.div variants={fadeInUp} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 flex items-start gap-4 transition-all duration-300 hover:shadow-lg hover:border-green-400/50 transform hover:-translate-y-1.5">
        <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-lg ${color.bg}`}>{icon}</div>
        <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className={`text-2xl font-bold ${color.text}`}>{value}</p>
        </div>
    </motion.div>
);

const NavButton = ({ label, icon, isActive, onClick, notificationCount = 0 }) => (
    <button onClick={onClick} className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 transform focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 ${ isActive ? 'bg-green-600 text-white shadow-md shadow-green-500/30' : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900' }`}>
        <div className="flex items-center gap-3">{icon}<span>{label}</span></div>
        {notificationCount > 0 && <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">{notificationCount}</span>}
    </button>
);

const WorkHoursChart = ({ data, targetHours }) => {
    const chartData = {
        labels: data.map(d => d.name),
        datasets: [
            {
                label: 'Actual Hours Worked',
                data: data.map(d => d.totalHours),
                backgroundColor: 'rgba(34, 197, 94, 0.7)',
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 1,
                borderRadius: 4,
            },
            {
                label: 'Monthly Target',
                data: data.map(() => targetHours),
                backgroundColor: 'rgba(203, 213, 225, 0.5)',
                borderColor: 'rgba(203, 213, 225, 1)',
                borderWidth: 1,
                borderRadius: 4,
            }
        ]
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Employee Monthly Work Hours', font: { size: 16, family: 'sans-serif' }, color: '#334155' },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) { label += ': '; }
                        if (context.parsed.y !== null) { label += context.parsed.y.toFixed(2) + ' hours'; }
                        return label;
                    }
                }
            }
        },
        scales: { 
            y: { 
                beginAtZero: true, 
                title: { display: true, text: 'Hours' },
                grid: {
                    color: '#e2e8f0' // slate-200
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    };
    return <Bar data={chartData} options={options} />;
};

const ManageLeaveModal = ({ item, comments, setComments, error, onClose, onSubmit, isSubmitting }) => (
    <AnimatePresence>
        <motion.div variants={modalBackdrop} initial="initial" animate="animate" exit="exit" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <motion.div variants={modalContent} className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg">
                <h3 className="text-2xl font-bold mb-6 text-slate-800">Manage Leave Request</h3>
                <div className="text-sm space-y-3 p-4 bg-slate-50 rounded-lg mb-5 border">
                    <p><strong>Employee:</strong> <span className="font-medium text-slate-700">{item.user.name} ({item.user.role})</span></p>
                    <p><strong>Dates:</strong> <span className="font-medium text-slate-700">{formatEnglishDate(item.startDate)} to {formatEnglishDate(item.endDate)}</span></p>
                    <p><strong>Type:</strong> <span className="font-medium text-slate-700">{item.leaveType}</span></p>
                    <div className="pt-2 border-t mt-2"><p className="font-semibold text-slate-600">Reason:</p><p className="text-slate-700 whitespace-pre-wrap">{item.reason}</p></div>
                </div>
                <div>
                    <label htmlFor="hrComments" className="block text-sm font-semibold text-slate-600 mb-1">Add or Edit HR Comments</label>
                    <textarea id="hrComments" value={comments} onChange={(e) => setComments(e.target.value)} rows="3" className="w-full mt-1 p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="Optional comments..."></textarea>
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 bg-slate-200 font-semibold rounded-lg disabled:opacity-50">Cancel</motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => onSubmit('Rejected')} disabled={isSubmitting} className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"><XIcon size={16}/> Reject</motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => onSubmit('Approved')} disabled={isSubmitting} className="px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"><Check size={16}/> Approve</motion.button>
                </div>
            </motion.div>
        </motion.div>
    </AnimatePresence>
);

const DeleteModal = ({ onConfirm, onClose, isDeleting }) => (
    <AnimatePresence>
        <motion.div variants={modalBackdrop} initial="initial" animate="animate" exit="exit" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <motion.div variants={modalContent} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                <div className="flex items-start"><div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"><AlertTriangle className="h-6 w-6 text-red-600"/></div><div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left"><h3 className="text-lg font-bold text-slate-900">Delete Record</h3><p className="text-sm text-slate-500 mt-2">Are you sure you want to delete this record? This action cannot be undone.</p></div></div>
                <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={onClose} disabled={isDeleting} className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 font-semibold rounded-lg disabled:opacity-50">Cancel</motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={onConfirm} disabled={isDeleting} className="w-full sm:w-auto px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">{isDeleting ? 'Deleting...' : 'Delete'}</motion.button>
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
        if (!newCheckoutTime) {
            setError('Please select a valid date and time.');
            return;
        }
        if (new Date(newCheckoutTime) <= new Date(record.checkInTime)) {
            setError('Checkout time must be after check-in time.');
            return;
        }
        onUpdate({ attendanceId: record._id, newCheckoutTime });
    };

    return (
        <AnimatePresence>
            <motion.div variants={modalBackdrop} initial="initial" animate="animate" exit="exit" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <motion.div variants={modalContent} className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg">
                    <h3 className="text-2xl font-bold mb-6 text-slate-800">Adjust Checkout Time</h3>
                    <div className="text-sm space-y-3 p-4 bg-slate-50 rounded-lg mb-5 border">
                        <p><strong>Employee:</strong> <span className="font-medium text-slate-700">{record.user.name}</span></p>
                        <p><strong>Checked In:</strong> <span className="font-medium text-slate-700">{new Date(record.checkInTime).toLocaleString()}</span></p>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="newCheckoutTime" className="block text-sm font-semibold text-slate-600 mb-1">New Checkout Date & Time</label>
                             <DatePicker
                                selected={newCheckoutTime}
                                onChange={(date) => setNewCheckoutTime(date)}
                                showTimeSelect
                                timeFormat="h:mm aa"
                                timeIntervals={15}
                                dateFormat="MMMM d, yyyy h:mm aa"
                                className="w-full mt-1 p-2.5 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                wrapperClassName="w-full"
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                        <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                            <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 disabled:opacity-50">Cancel</motion.button>
                            <motion.button whileTap={{ scale: 0.95 }} type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50">
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};


// --- Page Views ---

const DashboardView = ({ workHoursData, targetHours, selectedMonth, handleMonthChange, isLoadingChart }) => (
    <motion.div key="dashboard" variants={fadeInUp} initial="initial" animate="animate" className="space-y-8">
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80">
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
                <h2 className="text-xl font-bold text-slate-800">Team Work Hours</h2>
                <div className="flex items-center gap-2 mt-3 sm:mt-0"><button onClick={() => handleMonthChange(-1)} className="p-2 rounded-full hover:bg-slate-100"><ChevronLeft size={20} /></button><span className="font-semibold text-center w-32">{selectedMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</span><button onClick={() => handleMonthChange(1)} className="p-2 rounded-full hover:bg-slate-100"><ChevronRight size={20} /></button></div>
            </motion.div>
            <motion.div variants={fadeInUp} className="h-96 relative">{isLoadingChart ? <div className="absolute inset-0 flex items-center justify-center text-slate-500">Loading Chart Data...</div> : (workHoursData.length > 0 ? <WorkHoursChart data={workHoursData} targetHours={targetHours} /> : <div className="absolute inset-0 flex items-center justify-center text-slate-500">No attendance data found for this month.</div>)}</motion.div>
        </motion.div>
    </motion.div>
);

const AttendanceView = ({ attendanceData, allUsers, openDeleteModal, openEditModal }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const filteredAttendance = useMemo(() => {
        let result = attendanceData;
        if (searchQuery) { result = result.filter(att => att.user?.name.toLowerCase().includes(searchQuery.toLowerCase())); }
        if (dateRange.start) { result = result.filter(att => new Date(att.checkInTime) >= new Date(dateRange.start)); }
        if (dateRange.end) { result = result.filter(att => new Date(att.checkInTime) <= new Date(new Date(dateRange.end).setHours(23, 59, 59, 999))); }
        return result;
    }, [searchQuery, dateRange, attendanceData]);

    const completedDays = filteredAttendance.filter((att) => att.checkOutTime);
    const totalWorkSeconds = completedDays.reduce((acc, att) => acc + (att.duration || 0), 0);
    const daysMeetingTarget = completedDays.filter((day) => day.duration >= MIN_WORK_SECONDS).length;

    const handleDownloadCSV = (data) => {
        if (data.length === 0) {
            toast.error("No data available to download.");
            return;
        }
    
        const sanitizeField = (field) => {
            if (field === null || field === undefined) return '""';
            const str = String(field);
            return `"${str.replace(/"/g, '""')}"`;
        };
    
        const headers = ["Employee Name", "Role", "Date", "Check-In", "Check-Out", "Work Duration (Hours)", "Break Duration (Minutes)", "Work Description"].join(',');
    
        const rows = data.map(att => [
            sanitizeField(att.user?.name || 'N/A'),
            sanitizeField(att.user?.role || 'N/A'),
            sanitizeField(formatEnglishDate(att.checkInTime)),
            sanitizeField(new Date(att.checkInTime).toLocaleTimeString('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' })),
            sanitizeField(att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' }) : 'N/A'),
            att.duration ? (att.duration / 3600).toFixed(2) : '0.00',
            att.totalBreakDuration ? Math.round(att.totalBreakDuration / 60) : '0',
            sanitizeField(att.description || '')
        ].join(','));
    
        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }); 
    
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <motion.div key="attendance" variants={fadeInUp} initial="initial" animate="animate" className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-800">Attendance Overview</h1>
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Logged Time" value={formatDuration(totalWorkSeconds)} icon={<Clock size={24} className="text-green-600" />} color={{ bg: 'bg-green-100', text: 'text-green-600' }} />
                <StatCard title="Days Meeting Target" value={`${daysMeetingTarget} / ${completedDays.length}`} icon={<Check size={24} className="text-blue-600" />} color={{ bg: 'bg-blue-100', text: 'text-blue-600' }} />
                <StatCard title="Active Employees" value={allUsers.length} icon={<Users size={24} className="text-indigo-600" />} color={{ bg: 'bg-indigo-100', text: 'text-indigo-600' }} />
            </motion.div>
            <motion.div variants={fadeInUp} className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80">
                <h2 className="text-xl font-semibold mb-4 text-slate-800">Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <label htmlFor="search-filter" className="block text-sm font-medium mb-1 text-slate-600">Search by Name</label>
                        <input id="search-filter" type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="e.g. Nischal Shrestha" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"/>
                    </div>
                    <div>
                        <label htmlFor="start-date-filter" className="block text-sm font-medium mb-1 text-slate-600">Start Date</label>
                        <input id="start-date-filter" type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"/>
                    </div>
                    <div>
                        <label htmlFor="end-date-filter" className="block text-sm font-medium mb-1 text-slate-600">End Date</label>
                        <input id="end-date-filter" type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"/>
                    </div>
                </div>
            </motion.div>
            <motion.div variants={fadeInUp} className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5">
                    <div><h2 className="text-xl font-semibold text-slate-800">Attendance History</h2><p className="text-sm text-slate-500 mt-1">Showing {filteredAttendance.length} records</p></div>
                    <motion.button whileTap={{scale: 0.95}} onClick={() => handleDownloadCSV(filteredAttendance)} className="mt-4 md:mt-0 bg-slate-700 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50" disabled={filteredAttendance.length === 0}><Download size={16}/>Download CSV</motion.button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 hidden md:table-header-group">
                            <tr>
                                <th scope="col" className="px-6 py-3">Staff</th>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Check-In/Out</th>
                                <th scope="col" className="px-6 py-3">Break</th>
                                <th scope="col" className="px-6 py-3">Work Time</th>
                                <th scope="col" className="px-6 py-3">Description</th>
                                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAttendance.map((att) => (
                                <tr key={att._id} className="bg-white border-b last:border-none md:border-none md:hover:bg-slate-50/70 block md:table-row mb-4 md:mb-0 rounded-lg shadow-md md:shadow-none p-4 md:p-0">
                                    <td data-label="Staff" className="flex justify-between items-center md:table-cell px-2 py-2 md:px-6 md:py-4 font-medium text-slate-900 whitespace-nowrap"><div className="flex items-center"><div className="flex-shrink-0 h-10 w-10"><Image className="h-10 w-10 rounded-full object-cover" src={att.user?.avatar || '/default-avatar.png'} alt={att.user?.name || ''} width={40} height={40}/></div><div className="ml-4"><div className="font-medium">{att.user?.name || "Deleted"}</div><div className="text-sm text-slate-500">{att.user?.role || "N/A"}</div></div></div></td>
                                    <td data-label="Date" className="flex justify-between items-center md:table-cell px-2 py-2 md:px-6 md:py-4">{formatEnglishDate(att.checkInTime)}</td>
                                    <td data-label="Check-In/Out" className="flex justify-between items-center md:table-cell px-2 py-2 md:px-6 md:py-4"><div>{new Date(att.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div><div>{att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : <span className="text-blue-500 font-semibold">Active</span>}</div></td>
                                    <td data-label="Break" className="flex justify-between items-center md:table-cell px-2 py-2 md:px-6 md:py-4">{formatDuration(att.totalBreakDuration)}</td>
                                    <td data-label="Work Time" className={`flex justify-between items-center md:table-cell px-2 py-2 md:px-6 md:py-4 ${getDurationStyle(att)}`}>{formatDuration(att.duration)}</td>
                                    <td data-label="Description" className="flex justify-between items-center md:table-cell px-2 py-2 md:px-6 md:py-4 max-w-full md:max-w-sm"><p className="whitespace-pre-wrap break-words text-right md:text-left">{att.description || '–'}</p></td>
                                    <td data-label="Actions" className="flex justify-end items-center md:table-cell md:text-center px-2 py-2 md:px-6 md:py-4">
                                        <div className="flex items-center justify-center md:justify-end gap-1">
                                            <button onClick={() => openEditModal(att)} className="text-slate-400 hover:text-green-600 p-2 rounded-full transition-colors"><Edit size={18} /></button>
                                            <button onClick={() => openDeleteModal(att._id)} className="text-slate-400 hover:text-red-600 p-2 rounded-full transition-colors"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredAttendance.length === 0 && (<tr><td colSpan="7" className="text-center py-10 text-slate-500">No records found.</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </motion.div>
    );
};

const NotificationSender = ({ allUsers, targetType, setTargetType, targetUser, setTargetUser, notificationContent, setNotificationContent, handleSendNotification, isSending }) => (
    <motion.div key="notifications" variants={fadeInUp} initial="initial" animate="animate" className="space-y-8">
        <h1 className="text-3xl font-bold text-slate-800">Broadcast Notifications</h1>
        <motion.div variants={fadeInUp} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200/80">
            <form onSubmit={handleSendNotification} className="space-y-6">
                <div>
                    <label className="block text-md font-semibold mb-3">Send To</label>
                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2"><input type="radio" name="targetType" value="all" checked={targetType === 'all'} onChange={(e) => setTargetType(e.target.value)} className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500" />All Employees</label>
                        <label className="flex items-center gap-2"><input type="radio" name="targetType" value="individual" checked={targetType === 'individual'} onChange={(e) => setTargetType(e.target.value)} className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"/>Specific Employee</label>
                    </div>
                </div>
                <AnimatePresence>
                    {targetType === 'individual' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                            <label htmlFor="targetUser" className="block text-sm font-medium text-slate-700 mb-1">Select Employee</label>
                            <select id="targetUser" value={targetUser} onChange={(e) => setTargetUser(e.target.value)} required className="w-full mt-1 p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                <option value="" disabled>-- Select an employee --</option>
                                {allUsers.map((u) => (<option key={u._id} value={u._id}>{u.name} ({u.role})</option>))}
                            </select>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div>
                    <label htmlFor="notification-content" className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                    <textarea id="notification-content" value={notificationContent} onChange={(e) => setNotificationContent(e.target.value)} rows="5" className="w-full mt-1 p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" required placeholder="Type your announcement here..."></textarea>
                </div>
                <div className="flex justify-end">
                    <motion.button whileTap={{scale: 0.95}} type="submit" disabled={isSending} className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 disabled:opacity-50"><Send size={16} />{isSending ? 'Sending...' : 'Send Notification'}</motion.button>
                </div>
            </form>
        </motion.div>
    </motion.div>
);

const LeaveManagementView = ({ pending, approved, history, onManage }) => {
    const [activeTab, setActiveTab] = useState('pending');
    const tabs = { pending, approved, history };
    const currentData = tabs[activeTab];
    
    const LeaveRow = ({ req }) => (
         <tr className="bg-white border-b last:border-none md:border-none md:hover:bg-slate-50/70 block md:table-row mb-4 md:mb-0 rounded-lg shadow-md md:shadow-none p-4 md:p-0">
            <td data-label="Employee" className="flex justify-between items-center md:table-cell px-2 py-2 md:px-6 md:py-4 whitespace-nowrap"><div className="font-medium">{req.user?.name || 'N/A'}</div><div className="text-sm text-slate-500">{req.user?.role || ''}</div></td>
            <td data-label="Dates & Type" className="flex justify-between items-center md:table-cell px-2 py-2 md:px-6 md:py-4 whitespace-nowrap"><div className="text-sm">{formatEnglishDate(req.startDate)} to {formatEnglishDate(req.endDate)}</div><div className="text-sm font-medium">{req.leaveType}</div></td>
            <td data-label={activeTab === 'pending' ? 'Reason' : 'HR Comments'} className="flex justify-between items-center md:table-cell px-2 py-2 md:px-6 md:py-4 text-sm max-w-full md:max-w-xs"><p className="whitespace-pre-wrap break-words text-right md:text-left">{activeTab === 'pending' ? req.reason : req.hrComments || '–'}</p></td>
            <td data-label={activeTab === 'pending' ? 'Actions' : 'Status'} className="flex justify-end items-center md:justify-center md:table-cell px-2 py-2 md:px-6 md:py-4 whitespace-nowrap">
                {activeTab === 'pending' ? (<button onClick={() => onManage(req)} className="p-2 text-green-600 hover:bg-green-100 rounded-full"><Send size={20} /></button>) : (<span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full ${getStatusBadge(req.status)}`}>{req.status}</span>)}
            </td>
        </tr>
    );

    return (
        <motion.div key="leaves" variants={fadeInUp} initial="initial" animate="animate" className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-800">Leave Management</h1>
            <motion.div variants={fadeInUp} className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80">
                <div className="border-b border-gray-200 mb-4">
                    <nav className="-mb-px flex space-x-4 sm:space-x-8" aria-label="Tabs">
                        <button onClick={() => setActiveTab('pending')} className={`relative whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'pending' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Pending {pending.length > 0 && <span className="ml-2 bg-yellow-200 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span>}</button>
                        <button onClick={() => setActiveTab('approved')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'approved' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Approved</button>
                        <button onClick={() => setActiveTab('history')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'history' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>History</button>
                    </nav>
                </div>
                <div className="overflow-x-auto">
                    <AnimatePresence mode="wait">
                        <motion.table key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 hidden md:table-header-group">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Employee</th>
                                    <th scope="col" className="px-6 py-3">Dates & Type</th>
                                    <th scope="col" className="px-6 py-3">{activeTab === 'pending' ? 'Reason' : 'HR Comments'}</th>
                                    <th scope="col" className="px-6 py-3 text-center">{activeTab === 'pending' ? 'Actions' : 'Status'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentData.length > 0 ? currentData.map(req => <LeaveRow key={req._id} req={req} />) : <tr><td colSpan="4" className="text-center py-10 text-slate-500">No requests in this category.</td></tr>}
                            </tbody>
                        </motion.table>
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default function HRDashboard({ user, initialAttendance, initialLeaveRequests, allUsers, initialConcludedLeaves, initialApprovedLeaves }) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState(initialAttendance);
  const [leaveRequests, setLeaveRequests] = useState(initialLeaveRequests);
  const [concludedLeaves, setConcludedLeaves] = useState(initialConcludedLeaves);
  const [approvedLeaves, setApprovedLeaves] = useState(initialApprovedLeaves);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [currentLeaveItem, setCurrentLeaveItem] = useState(null);
  const [hrComments, setHrComments] = useState('');
  const [isSubmittingLeaveAction, setIsSubmittingLeaveAction] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [notificationContent, setNotificationContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [targetType, setTargetType] = useState('all');
  const [targetUser, setTargetUser] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const [workHoursData, setWorkHoursData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const MONTHLY_HOUR_TARGET = 120;

  // --- Data Fetching & Side Effects ---
  useEffect(() => {
    const fetchChartData = async () => {
        setIsLoadingChart(true);
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth() + 1;
        try {
            const res = await fetch(`/api/hr/work-hours?year=${year}&month=${month}`);
            if (!res.ok) throw new Error('Failed to fetch chart data');
            const data = await res.json();
            setWorkHoursData(data.data);
        } catch (error) { 
            console.error(error); 
            toast.error(error.message); 
        } finally { 
            setIsLoadingChart(false); 
        }
    };
    if(activeView === 'dashboard') { fetchChartData(); }
  }, [selectedMonth, activeView]);

  useEffect(() => {
    const handleClickOutside = (event) => { if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) { setIsDropdownOpen(false); } }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // --- Handlers ---
  const handleLogout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); };
  const openLeaveModal = (request) => { setCurrentLeaveItem(request); setHrComments(request.hrComments || ''); setIsLeaveModalOpen(true); };
  const closeLeaveModal = () => { setIsLeaveModalOpen(false); setCurrentLeaveItem(null); setHrComments(''); setError(''); };

  const handleManageLeave = async (newStatus) => {
     if (!currentLeaveItem) return;
     setIsSubmittingLeaveAction(true);
     setError('');
     const loadingToast = toast.loading(`Updating leave to ${newStatus}...`);
     try {
         const res = await fetch('/api/hr/manage-leave', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leaveId: currentLeaveItem._id, status: newStatus, hrComments: hrComments }) });
         const result = await res.json();
         if (!res.ok) throw new Error(result.message || "An unknown error occurred.");
         
         const updatedLeave = result.data;

         setLeaveRequests(prev => prev.filter(req => req._id !== currentLeaveItem._id));
         
         if (newStatus === 'Approved' && new Date(updatedLeave.endDate) >= new Date()) {
            setApprovedLeaves(prev => [updatedLeave, ...prev].sort((a,b) => new Date(a.startDate) - new Date(b.startDate)));
         } else {
            setApprovedLeaves(prev => prev.filter(req => req._id !== currentLeaveItem._id));
         }
         
         setConcludedLeaves(prev => [updatedLeave, ...prev].sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
         
         toast.success(result.message, { id: loadingToast });
         closeLeaveModal();
     } catch (err) {
         toast.error(err.message, { id: loadingToast });
         setError(err.message);
     } finally {
         setIsSubmittingLeaveAction(false);
     }
  };

  const handleMonthChange = (increment) => { setSelectedMonth(prevDate => { const newDate = new Date(prevDate); newDate.setMonth(newDate.getMonth() + increment); return newDate; }); };
  const handleMobileNavClick = (view) => { setActiveView(view); setIsMobileMenuOpen(false); };
  
  const handleSendNotification = async (e) => { 
      e.preventDefault(); 
      if (!notificationContent.trim() || (targetType === 'individual' && !targetUser)) { toast.error('Please fill all required fields.'); return; } 
      setIsSending(true); 
      const loadingToast = toast.loading('Sending notification...'); 
      try { 
          const res = await fetch('/api/hr/send-notification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: notificationContent, targetType, targetUser: targetType === 'individual' ? targetUser : null }) }); 
          const data = await res.json(); 
          if (!res.ok) throw new Error(data.message); 
          toast.success(data.message, { id: loadingToast }); 
          setNotificationContent(''); setTargetUser(''); setTargetType('all'); 
      } catch (err) { 
          toast.error(err.message, { id: loadingToast }); 
      } finally { 
          setIsSending(false); 
      } 
  };
  
  const openDeleteModal = (attendanceId) => { setRecordToDelete(attendanceId); setIsDeleteModalOpen(true); };
  const closeDeleteModal = () => { setRecordToDelete(null); setIsDeleteModalOpen(false); };
  
  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    setIsDeleting(true);
    const loadingToast = toast.loading("Deleting record...");
    try {
        const res = await fetch('/api/hr/delete-attendance', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attendanceId: recordToDelete })
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || 'Server error');
        }
        setAttendanceRecords(prev => prev.filter(att => att._id !== recordToDelete));
        toast.success("Record deleted successfully.", { id: loadingToast });
    } catch (err) {
        toast.error(err.message || 'Failed to delete record.', { id: loadingToast });
    } finally {
        setIsDeleting(false);
        closeDeleteModal();
    }
  };
  
  const openEditModal = (record) => { setEditingRecord(record); setIsEditModalOpen(true); };
  const closeEditModal = () => { setEditingRecord(null); setIsEditModalOpen(false); };

  const handleUpdateAttendance = async ({ attendanceId, newCheckoutTime }) => {
    setIsSubmittingEdit(true);
    const loadingToast = toast.loading('Updating record...');
    try {
        const res = await fetch('/api/hr/adjust-checkout', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attendanceId, newCheckoutTime })
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message);
        
        setAttendanceRecords(prev => prev.map(rec => rec._id === attendanceId ? result.data : rec));
        
        toast.success(result.message, { id: loadingToast });
        closeEditModal();
    } catch (err) {
        toast.error(err.message || 'Failed to update record.', { id: loadingToast });
    } finally {
        setIsSubmittingEdit(false);
    }
  };

  const renderContent = () => {
      switch(activeView) {
          case 'dashboard': return <DashboardView workHoursData={workHoursData} targetHours={MONTHLY_HOUR_TARGET} selectedMonth={selectedMonth} handleMonthChange={handleMonthChange} isLoadingChart={isLoadingChart} />;
          case 'attendance': return <AttendanceView attendanceData={attendanceRecords} allUsers={allUsers} openDeleteModal={openDeleteModal} openEditModal={openEditModal} />;
          case 'notifications': return <NotificationSender allUsers={allUsers} targetType={targetType} setTargetType={setTargetType} targetUser={targetUser} setTargetUser={setTargetUser} notificationContent={notificationContent} setNotificationContent={setNotificationContent} handleSendNotification={handleSendNotification} isSending={isSending} />;
          case 'leaves': return <LeaveManagementView pending={leaveRequests} approved={approvedLeaves} history={concludedLeaves} onManage={openLeaveModal} />;
          default: return <DashboardView workHoursData={workHoursData} targetHours={MONTHLY_HOUR_TARGET} selectedMonth={selectedMonth} handleMonthChange={handleMonthChange} isLoadingChart={isLoadingChart} />;
      }
  };

  const MainNav = ({ isMobile = false }) => (
    <nav className="flex-1 space-y-2">
        <NavButton label="Dashboard" icon={<BarChart2 size={20} />} isActive={activeView === 'dashboard'} onClick={() => isMobile ? handleMobileNavClick('dashboard') : setActiveView('dashboard')} />
        <NavButton label="Attendance" icon={<Clock size={20} />} isActive={activeView === 'attendance'} onClick={() => isMobile ? handleMobileNavClick('attendance') : setActiveView('attendance')} />
        <NavButton label="Leave Management" icon={<Briefcase size={20} />} isActive={activeView === 'leaves'} onClick={() => isMobile ? handleMobileNavClick('leaves') : setActiveView('leaves')} notificationCount={leaveRequests.length}/>
        <NavButton label="Notifications" icon={<Bell size={20} />} isActive={activeView === 'notifications'} onClick={() => isMobile ? handleMobileNavClick('notifications') : setActiveView('notifications')} />
    </nav>
  );

  return (
    <>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      
      {isLeaveModalOpen && <ManageLeaveModal item={currentLeaveItem} comments={hrComments} setComments={setHrComments} error={error} onClose={closeLeaveModal} onSubmit={handleManageLeave} isSubmitting={isSubmittingLeaveAction} />}
      {isDeleteModalOpen && <DeleteModal onConfirm={handleConfirmDelete} onClose={closeDeleteModal} isDeleting={isDeleting} />}
      {isEditModalOpen && <AdjustCheckoutModal record={editingRecord} onClose={closeEditModal} onUpdate={handleUpdateAttendance} isSubmitting={isSubmittingEdit} />}
      
      {/* Mobile Menu Overlay & Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div key="backdrop" variants={modalBackdrop} initial="initial" animate="animate" exit="exit" className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
            <motion.div key="mobilesidebar" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "tween", ease: "circOut", duration: 0.4 }} className="fixed top-0 left-0 h-full w-64 bg-white z-50 lg:hidden shadow-xl">
              <div className="p-4"><div className="flex items-center gap-3 mb-10 px-2"><Image src="/geckoworks.png" alt="Logo" width={40} height={40} /><h1 className="text-xl font-bold text-slate-800">Gecko HR</h1></div><MainNav isMobile /></div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="min-h-screen w-full bg-slate-100 font-sans flex">
        {/* Desktop Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200/80 flex-col p-4 hidden lg:flex">
            <div className="flex items-center gap-3 mb-10 px-2"><Image src="/geckoworks.png" alt="Logo" width={40} height={40} /><h1 className="text-xl font-bold text-slate-800">Gecko HR</h1></div>
            <MainNav />
        </aside>

        <main className="flex-1 flex flex-col max-w-full overflow-hidden">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 p-4 lg:px-10 flex justify-between items-center sticky top-0 z-30">
                <button className="lg:hidden text-slate-600 hover:text-green-600" onClick={() => setIsMobileMenuOpen(true)}><Menu size={24} /></button>
                <div className="flex-1"></div>
                <div ref={userDropdownRef} className="relative">
                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors"><span className="font-semibold text-sm text-slate-700 hidden sm:inline">{user.name}</span><Image src={user.avatar} width={40} height={40} className="rounded-full object-cover" alt="User Avatar"/><ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} /></button>
                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="absolute top-full right-0 mt-2 w-56 rounded-xl shadow-2xl bg-white ring-1 ring-black ring-opacity-5 z-40 origin-top-right"><div className="px-4 py-3 border-b border-slate-200/80"><p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p><p className="text-xs text-slate-500">{user.role}</p></div><div className="p-1"><Link href="/hr/add-user" className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-3 rounded-md"><UserPlus className="h-4 w-4"/>Add Employee</Link><button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-3 rounded-md"><LogOut className="h-4 w-4"/>Sign Out</button></div></motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto">
                <AnimatePresence mode="wait">
                    {renderContent()}
                </AnimatePresence>
            </div>
        </main>
      </div>
      <style jsx global>{`
        /* Mobile-First Responsive Table Styles */
        @media (max-width: 767px) {
            td[data-label]::before {
                content: attr(data-label);
                font-weight: 600;
                text-align: left;
                margin-right: 1rem;
                color: #475569; /* slate-600 */
                flex-shrink: 0;
            }
            .block.md\\:table-row > td {
                border-bottom: 1px dashed #e2e8f0; /* slate-200 */
            }
             .block.md\\:table-row > td:last-child {
                border-bottom: none;
            }
        }
        .react-datepicker-wrapper {
            width: 100%;
        }
      `}</style>
    </>
  );
}

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
    const [allAttendance, allLeaveRequests, allUsers] = await Promise.all([
        Attendance.find({}).populate("user", "name role avatar").sort({ checkInTime: -1 }).lean(),
        LeaveRequest.find({}).populate('user', 'name role').sort({ createdAt: -1 }).lean(),
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
    console.error("HR Dashboard getServerSideProps Error:", error);
    context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
    return { redirect: { destination: "/login", permanent: false } };
  }
}
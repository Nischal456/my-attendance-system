"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from 'next/image';
import jwt from "jsonwebtoken";
import dbConnect from "../../../lib/dbConnect";
import User from "../../../models/User";
import Attendance from "../../../models/Attendance";
import LeaveRequest from "../../../models/LeaveRequest";
import { Send, Trash2, AlertTriangle, LogOut, Check, X as XIcon, UserPlus, Calendar, Briefcase, Download, Archive, ThumbsUp, ChevronDown, Bell, Users, BarChart2, Clock, Menu } from 'react-feather';

// --- Helper Functions (No Changes) ---
const formatEnglishDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
};
const formatDuration = (totalSeconds) => {
  if (totalSeconds === null || totalSeconds === undefined || totalSeconds < 0) return '0 mins';
  if (totalSeconds === 0) return '0 mins';
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
  if (attendanceEntry.checkOutTime) { return attendanceEntry.duration >= MIN_WORK_SECONDS ? "text-green-600 font-bold" : "text-red-600 font-bold"; }
  return "font-bold text-blue-600";
};
const getStatusBadge = (status) => {
    switch (status) {
        case 'Approved': return 'bg-green-100 text-green-700 border border-green-200';
        case 'Rejected': return 'bg-red-100 text-red-700 border border-red-200';
        default: return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    }
}

// --- UI Sub-Components ---
const StatCard = ({ title, value, icon, color, delay }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 flex items-start gap-4 transition-all duration-300 hover:shadow-md hover:border-green-300/50 transform hover:-translate-y-1 animate-fade-in-up" style={{ animationDelay: `${delay * 100}ms` }}>
        <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-lg ${color.bg}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className={`text-2xl font-bold ${color.text}`}>{value}</p>
        </div>
    </div>
);

const NavButton = ({ label, icon, isActive, onClick, isMobile = false }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105 ${
            isActive ? 'bg-green-600 text-white shadow-md shadow-green-500/20' : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
        } ${isMobile && 'text-lg py-4'}`}
    >
        {icon}
        <span>{label}</span>
    </button>
);


// --- Main HR Dashboard Component ---
export default function HRDashboard({ user, initialAttendance, initialLeaveRequests, allUsers, initialConcludedLeaves, initialApprovedLeaves }) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [allAttendance, setAllAttendance] = useState(initialAttendance);
  const [filteredAttendance, setFilteredAttendance] = useState(initialAttendance);
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedUser, setSelectedUser] = useState("All");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [notificationContent, setNotificationContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState(initialLeaveRequests);
  const [concludedLeaves, setConcludedLeaves] = useState(initialConcludedLeaves);
  const [approvedLeaves, setApprovedLeaves] = useState(initialApprovedLeaves);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [currentLeaveItem, setCurrentLeaveItem] = useState(null);
  const [hrComments, setHrComments] = useState('');
  const [isSubmittingLeaveAction, setIsSubmittingLeaveAction] = useState(false);
  const [activeView, setActiveView] = useState('attendance');
  const [targetType, setTargetType] = useState('all');
  const [targetUser, setTargetUser] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);

  useEffect(() => {
    let result = allAttendance;
    if (selectedRole !== "All") result = result.filter((att) => att.user?.role === selectedRole);
    if (selectedUser !== "All") result = result.filter((att) => att.user?._id === selectedUser);
    setFilteredAttendance(result);
  }, [selectedRole, selectedUser, allAttendance]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
          setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const completedDaysSummary = filteredAttendance.filter((att) => att.checkOutTime);
  const totalWorkSecondsSummary = completedDaysSummary.reduce((acc, att) => acc + (att.duration || 0), 0);
  const daysMeetingTargetSummary = completedDaysSummary.filter((day) => day.duration >= MIN_WORK_SECONDS).length;

  const handleLogout = async () => { await fetch("/api/auth/logout"); router.push("/login"); };
  const openDeleteModal = (attendanceId) => { setRecordToDelete(attendanceId); setIsDeleteModalOpen(true); };
  const closeDeleteModal = () => { setRecordToDelete(null); setIsDeleteModalOpen(false); };
  const handleConfirmDelete = async () => { if (!recordToDelete) return; setError(''); setIsDeleting(true); try { const res = await fetch('/api/hr/delete-attendance', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attendanceId: recordToDelete }) }); if (!res.ok) { const data = await res.json(); throw new Error(data.message); } setAllAttendance(prev => prev.filter(att => att._id !== recordToDelete)); setMessage("Record deleted."); setTimeout(() => setMessage(''), 3000); } catch (err) { setError(err.message || 'Failed to delete record.'); } finally { setIsDeleting(false); closeDeleteModal(); } };
  
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notificationContent.trim() || (targetType === 'individual' && !targetUser)) { setError('Please fill all required fields.'); return; }
    setIsSending(true); setMessage(''); setError('');
    try {
      const res = await fetch('/api/hr/send-notification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: notificationContent, targetType, targetUser: targetType === 'individual' ? targetUser : null }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage(data.message); setNotificationContent(''); setTargetUser(''); setTargetType('all');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setError(err.message); } finally { setIsSending(false); }
  };

  const openLeaveModal = (request) => { setCurrentLeaveItem(request); setHrComments(request.hrComments || ''); setIsLeaveModalOpen(true); };
  const closeLeaveModal = () => { setIsLeaveModalOpen(false); setCurrentLeaveItem(null); setHrComments(''); setError(''); };
  const handleManageLeave = async (newStatus) => { if (!currentLeaveItem) return; setIsSubmittingLeaveAction(true); setMessage(''); setError(''); try { const res = await fetch('/api/hr/manage-leave', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leaveId: currentLeaveItem._id, status: newStatus, hrComments: hrComments }) }); const result = await res.json(); if (!res.ok) throw new Error(result.message); setLeaveRequests(prev => prev.filter(req => req._id !== currentLeaveItem._id)); if(newStatus === 'Approved') { setApprovedLeaves(prev => [result.data, ...prev]); } setConcludedLeaves(prev => [result.data, ...prev]); setMessage(result.message); closeLeaveModal(); setTimeout(() => setMessage(''), 3000); } catch (err) { setError(err.message); } finally { setIsSubmittingLeaveAction(false); } };
  const handleDownloadCSV = () => { if (filteredAttendance.length === 0) { alert("No data to download."); return; } const sanitizeField = (field) => { if (field === null || field === undefined) return '""'; return `"${String(field).replace(/"/g, '""')}"`; }; const headers = ["Employee Name", "Role", "Date", "Check-In", "Check-Out", "Work Duration (Hours)", "Break Duration (Minutes)", "Work Description"].join(','); const rows = filteredAttendance.map(att => [sanitizeField(att.user?.name || 'N/A'), sanitizeField(att.user?.role || 'N/A'), sanitizeField(formatEnglishDate(att.checkInTime)), sanitizeField(new Date(att.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })), sanitizeField(att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'), att.duration ? (att.duration / 3600).toFixed(2) : '0.00', att.totalBreakDuration ? Math.round(att.totalBreakDuration / 60) : '0', sanitizeField(att.description || '')].join(',')); const csv = [headers, ...rows].join('\n'); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", `attendance_report_${new Date().toISOString().split('T')[0]}.csv`); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); };

  const renderContent = () => {
    return (
        <div key={activeView} className="animate-fade-in-up duration-500">
            {
                {
                    'notifications': <NotificationSender allUsers={allUsers} targetType={targetType} setTargetType={setTargetType} targetUser={targetUser} setTargetUser={setTargetUser} notificationContent={notificationContent} setNotificationContent={setNotificationContent} handleSendNotification={handleSendNotification} isSending={isSending} />,
                    'leaves': <LeaveTable title="Pending Leave Requests" requests={leaveRequests} onManage={openLeaveModal} type="pending" />,
                    'approved_leaves': <LeaveTable title="Approved & Upcoming Leaves" requests={approvedLeaves} type="approved" />,
                    'leave_history': <LeaveTable title="Concluded Leave History" requests={concludedLeaves} type="history" />,
                    'attendance': <AttendanceView allUsers={allUsers} selectedRole={selectedRole} setSelectedRole={setSelectedRole} selectedUser={selectedUser} setSelectedUser={setSelectedUser} totalWorkSecondsSummary={totalWorkSecondsSummary} daysMeetingTargetSummary={daysMeetingTargetSummary} completedDaysSummary={completedDaysSummary} filteredAttendance={filteredAttendance} initialAttendance={initialAttendance} handleDownloadCSV={handleDownloadCSV} openDeleteModal={openDeleteModal} />,
                }[activeView]
            }
        </div>
    );
  };
  
  const handleMobileNavClick = (view) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  }

  return (
    <>
      {isLeaveModalOpen && <ManageLeaveModal item={currentLeaveItem} comments={hrComments} setComments={setHrComments} error={error} onClose={closeLeaveModal} onSubmit={handleManageLeave} isSubmitting={isSubmittingLeaveAction} />}
      {isDeleteModalOpen && <DeleteModal onConfirm={handleConfirmDelete} onClose={closeDeleteModal} isDeleting={isDeleting} />}
      
      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)}></div>
      <div className={`fixed top-0 left-0 h-full w-64 bg-white z-50 lg:hidden shadow-xl transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-4">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <Image src="/geckoworks.png" alt="Logo" width={40} height={40} />
                    <h1 className="text-xl font-bold text-slate-800">Gecko HR</h1>
                </div>
                <nav className="flex-1 space-y-2">
                    <NavButton label="Attendance" icon={<BarChart2 size={20} />} isActive={activeView === 'attendance'} onClick={() => handleMobileNavClick('attendance')} />
                    <NavButton label="Send Notification" icon={<Bell size={20} />} isActive={activeView === 'notifications'} onClick={() => handleMobileNavClick('notifications')} />
                    <NavButton label="Pending Leaves" icon={<Briefcase size={20} />} isActive={activeView === 'leaves'} onClick={() => handleMobileNavClick('leaves')} />
                    <NavButton label="Approved Leaves" icon={<ThumbsUp size={20} />} isActive={activeView === 'approved_leaves'} onClick={() => handleMobileNavClick('approved_leaves')} />
                    <NavButton label="Leave History" icon={<Archive size={20} />} isActive={activeView === 'leave_history'} onClick={() => handleMobileNavClick('leave_history')} />
                </nav>
            </div>
      </div>
      
      <div className="min-h-screen w-full bg-slate-100 font-sans flex">
        {/* --- Sidebar (Desktop) --- */}
        <aside className="w-64 bg-white border-r border-slate-200/80 flex-col p-4 hidden lg:flex">
            <div className="flex items-center gap-3 mb-10 px-2">
                <Image src="/geckoworks.png" alt="Logo" width={40} height={40} />
                <h1 className="text-xl font-bold text-slate-800">Gecko HR</h1>
            </div>
            <nav className="flex-1 space-y-2">
                <NavButton label="Attendance" icon={<BarChart2 size={20} />} isActive={activeView === 'attendance'} onClick={() => setActiveView('attendance')} />
                <NavButton label="Send Notification" icon={<Bell size={20} />} isActive={activeView === 'notifications'} onClick={() => setActiveView('notifications')} />
                <NavButton label="Pending Leaves" icon={<Briefcase size={20} />} isActive={activeView === 'leaves'} onClick={() => setActiveView('leaves')} />
                <NavButton label="Approved Leaves" icon={<ThumbsUp size={20} />} isActive={activeView === 'approved_leaves'} onClick={() => setActiveView('approved_leaves')} />
                <NavButton label="Leave History" icon={<Archive size={20} />} isActive={activeView === 'leave_history'} onClick={() => setActiveView('leave_history')} />
            </nav>
        </aside>

        {/* --- Main Content --- */}
        <main className="flex-1 flex flex-col">
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 p-4 lg:px-10 flex justify-between items-center sticky top-0 z-30">
                <button className="lg:hidden text-slate-600 hover:text-green-600" onClick={() => setIsMobileMenuOpen(true)}>
                    <Menu size={24} />
                </button>
                <div className="flex-1">
                    {/* Dynamic Header can be placed here if needed */}
                </div>
                <div ref={userDropdownRef} className="relative">
                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-3 p-2 rounded-full hover:bg-slate-100 transition-colors">
                        <span className="font-semibold text-sm text-slate-700 hidden sm:inline">{user.name}</span>
                        <Image src={user.avatar} width={40} height={40} className="rounded-full object-cover" alt="User Avatar"/>
                        <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`absolute top-full right-0 mt-2 w-56 rounded-xl shadow-2xl bg-white ring-1 ring-black ring-opacity-5 z-40 origin-top-right transition-all duration-300 ease-out ${isDropdownOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                        <div className="px-4 py-3 border-b border-slate-200/80">
                            <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.role}</p>
                        </div>
                        <div className="p-1">
                            <Link href="/hr/add-user" className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-3 rounded-md"><UserPlus className="h-4 w-4"/>Add Employee</Link>
                            <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-3 rounded-md"><LogOut className="h-4 w-4"/>Sign Out</button>
                        </div>
                    </div>
                </div>
            </header>
            <div className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto">
                {message && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md mb-6 animate-fade-in-down" role="alert"><p>{message}</p></div>}
                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 animate-fade-in-down" role="alert"><p>{error}</p></div>}
                {renderContent()}
            </div>
        </main>
      </div>
    </>
  );
}

// --- Specific View Components (with staggered animation) ---
const AttendanceView = ({ allUsers, selectedRole, setSelectedRole, selectedUser, setSelectedUser, totalWorkSecondsSummary, daysMeetingTargetSummary, completedDaysSummary, filteredAttendance, initialAttendance, handleDownloadCSV, openDeleteModal }) => (
    <div className="space-y-8">
        <h1 className="text-3xl font-bold text-slate-800">Attendance Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Total Logged Time" value={formatDuration(totalWorkSecondsSummary)} icon={<Clock size={24} className="text-green-600" />} color={{ bg: 'bg-green-100', text: 'text-green-600' }} delay={1} />
            <StatCard title="Days Meeting Target" value={`${daysMeetingTargetSummary} / ${completedDaysSummary.length}`} icon={<Check size={24} className="text-blue-600" />} color={{ bg: 'bg-blue-100', text: 'text-blue-600' }} delay={2} />
            <StatCard title="Total Employees" value={allUsers.length} icon={<Users size={24} className="text-indigo-600" />} color={{ bg: 'bg-indigo-100', text: 'text-indigo-600' }} delay={3} />
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
            <h2 className="text-xl font-semibold mb-4 text-slate-800">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="role-filter" className="block text-sm font-medium mb-1 text-slate-600">Filter by Role</label>
                    <select id="role-filter" value={selectedRole} onChange={(e) => { setSelectedRole(e.target.value); setSelectedUser("All"); }} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/80 transition">
                        <option value="All">All Roles</option><option value="Staff">Staff</option><option value="Intern">Intern</option><option value="Manager">Manager</option><option value="Project Manager">Project Manager</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="user-filter" className="block text-sm font-medium mb-1 text-slate-600">Filter by Employee</label>
                    <select id="user-filter" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/80 transition">
                        <option value="All">All Employees</option>
                        {allUsers.filter((u) => selectedRole === "All" || u.role === selectedRole).map((u) => (<option key={u._id} value={u._id}>{u.name}</option>))}
                    </select>
                </div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5">
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">Attendance History</h2>
                    <p className="text-sm text-slate-500 mt-1">Showing {filteredAttendance.length} of {initialAttendance.length} records</p>
                </div>
                <button onClick={handleDownloadCSV} className="mt-4 md:mt-0 bg-slate-700 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"><Download size={16}/>Download CSV</button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50"><tr><th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Check-In/Out</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Break</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Work Time</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th><th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th></tr></thead>
                    <tbody className="bg-white divide-y divide-slate-200/80">{filteredAttendance.map((att, index) => (<tr key={att._id} className="hover:bg-slate-50/70 animate-fade-in-up" style={{ animationDelay: `${index * 50}ms`}}><td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="flex-shrink-0 h-10 w-10"><Image className="h-10 w-10 rounded-full object-cover" src={att.user?.avatar || '/default-avatar.png'} alt={att.user?.name || ''} width={40} height={40}/></div><div className="ml-4"><div className="font-medium text-slate-900">{att.user?.name || "Deleted"}</div><div className="text-sm text-slate-500">{att.user?.role || "N/A"}</div></div></div></td><td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{formatEnglishDate(att.checkInTime)}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600"><div>{new Date(att.checkInTime).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}</div><div>{att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'}) : <span className="text-blue-600 font-medium">Active</span>}</div></td><td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{formatDuration(att.totalBreakDuration)}</td><td className={`px-6 py-4 whitespace-nowrap text-sm ${getDurationStyle(att)}`}>{formatDuration(att.duration)}</td><td className="px-6 py-4 text-sm text-slate-600 max-w-sm"><p className="whitespace-pre-wrap break-words">{att.description || '-'}</p></td><td className="px-6 py-4 whitespace-nowrap text-center text-sm"><button onClick={() => openDeleteModal(att._id)} className="text-slate-400 hover:text-red-600 p-2 rounded-full transition-colors"><Trash2 size={18} /></button></td></tr>))}{filteredAttendance.length === 0 && (<tr><td colSpan="7" className="text-center py-10 text-slate-500">No records found for the selected filters.</td></tr>)}</tbody>
                </table>
            </div>
        </div>
    </div>
);

const NotificationSender = ({ allUsers, targetType, setTargetType, targetUser, setTargetUser, notificationContent, setNotificationContent, handleSendNotification, isSending }) => (
    <div className="space-y-8">
        <h1 className="text-3xl font-bold text-slate-800">Broadcast Notifications</h1>
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200/80">
            <form onSubmit={handleSendNotification} className="space-y-6">
                <div>
                    <label className="block text-md font-semibold text-slate-800 mb-3">Send To</label>
                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 text-sm font-medium"><input type="radio" name="targetType" value="all" checked={targetType === 'all'} onChange={(e) => setTargetType(e.target.value)} className="h-4 w-4 text-green-600 border-slate-300 focus:ring-green-500"/>All Employees</label>
                        <label className="flex items-center gap-2 text-sm font-medium"><input type="radio" name="targetType" value="individual" checked={targetType === 'individual'} onChange={(e) => setTargetType(e.target.value)} className="h-4 w-4 text-green-600 border-slate-300 focus:ring-green-500"/>Specific Employee</label>
                    </div>
                </div>
                {targetType === 'individual' && (
                    <div className="animate-fade-in-up">
                        <label htmlFor="targetUser" className="block text-sm font-medium mb-1 text-slate-600">Select Employee</label>
                        <select id="targetUser" value={targetUser} onChange={(e) => setTargetUser(e.target.value)} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/80 transition">
                            <option value="" disabled>-- Select an employee --</option>
                            {allUsers.map((u) => (<option key={u._id} value={u._id}>{u.name} ({u.role})</option>))}
                        </select>
                    </div>
                )}
                <div>
                    <label htmlFor="notification-content" className="block text-sm font-medium mb-1 text-slate-600">Message</label>
                    <textarea id="notification-content" value={notificationContent} onChange={(e) => setNotificationContent(e.target.value)} rows="5" className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/80 transition" required placeholder="Type your announcement here..."></textarea>
                </div>
                <div className="flex justify-end">
                    <button type="submit" disabled={isSending} className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors transform hover:scale-105">
                        <Send size={16} />
                        {isSending ? 'Sending...' : 'Send Notification'}
                    </button>
                </div>
            </form>
        </div>
    </div>
);

const LeaveTable = ({ title, requests, onManage, type }) => (
    <div className="space-y-8">
        <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Dates & Type</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{type === 'pending' ? 'Reason' : 'HR Comments'}</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">{type === 'pending' ? 'Actions' : 'Status'}</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200/80">
                    {requests.map((req, index) => (
                        <tr key={req._id} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms`}}>
                            <td className="px-6 py-4 whitespace-nowrap"><div className="font-medium text-slate-900">{req.user?.name || 'N/A'}</div><div className="text-sm text-slate-500">{req.user?.role || ''}</div></td>
                            <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-slate-800">{formatEnglishDate(req.startDate)} to {formatEnglishDate(req.endDate)}</div><div className="text-sm font-medium text-slate-500">{req.leaveType}</div></td>
                            <td className="px-6 py-4 text-sm text-slate-600 max-w-xs"><p className="truncate" title={type === 'pending' ? req.reason : req.hrComments}>{type === 'pending' ? req.reason : req.hrComments || '-'}</p></td>
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                {type === 'pending' ? <button onClick={() => onManage(req)} className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"><Send size={20} /></button> : <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${getStatusBadge(req.status)}`}>{req.status}</span>}
                            </td>
                        </tr>
                    ))}
                    {requests.length === 0 && (<tr><td colSpan="4" className="text-center py-10 text-slate-500">No requests found.</td></tr>)}
                </tbody>
            </table>
        </div>
    </div>
);

const ManageLeaveModal = ({ item, comments, setComments, error, onClose, onSubmit, isSubmitting }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in duration-300">
        <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg animate-scale-in duration-300">
            <h3 className="text-2xl font-bold mb-6 text-slate-800">Manage Leave Request</h3>
            <div className="text-sm space-y-3 p-4 bg-slate-50 rounded-lg mb-5 border border-slate-200/80">
                <p><strong>Employee:</strong> <span className="font-medium text-slate-700">{item.user.name} ({item.user.role})</span></p>
                <p><strong>Dates:</strong> <span className="font-medium text-slate-700">{formatEnglishDate(item.startDate)} to {formatEnglishDate(item.endDate)}</span></p>
                <p><strong>Type:</strong> <span className="font-medium text-slate-700">{item.leaveType}</span></p>
                <div className="pt-2 border-t border-slate-200">
                    <p className="font-semibold text-slate-600">Reason:</p>
                    <p className="text-slate-700">{item.reason}</p>
                </div>
            </div>
            <div>
                <label htmlFor="hrComments" className="block text-sm font-semibold text-slate-600 mb-1">Add or Edit HR Comments</label>
                <textarea id="hrComments" value={comments} onChange={(e) => setComments(e.target.value)} rows="3" className="w-full mt-1 p-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/80 transition" placeholder="Optional comments..."></textarea>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <div className="mt-8 flex justify-end gap-3">
                <button onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors">Cancel</button>
                <button onClick={() => onSubmit('Rejected')} disabled={isSubmitting} className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors transform hover:scale-105"><XIcon size={16}/> Reject</button>
                <button onClick={() => onSubmit('Approved')} disabled={isSubmitting} className="px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors transform hover:scale-105"><Check size={16}/> Approve</button>
            </div>
        </div>
    </div>
);

const DeleteModal = ({ onConfirm, onClose, isDeleting }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in duration-300">
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-scale-in duration-300">
            <div className="flex items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-bold text-slate-900">Delete Record</h3>
                    <p className="text-sm text-slate-500 mt-2">Are you sure you want to delete this record? This action is permanent and cannot be undone.</p>
                </div>
            </div>
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button onClick={onClose} disabled={isDeleting} className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors">Cancel</button>
                <button onClick={onConfirm} disabled={isDeleting} className="w-full sm:w-auto px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-red-700 transition-colors">
                    {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
            </div>
        </div>
    </div>
);


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
    const [allAttendance, pendingLeaveRequests, concludedLeaveRequests, allUsers] = await Promise.all([
        Attendance.find({}).populate("user").sort({ checkInTime: -1 }).limit(100),
        LeaveRequest.find({ status: 'Pending' }).populate('user', 'name role').sort({ createdAt: -1 }),
        LeaveRequest.find({ status: { $in: ['Approved', 'Rejected'] } }).populate('user', 'name role').sort({ updatedAt: -1 }).limit(100),
        User.find({ role: { $ne: 'HR' } }).select('name role').sort({ name: 1 })
    ]);
    return {
      props: {
        user: JSON.parse(JSON.stringify(user)),
        initialAttendance: JSON.parse(JSON.stringify(allAttendance)),
        initialLeaveRequests: JSON.parse(JSON.stringify(pendingLeaveRequests)),
        initialConcludedLeaves: JSON.parse(JSON.stringify(concludedLeaveRequests)),
        initialApprovedLeaves: JSON.parse(JSON.stringify(concludedLeaveRequests.filter(l => l.status === 'Approved'))),
        allUsers: JSON.parse(JSON.stringify(allUsers)),
      },
    };
  } catch (error) {
    console.error("HR Dashboard getServerSideProps Error:", error);
    return { redirect: { destination: "/login", permanent: false } };
  }
}
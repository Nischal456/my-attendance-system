import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from 'next/image';
import jwt from "jsonwebtoken";
import dbConnect from "../../../lib/dbConnect";
import User from "../../../models/User";
import Attendance from "../../../models/Attendance";
import LeaveRequest from "../../../models/LeaveRequest";
import { Send, Trash2, AlertTriangle, LogOut, Check, X as XIcon, MessageSquare, UserPlus, Calendar, Briefcase, Download, Archive, ThumbsUp, ChevronDown } from 'react-feather';

// --- Helper Functions ---
const formatEnglishDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
};
const formatDuration = (totalSeconds) => {
  if (totalSeconds === null || totalSeconds === undefined || totalSeconds < 0) return '0 mins';
  if (totalSeconds === 0) return '0 mins';
  if (totalSeconds < 60) return `${totalSeconds} secs`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts = [];
  if (hours > 0) parts.push(`${hours} hr${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);
  return parts.join(' ') || '0 mins';
};
const MIN_WORK_SECONDS = 21600;
const getDurationStyle = (attendanceEntry) => {
  if (attendanceEntry.checkOutTime) { return attendanceEntry.duration >= MIN_WORK_SECONDS ? "text-green-600 font-bold" : "text-red-600 font-bold"; }
  return "font-bold text-blue-600";
};
const formatDateForLeave = (dateString) => new Date(dateString).toLocaleDateString('en-CA');
const getStatusBadge = (status) => {
    switch (status) {
        case 'Approved': return 'bg-green-100 text-green-800';
        case 'Rejected': return 'bg-red-100 text-red-800';
        default: return 'bg-yellow-100 text-yellow-800';
    }
}

// --- Main HR Dashboard Component ---
export default function HRDashboard({ user, initialAttendance, initialLeaveRequests, allUsers, initialConcludedLeaves, initialApprovedLeaves }) {
  const router = useRouter();
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
  const handleConfirmDelete = async () => { if (!recordToDelete) return; setError(''); setIsDeleting(true); try { const res = await fetch('/api/hr/delete-attendance', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attendanceId: recordToDelete }) }); if (!res.ok) { const data = await res.json(); throw new Error(data.message); } setAllAttendance(prev => prev.filter(att => att._id !== recordToDelete)); setFilteredAttendance(prev => prev.filter(att => att._id !== recordToDelete)); setMessage("Attendance record deleted successfully."); setTimeout(() => setMessage(''), 3000); } catch (err) { setError(err.message || 'Failed to delete record.'); } finally { setIsDeleting(false); closeDeleteModal(); } };
  
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notificationContent.trim()) return;
    if (targetType === 'individual' && !targetUser) {
        setError('Please select an employee.'); setTimeout(() => setError(''), 3000);
        return;
    }
    setIsSending(true); setMessage(''); setError('');
    try {
      const res = await fetch('/api/hr/send-notification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: notificationContent, targetType, targetUser: targetType === 'individual' ? targetUser : null }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage(data.message); setNotificationContent(''); setTargetUser(''); setTargetType('all');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const openLeaveModal = (request) => { setCurrentLeaveItem(request); setHrComments(request.hrComments || ''); setIsLeaveModalOpen(true); };
  const closeLeaveModal = () => { setIsLeaveModalOpen(false); setCurrentLeaveItem(null); setHrComments(''); setError(''); };
  const handleManageLeave = async (newStatus) => { if (!currentLeaveItem) return; setIsSubmittingLeaveAction(true); setMessage(''); setError(''); try { const res = await fetch('/api/hr/manage-leave', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leaveId: currentLeaveItem._id, status: newStatus, hrComments: hrComments }) }); const result = await res.json(); if (!res.ok) throw new Error(result.message); setLeaveRequests(prev => prev.filter(req => req._id !== currentLeaveItem._id)); if(newStatus === 'Approved') { setApprovedLeaves(prev => [result.data, ...prev]); } setConcludedLeaves(prev => [result.data, ...prev]); setMessage(result.message); closeLeaveModal(); setTimeout(() => setMessage(''), 3000); } catch (err) { setError(err.message); } finally { setIsSubmittingLeaveAction(false); } };
  const handleDownloadCSV = () => { if (filteredAttendance.length === 0) { alert("No data to download."); return; } const sanitizeField = (field) => { if (field === null || field === undefined) return '""'; return `"${String(field).replace(/"/g, '""')}"`; }; const headers = ["Employee Name", "Role", "Date", "Check-In", "Check-Out", "Work Duration (Hours)", "Break Duration (Minutes)", "Work Description"].join(','); const rows = filteredAttendance.map(att => [sanitizeField(att.user?.name || 'N/A'), sanitizeField(att.user?.role || 'N/A'), sanitizeField(formatEnglishDate(att.checkInTime)), sanitizeField(new Date(att.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })), sanitizeField(att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'), att.duration ? (att.duration / 3600).toFixed(2) : '0.00', att.totalBreakDuration ? Math.round(att.totalBreakDuration / 60) : '0', sanitizeField(att.description || '')].join(',')); const csv = [headers, ...rows].join('\n'); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", `attendance_report_${new Date().toISOString().split('T')[0]}.csv`); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); };

  return (
    <>
      {isLeaveModalOpen && currentLeaveItem && (<div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"><div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg animate-fade-in-up"><h3 className="text-xl font-semibold mb-4 text-gray-800">Manage Leave Request</h3><div className="text-sm space-y-2 p-4 bg-gray-50 rounded-md mb-4 border"><p><strong>Employee:</strong> {currentLeaveItem.user.name}</p><p><strong>Dates:</strong> {formatDateForLeave(currentLeaveItem.startDate)} to {formatDateForLeave(currentLeaveItem.endDate)}</p><p><strong>Type:</strong> {currentLeaveItem.leaveType}</p><p><strong>Reason:</strong> {currentLeaveItem.reason}</p></div><div><label htmlFor="hrComments">Add Comments</label><textarea id="hrComments" value={hrComments} onChange={(e) => setHrComments(e.target.value)} rows="3" className="w-full mt-1 p-2 border rounded-md"></textarea></div>{error && <p className="text-red-500 text-sm mt-2">{error}</p>}<div className="mt-6 flex justify-end gap-3"><button onClick={closeLeaveModal} disabled={isSubmittingLeaveAction} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button><button onClick={() => handleManageLeave('Rejected')} disabled={isSubmittingLeaveAction} className="px-4 py-2 bg-red-600 text-white rounded-md flex items-center gap-2"><XIcon size={16}/> Reject</button><button onClick={() => handleManageLeave('Approved')} disabled={isSubmittingLeaveAction} className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center gap-2"><Check size={16}/> Approve</button></div></div></div>)}
      {isDeleteModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"><div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md animate-fade-in-up"><div className="flex items-start"><div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"><AlertTriangle className="h-6 w-6 text-red-600" /></div><div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left"><h3 className="text-lg font-medium text-gray-900">Delete Record</h3><p className="text-sm text-gray-500 mt-2">Are you sure? This is permanent.</p></div></div><div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse"><button onClick={handleConfirmDelete} disabled={isDeleting} className="w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm">{isDeleting ? 'Deleting...' : 'Delete'}</button><button onClick={closeDeleteModal} disabled={isDeleting} className="mt-3 w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 bg-white text-base font-medium sm:mt-0 sm:w-auto sm:text-sm">Cancel</button></div></div></div>)}
      
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8"><h1 className="text-3xl font-bold text-gray-800">HR Admin Dashboard</h1><p className="text-gray-600 mt-1">Welcome, <span className="font-semibold text-green-600">{user.name}</span></p><div ref={userDropdownRef} className="relative mt-4 md:mt-0"><button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border"><Image src={user.avatar} width={32} height={32} className="rounded-full object-cover" alt="User Avatar"/><span className="font-semibold">{user.name}</span><ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} /></button>{isDropdownOpen && (<div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20"><div className="px-4 py-3 border-b"><p className="text-sm font-medium">{user.name}</p><p className="text-xs text-gray-500">{user.role}</p></div><div className="py-1"><Link href="/hr/add-user" legacyBehavior><a className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-3"><UserPlus className="h-4 w-4"/>Add Employee</a></Link></div><div className="py-1 border-t"><button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-3"><LogOut className="h-4 w-4"/>Sign Out</button></div></div>)}</div></div>
          {message && <p className="text-green-600 bg-green-100 p-3 rounded-md my-4">{message}</p>}
          {error && <p className="text-red-500 bg-red-100 p-2 rounded-md my-4">{error}</p>}
          <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border"><h2 className="text-xl font-semibold mb-4">Send General Notification</h2><form onSubmit={handleSendNotification} className="space-y-4"><div><label className="block text-sm font-medium mb-2">Send To</label><div className="flex items-center gap-6"><label className="flex items-center gap-2"><input type="radio" name="targetType" value="all" checked={targetType === 'all'} onChange={(e) => setTargetType(e.target.value)} className="h-4 w-4"/>All Employees</label><label className="flex items-center gap-2"><input type="radio" name="targetType" value="individual" checked={targetType === 'individual'} onChange={(e) => setTargetType(e.target.value)} className="h-4 w-4"/>Specific Employee</label></div></div>{targetType === 'individual' && (<div><label htmlFor="targetUser" className="block text-sm font-medium mb-1">Select Employee</label><select id="targetUser" value={targetUser} onChange={(e) => setTargetUser(e.target.value)} required className="w-full px-3 py-2 border rounded-md"><option value="" disabled>-- Select --</option>{allUsers.map((u) => (<option key={u._id} value={u._id}>{u.name} ({u.role})</option>))}</select></div>)}<div><label htmlFor="notification-content" className="block text-sm font-medium mb-1">Message</label><textarea id="notification-content" value={notificationContent} onChange={(e) => setNotificationContent(e.target.value)} rows="4" className="w-full px-3 py-2 border rounded-md" required /></div><div className="flex justify-end"><button type="submit" disabled={isSending} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"><Send size={16} />{isSending ? 'Sending...' : 'Send'}</button></div></form></div>
          <div className="mb-8"><div className="border-b border-gray-200"><nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs"><button onClick={() => setActiveView('attendance')} className={`flex-shrink-0 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeView === 'attendance' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Calendar size={16}/> Attendance</button><button onClick={() => setActiveView('leaves')} className={`flex-shrink-0 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeView === 'leaves' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Briefcase size={16}/> Pending Requests</button><button onClick={() => setActiveView('approved_leaves')} className={`flex-shrink-0 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeView === 'approved_leaves' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><ThumbsUp size={16}/> Approved Leaves</button><button onClick={() => setActiveView('leave_history')} className={`flex-shrink-0 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeView === 'leave_history' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Archive size={16}/> Leave History</button></nav></div></div>
          {activeView === 'leaves' && (<div className="bg-white p-6 rounded-xl shadow-sm border"><h2 className="text-xl font-semibold mb-4">Pending Leave Requests</h2><div className="overflow-x-auto"><table className="min-w-full divide-y"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium uppercase">Employee</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">Dates & Type</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">Reason</th><th className="px-6 py-3 text-center text-xs font-medium uppercase">Actions</th></tr></thead><tbody className="divide-y">{leaveRequests.map(req => (<tr key={req._id}><td className="px-6 py-4"><div className="font-medium">{req.user?.name || 'N/A'}</div><div className="text-xs text-gray-500">{req.user?.role || ''}</div></td><td className="px-6 py-4"><div className="text-sm">{formatDateForLeave(req.startDate)} to {formatDateForLeave(req.endDate)}</div><div className="text-xs font-medium">{req.leaveType}</div></td><td className="px-6 py-4 text-sm max-w-xs truncate" title={req.reason}>{req.reason}</td><td className="px-6 py-4 text-center"><button onClick={() => openLeaveModal(req)} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-full"><MessageSquare size={20} /></button></td></tr>))}{leaveRequests.length === 0 && (<tr><td colSpan="4" className="text-center py-8">No pending leave requests.</td></tr>)}</tbody></table></div></div>)}
          {activeView === 'approved_leaves' && (<div className="bg-white p-6 rounded-xl shadow-sm border"><h2 className="text-xl font-semibold mb-4">Approved Leave Requests</h2><div className="overflow-x-auto"><table className="min-w-full divide-y"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium uppercase">Employee</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">Approved Dates</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">Type</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">HR Comments</th></tr></thead><tbody className="divide-y">{approvedLeaves.map(req => (<tr key={req._id}><td className="px-6 py-4"><div className="font-medium">{req.user?.name || 'N/A'}</div><div className="text-xs text-gray-500">{req.user?.role || ''}</div></td><td className="px-6 py-4 text-sm">{formatDateForLeave(req.startDate)} to {formatDateForLeave(req.endDate)}</td><td className="px-6 py-4 text-sm font-medium">{req.leaveType}</td><td className="px-6 py-4 text-sm italic max-w-xs" title={req.hrComments}>{req.hrComments || '-'}</td></tr>))}{approvedLeaves.length === 0 && (<tr><td colSpan="4" className="text-center py-8">No approved leaves.</td></tr>)}</tbody></table></div></div>)}
          {activeView === 'leave_history' && (<div className="bg-white p-6 rounded-xl shadow-sm border"><h2 className="text-xl font-semibold mb-4">Concluded Leave History</h2><div className="overflow-x-auto"><table className="min-w-full divide-y"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium uppercase">Employee</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">Dates & Type</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">HR Comments</th><th className="px-6 py-3 text-center text-xs font-medium uppercase">Final Status</th></tr></thead><tbody className="divide-y">{concludedLeaves.map(req => (<tr key={req._id}><td className="px-6 py-4"><div className="font-medium">{req.user?.name || 'N/A'}</div><div className="text-xs text-gray-500">{req.user?.role || ''}</div></td><td className="px-6 py-4"><div className="text-sm">{formatDateForLeave(req.startDate)} to {formatDateForLeave(req.endDate)}</div><div className="text-xs font-medium">{req.leaveType}</div></td><td className="px-6 py-4 text-sm italic max-w-xs" title={req.hrComments}>{req.hrComments || '-'}</td><td className="px-6 py-4 text-center"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(req.status)}`}>{req.status}</span></td></tr>))}{concludedLeaves.length === 0 && (<tr><td colSpan="4" className="text-center py-8">No concluded leave requests.</td></tr>)}</tbody></table></div></div>)}
          {activeView === 'attendance' && (<div className="space-y-8"><div className="bg-white p-6 rounded-xl shadow-sm"><h2 className="text-xl font-semibold mb-4">Attendance Filters</h2><div className="flex flex-col md:flex-row gap-4"><div className="flex-1"><label htmlFor="role-filter" className="block text-sm font-medium mb-1">Filter by Role</label><select id="role-filter" value={selectedRole} onChange={(e) => { setSelectedRole(e.target.value); setSelectedUser("All"); }} className="w-full px-3 py-2 border rounded-md"><option value="All">All Roles</option><option value="Staff">Staff</option><option value="Intern">Intern</option><option value="Manager">Manager</option><option value="Project Manager">Project Manager</option></select></div><div className="flex-1"><label htmlFor="user-filter" className="block text-sm font-medium mb-1">Filter by Employee</label><select id="user-filter" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="w-full px-3 py-2 border rounded-md"><option value="All">All Employees</option>{allUsers.filter((u) => selectedRole === "All" || u.role === selectedRole).map((u) => (<option key={u._id} value={u._id}>{u.name}</option>))}</select></div></div></div><div className="bg-white p-6 rounded-xl shadow-sm"><h2 className="text-xl font-semibold mb-4">Filtered Summary</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="bg-green-50 p-4 rounded-lg"><h3 className="text-sm font-medium text-green-800 mb-1">Total Logged Time</h3><p className="text-2xl font-bold text-green-600">{formatDuration(totalWorkSecondsSummary)}</p></div><div className="bg-blue-50 p-4 rounded-lg"><h3 className="text-sm font-medium text-blue-800 mb-1">Days Meeting Target</h3><p className="text-2xl font-bold text-blue-600">{daysMeetingTargetSummary} <span className="text-base font-normal">/ {completedDaysSummary.length}</span></p></div></div></div><div className="bg-white p-6 rounded-xl shadow-sm overflow-x-auto"><div className="flex justify-between items-center mb-4"><div><h2 className="text-xl font-semibold">Attendance History</h2><p className="text-sm text-gray-500 mt-1">Showing {filteredAttendance.length} of {initialAttendance.length} records</p></div><button onClick={handleDownloadCSV} className="bg-gray-700 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2"><Download size={16}/>Download CSV</button></div><table className="min-w-full divide-y"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium uppercase">Staff</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">Phone</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">Date</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">Check-In/Out</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">Break</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">Work Time</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">Description</th><th className="px-6 py-3 text-center text-xs font-medium uppercase">Actions</th></tr></thead><tbody className="divide-y">{filteredAttendance.map((att) => (<tr key={att._id} className="hover:bg-gray-50"><td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="flex-shrink-0 h-10 w-10"><Image className="h-10 w-10 rounded-full object-cover" src={att.user?.avatar || '/default-avatar.png'} alt={att.user?.name || ''} width={40} height={40}/></div><div className="ml-4"><div className="font-medium">{att.user?.name || "Deleted"}</div><div className="text-sm text-gray-500">{att.user?.role || "N/A"}</div></div></div></td><td className="px-6 py-4 whitespace-nowrap text-sm">{att.user?.phoneNumber || "-"}</td><td className="px-6 py-4 whitespace-nowrap text-sm">{formatEnglishDate(att.checkInTime)}</td><td className="px-6 py-4 whitespace-nowrap text-sm"><div>{new Date(att.checkInTime).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}</div><div>{att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'}) : '-'}</div></td><td className="px-6 py-4 whitespace-nowrap text-sm">{formatDuration(att.totalBreakDuration)}</td><td className={`px-6 py-4 whitespace-nowrap text-sm ${getDurationStyle(att)}`}>{formatDuration(att.duration)}</td><td className="px-6 py-4 text-sm max-w-sm whitespace-pre-wrap">{att.description || '-'}</td><td className="px-6 py-4 whitespace-nowrap text-center text-sm"><button onClick={() => openDeleteModal(att._id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button></td></tr>))}{filteredAttendance.length === 0 && (<tr><td colSpan="8" className="text-center py-4">No records.</td></tr>)}</tbody></table></div></div>)}
        </div>
      </div>
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
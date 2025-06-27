import { useState } from "react";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from 'next/image';
import jwt from "jsonwebtoken";
import dbConnect from "../../../lib/dbConnect";
import User from "../../../models/User";
import Attendance from "../../../models/Attendance";
import NepaliDate from "nepali-date-converter";
import { Send, Trash2, AlertTriangle } from 'react-feather';

const toNepaliDate = (gregorianDate) => {
  if (!gregorianDate) return '-';
  const nepaliDate = new NepaliDate(new Date(gregorianDate));
  return nepaliDate.format('DD MMMM, YYYY');
};

const formatDuration = (totalSeconds) => {
  if (totalSeconds === null || totalSeconds === undefined || totalSeconds < 0) return '-';
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
  if (attendanceEntry.checkOutTime) {
    if (attendanceEntry.duration >= MIN_WORK_SECONDS) {
      return "text-green-600 font-bold";
    } else {
      return "text-red-600 font-bold";
    }
  }
  return "font-bold text-blue-600";
};


export default function HRDashboard({ user, initialAttendance }) {
  const router = useRouter();

  const [allAttendance, setAllAttendance] = useState(initialAttendance);
  const [filteredAttendance, setFilteredAttendance] = useState(initialAttendance);
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedUser, setSelectedUser] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [notificationContent, setNotificationContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  

  const uniqueUsers = useMemo(() => {
    const userMap = new Map();
    allAttendance.forEach((att) => {
      if (att.user) {
        userMap.set(att.user._id, { _id: att.user._id, name: att.user.name, role: att.user.role });
      }
    });
    return Array.from(userMap.values());
  }, [allAttendance]);

  useEffect(() => {
    let result = allAttendance;
    if (selectedRole !== "All") {
      result = result.filter((att) => att.user?.role?.toLowerCase() === selectedRole.toLowerCase());
    }
    if (selectedUser !== "All") {
      result = result.filter((att) => att.user?._id === selectedUser);
    }
    setFilteredAttendance(result);
  }, [selectedRole, selectedUser, allAttendance]);

  const completedDays = filteredAttendance.filter((att) => att.checkOutTime);
  const totalWorkSeconds = completedDays.reduce((acc, att) => acc + (att.duration || 0), 0);
  const daysMeetingTarget = completedDays.filter((day) => day.duration >= MIN_WORK_SECONDS).length;

  const handleLogout = async () => {
    await fetch("/api/auth/logout");
    router.push("/login");
  };

  const openDeleteModal = (attendanceId) => {
    setRecordToDelete(attendanceId);
    setIsModalOpen(true);
  };

  const closeDeleteModal = () => {
    setRecordToDelete(null);
    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    setError('');
    setIsDeleting(true);

    try {
      const res = await fetch('/api/hr/delete-attendance', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendanceId: recordToDelete }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setAllAttendance(prev => prev.filter(att => att._id !== recordToDelete));
      
    } catch (err) {
      setError(err.message || 'Failed to delete record.');
    } finally {
      setIsDeleting(false);
      closeDeleteModal();
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notificationContent.trim()) return;
    setIsSending(true);
    setNotificationMessage('');
    setError('');
    try {
      const res = await fetch('/api/hr/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: notificationContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setNotificationMessage('Notification sent successfully!');
      setNotificationContent('');
      setTimeout(() => setNotificationMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md animate-fade-in-up">
            <div className="flex items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Delete Attendance Record</h3>
                <div className="mt-2"><p className="text-sm text-gray-500">Are you sure? This action is permanent.</p></div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button type="button" onClick={handleConfirmDelete} disabled={isDeleting} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">{isDeleting ? 'Deleting...' : 'Confirm Delete'}</button>
              <button type="button" onClick={closeDeleteModal} disabled={isDeleting} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">HR Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome, <span className="font-semibold text-green-600">{user.name}</span> ({user.role})</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
            <Link href="/hr/add-user"><button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-sm transition-colors duration-200 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>Add New Employee</button></Link>
            <button onClick={handleLogout} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg shadow-sm transition-colors duration-200 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>Logout</button>
          </div>
        </div>
        
        {error && <p className="text-red-500 bg-red-100 p-2 rounded-md my-4">{error}</p>}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Send Company-Wide Notification</h2>
          <form onSubmit={handleSendNotification} className="space-y-4">
            <div>
              <label htmlFor="notification-content" className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                id="notification-content"
                value={notificationContent}
                onChange={(e) => setNotificationContent(e.target.value)}
                placeholder="Type your announcement here..."
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="flex items-center justify-between">
                <button
                    type="submit"
                    disabled={isSending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
                >
                    <Send size={16} />
                    {isSending ? 'Sending...' : 'Send Notification'}
                </button>
                {/* Display success message */}
                {notificationMessage && <p className="text-sm text-green-600 font-semibold">{notificationMessage}</p>}
            </div>
          </form>
        </div>
        {/* --- RESTORED: Filter Section --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Attendance Filters</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
              <select id="role-filter" value={selectedRole} onChange={(e) => { setSelectedRole(e.target.value); setSelectedUser("All"); }} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500">
                <option value="All">All Roles</option>
                <option value="Staff">Staff</option>
                <option value="Intern">Intern</option>
                <option value="Manager">Manager</option>
                <option value="Project Manager">Project Manager</option>
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="user-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Employee</label>
              <select id="user-filter" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500">
                <option value="All">All Employees</option>
                {uniqueUsers.filter((u) => selectedRole === "All" || u.role === selectedRole).map((u) => (<option key={u._id} value={u._id}>{u.name}</option>))}
              </select>
            </div>
          </div>
        </div>

        {/* --- RESTORED: Summary Section --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Filtered Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="text-sm font-medium text-green-800 mb-1">Total Logged Time</h3>
              <p className="text-2xl font-bold text-green-600">{formatDuration(totalWorkSeconds)}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-sm font-medium text-blue-800 mb-1">Days Meeting 6-Hour Target</h3>
              <p className="text-2xl font-bold text-blue-600">{daysMeetingTarget} <span className="text-base font-normal text-gray-500">/ {completedDays.length}</span></p>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white p-6 rounded-xl shadow-sm overflow-x-auto">
          <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-semibold text-gray-800">Attendance History</h2><p className="text-sm text-gray-500">Showing {filteredAttendance.length} records</p></div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff (Role)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date (Nepali)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-In/Out</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Break</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Time</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAttendance.map((att) => (
                <tr key={att._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="flex-shrink-0 h-10 w-10"><Image className="h-10 w-10 rounded-full object-cover" src={att.user?.avatar || '/default-avatar.png'} alt={att.user?.name || ''} width={40} height={40}/></div><div className="ml-4"><div className="font-medium text-gray-900">{att.user?.name || "Deleted User"}</div><div className="text-sm text-gray-500">{att.user?.role || "N/A"}</div></div></div></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{att.user?.phoneNumber || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{toNepaliDate(att.checkInTime)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><div>{new Date(att.checkInTime).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', hour12: true})}</div><div>{att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', hour12: true}) : '-'}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDuration(att.totalBreakDuration)}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${getDurationStyle(att)}`}>{formatDuration(att.duration)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium"><button onClick={() => openDeleteModal(att._id)} className="text-red-600 hover:text-red-800 transition-colors duration-150" title="Delete Record"><Trash2 size={18} /></button></td>
                </tr>
              ))}
              {filteredAttendance.length === 0 && (<tr><td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">No records match the current filters.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
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
    const allAttendance = await Attendance.find({}).populate("user", "name role phoneNumber avatar").sort({ checkInTime: -1 });
    return {
      props: {
        user: JSON.parse(JSON.stringify(user)),
        initialAttendance: JSON.parse(JSON.stringify(allAttendance)),
      },
    };
  } catch (error) {
    console.error("HR Dashboard getServerSideProps Error:", error);
    return { redirect: { destination: "/login", permanent: false } };
  }
}
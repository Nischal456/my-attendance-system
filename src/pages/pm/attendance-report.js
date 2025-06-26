import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from 'next/image';
import jwt from "jsonwebtoken";
import dbConnect from "../../../lib/dbConnect";
import User from "../../../models/User";
import Attendance from "../../../models/Attendance";
import NepaliDate from "nepali-date-converter";

// --- Helper Functions ---
const toNepaliDate = (gregorianDate) => {
  if (!gregorianDate) return '-';
  const nepaliDate = new NepaliDate(new Date(gregorianDate));
  return nepaliDate.format('DD MMMM, YYYY'); // Format as "DD MMMM, YYYY"
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


export default function AttendanceReportPage({ user, initialAttendance }) {
  const router = useRouter();
  const [allAttendance, setAllAttendance] = useState(initialAttendance);
  const [filteredAttendance, setFilteredAttendance] = useState(initialAttendance);
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedUser, setSelectedUser] = useState("All");

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
            <Link href="/pm/dashboard">
                <button className="flex items-center text-green-600 hover:text-green-800 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                    Back to PM Dashboard
                </button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-800 mt-4">Staff Attendance Report</h1>
            <p className="text-gray-600 mt-1">Viewing all employee attendance records.</p>
        </div>

        {/* Filter Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
              <select id="role-filter" value={selectedRole} onChange={(e) => { setSelectedRole(e.target.value); setSelectedUser("All"); }} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="All">All Roles</option>
                <option value="Staff">Staff</option>
                <option value="Intern">Intern</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="user-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Employee</label>
              <select id="user-filter" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="All">All Employees</option>
                {uniqueUsers.filter((u) => selectedRole === "All" || u.role === selectedRole).map((u) => (<option key={u._id} value={u._id}>{u.name}</option>))}
              </select>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <div className="flex justify-between items-center mb-4 p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Attendance History</h2>
            <p className="text-sm text-gray-500">Showing {filteredAttendance.length} records</p>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff (Role)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date (Nepali)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-In/Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Break</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Time</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {filteredAttendance.map((att) => (
                <tr key={att._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="flex-shrink-0 h-10 w-10"><Image className="h-10 w-10 rounded-full object-cover" src={att.user?.avatar || '/default-avatar.png'} alt={att.user?.name || ''} width={40} height={40}/></div><div className="ml-4"><div className="font-medium text-gray-900">{att.user?.name || "Deleted User"}</div><div className="text-sm text-gray-500">{att.user?.role || "N/A"}</div></div></div></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{toNepaliDate(att.checkInTime)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><div>{new Date(att.checkInTime).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', hour12: true})}</div><div>{att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', hour12: true}) : '-'}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDuration(att.totalBreakDuration)}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${getDurationStyle(att)}`}>{formatDuration(att.duration)}</td>
                </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Secure this page and fetch all attendance data
export async function getServerSideProps(context) {
  await dbConnect();
  const { token } = context.req.cookies;
  if (!token) return { redirect: { destination: "/login", permanent: false } };
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    // Security: Only PMs and HR can see this report.
    if (!user || (user.role !== "Project Manager" && user.role !== "HR")) {
      return { redirect: { destination: "/dashboard", permanent: false } };
    }
    
    // Fetch all attendance records and populate user details
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
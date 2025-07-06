"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from 'next/image';
import jwt from "jsonwebtoken";
import dbConnect from "../../../lib/dbConnect";
import User from "../../../models/User";
import Attendance from "../../../models/Attendance";
import NepaliDate from "nepali-date-converter";
import { ArrowLeft, Clock } from "react-feather";

// --- Helper Functions ---
const toNepaliDate = (gregorianDate) => {
  if (!gregorianDate) return '-';
  const nepaliDate = new NepaliDate(new Date(gregorianDate));
  return nepaliDate.format('DD MMMM, YYYY'); // Format as "19 Jestha, 2081"
};

const formatDuration = (totalSeconds) => {
  if (totalSeconds === null || totalSeconds === undefined || totalSeconds < 0) return '-';
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white/80 backdrop-blur-xl shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-5 px-4 sm:px-6 lg:px-8">
            <Link href="/pm/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 mb-2 transition-colors">
                <ArrowLeft size={16} />
                Back to PM Dashboard
            </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Staff Attendance Report</h1>
          <p className="text-slate-500 mt-1">A comprehensive log of all employee attendance records.</p>
        </div>
      </header>
      
      <main className="py-10">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-500 ease-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          {/* Filter Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="role-filter" className="block text-sm font-medium text-slate-600 mb-1">Filter by Role</label>
                <select id="role-filter" value={selectedRole} onChange={(e) => { setSelectedRole(e.target.value); setSelectedUser("All"); }} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/80 transition">
                  <option value="All">All Roles</option>
                  <option value="Staff">Staff</option>
                  <option value="Intern">Intern</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
              <div>
                <label htmlFor="user-filter" className="block text-sm font-medium text-slate-600 mb-1">Filter by Employee</label>
                <select id="user-filter" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/80 transition">
                  <option value="All">All Employees</option>
                  {uniqueUsers.filter((u) => selectedRole === "All" || u.role === selectedRole).map((u) => (<option key={u._id} value={u._id}>{u.name}</option>))}
                </select>
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="flex justify-between items-center mb-0 p-6 border-b border-slate-200/80">
              <h2 className="text-xl font-semibold text-slate-800">Attendance History</h2>
              <p className="text-sm font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">Showing {filteredAttendance.length} records</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200/80">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff (Role)</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date (Nepali)</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Check-In / Out</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Break</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Work Time</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200/80">
                    {filteredAttendance.length > 0 ? filteredAttendance.map((att, index) => (
                    <tr key={att._id} className="hover:bg-slate-50/70 animate-fade-in-up" style={{ animationDelay: `${index * 30}ms`}}>
                        <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="flex-shrink-0 h-10 w-10"><Image className="h-10 w-10 rounded-full object-cover" src={att.user?.avatar || '/default-avatar.png'} alt={att.user?.name || ''} width={40} height={40}/></div><div className="ml-4"><div className="font-medium text-slate-900">{att.user?.name || "Deleted User"}</div><div className="text-sm text-slate-500">{att.user?.role || "N/A"}</div></div></div></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600">{toNepaliDate(att.checkInTime)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500"><div>{new Date(att.checkInTime).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', hour12: true})}</div><div>{att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', hour12: true}) : <span className="text-blue-600 font-medium">Active</span>}</div></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDuration(att.totalBreakDuration)}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${getDurationStyle(att)}`}>{formatDuration(att.duration)}</td>
                    </tr>
                    )) : (
                    <tr>
                      <td colSpan="5" className="text-center py-16 text-slate-500">
                        <Clock size={40} className="mx-auto text-slate-300" />
                        <h3 className="mt-4 text-lg font-semibold">No Records Found</h3>
                        <p className="mt-1">There is no attendance data for the selected filters.</p>
                      </td>
                    </tr>
                    )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

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
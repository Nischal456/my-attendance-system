import { useState } from 'react';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import Attendance from '../../../models/Attendance';
import NepaliDate from 'nepali-date-converter';


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
  const seconds = totalSeconds % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours} hr${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);
  if (hours === 0 && seconds > 0) parts.push(`${seconds} secs`);
  return parts.join(' ');
};

const MIN_WORK_SECONDS = 21600; // 6 hours

const getDurationStyle = (attendanceEntry) => {
  const style = { padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' };
  if (attendanceEntry.checkOutTime) {
    if (attendanceEntry.duration >= MIN_WORK_SECONDS) {
      style.color = '#28a745';
    } else {
      style.color = '#dc3545';
    }
  }
  return style;
};

// --- HR Dashboard Component ---
export default function HRDashboard({ user, initialAttendance }) {
  const router = useRouter();
  
  const [allAttendance] = useState(initialAttendance);
  const [filteredAttendance, setFilteredAttendance] = useState(initialAttendance);
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedUser, setSelectedUser] = useState('All');

  const uniqueUsers = useMemo(() => {
    const userMap = new Map();
    allAttendance.forEach(att => {
      if (att.user) {
        userMap.set(att.user._id, {
          _id: att.user._id,
          name: att.user.name,
          role: att.user.role,
        });
      }
    });
    return Array.from(userMap.values());
  }, [allAttendance]);

  useEffect(() => {
    let result = allAttendance;
    if (selectedRole !== 'All') {
      result = result.filter(att => att.user?.role === selectedRole);
    }
    if (selectedUser !== 'All') {
      result = result.filter(att => att.user?._id === selectedUser);
    }
    setFilteredAttendance(result);
  }, [selectedRole, selectedUser, allAttendance]);
  
  const completedDays = filteredAttendance.filter(att => att.checkOutTime);
  const totalWorkSeconds = completedDays.reduce((acc, att) => acc + (att.duration || 0), 0);
  const daysMeetingTarget = completedDays.filter(day => day.duration >= MIN_WORK_SECONDS).length;

  const handleLogout = async () => {
    await fetch('/api/auth/logout');
    router.push('/login');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>HR Admin Dashboard</h1>
      <p>Welcome, {user.name} ({user.role})</p>
      <div style={{ margin: '20px 0' }}>
        <Link href="/hr/add-user">
          <button style={{ padding: '10px 15px', cursor: 'pointer', marginRight: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
            + Add New Employee
          </button>
        </Link>
        <button onClick={handleLogout} style={{ padding: '10px 15px', cursor: 'pointer' }}>Logout</button>
      </div>
      <hr />

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', padding: '10px', background: '#f8f9fa', borderRadius: '5px', marginBottom: '20px' }}>
        <div>
          <label htmlFor="role-filter" style={{ fontWeight: 'bold', marginRight: '10px' }}>Filter by Role:</label>
          <select 
            id="role-filter" 
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setSelectedUser('All');
            }}
            style={{ padding: '8px' }}
          >
            <option value="All">All Roles</option>
            <option value="staff">staff</option>
            <option value="Intern">Intern</option>
            <option value="Manager">Manager</option>
          </select>
        </div>
        <div>
          <label htmlFor="user-filter" style={{ fontWeight: 'bold', marginRight: '10px' }}>Filter by Employee:</label>
          <select 
            id="user-filter" 
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            style={{ padding: '8px' }}
          >
            <option value="All">All Employees</option>
            {uniqueUsers
              .filter(u => selectedRole === 'All' || u.role === selectedRole)
              .map(u => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))
            }
          </select>
        </div>
      </div>

      <h2>Attendance History</h2>
      <div style={{ background: '#f8f9fa', padding: '10px', border: '1px solid #dee2e6', borderRadius: '5px', marginBottom: '15px' }}>
          <h3 style={{ margin: '0 0 5px 0' }}>Filtered Summary</h3>
          <div><strong>Total Logged Time:</strong> {formatDuration(totalWorkSeconds)}</div>
          <div><strong>Days Meeting 6-Hour Target:</strong> {daysMeetingTarget} / {completedDays.length}</div>
      </div>

      <table style={{width: "100%", borderCollapse: 'collapse', marginTop: '20px', fontSize: '0.9em'}}>
        <thead>
          <tr style={{background: '#f2f2f2'}}>
            <th style={{padding: '8px', border: '1px solid #ddd', textAlign: 'left'}}>Staff (Role)</th>
            <th style={{padding: '8px', border: '1px solid #ddd', textAlign: 'left'}}>Phone Number</th>
            <th style={{padding: '8px', border: '1px solid #ddd', textAlign: 'left'}}>Date (Nepali)</th>
            <th style={{padding: '8px', border: '1px solid #ddd', textAlign: 'left'}}>Check-In</th>
            <th style={{padding: '8px', border: '1px solid #ddd', textAlign: 'left'}}>Check-Out</th>
            <th style={{padding: '8px', border: '1px solid #ddd', textAlign: 'left'}}>Break Duration</th>
            <th style={{padding: '8px', border: '1px solid #ddd', textAlign: 'left'}}>Net Work Time</th>
            <th style={{padding: '8px', border: '1px solid #ddd', textAlign: 'left'}}>Description</th>
          </tr>
        </thead>
        <tbody>
          {filteredAttendance.map(att => (
            <tr key={att._id}>
              <td style={{padding: '8px', border: '1px solid #ddd'}}>
                {att.user?.name || 'Deleted User'} 
                <span style={{color: '#6c757d', fontSize: '0.9em'}}> ({att.user?.role || 'N/A'})</span>
              </td>
              <td style={{padding: '8px', border: '1px solid #ddd'}}>{att.user?.phoneNumber || '-'}</td>
              <td style={{padding: '8px', border: '1px solid #ddd'}}>{toNepaliDate(att.checkInTime)}</td>
              <td style={{padding: '8px', border: '1px solid #ddd'}}>{new Date(att.checkInTime).toLocaleTimeString()}</td>
              <td style={{padding: '8px', border: '1px solid #ddd'}}>
                {att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString() : <span style={{color: 'blue'}}>In Progress...</span>}
              </td>
              <td style={{padding: '8px', border: '1px solid #ddd'}}>{formatDuration(att.totalBreakDuration)}</td>
              <td style={getDurationStyle(att)}>{formatDuration(att.duration)}</td>
              <td style={{padding: '8px', border: '1px solid #ddd', maxWidth: '200px', whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
                {att.description || '-'}
              </td>
            </tr>
          ))}
          {filteredAttendance.length === 0 && (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>No records match the current filters.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// --- Server-Side Props for HR Dashboard ---
export async function getServerSideProps(context) {
  await dbConnect();
  const { token } = context.req.cookies;
  if (!token) {
    return { redirect: { destination: '/login', permanent: false } };
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || user.role !== 'HR') {
      return { redirect: { destination: '/dashboard', permanent: false } };
    }
    const allAttendance = await Attendance.find({})
      .populate('user', 'name role phoneNumber')
      .sort({ checkInTime: -1 });
    return {
      props: { 
        user: JSON.parse(JSON.stringify(user)),
        initialAttendance: JSON.parse(JSON.stringify(allAttendance)),
      },
    };
  } catch (error) {
    console.error("HR Dashboard getServerSideProps Error:", error);
    return { redirect: { destination: '/login', permanent: false } };
  }
}

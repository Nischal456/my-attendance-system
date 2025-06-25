import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import jwt from 'jsonwebtoken';
import User from '../../models/User';
import Attendance from '../../models/Attendance';
import dbConnect from '../../lib/dbConnect';
import NepaliDate from 'nepali-date-converter';
import Image from 'next/image';
import { LogOut, Clock, Calendar, Coffee, CheckCircle, AlertCircle } from 'react-feather';

// --- Helper Functions ---
const toNepaliDate = (gregorianDate, includeTime = false) => {
  if (!gregorianDate) return '-';
  const date = new Date(gregorianDate);
  const nepaliDate = new NepaliDate(date).format('DD MMMM, YYYY');
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return includeTime ? `${nepaliDate} at ${time}` : nepaliDate;
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

const formatElapsedTime = (startTime) => {
  const now = new Date();
  const start = new Date(startTime);
  const seconds = Math.floor((now - start) / 1000);
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

// --- Main Dashboard Component ---
export default function Dashboard({ user, initialAttendance, activeCheckIn, initialIsOnBreak }) {
  const [attendance, setAttendance] = useState(initialAttendance);
  const [description, setDescription] = useState(activeCheckIn?.description || '');
  const [error, setError] = useState('');
  const [activeAttendanceId, setActiveAttendanceId] = useState(activeCheckIn?._id || null);
  const [checkInTime, setCheckInTime] = useState(activeCheckIn?.checkInTime || null);
  const [elapsedTime, setElapsedTime] = useState('');
  const [isOnBreak, setIsOnBreak] = useState(initialIsOnBreak || false);

  const router = useRouter();

  const MIN_WORK_SECONDS = 21600; // 6 hours in seconds
  const completedDays = attendance.filter(att => att.checkOutTime);
  const totalWorkSeconds = completedDays.reduce((acc, att) => acc + (att.duration || 0), 0);
  const daysMeetingTarget = completedDays.filter(day => day.duration >= MIN_WORK_SECONDS).length;

  useEffect(() => {
    if (checkInTime) {
      const timerInterval = setInterval(() => {
        setElapsedTime(formatElapsedTime(checkInTime));
      }, 1000);
      return () => clearInterval(timerInterval);
    } else {
      setElapsedTime('');
    }
  }, [checkInTime]);

  // --- Event Handlers ---
  const handleCheckIn = async () => {
    setError('');
    try {
      const res = await fetch('/api/attendance/checkin', { method: 'POST' });
      const { data, message } = await res.json();
      if (!res.ok) throw new Error(message || 'Failed to check in');
      setActiveAttendanceId(data._id);
      setCheckInTime(data.checkInTime);
      setAttendance([data, ...attendance]);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCheckOut = async () => {
    if (!description.trim()) {
      setError('Please provide a description of your work.');
      return;
    }
    setError('');
    try {
      const res = await fetch('/api/attendance/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, attendanceId: activeAttendanceId }),
      });
      const { data, message } = await res.json();
      if (!res.ok) throw new Error(message || 'Failed to check out');
      setActiveAttendanceId(null);
      setCheckInTime(null);
      setDescription('');
      setIsOnBreak(false);
      setAttendance(attendance.map(att => att._id === data._id ? data : att));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBreakIn = async () => {
    setError('');
    try {
      const res = await fetch('/api/attendance/break-in', { method: 'POST' });
      const { message } = await res.json();
      if (!res.ok) throw new Error(message || 'Failed to start break');
      setIsOnBreak(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBreakOut = async () => {
    setError('');
    try {
      const res = await fetch('/api/attendance/break-out', { method: 'POST' });
      const { message } = await res.json();
      if (!res.ok) throw new Error(message || 'Failed to end break');
      setIsOnBreak(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Image src="/logo.png" alt="Gecko Logo" width={40} height={40} className="rounded-full" />
            <h1 className="text-xl font-bold text-gray-800">Gecko Attendance</h1>
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-2 text-gray-600">
              <Calendar size={18} />
              <span>{toNepaliDate(new Date(), true)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-700 font-medium">{user.name}</span>
              <span className="bg-[#2ac759]/10 text-[#2ac759] px-2 py-1 rounded-full text-xs">
                {user.role}
              </span>
            </div>
            <button onClick={handleLogout} className="flex items-center space-x-1 text-gray-500 hover:text-gray-700">
              <LogOut size={18} />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 flex items-center bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <AlertCircle className="text-red-500 mr-3" />
            <div className="text-red-700">{error}</div>
          </div>
        )}

        {/* Time Tracking Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8 border border-gray-100">
          <div className="p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Today's Work</h2>
            {!checkInTime ? (
              <div className="text-center py-8">
                <button
                  onClick={handleCheckIn}
                  className="bg-[#2ac759] hover:bg-[#25b04f] text-white font-medium py-3 px-8 rounded-lg transition-all hover:shadow-lg"
                >
                  Check In
                </button>
                <p className="mt-3 text-gray-500">Start tracking your work hours</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-700">
                      Currently Checked In
                      {isOnBreak && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          <Coffee className="mr-1" size={12} /> On Break
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Checked in at {toNepaliDate(checkInTime, true)}
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <div className="text-3xl font-bold text-gray-900 flex items-center">
                      <Clock className="mr-2 text-[#2ac759]" size={24} />
                      {elapsedTime}
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Work Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What did you work on today?"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2ac759] focus:border-transparent"
                    disabled={isOnBreak}
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  {!isOnBreak ? (
                    <>
                      <button
                        onClick={handleBreakIn}
                        className="flex items-center bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg transition-all"
                      >
                        <Coffee className="mr-2" size={16} /> Start Break
                      </button>
                      <button
                        onClick={handleCheckOut}
                        className="flex items-center bg-[#2ac759] hover:bg-[#25b04f] text-white font-medium py-2 px-4 rounded-lg transition-all"
                      >
                        <CheckCircle className="mr-2" size={16} /> Check Out
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleBreakOut}
                      className="flex items-center bg-[#2ac759] hover:bg-[#25b04f] text-white font-medium py-2 px-4 rounded-lg transition-all"
                    >
                      <CheckCircle className="mr-2" size={16} /> End Break
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Logged Time</h3>
            <p className="text-2xl font-semibold text-gray-800">{formatDuration(totalWorkSeconds)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Completed Days</h3>
            <p className="text-2xl font-semibold text-gray-800">{completedDays.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Target Met Days</h3>
            <p className="text-2xl font-semibold text-gray-800">
              {daysMeetingTarget} <span className="text-sm text-gray-500">/ {completedDays.length}</span>
            </p>
          </div>
        </div>

        {/* Attendance History */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Your Attendance History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Break
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Work Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendance.map((att) => (
                  <tr key={att._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">{toNepaliDate(att.checkInTime)}</div>
                      <div className="text-gray-500 text-xs">
                        {att.checkInTime && new Date(att.checkInTime).toLocaleTimeString()}
                        {att.checkOutTime && ` - ${new Date(att.checkOutTime).toLocaleTimeString()}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDuration(att.totalBreakDuration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`font-medium ${
                          att.checkOutTime
                            ? att.duration >= MIN_WORK_SECONDS
                              ? 'text-green-600'
                              : 'text-red-600'
                            : 'text-blue-600'
                        }`}
                      >
                        {formatDuration(att.duration)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {att.description || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- Server-Side Props ---
export async function getServerSideProps(context) {
  await dbConnect();
  const { token } = context.req.cookies;
  if (!token) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return { redirect: { destination: '/login', permanent: false } };
    }
    if (user.role === 'HR') {
      return { redirect: { destination: '/hr/dashboard', permanent: false } };
    }

    const attendanceHistory = await Attendance.find({ user: user._id }).sort({ checkInTime: -1 });
    const activeCheckIn = attendanceHistory.find(att => !att.checkOutTime) || null;
    let initialIsOnBreak = false;

    if (activeCheckIn) {
      initialIsOnBreak = activeCheckIn.breaks.some(b => !b.breakOutTime);
    }

    return {
      props: {
        user: JSON.parse(JSON.stringify(user)),
        initialAttendance: JSON.parse(JSON.stringify(attendanceHistory)),
        activeCheckIn: JSON.parse(JSON.stringify(activeCheckIn)),
        initialIsOnBreak,
      },
    };
  } catch (error) {
    console.error("Authentication Error in getServerSideProps:", error);
    return { redirect: { destination: '/login', permanent: false } };
  }
}
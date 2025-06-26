import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import jwt from 'jsonwebtoken';
import User from '../../models/User';
import Attendance from '../../models/Attendance';
import Task from '../../models/Task'; // Import the Task model
import dbConnect from '../../lib/dbConnect';
import NepaliDate from 'nepali-date-converter';
import Image from 'next/image';

import { LogOut, Clock, Calendar, Coffee, CheckCircle, AlertCircle, Play, Star, List, Bell, Edit } from 'react-feather';
import { ChevronDown  } from 'lucide-react';
// --- Helper Functions ---

const formatEnglishDate = (dateString, includeTime = false) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
  const formattedDate = date.toLocaleDateString('en-US', options);
  if (includeTime) {
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${formattedDate} at ${time}`;
  }
  return formattedDate;
};

const toNepaliDate = (gregorianDate) => {
  if (!gregorianDate) return '-';
  const date = new Date(gregorianDate);
  const nepaliDate = new NepaliDate(date);
  return nepaliDate.format('DD MMMM, YYYY'); // Format as "DD MMMM, YYYY"
};

const formatDuration = (totalSeconds) => {
  if (totalSeconds === null || totalSeconds === undefined || totalSeconds < 0) return '0 mins';
  if (totalSeconds < 60) return `${totalSeconds} secs`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts = [];
  if (hours > 0) parts.push(`${hours} hr${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);
  return parts.join(' ') || '0 mins';
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

const MIN_WORK_SECONDS = 21600;

const getStatusClasses = (status) => {
  switch (status) {
    case 'In Progress': return 'bg-blue-100 text-blue-800';
    case 'Completed': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getDeadlineInfo = (task) => {
  if (!task.deadline) {
    return { text: '-', classes: 'text-gray-400' };
  }
  const deadlineText = formatEnglishDate(task.deadline);
  if (task.status === 'Completed') {
    return { text: deadlineText, classes: 'text-gray-400' };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(task.deadline) < today) {
    return { text: `${deadlineText} (Overdue)`, classes: 'text-red-600 font-bold' };
  }
  return { text: deadlineText, classes: 'text-gray-600' };
};


// --- Main Dashboard Component ---
export default function Dashboard({ user, initialAttendance, initialTasks, activeCheckIn, initialIsOnBreak }) {
  const [attendance, setAttendance] = useState(initialAttendance);
  const [description, setDescription] = useState(activeCheckIn?.description || '');
  const [error, setError] = useState('');
  const [activeAttendanceId, setActiveAttendanceId] = useState(activeCheckIn?._id || null);
  const [checkInTime, setCheckInTime] = useState(activeCheckIn?.checkInTime || null);
  const [elapsedTime, setElapsedTime] = useState('');
  const [isOnBreak, setIsOnBreak] = useState(initialIsOnBreak || false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tasks, setTasks] = useState(initialTasks);
  const [profileUser, setProfileUser] = useState(user);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const completedDays = attendance.filter(att => att.checkOutTime);
  const totalWorkSeconds = completedDays.reduce((acc, att) => acc + (att.duration || 0), 0);
  const daysMeetingTarget = completedDays.filter(day => day.duration >= MIN_WORK_SECONDS).length;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  useEffect(() => {
    if (checkInTime) {
      const timerInterval = setInterval(() => { setElapsedTime(formatElapsedTime(checkInTime)); }, 1000);
      return () => clearInterval(timerInterval);
    } else {
      setElapsedTime('');
    }
  }, [checkInTime]);

  useEffect(() => {
    const timerId = setInterval(() => { setCurrentTime(new Date()); }, 1000);
    return () => clearInterval(timerId);
  }, []);

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

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    setError('');
    try {
      const res = await fetch('/api/tasks/update-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, newStatus }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      setTasks(currentTasks =>
        currentTasks.map(task => (task._id === taskId ? result.data : task))
      );
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      handleAvatarUpload(reader.result);
    };
    reader.onerror = () => {
      setError("Could not read the selected file.");
    };
  };

  const handleAvatarUpload = async (base64Image) => {
    setIsUploading(true);
    setError('');
    try {
      const res = await fetch('/api/user/upload-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setProfileUser(prev => ({ ...prev, avatar: data.avatar }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
        <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-md' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Dashboard Title */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 flex items-center">
              <Image
                src="/geckoworks.png"
                alt="GeckoWorks Logo"
                width={64}
                height={86}
                className="rounded-full border-2 border-white shadow-sm"
              />
            </div>
            <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">
              {user.name}'s Dashboard
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Date and Time */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-indigo-500" />
              <span>{formatEnglishDate(new Date())}</span>
              <span className="mx-1 text-gray-300">|</span>
              <Clock className="h-4 w-4 text-indigo-500" />
              <span>
                {currentTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {/* Notifications */}
            <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 relative">
              <Bell className="h-5 w-5" />
              <span className="sr-only">View notifications</span>
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative ml-3">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Image
                    src={profileUser.avatar}
                    alt={profileUser.name}
                    width={36}
                    height={36}
                    className="rounded-full border-2 border-white shadow-sm"
                  />
                  <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white"></span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1 max-w-[120px]">
                    {profileUser.name}
                  </p>
                  <p className="text-xs text-gray-500">{profileUser.role}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
            >
              <LogOut className="h-5 w-5 mr-1" />
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-4">
            <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
            </button>

            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-1"
              >
                <Image
                  src={profileUser.avatar}
                  alt={profileUser.name}
                  width={32}
                  height={32}
                  className="rounded-full border-2 border-white shadow-sm"
                />
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Mobile Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 z-10">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium text-gray-900">
                      {profileUser.name}
                    </p>
                    <p className="text-xs text-gray-500">{profileUser.role}</p>
                  </div>
                  <div className="px-4 py-2 text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3 text-indigo-500" />
                      <span>{formatEnglishDate(new Date())}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Clock className="h-3 w-3 text-indigo-500" />
                      <span>
                        {currentTime.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (<div className="mb-6 flex items-center bg-red-50 border-l-4 border-red-500 p-4 rounded"><AlertCircle className="text-red-500 mr-3" /><div className="text-red-700">{error}</div></div>)}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 flex items-center space-x-6">
              <div className="relative">
                <Image src={profileUser.avatar} alt="Profile Picture" width={80} height={80} className="rounded-full object-cover border-4 border-white shadow-lg"/>
                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-green-500 text-white rounded-full p-1.5 cursor-pointer hover:bg-green-600 transition">
                  <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isUploading} />
                  {isUploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Edit size={14} />}
                </label>
              </div>
              <div><h2 className="text-2xl font-bold text-gray-800">{profileUser.name}</h2><p className="text-gray-600">{profileUser.role}</p></div>
            </div>
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="p-6 md:p-8"><h2 className="text-xl font-semibold text-gray-800 mb-6">Today's Work</h2>
                {!checkInTime ? (
                  <div className="text-center py-8"><button onClick={handleCheckIn} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105 shadow-lg hover:shadow-green-500/30">Check In</button><p className="mt-3 text-sm text-gray-500">Start tracking your work hours</p></div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-col"><h3 className="text-lg font-medium text-gray-700">Currently Checked In {isOnBreak && <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Coffee className="mr-1" size={12} /> On Break</span>}</h3><p className="text-sm text-gray-500">Since {new Date(checkInTime).toLocaleTimeString()}</p><div className="mt-4 text-4xl font-bold text-gray-900 tracking-wider flex items-center"><Clock className="mr-2 text-green-500" size={30} />{elapsedTime}</div></div>
                    <div><label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Work Description</label><textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What did you work on today?" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" disabled={isOnBreak} /></div>
                    <div className="flex flex-wrap gap-3">{!isOnBreak ? (<><button onClick={handleBreakIn} className="flex items-center bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg transition-all"><Coffee className="mr-2" size={16} /> Start Break</button><button onClick={handleCheckOut} className="flex items-center bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-all"><LogOut className="mr-2" size={16} /> Check Out</button></>) : (<button onClick={handleBreakOut} className="flex items-center bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-all"><CheckCircle className="mr-2" size={16} /> End Break</button>)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="px-6 py-5 border-b border-gray-200 flex items-center space-x-3"><List className="text-green-500" /><h2 className="text-lg font-semibold text-gray-800">My Assigned Tasks</h2></div>
              <div className="p-6 md:p-8 space-y-4">
                {tasks.length === 0 ? (<p className="text-center text-gray-500 py-4">You have no tasks assigned at the moment.</p>) : (
                  tasks.map(task => {
                    const deadlineInfo = getDeadlineInfo(task);
                    return (
                      <div key={task._id} className="p-4 border border-gray-200 rounded-lg transition-shadow hover:shadow-md">
                        <div className="flex justify-between items-start gap-4"><div><h4 className="font-semibold text-gray-800">{task.title}</h4><p className="text-sm text-gray-600 mt-1">{task.description}</p></div><span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium ${getStatusClasses(task.status)}`}>{task.status}</span></div>
                        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 items-center justify-between">
                          <div className="text-xs text-gray-400">Assigned: {formatEnglishDate(task.createdAt)}</div>
                          <div className={`text-xs font-semibold flex items-center gap-1 ${deadlineInfo.classes}`}><Bell size={14} /><span>Deadline: {deadlineInfo.text}</span></div>
                        </div>
                        <div className="mt-4 border-t border-gray-100 pt-4 flex items-center justify-end">
                          {task.status === 'To Do' && (<button onClick={() => handleUpdateTaskStatus(task._id, 'In Progress')} className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 px-3 rounded-lg text-sm transition-all"><Play size={14} className="mr-1" /> Start Task</button>)}
                          {task.status === 'In Progress' && (<button onClick={() => handleUpdateTaskStatus(task._id, 'Completed')} className="flex items-center bg-green-500 hover:bg-green-600 text-white font-medium py-1 px-3 rounded-lg text-sm transition-all"><CheckCircle size={14} className="mr-1" /> Mark as Completed</button>)}
                          {task.status === 'Completed' && (<div className="text-sm text-green-600 font-medium flex items-center"><Star size={14} className="mr-1 fill-current" /> Completed on {formatEnglishDate(task.completedAt)}</div>)}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="px-6 py-5 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-800">Your Attendance History</h2></div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Break</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Time</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th></tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">{attendance.map((att) => (<tr key={att._id} className="hover:bg-gray-50"><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><div className="font-medium">{toNepaliDate(att.checkInTime)}</div><div className="text-gray-500 text-xs">{att.checkInTime && new Date(att.checkInTime).toLocaleTimeString()}{att.checkOutTime && ` - ${new Date(att.checkOutTime).toLocaleTimeString()}`}</div></td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDuration(att.totalBreakDuration)}</td><td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`font-medium ${att.checkOutTime ? att.duration >= MIN_WORK_SECONDS ? 'text-green-600' : 'text-red-600' : 'text-blue-600'}`}>{formatDuration(att.duration)}</span></td><td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{att.description || '-'}</td></tr>))}</tbody>
                    </table>
                </div>
            </div>
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
    if (user.role === 'Project Manager') {
        return { redirect: { destination: '/pm/dashboard', permanent: false } };
    }
    const attendanceHistory = await Attendance.find({ user: user._id }).sort({ checkInTime: -1 });
    const activeCheckIn = attendanceHistory.find(att => !att.checkOutTime) || null;
    let initialIsOnBreak = activeCheckIn ? activeCheckIn.breaks.some(b => !b.breakOutTime) : false;
    const tasks = await Task.find({ assignedTo: user._id }).sort({ createdAt: -1 });
    return {
      props: {
        user: JSON.parse(JSON.stringify(user)),
        initialAttendance: JSON.parse(JSON.stringify(attendanceHistory)),
        activeCheckIn: JSON.parse(JSON.stringify(activeCheckIn)),
        initialIsOnBreak,
        initialTasks: JSON.parse(JSON.stringify(tasks)),
      },
    };
  } catch (error) {
    console.error("Authentication Error in getServerSideProps:", error);
    return { redirect: { destination: '/login', permanent: false } };
  }
}
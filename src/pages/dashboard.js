import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import jwt from 'jsonwebtoken';
import User from '../../models/User';
import Attendance from '../../models/Attendance';
import dbConnect from '../../lib/dbConnect';
import NepaliDate from 'nepali-date-converter';

// --- Helper Functions ---

const toNepaliDate = (gregorianDate) => {
  if (!gregorianDate) return '-';
  const nepaliDate = new NepaliDate(new Date(gregorianDate));
  // CORRECTED: Using 'YYYY' makes the year dynamic instead of hardcoded.
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
  // --- State Definitions ---
  const [attendance, setAttendance] = useState(initialAttendance);
  const [description, setDescription] = useState(activeCheckIn?.description || '');
  const [error, setError] = useState('');
  const [activeAttendanceId, setActiveAttendanceId] = useState(activeCheckIn?._id || null);
  const [checkInTime, setCheckInTime] = useState(activeCheckIn?.checkInTime || null);
  const [elapsedTime, setElapsedTime] = useState('');
  const [isOnBreak, setIsOnBreak] = useState(initialIsOnBreak || false);

  const router = useRouter();
  const MIN_WORK_SECONDS = 21600;

  // --- Calculations ---
  const completedDays = attendance.filter(att => att.checkOutTime);
  const totalWorkSeconds = completedDays.reduce((acc, att) => acc + (att.duration || 0), 0);
  const daysMeetingTarget = completedDays.filter(day => day.duration >= MIN_WORK_SECONDS).length;

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

  // --- TIMER LOGIC: This useEffect hook runs the timer ---
  // It starts when `checkInTime` receives a valid date and stops when it becomes null.
  useEffect(() => {
    // Ensure there is a check-in time to start the timer
    if (checkInTime) {
      // Set an interval to update the elapsed time every second
      const timerInterval = setInterval(() => {
        setElapsedTime(formatElapsedTime(checkInTime));
      }, 1000);
      
      // Cleanup function: This is crucial to stop the timer when the component unmounts or checkInTime changes
      return () => clearInterval(timerInterval);
    } else {
      // If there's no check-in time, ensure the timer display is empty
      setElapsedTime('');
    }
  }, [checkInTime]); // The dependency array ensures this effect re-runs only when `checkInTime` changes.


  // --- Event Handlers ---

  const handleCheckIn = async () => {
    setError('');
    try {
      const res = await fetch('/api/attendance/checkin', { method: 'POST' });
      const { data, message } = await res.json();
      if (!res.ok) throw new Error(message || 'Failed to check in');
      
      // These state updates are what make the timer appear and start
      setActiveAttendanceId(data._id);
      setCheckInTime(data.checkInTime); // This is the key line that triggers the timer's useEffect
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
      setCheckInTime(null); // Setting this to null stops the timer
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
      if (!res.ok) throw new Error(message);
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
      if (!res.ok) throw new Error(message);
      setIsOnBreak(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout');
    router.push('/login');
  };

  // --- JSX Rendering ---

  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome, {user.name} ({user.role})</h1>
      <h3>Today's Date: {toNepaliDate(new Date())}</h3>
      <button onClick={handleLogout}>Logout</button>
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

      <hr />

      <div>
        <h3>Log your work</h3>
        {/* This conditional rendering shows the timer only after check-in */}
        {!checkInTime ? (
          <button onClick={handleCheckIn}>Check-In</button>
        ) : (
          <div>
            <h3>
              Currently Checked In
              {isOnBreak && <span style={{ color: 'orange', marginLeft: '10px' }}>(On Break)</span>}
            </h3>
            {/* The timer is displayed here */}
            <h2>Timer: {elapsedTime}</h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on?"
              rows="4"
              cols="50"
              disabled={isOnBreak}
            ></textarea>
            <br/>
            {!isOnBreak ? (
              <>
                <button onClick={handleBreakIn} style={{backgroundColor: 'orange', color: 'white'}}>Start Break</button>
                <button onClick={handleCheckOut}>Check-Out</button>
              </>
            ) : (
              <button onClick={handleBreakOut} style={{backgroundColor: 'green', color: 'white'}}>End Break</button>
            )}
          </div>
        )}
      </div>

      <hr />
      
      <div>
        <h2>Your Attendance History</h2>
        <div style={{ background: '#f8f9fa', padding: '10px', border: '1px solid #dee2e6', borderRadius: '5px', marginBottom: '15px' }}>
          <h3 style={{ margin: '0 0 5px 0' }}>Summary</h3>
          <div><strong>Total Logged Time:</strong> {formatDuration(totalWorkSeconds)}</div>
          <div><strong>Days Meeting 6-Hour Target:</strong> {daysMeetingTarget} / {completedDays.length}</div>
        </div>
        <table style={{width: "100%", borderCollapse: 'collapse'}}>
            <thead>
                <tr>
                    <th style={{padding: '8px', border: '1px solid #ddd'}}>Date (Nepali)</th>
                    <th style={{padding: '8px', border: '1px solid #ddd'}}>Check-In</th>
                    <th style={{padding: '8px', border: '1px solid #ddd'}}>Check-Out</th>
                    <th style={{padding: '8px', border: '1px solid #ddd'}}>Break Duration</th>
                    <th style={{padding: '8px', border: '1px solid #ddd'}}>Net Work Time</th>
                    <th style={{padding: '8px', border: '1px solid #ddd'}}>Description</th>
                </tr>
            </thead>
            <tbody>
                {attendance.map(att => (
                    <tr key={att._id}>
                        <td style={{padding: '8px', border: '1px solid #ddd'}}>{toNepaliDate(att.checkInTime)}</td>
                        <td style={{padding: '8px', border: '1px solid #ddd'}}>{new Date(att.checkInTime).toLocaleTimeString()}</td>
                        <td style={{padding: '8px', border: '1px solid #ddd'}}>
                            {att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString() : 'In Progress...'}
                        </td>
                        <td style={{padding: '8px', border: '1px solid #ddd'}}>{formatDuration(att.totalBreakDuration)}</td>
                        <td style={getDurationStyle(att)}>{formatDuration(att.duration)}</td>
                        <td style={{padding: '8px', border: '1px solid #ddd'}}>{att.description || '-'}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
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

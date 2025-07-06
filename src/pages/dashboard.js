import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import jwt from 'jsonwebtoken';
import User from '../../models/User';
import Attendance from '../../models/Attendance';
import Task from '../../models/Task';
import dbConnect from '../../lib/dbConnect';
import Note from '../../models/Note';
import Notification from '../../models/Notification';
import Image from 'next/image';
import { LogOut, Clock, Calendar, Coffee, CheckCircle, AlertCircle, Play, Star, List, Bell, Edit, Trash2, Save, X, User as UserIcon, FileText } from 'react-feather';
import { ChevronDown } from 'lucide-react';

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
  if (!task.deadline) { return { text: '-', classes: 'text-gray-400' }; }
  const deadlineText = formatEnglishDate(task.deadline);
  if (task.status === 'Completed') { return { text: deadlineText, classes: 'text-gray-400' }; }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(task.deadline) < today) {
    return { text: `${deadlineText} (Overdue)`, classes: 'text-red-600 font-bold' };
  }
  return { text: deadlineText, classes: 'text-gray-600' };
};
const handleApiError = async (response) => {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        const errorData = await response.json();
        return errorData.message || `HTTP error! status: ${response.status}`;
    } else {
        return `HTTP error! status: ${response.status} - ${response.statusText}`;
    }
};

export default function Dashboard({ user, initialAttendance, initialTasks, initialNotes, activeCheckIn, initialIsOnBreak, initialNotifications }) {
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications || []);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  const unreadNotifications = useMemo(() => notifications.filter(n => !n.isRead), [notifications]);
  
  useEffect(() => { const handleScroll = () => setIsScrolled(window.scrollY > 10); window.addEventListener('scroll', handleScroll); return () => window.removeEventListener('scroll', handleScroll); }, []);
  useEffect(() => { if (checkInTime) { const timer = setInterval(() => setElapsedTime(formatElapsedTime(checkInTime)), 1000); return () => clearInterval(timer); } else { setElapsedTime(''); } }, [checkInTime]);
  useEffect(() => { const timer = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { function handleClickOutside(event) { if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) setIsNotificationOpen(false); if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) setIsDropdownOpen(false); } document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, []);

  const handleCheckIn = async () => { setError(''); try { const res = await fetch('/api/attendance/checkin', { method: 'POST' }); if (!res.ok) throw new Error(await handleApiError(res)); const { data } = await res.json(); setActiveAttendanceId(data._id); setCheckInTime(data.checkInTime); setAttendance([data, ...attendance]); } catch (err) { setError(err.message); }};
  const handleCheckOut = async () => { if (!description.trim()) { setError('Please provide a description of your work.'); return; } setError(''); try { const res = await fetch('/api/attendance/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description, attendanceId: activeAttendanceId }), }); if (!res.ok) throw new Error(await handleApiError(res)); const { data } = await res.json(); setActiveAttendanceId(null); setCheckInTime(null); setDescription(''); setIsOnBreak(false); setAttendance(attendance.map(att => att._id === data._id ? data : att)); } catch (err) { setError(err.message); }};
  const handleBreakIn = async () => { setError(''); try { const res = await fetch('/api/attendance/break-in', { method: 'POST' }); if (!res.ok) throw new Error(await handleApiError(res)); setIsOnBreak(true); } catch (err) { setError(err.message); }};
  const handleBreakOut = async () => { setError(''); try { const res = await fetch('/api/attendance/break-out', { method: 'POST' }); if (!res.ok) throw new Error(await handleApiError(res)); setIsOnBreak(false); } catch (err) { setError(err.message); }};
  const handleLogout = async () => { await fetch('/api/auth/logout'); router.push('/login'); };
  const handleUpdateTaskStatus = async (taskId, newStatus) => { setError(''); try { const res = await fetch('/api/tasks/update-status', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId, newStatus }), }); if (!res.ok) throw new Error(await handleApiError(res)); const result = await res.json(); setTasks(currentTasks => currentTasks.map(task => (task._id === taskId ? result.data : task))); } catch (err) { setError(err.message); }};
  const handleFileChange = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.readAsDataURL(file); reader.onloadend = () => { handleAvatarUpload(reader.result); }; reader.onerror = () => { setError("Could not read the selected file."); }; };
  const handleAvatarUpload = async (base64Image) => { setIsUploading(true); setError(''); try { const res = await fetch('/api/user/upload-avatar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64Image }), }); if (!res.ok) throw new Error(await handleApiError(res)); const data = await res.json(); setProfileUser(prev => ({ ...prev, avatar: data.avatar })); } catch (err) { setError(err.message); } finally { setIsUploading(false); }};
  const handleCreateNote = async (e) => { e.preventDefault(); if (!newNoteContent.trim()) return; setIsSubmittingNote(true); setError(''); try { const res = await fetch('/api/notes/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: newNoteContent }), }); if (!res.ok) throw new Error(await handleApiError(res)); const result = await res.json(); setNotes(prevNotes => [result.data, ...prevNotes]); setNewNoteContent(''); } catch (err) { setError(err.message); } finally { setIsSubmittingNote(false); }};
  const handleUpdateNote = async () => { if (!editingNote || !editingNote.content.trim()) return; setIsSubmittingNote(true); setError(''); try { const res = await fetch('/api/notes/edit', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ noteId: editingNote._id, content: editingNote.content }), }); if (!res.ok) throw new Error(await handleApiError(res)); const result = await res.json(); setNotes(prevNotes => prevNotes.map(n => n._id === editingNote._id ? result.data : n)); setEditingNote(null); } catch (err) { setError(err.message); } finally { setIsSubmittingNote(false); }};
  const handleDeleteNote = async (noteId) => { if (!window.confirm('Are you sure you want to delete this note?')) return; setError(''); try { const res = await fetch('/api/notes/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ noteId }), }); if (!res.ok) throw new Error(await handleApiError(res)); setNotes(prevNotes => prevNotes.filter(n => n._id !== noteId)); } catch (err) { setError(err.message); }};
  const handleMarkAsRead = async () => { if (unreadNotifications.length === 0) return; try { await fetch('/api/notification/mark-as-read', { method: 'POST' }); setNotifications(prev => prev.map(n => ({ ...n, isRead: true }))); } catch (err) { console.error(err); } };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className={`sticky top-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-md' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                  <div className="flex items-center space-x-3"><div className="flex-shrink-0 flex items-center"><Image src="/geckoworks.png" alt="GeckoWorks Logo" width={40} height={40} className="rounded-full" /></div><h1 className="text-lg font-semibold text-gray-900 hidden sm:block">{user.name}'s Dashboard</h1></div>
                  <div className="flex items-center space-x-2 sm:space-x-4">
                      <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600"><Calendar className="h-4 w-4 text-indigo-500" /><span>{currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span><span className="mx-1 text-gray-300">|</span><Clock className="h-4 w-4 text-indigo-500" /><span>{currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}</span></div>
                      <div ref={notificationDropdownRef} className="relative"><button onClick={() => { setIsNotificationOpen(prev => !prev); if (!isNotificationOpen) handleMarkAsRead(); }} className="relative p-2 text-gray-600 hover:text-indigo-600 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" title="Notifications"><Bell className="h-6 w-6"/>{unreadNotifications.length > 0 && (<span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">{unreadNotifications.length}</span>)}</button>{isNotificationOpen && ( <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-20"><div className="p-4 border-b"><h3 className="text-lg font-semibold">Notifications</h3></div><div className="max-h-96 overflow-y-auto">{notifications.length > 0 ? notifications.map(notif => (<Link key={notif._id} href={notif.link || '#'} passHref legacyBehavior><a className="block p-4 hover:bg-gray-50"><p className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>{notif.content}</p><p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleString()}</p></a></Link>)) : (<p className="p-4 text-sm text-gray-500">You're all caught up!</p>)}</div></div> )}</div>
                      <div ref={userDropdownRef} className="relative"><button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 bg-white pl-1 pr-3 py-1 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"><Image src={profileUser.avatar} alt={profileUser.name} width={32} height={32} className="rounded-full object-cover aspect-square"/><span className="font-semibold text-sm text-gray-700 hidden sm:block">{profileUser.name.split(' ')[0]}</span><ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} /></button>{isDropdownOpen && (<div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20"><div className="px-4 py-3 border-b"><p className="text-sm font-medium text-gray-900 truncate">{profileUser.name}</p><p className="text-xs text-gray-500">{profileUser.role}</p></div><div className="py-1"><Link href="/leaves" legacyBehavior><a className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"><FileText className="h-4 w-4 text-gray-500" /><span>My Leave</span></a></Link></div><div className="py-1 border-t"><button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"><LogOut className="h-4 w-4 text-gray-500" /><span>Sign Out</span></button></div></div>)}</div>
                  </div>
              </div>
          </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {error && (<div className="mb-6 flex items-center bg-red-50 border-l-4 border-red-500 p-4 rounded"><AlertCircle className="text-red-500 mr-3" /><div className="text-red-700">{error}</div></div>)}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-8"><div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 flex items-center space-x-6"><div className="relative"><Image src={profileUser.avatar} alt="Profile Picture" width={80} height={80} className="rounded-full object-cover aspect-square border-4 border-white shadow-lg" /><label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-green-500 text-white rounded-full p-1.5 cursor-pointer hover:bg-green-600 transition"><input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isUploading} />{isUploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Edit size={14} />}</label></div><div><h2 className="text-2xl font-bold text-gray-800">{profileUser.name}</h2><p className="text-gray-600">{profileUser.role}</p></div></div><div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"><div className="p-6 md:p-8"><h2 className="text-xl font-semibold text-gray-800 mb-6">Today's Work</h2>{!checkInTime ? (<div className="text-center py-8"><button onClick={handleCheckIn} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105 shadow-lg hover:shadow-green-500/30">Check In</button><p className="mt-3 text-sm text-gray-500">Start tracking your work hours</p></div>) : (<div className="space-y-6"><div className="flex flex-col"><h3 className="text-lg font-medium text-gray-700">Currently Checked In {isOnBreak && <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Coffee className="mr-1" size={12} /> On Break</span>}</h3><p className="text-sm text-gray-500">Since {new Date(checkInTime).toLocaleTimeString()}</p><div className="mt-4 text-4xl font-bold text-gray-900 tracking-wider flex items-center"><Clock className="mr-2 text-green-500" size={30} />{elapsedTime}</div></div><div><label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Work Description</label><textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What did you work on today?" rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" disabled={isOnBreak} /></div><div className="flex flex-wrap gap-3">{!isOnBreak ? (<><button onClick={handleBreakIn} className="flex items-center bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg transition-all"><Coffee className="mr-2" size={16} /> Start Break</button><button onClick={handleCheckOut} className="flex items-center bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-all"><LogOut className="mr-2" size={16} /> Check Out</button></>) : (<button onClick={handleBreakOut} className="flex items-center bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-all"><CheckCircle className="mr-2" size={16} /> End Break</button>)}</div></div>)}</div></div><div className="bg-white rounded-xl shadow-md border border-gray-100"><div className="px-6 py-5 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-800">Daily Notes</h2></div><div className="p-6"><form onSubmit={handleCreateNote} className="space-y-3 mb-6"><textarea value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} placeholder="Add a new note for today..." rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"/><button type="submit" disabled={isSubmittingNote} className="px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2">{isSubmittingNote && !editingNote ? 'Saving...' : 'Save Note'}</button></form><div className="space-y-4 max-h-96 overflow-y-auto pr-2">{notes.map(note => (<div key={note._id} className="p-4 bg-gray-50 rounded-lg">{editingNote?._id === note._id ? (<div className="space-y-2"><textarea value={editingNote.content} onChange={(e) => setEditingNote({...editingNote, content: e.target.value})} className="w-full px-2 py-1 border border-gray-300 rounded-md" rows="3"/><div className="flex items-center gap-2"><button onClick={handleUpdateNote} disabled={isSubmittingNote} className="p-1 text-green-600 hover:bg-green-100 rounded-full disabled:opacity-50"><Save size={18} /></button><button onClick={() => setEditingNote(null)} className="p-1 text-gray-500 hover:bg-gray-200 rounded-full"><X size={18} /></button></div></div>) : (<div><p className="text-gray-800 whitespace-pre-wrap">{note.content}</p><div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200"><p className="text-xs text-gray-400">{formatEnglishDate(note.createdAt, true)}</p><div className="flex items-center gap-3"><button onClick={() => setEditingNote(note)} className="text-gray-500 hover:text-blue-600" title="Edit Note"><Edit size={16} /></button><button onClick={() => handleDeleteNote(note._id)} className="text-gray-500 hover:text-red-600" title="Delete Note"><Trash2 size={16} /></button></div></div></div>)}</div>))}{notes.length === 0 && <p className="text-center text-gray-500">No notes yet.</p>}</div></div></div></div>
                <div className="lg:col-span-2 space-y-8"><div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"><div className="px-6 py-5 border-b border-gray-200 flex items-center space-x-3"><List className="text-green-500" /><h2 className="text-lg font-semibold text-gray-800">My Assigned Tasks</h2></div><div className="p-6 md:p-8 space-y-4">{tasks.length === 0 ? (<p className="text-center text-gray-500 py-4">You have no tasks assigned.</p>) : (tasks.map(task => { const deadlineInfo = getDeadlineInfo(task); return (<div key={task._id} className="p-4 border border-gray-200 rounded-lg transition-shadow hover:shadow-md"><div className="flex justify-between items-start gap-4"><div><h4 className="font-semibold text-gray-800">{task.title}</h4><p className="text-sm text-gray-600 mt-1">{task.description}</p></div><span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium ${getStatusClasses(task.status)}`}>{task.status}</span></div><div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 items-center justify-between"><div className="text-xs text-gray-400">Assigned: {formatEnglishDate(task.createdAt)}</div><div className={`text-xs font-semibold flex items-center gap-1 ${deadlineInfo.classes}`}><Bell size={14} /><span>Deadline: {deadlineInfo.text}</span></div></div><div className="mt-4 border-t border-gray-100 pt-4 flex items-center justify-end">{task.status === 'To Do' && (<button onClick={() => handleUpdateTaskStatus(task._id, 'In Progress')} className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 px-3 rounded-lg text-sm transition-all"><Play size={14} className="mr-1" /> Start Task</button>)}{task.status === 'In Progress' && (<button onClick={() => handleUpdateTaskStatus(task._id, 'Completed')} className="flex items-center bg-green-500 hover:bg-green-600 text-white font-medium py-1 px-3 rounded-lg text-sm transition-all"><CheckCircle size={14} className="mr-1" /> Mark as Completed</button>)}{task.status === 'Completed' && (<div className="text-sm text-green-600 font-medium flex items-center"><Star size={14} className="mr-1 fill-current" /> Completed on {formatEnglishDate(task.completedAt)}</div>)}</div></div>)}))}</div></div><div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"><div className="px-6 py-5 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-800">Your Attendance History</h2></div><div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-In/Out</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Break</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Time</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{attendance.map((att) => (<tr key={att._id} className="hover:bg-gray-50"><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><div className="font-medium">{formatEnglishDate(att.checkInTime)}</div></td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{att.checkInTime && new Date(att.checkInTime).toLocaleTimeString()}{att.checkOutTime && ` - ${new Date(att.checkOutTime).toLocaleTimeString()}`}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDuration(att.totalBreakDuration)}</td><td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`font-medium ${att.checkOutTime ? att.duration >= MIN_WORK_SECONDS ? 'text-green-600' : 'text-red-600' : 'text-blue-600'}`}>{formatDuration(att.duration)}</span></td><td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{att.description || '-'}</td></tr>))}</tbody></table></div></div></div>
            </div>
      </main>
    </div>
  );
}

export async function getServerSideProps(context) {
    await dbConnect();
    const { token } = context.req.cookies;
    if (!token) { return { redirect: { destination: '/login', permanent: false } }; }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) { throw new Error("User not found."); }
        
        if (user.role === 'HR') { return { redirect: { destination: '/hr/dashboard', permanent: false } }; }
        if (user.role === 'Project Manager') { return { redirect: { destination: '/pm/dashboard', permanent: false } }; }
        if (user.role === 'Finance') { return { redirect: { destination: '/finance/dashboard', permanent: false } }; }
        
        const [attendanceHistory, tasks, notes, userNotifications] = await Promise.all([
            Attendance.find({ user: user._id }).sort({ checkInTime: -1 }).limit(50),
            Task.find({ assignedTo: user._id }).sort({ createdAt: -1 }).limit(50),
            Note.find({ user: user._id }).sort({ createdAt: -1 }).limit(50),
            Notification.find({ recipient: user._id }).sort({ createdAt: -1 }).limit(50)
        ]);

        const activeCheckIn = await Attendance.findOne({ user: user._id, checkOutTime: null });
        let initialIsOnBreak = activeCheckIn ? activeCheckIn.breaks.some(b => !b.breakOutTime) : false;
        
        return {
            props: {
                user: JSON.parse(JSON.stringify(user)),
                initialAttendance: JSON.parse(JSON.stringify(attendanceHistory)),
                activeCheckIn: JSON.parse(JSON.stringify(activeCheckIn)),
                initialIsOnBreak,
                initialTasks: JSON.parse(JSON.stringify(tasks)),
                initialNotes: JSON.parse(JSON.stringify(notes)),
                initialNotifications: JSON.parse(JSON.stringify(userNotifications)),
            },
        };
    } catch (error) {
        console.error("Dashboard getServerSideProps Error:", error.message);
        return { redirect: { destination: '/login', permanent: false } };
    }
}
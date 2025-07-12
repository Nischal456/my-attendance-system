"use client";
import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, Clock, Calendar, Coffee, CheckCircle, AlertCircle, Play, Star, Bell, Edit, Trash2, Save, X, User as UserIcon, FileText, Briefcase, DollarSign, Info, Shield, CheckSquare, Paperclip, Upload, Inbox, MessageSquare } from 'react-feather';
import { ChevronDown } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- Helper Functions ---
const formatEnglishDate = (dateString, includeTime = false) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
  if (includeTime) {
    options.hour = 'numeric';
    options.minute = '2-digit';
    options.hour12 = true;
  }
  return date.toLocaleDateString('en-US', options);
};

const formatDuration = (totalSeconds) => {
  if (totalSeconds === null || totalSeconds === undefined || totalSeconds < 0) return '0m';
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  return parts.join(' ') || '0m';
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

const formatDeadline = (dateString) => {
  if (!dateString) return 'No deadline';
  return new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' });
};

const MIN_WORK_SECONDS = 21600; // 6 hours in seconds

const getStatusClasses = (status) => {
  switch (status) {
    case 'In Progress': return 'bg-blue-100 text-blue-700';
    case 'Completed': return 'bg-green-100 text-green-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};

const getDeadlineInfo = (task) => {
  if (!task.deadline || task.status === 'Completed') return { classes: 'text-gray-500' };
  if (new Date(task.deadline) < new Date()) {
    return { classes: 'text-red-600 font-semibold' };
  }
  return { classes: 'text-gray-500' };
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

const getSenderUI = (author) => {
    const lowerCaseAuthor = author?.toLowerCase() || '';
    if (lowerCaseAuthor.includes('hr')) return { Icon: UserIcon, iconBg: 'bg-rose-100 text-rose-600' };
    if (lowerCaseAuthor.includes('project manager')) return { Icon: Briefcase, iconBg: 'bg-purple-100 text-purple-600' };
    if (lowerCaseAuthor.includes('finance')) return { Icon: DollarSign, iconBg: 'bg-emerald-100 text-emerald-600' };
    return { Icon: Info, iconBg: 'bg-blue-100 text-blue-600' };
};

// --- Sub-Components ---
const SubmitWorkModal = ({ task, onClose, setTasks }) => {
    const [description, setDescription] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        const filePromises = files.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve({ url: reader.result, filename: file.name });
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });
        Promise.all(filePromises).then(newFiles => {
            setAttachments(prev => [...prev, ...newFiles]);
        }).catch(err => {
            toast.error("Error reading files.");
            console.error(err);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description.trim()) {
            setError('Please provide a description of the work you completed.');
            return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/tasks/submit-work', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId: task._id,
                    attachments,
                    submissionDescription: description
                })
            });
            if (!res.ok) {
                const errorResult = await res.json();
                throw new Error(errorResult.message || 'Failed to submit work.');
            }
            const result = await res.json();
            setTasks(prev => prev.map(t => (t._id === task._id ? result.data : t)));
            toast.success('Work submitted successfully!');
            onClose();
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in duration-300">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
                <h3 className="text-2xl font-bold mb-2">Submit Work</h3>
                <p className="text-sm text-slate-500 mb-6">For task: <span className="font-semibold text-slate-700">"{task.title}"</span></p>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="submissionDescription" className="block text-sm font-medium mb-1">Work Description *</label>
                        <textarea
                            id="submissionDescription"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the work you have completed for this task..."
                            rows={4}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-transparent transition"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Attach Files (Optional)</label>
                        <input type="file" multiple onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                    </div>
                    {attachments.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-600">Selected files:</p>
                            <div className="flex flex-wrap gap-2">
                                {attachments.map((file, i) => (
                                    <span key={i} className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-md">{file.filename}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                    <div className="mt-8 pt-4 border-t flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-200 rounded-lg font-semibold text-slate-700 hover:bg-slate-300 transition-colors">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:bg-green-700 transition-colors">
                            {isSubmitting ? 'Submitting...' : 'Submit & Complete'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Main Dashboard Component ---
export default function Dashboard({ user }) {
  const router = useRouter();
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [activeAttendanceId, setActiveAttendanceId] = useState(null);
  const [checkInTime, setCheckInTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('');
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [profileUser, setProfileUser] = useState(user);
  const [isUploading, setIsUploading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [notes, setNotes] = useState([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [taskToSubmit, setTaskToSubmit] = useState(null);
  const [activeTaskTab, setActiveTaskTab] = useState('active'); // 'active' or 'completed'
  const notificationDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const fetchDashboardData = async () => {
        setIsDataLoading(true);
        try {
            const res = await fetch('/api/dashboard/data');
            if(!res.ok) throw new Error('Failed to fetch dashboard data');
            const data = await res.json();
            setAttendance(data.initialAttendance || []);
            setTasks(data.initialTasks || []);
            setNotes(data.initialNotes || []);
            setNotifications(data.initialNotifications || []);
            if(data.activeCheckIn) {
                setActiveAttendanceId(data.activeCheckIn._id);
                setCheckInTime(data.activeCheckIn.checkInTime);
                setDescription(data.activeCheckIn.description || '');
                setIsOnBreak(data.initialIsOnBreak);
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setIsDataLoading(false);
        }
    };
    fetchDashboardData();
  }, []);
  
  const unreadNotifications = useMemo(() => notifications.filter(n => !n.isRead), [notifications]);
  
  const { activeTasks, completedTasks } = useMemo(() => {
    const active = tasks.filter(task => task.status !== 'Completed');
    const completed = tasks.filter(task => task.status === 'Completed');
    return { activeTasks: active, completedTasks: completed };
  }, [tasks]);

  useEffect(() => { const handleScroll = () => setIsScrolled(window.scrollY > 10); window.addEventListener('scroll', handleScroll); return () => window.removeEventListener('scroll', handleScroll); }, []);
  useEffect(() => { if (checkInTime) { const timer = setInterval(() => setElapsedTime(formatElapsedTime(checkInTime)), 1000); return () => clearInterval(timer); } else { setElapsedTime(''); } }, [checkInTime]);
  useEffect(() => { const timer = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { function handleClickOutside(event) { if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) setIsNotificationOpen(false); if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) setIsDropdownOpen(false); } document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, []);
  
  const handleCheckIn = async () => { setError(''); setIsAttendanceLoading(true); try { const res = await fetch('/api/attendance/checkin', { method: 'POST' }); if (!res.ok) throw new Error(await handleApiError(res)); const { data } = await res.json(); setActiveAttendanceId(data._id); setCheckInTime(data.checkInTime); setAttendance([data, ...attendance]); toast.success("Checked in successfully!"); } catch (err) { setError(err.message); toast.error(err.message); } finally { setIsAttendanceLoading(false); } };
  const handleCheckOut = async () => { if (!description.trim()) { setError('Please provide a description of your work.'); toast.error('Work description is required.'); return; } setError(''); setIsAttendanceLoading(true); try { const res = await fetch('/api/attendance/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description, attendanceId: activeAttendanceId }), }); if (!res.ok) throw new Error(await handleApiError(res)); const { data } = await res.json(); setActiveAttendanceId(null); setCheckInTime(null); setDescription(''); setIsOnBreak(false); setAttendance(attendance.map(att => att._id === data._id ? data : att)); toast.success("Checked out successfully!"); } catch (err) { setError(err.message); toast.error(err.message); } finally { setIsAttendanceLoading(false); } };
  const handleBreakIn = async () => { setError(''); setIsAttendanceLoading(true); try { const res = await fetch('/api/attendance/break-in', { method: 'POST' }); if (!res.ok) throw new Error(await handleApiError(res)); setIsOnBreak(true); toast.success("Break started.");} catch (err) { setError(err.message); toast.error(err.message);} finally { setIsAttendanceLoading(false); } };
  const handleBreakOut = async () => { setError(''); setIsAttendanceLoading(true); try { const res = await fetch('/api/attendance/break-out', { method: 'POST' }); if (!res.ok) throw new Error(await handleApiError(res)); setIsOnBreak(false); toast.success("Resumed work.");} catch (err) { setError(err.message); toast.error(err.message);} finally { setIsAttendanceLoading(false); } };
  const handleLogout = async () => { await fetch('/api/auth/logout'); router.push('/login'); };
  const handleUpdateTaskStatus = async (taskId, newStatus) => { setError(''); try { const res = await fetch('/api/tasks/update-status', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId, newStatus }), }); if (!res.ok) throw new Error(await handleApiError(res)); const result = await res.json(); setTasks(currentTasks => currentTasks.map(task => (task._id === taskId ? result.data : task))); toast.success(`Task marked as '${newStatus}'`); } catch (err) { setError(err.message); toast.error(err.message); }};
  const handleFileChange = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.readAsDataURL(file); reader.onloadend = () => { handleAvatarUpload(reader.result); }; reader.onerror = () => { toast.error("Could not read file."); }; };
  const handleAvatarUpload = async (base64Image) => { setIsUploading(true); setError(''); try { const res = await fetch('/api/user/upload-avatar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64Image }), }); if (!res.ok) throw new Error(await handleApiError(res)); const data = await res.json(); setProfileUser(prev => ({ ...prev, avatar: data.avatar })); toast.success('Avatar updated!'); } catch (err) { setError(err.message); toast.error(err.message); } finally { setIsUploading(false); }};
  const handleCreateNote = async (e) => { e.preventDefault(); if (!newNoteContent.trim()) return; setIsSubmittingNote(true); setError(''); try { const res = await fetch('/api/notes/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: newNoteContent }), }); if (!res.ok) throw new Error(await handleApiError(res)); const result = await res.json(); setNotes(prevNotes => [result.data, ...prevNotes]); setNewNoteContent(''); toast.success('Note saved.'); } catch (err) { setError(err.message); toast.error(err.message); } finally { setIsSubmittingNote(false); }};
  const handleUpdateNote = async () => { if (!editingNote || !editingNote.content.trim()) return; setIsSubmittingNote(true); setError(''); try { const res = await fetch('/api/notes/edit', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ noteId: editingNote._id, content: editingNote.content }), }); if (!res.ok) throw new Error(await handleApiError(res)); const result = await res.json(); setNotes(prevNotes => prevNotes.map(n => n._id === editingNote._id ? result.data : n)); setEditingNote(null); toast.success('Note updated.'); } catch (err) { setError(err.message); toast.error(err.message); } finally { setIsSubmittingNote(false); }};
  const handleDeleteNote = async (noteId) => { if (!window.confirm('Are you sure you want to delete this note?')) return; setError(''); try { const res = await fetch('/api/notes/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ noteId }), }); if (!res.ok) throw new Error(await handleApiError(res)); setNotes(prevNotes => prevNotes.filter(n => n._id !== noteId)); toast.success('Note deleted.'); } catch (err) { setError(err.message); toast.error(err.message); }};
  const handleMarkAsRead = async () => { if (unreadNotifications.length === 0) return; try { await fetch('/api/notification/mark-as-read', { method: 'POST' }); setNotifications(prev => prev.map(n => ({ ...n, isRead: true }))); } catch (err) { console.error(err); toast.error("Failed to mark notifications as read."); } };

  return (
    <>
      <Toaster position="top-center" />
      {taskToSubmit && <SubmitWorkModal task={taskToSubmit} onClose={() => setTaskToSubmit(null)} setTasks={setTasks} />}
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
        <div className="w-full h-full absolute inset-0 bg-slate-50 overflow-hidden">
          <div className="absolute top-0 -left-48 w-[40rem] h-[40rem] bg-green-200/50 rounded-full filter blur-3xl opacity-40 animate-blob"></div>
          <div className="absolute top-0 -right-48 w-[40rem] h-[40rem] bg-sky-200/50 rounded-full filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/4 w-[40rem] h-[40rem] bg-rose-200/50 rounded-full filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative z-10">
          <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-xl shadow-md' : 'bg-white/50'}`}>
              <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between items-center h-20">
                      <div className="flex items-center space-x-4"><Link href="/dashboard" className="flex items-center space-x-3"><Image src="/geckoworks.png" alt="GeckoWorks Logo" width={42} height={42} className="rounded-full" /><h1 className="text-xl font-bold text-slate-900 tracking-tight">{user.name.split(' ')[0]}'s Dashboard</h1></Link></div>
                      <div className="flex items-center space-x-2 sm:space-x-4">
                          <div className="hidden md:flex items-center space-x-4 text-sm text-slate-500 bg-slate-100 px-4 py-2 rounded-full"><div className="flex items-center space-x-2"><Calendar className="h-4 w-4 text-green-600" /><span>{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span></div><div className="h-4 w-px bg-slate-300"></div><div className="flex items-center space-x-2"><Clock className="h-4 w-4 text-green-600" /><span>{currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span></div></div>
                          <div ref={notificationDropdownRef} className="relative"><button onClick={() => setIsNotificationOpen(prev => !prev)} className="relative p-2 text-slate-500 hover:text-green-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500" title="Notifications"><Bell className="h-6 w-6"/>{unreadNotifications.length > 0 && (<span className="absolute top-1.5 right-1.5 flex h-5 w-5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center">{unreadNotifications.length}</span></span>)}</button>{isNotificationOpen && (<><div className="fixed inset-0 bg-black/30 z-10 sm:hidden" onClick={() => setIsNotificationOpen(false)}></div><div className={`fixed sm:absolute top-24 sm:top-auto inset-x-4 sm:inset-x-auto sm:right-0 sm:mt-3 sm:w-[26rem] bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-xl shadow-2xl z-20 overflow-hidden origin-top-right transition-all duration-300 ease-out ${isNotificationOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}><div className="p-4 border-b border-slate-200/80 flex justify-between items-center"><h3 className="text-lg font-semibold text-slate-800">Notifications</h3>{unreadNotifications.length > 0 && (<button onClick={handleMarkAsRead} className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-100/50 rounded-full transition-colors" title="Mark all as read"><CheckSquare size={20} /></button>)}</div><div className="max-h-[70vh] overflow-y-auto notification-scroll">{notifications.length > 0 ? (<div className="divide-y divide-slate-200/80">{notifications.map((notif, index) => { const senderUI = getSenderUI(notif.author); const isUnread = !notif.isRead; return (<Link key={notif._id} href={notif.link || '#'} className={`block animate-fade-in-up`} style={{animationDelay: `${index * 50}ms`}}><div className={`flex items-start gap-4 p-4 transition-colors ${isUnread ? 'bg-sky-50/70 hover:bg-sky-100/60' : 'hover:bg-slate-100/70'}`}><div className={`flex-shrink-0 mt-0.5 w-9 h-9 flex items-center justify-center rounded-full shadow-inner ${senderUI.iconBg}`}><senderUI.Icon size={18}/></div><div className="flex-1 text-sm"><p className={`leading-snug ${isUnread ? 'text-slate-800 font-semibold' : 'text-slate-600'}`}>{notif.content}</p><p className={`text-xs mt-1.5 ${isUnread ? 'text-sky-600 font-semibold' : 'text-slate-400'}`}>{formatEnglishDate(notif.createdAt, true)}</p></div>{isUnread && (<div className="mt-1 w-2.5 h-2.5 bg-sky-500 rounded-full flex-shrink-0" title="Unread"></div>)}</div></Link>)})}</div>) : (<div className="p-8 text-center"><Bell className="mx-auto h-12 w-12 text-slate-300"/><h4 className="mt-4 text-lg font-semibold text-slate-700">All caught up!</h4><p className="mt-1 text-sm text-slate-500">You have no new notifications.</p></div>)}</div></div></>)}</div>
                          <div ref={userDropdownRef} className="relative"><button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 bg-white pl-1 pr-2 py-1 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"><Image src={profileUser.avatar} alt={profileUser.name} width={36} height={36} className="rounded-full object-cover aspect-square"/><span className="font-semibold text-sm text-slate-700 hidden sm:block">{profileUser.name.split(' ')[0]}</span><ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} /></button><div className={`absolute top-full right-0 mt-3 w-64 rounded-xl shadow-2xl bg-white ring-1 ring-black ring-opacity-5 z-20 origin-top-right transition-all duration-300 ease-out ${isDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}><div className="p-4 border-b border-slate-100"><div className="flex items-center space-x-4"><Image src={profileUser.avatar} alt={profileUser.name} width={48} height={48} className="rounded-full object-cover aspect-square"/><div><p className="font-bold text-slate-800 truncate">{profileUser.name}</p><p className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">{profileUser.role}</p></div></div></div><div className="p-2"><Link href="/leaves" className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100/80 hover:text-green-600 flex items-center gap-3 transition-colors rounded-md"><FileText className="h-5 w-5" /><span>My Leave Requests</span></Link><button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-3 transition-colors rounded-md"><LogOut className="h-5 w-5" /><span>Sign Out</span></button></div></div></div>
                      </div>
                  </div>
              </div>
          </header>
          <main className={`max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 transition-all duration-700 ease-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
              {error && (<div className="mb-6 flex items-center bg-red-100/50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm"><AlertCircle className="text-red-500 mr-3" /><div className="text-sm font-medium text-red-800">{error}</div></div>)}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                  <div className="xl:col-span-4 space-y-8 animate-fade-in-up" style={{ animationDelay: '100ms'}}><div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden"><div className="p-6 flex items-center space-x-5"><div className="relative flex-shrink-0"><Image src={profileUser.avatar} alt="Profile Picture" width={88} height={88} className="rounded-full object-cover aspect-square shadow-md" /><label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 bg-green-600 text-white rounded-full p-2 cursor-pointer hover:bg-green-700 transition shadow-sm border-2 border-white transform hover:scale-110"><input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isUploading} />{isUploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Edit size={16} />}</label></div><div><h2 className="text-2xl font-bold text-slate-900">{profileUser.name}</h2><p className="text-slate-500 font-medium">{profileUser.role}</p></div></div><div className="bg-slate-50/70 p-6 border-t border-slate-200/80">{!checkInTime ? (<div className="text-center py-4"><button onClick={handleCheckIn} disabled={isAttendanceLoading || isDataLoading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-8 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-green-500/20 hover:shadow-green-600/30 focus:outline-none focus:ring-4 focus:ring-green-500/50 disabled:opacity-70"><div className="flex items-center justify-center gap-2"><Play size={20}/><span>{isDataLoading ? 'Loading...' : 'Check In'}</span></div></button><p className="mt-3 text-sm text-slate-500">You are currently checked out.</p></div>) : (<div className="space-y-5"><div className="flex justify-between items-center"><h3 className="text-lg font-semibold text-slate-800">Work Session Active</h3>{isOnBreak && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"><Coffee className="mr-1.5" size={14} /> On Break</span>}</div><div className={`text-center bg-white rounded-lg p-4 border border-green-200 shadow-inner relative overflow-hidden`}><div className="absolute inset-0 bg-green-500/10 animate-pulse"></div><p className="text-sm text-slate-500 relative">Elapsed Time</p><div className="text-5xl font-bold text-green-600 tracking-tighter my-1 relative">{elapsedTime}</div><p className="text-xs text-slate-400 relative">Checked in at {new Date(checkInTime).toLocaleTimeString()}</p></div><div><label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">Work Description</label><textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What are you working on?" rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/80 focus:border-transparent transition" disabled={isOnBreak} /></div><div className="grid grid-cols-2 gap-3">{!isOnBreak ? (<><button onClick={handleBreakIn} disabled={isAttendanceLoading} className="flex items-center justify-center gap-2 bg-amber-100 hover:bg-amber-200/80 text-amber-800 font-semibold py-2.5 px-4 rounded-lg transition-all disabled:opacity-70"><Coffee size={16} /> Start Break</button><button onClick={handleCheckOut} disabled={isAttendanceLoading} className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all disabled:opacity-70"><LogOut size={16} /> Check Out</button></>) : (<button onClick={handleBreakOut} disabled={isAttendanceLoading} className="col-span-2 flex items-center justify-center gap-2 bg-green-100 hover:bg-green-200/80 text-green-800 font-semibold py-2.5 px-4 rounded-lg transition-all disabled:opacity-70"><CheckCircle size={16} /> Resume Work</button>)}</div></div>)}</div></div><div className="bg-white rounded-2xl shadow-sm border border-slate-200/80"><div className="px-6 py-5 border-b border-slate-200/80"><h2 className="text-xl font-semibold text-slate-800">Daily Notes</h2></div><div className="p-6"><form onSubmit={handleCreateNote} className="space-y-3 mb-6"><textarea value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} placeholder="Jot down a quick note..." rows="3" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/80"/><button type="submit" disabled={isSubmittingNote || !newNoteContent.trim()} className="px-5 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2">{isSubmittingNote ? 'Saving...' : 'Save Note'}</button></form><div className="space-y-4 max-h-96 overflow-y-auto pr-2 -mr-2">{notes.map((note, index) => (<div key={note._id} className="p-4 bg-slate-50/70 rounded-lg group animate-fade-in-up" style={{animationDelay: `${index * 50}ms`}}>{editingNote?._id === note._id ? (<div className="space-y-3"><textarea value={editingNote.content} onChange={(e) => setEditingNote({...editingNote, content: e.target.value})} className="w-full px-2 py-1 border border-slate-300 rounded-md" rows="3"/><div className="flex items-center gap-2"><button onClick={handleUpdateNote} disabled={isSubmittingNote} className="p-2 text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"><Save size={18} /></button><button onClick={() => setEditingNote(null)} className="p-2 text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-md"><X size={18} /></button></div></div>) : (<div><p className="text-slate-700 whitespace-pre-wrap">{note.content}</p><div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200"><p className="text-xs text-slate-400">{formatEnglishDate(note.createdAt, true)}</p><div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => setEditingNote(note)} className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-full hover:text-blue-600" title="Edit Note"><Edit size={15} /></button><button onClick={() => handleDeleteNote(note._id)} className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-full hover:text-red-600" title="Delete Note"><Trash2 size={15} /></button></div></div></div>)}</div>))}{notes.length === 0 && <p className="text-center text-slate-500 py-8">No notes for today.</p>}</div></div></div></div>
                  <div className="xl:col-span-8 space-y-8 animate-fade-in-up" style={{ animationDelay: '200ms'}}>
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80">
                          <div className="px-6 py-5 border-b border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-3"><Briefcase className="text-green-600"/>My Tasks</h2>
                              <div className="p-1 bg-slate-100 rounded-lg flex space-x-1">
                                  <button onClick={() => setActiveTaskTab('active')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${activeTaskTab === 'active' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}>
                                      Active <span className="text-xs bg-indigo-100 text-indigo-600 font-bold px-1.5 py-0.5 rounded-full ml-1">{activeTasks.length}</span>
                                  </button>
                                  <button onClick={() => setActiveTaskTab('completed')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${activeTaskTab === 'completed' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}>
                                      Completed <span className="text-xs bg-green-100 text-green-600 font-bold px-1.5 py-0.5 rounded-full ml-1">{completedTasks.length}</span>
                                  </button>
                              </div>
                          </div>
                          
                          {activeTaskTab === 'active' && (
                              <div className="p-6 space-y-4">
                                  {activeTasks.length > 0 ? (activeTasks.map((task, index) => { const deadlineInfo = getDeadlineInfo(task); const pmAttachments = task.attachments?.filter(att => att.uploadedBy?.toString() === task.assignedBy?.toString()) || []; return (<div key={task._id} className="p-4 border border-slate-200 rounded-lg transition-shadow hover:shadow-md animate-fade-in-up" style={{animationDelay: `${index * 50}ms`}}><div className="flex justify-between items-start gap-4"><div><h4 className="font-semibold text-slate-800">{task.title}</h4><p className="text-sm text-slate-600 mt-1">{task.description}</p></div><span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(task.status)}`}>{task.status}</span></div>{pmAttachments.length > 0 && <div className="mt-3 pt-3 border-t"><h4 className="text-xs font-bold text-slate-500 mb-2">Reference Files:</h4><div className="flex flex-wrap gap-2">{pmAttachments.map(file => (<a key={file.url} href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs bg-slate-100 px-2 py-1 rounded-md hover:bg-slate-200 flex items-center gap-1.5"><Paperclip size={12}/>{file.filename}</a>))}</div></div>}<div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2"><div className={`flex items-center gap-1.5 text-xs font-medium ${deadlineInfo.classes}`}><Clock size={14} /><span>{formatDeadline(task.deadline)}</span></div><div className="flex items-center justify-end gap-2">{task.status === 'In Progress' ? (<button onClick={() => setTaskToSubmit(task)} className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white font-medium py-1.5 px-4 rounded-lg text-sm"><Upload size={14} /> Submit Work</button>) : (<button onClick={() => handleUpdateTaskStatus(task._id, 'In Progress')} className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white font-medium py-1.5 px-4 rounded-lg text-sm"><Play size={14} /> Start</button>)}</div></div></div>)})) : (<div className="text-center py-10"><Inbox className="mx-auto h-12 w-12 text-slate-300"/><h4 className="mt-4 text-lg font-semibold text-slate-700">No active tasks!</h4><p className="mt-1 text-sm text-slate-500">You're all caught up. Great job! 🎉</p></div>)}
                              </div>
                          )}

                          {activeTaskTab === 'completed' && (
                              <div className="p-6 space-y-4">
                                  {completedTasks.length > 0 ? (
                                      completedTasks.map((task, index) => {
                                          const userAttachments = task.attachments?.filter(att => att.uploadedBy?.toString() === task.assignedTo?.toString()) || [];
                                          return (
                                              <div key={task._id} className="p-4 bg-slate-50/70 rounded-lg animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                                                  <div className="flex justify-between items-start gap-4">
                                                      <div>
                                                          <h4 className="font-semibold text-slate-600">{task.title}</h4>
                                                          <p className="text-sm text-green-600 font-medium mt-1">Completed on {formatEnglishDate(task.completedAt)}</p>
                                                      </div>
                                                      <span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(task.status)}`}>
                                                          {task.status}
                                                      </span>
                                                  </div>
                                                  {task.submissionDescription && (
                                                      <div className="mt-3 pt-3 border-t border-slate-200/60">
                                                          <div className="flex items-start gap-2.5 mt-2">
                                                              <MessageSquare size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                                              <p className="text-sm text-slate-600 whitespace-pre-wrap">{task.submissionDescription}</p>
                                                          </div>
                                                      </div>
                                                  )}
                                                  {userAttachments.length > 0 && (
                                                      <div className="mt-3 pt-3 border-t border-slate-200/60">
                                                          <h4 className="text-xs font-bold text-green-700 mb-2">Your Submissions:</h4>
                                                          <div className="flex flex-wrap gap-2">
                                                              {userAttachments.map(file => (
                                                                  <a key={file.url} href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-md hover:bg-green-200 flex items-center gap-1.5">
                                                                      <CheckCircle size={12} />
                                                                      {file.filename}
                                                                  </a>
                                                              ))}
                                                          </div>
                                                      </div>
                                                  )}
                                              </div>
                                          );
                                      })
                                  ) : (
                                      <div className="text-center py-10">
                                          <Star className="mx-auto h-12 w-12 text-slate-300" />
                                          <h4 className="mt-4 text-lg font-semibold text-slate-700">No completed tasks yet</h4>
                                          <p className="mt-1 text-sm text-slate-500">Finish a task and it will appear here.</p>
                                      </div>
                                  )}
                              </div>
                          )}
                      </div>
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80"><div className="px-6 py-5 border-b border-slate-200/80"><h2 className="text-xl font-semibold text-slate-800">Attendance History</h2></div><div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200"><thead className="bg-slate-50"><tr><th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Work</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Break</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th></tr></thead><tbody className="bg-white divide-y divide-slate-200/80">{attendance.slice(0, 7).map((att, index) => (<tr key={att._id} className="hover:bg-slate-50/70 animate-fade-in-up" style={{animationDelay: `${index * 50}ms`}}><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{formatEnglishDate(att.checkInTime)}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{att.checkInTime && new Date(att.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{att.checkOutTime && ` - ${new Date(att.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}</td><td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`font-bold ${att.checkOutTime ? att.duration >= MIN_WORK_SECONDS ? 'text-green-600' : 'text-red-600' : 'text-blue-600'}`}>{formatDuration(att.duration)}</span></td><td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDuration(att.totalBreakDuration)}</td><td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title={att.description}>{att.description || '-'}</td></tr>))}</tbody></table></div>{attendance.length === 0 && <p className="text-center text-slate-500 py-10">No attendance history found.</p>}</div>
                  </div>
              </div>
          </main>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
    const jwt = require('jsonwebtoken');
    const dbConnect = require('../../lib/dbConnect').default;
    const User = require('../../models/User').default;
    
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
        
        const roleRedirects = {
            'HR': '/hr/dashboard',
            'Project Manager': '/pm/dashboard',
            'Finance': '/finance/dashboard'
        };
        if (roleRedirects[user.role]) {
            return { redirect: { destination: roleRedirects[user.role], permanent: false } };
        }
        
        return {
            props: {
                user: JSON.parse(JSON.stringify(user)),
            },
        };
    } catch (error) {
        console.error("Dashboard Auth Error:", error.message);
        context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        return { redirect: { destination: '/login', permanent: false } };
    }
}
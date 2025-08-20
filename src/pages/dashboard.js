import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, Clock, Calendar, Coffee, CheckCircle, Play, Star, Bell, Edit, Trash2, Save, X, User as UserIcon, FileText, Briefcase, Info, DollarSign, CheckSquare, Paperclip, Upload, Inbox, MessageSquare, Users, List, Plus, BarChart2, TrendingUp, AlertOctagon, Home } from 'react-feather';
import { ChevronDown } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Register Chart.js components ---
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- Helper & Utility Hooks ---
const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        window.addEventListener('resize', listener);
        return () => window.removeEventListener('resize', listener);
    }, [matches, query]);
    return matches;
};

const formatEnglishDate = (dateString, includeTime = false) => { 
    if (!dateString) return '-'; 
    const date = new Date(dateString); 
    const options = { year: 'numeric', month: 'long', day: 'numeric' }; 
    if (includeTime) { 
        options.hour = 'numeric'; 
        options.minute = '2-digit'; 
        options.hour12 = true; 
    } 
    return date.toLocaleDateString('en-US', options); 
};
const formatDuration = (totalSeconds) => { if (totalSeconds === null || totalSeconds === undefined || totalSeconds < 0) return '0m'; if (totalSeconds < 60) return `${totalSeconds}s`; const hours = Math.floor(totalSeconds / 3600); const minutes = Math.floor((totalSeconds % 3600) / 60); const parts = []; if (hours > 0) parts.push(`${hours}h`); if (minutes > 0) parts.push(`${minutes}m`); return parts.join(' ') || '0m'; };
const formatElapsedTime = (startTime) => { if (!startTime) return '00:00:00'; const now = new Date(); const start = new Date(startTime); const seconds = Math.floor((now - start) / 1000); if (seconds < 0) return '00:00:00'; const h = Math.floor(seconds / 3600).toString().padStart(2, '0'); const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0'); const s = (seconds % 60).toString().padStart(2, '0'); return `${h}:${m}:${s}`; };
const formatDeadline = (dateString) => { 
    if (!dateString) return 'No deadline'; 
    return new Date(dateString).toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
    }); 
};
const MIN_WORK_SECONDS = 21600; // 6 hours
const getStatusPill = (status) => { switch (status) { case 'In Progress': return 'bg-amber-100 text-amber-800'; case 'Completed': return 'bg-green-100 text-green-800'; default: return 'bg-sky-100 text-sky-800'; } };
const getDeadlineInfo = (task) => { if (!task.deadline || task.status === 'Completed') return { classes: 'text-slate-500' }; if (new Date(task.deadline) < new Date()) { return { classes: 'text-red-600 font-semibold' }; } return { classes: 'text-slate-500' }; };
const handleApiError = async (response) => { const contentType = response.headers.get("content-type"); if (contentType && contentType.indexOf("application/json") !== -1) { const errorData = await response.json(); return errorData.message || `HTTP error! status: ${response.status}`; } else { return `HTTP error! status: ${response.status} - ${response.statusText}`; } };
const getSenderUI = (author) => { const lowerCaseAuthor = author?.toLowerCase() || ''; if (lowerCaseAuthor.includes('hr')) return { Icon: UserIcon, iconBg: 'bg-rose-100 text-rose-600' }; if (lowerCaseAuthor.includes('project manager')) return { Icon: Briefcase, iconBg: 'bg-purple-100 text-purple-600' }; if (lowerCaseAuthor.includes('finance')) return { Icon: DollarSign, iconBg: 'bg-emerald-100 text-emerald-600' }; return { Icon: Info, iconBg: 'bg-blue-100 text-blue-600' }; };

// --- Reusable & Sub-Components ---
const NotificationContent = ({ notifications, onLinkClick }) => (
    <>
        {notifications.length > 0 ? (
            <div className="divide-y divide-slate-200/80">
                {notifications.map((notif) => {
                    const senderUI = getSenderUI(notif.author);
                    const isUnread = !notif.isRead;
                    return (
                        <Link key={notif._id} href={notif.link || '#'} onClick={onLinkClick} className={`block`}>
                                <div className={`flex items-start gap-4 p-4 transition-colors ${isUnread ? 'bg-sky-50/70 hover:bg-sky-100/60' : 'hover:bg-slate-100/70'}`}>
                                    <div className={`flex-shrink-0 mt-0.5 w-9 h-9 flex items-center justify-center rounded-full shadow-inner ${senderUI.iconBg}`}>
                                        <senderUI.Icon size={18}/>
                                    </div>
                                    <div className="flex-1 text-sm">
                                        <p className={`leading-snug ${isUnread ? 'text-slate-800 font-semibold' : 'text-slate-600'}`}>{notif.content}</p>
                                        <p className={`text-xs mt-1.5 ${isUnread ? 'text-sky-600 font-semibold' : 'text-slate-400'}`}>{formatEnglishDate(notif.createdAt, true)}</p>
                                    </div>
                                    {isUnread && (<div className="mt-1 w-2.5 h-2.5 bg-sky-500 rounded-full flex-shrink-0" title="Unread"></div>)}
                                </div>
                        </Link>
                    );
                })}
            </div>
        ) : (
            <div className="p-8 text-center flex flex-col justify-center items-center h-full">
                <Bell className="mx-auto h-16 w-16 text-slate-300"/>
                <h4 className="mt-5 text-lg font-semibold text-slate-700">All caught up!</h4>
                <p className="mt-1 text-sm text-slate-500">You have no new notifications.</p>
            </div>
        )}
    </>
);

const MobileNotificationPanel = ({ notifications, unreadCount, handleMarkAsRead, onClose }) => {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);
    return (
        <motion.div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
            <motion.div className="h-full w-full max-w-md bg-slate-50 shadow-2xl flex flex-col" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 350, damping: 35 }} onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-slate-200 flex justify-between items-center bg-white flex-shrink-0">
                    <h3 className="text-xl font-bold text-slate-800">Notifications</h3>
                    <div className="flex items-center gap-1">
                        {unreadCount > 0 && (<button onClick={handleMarkAsRead} className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-100/50 rounded-full transition-colors" title="Mark all as read"><CheckSquare size={20} /></button>)}
                        <button onClick={onClose} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100/50 rounded-full transition-colors" title="Close"><X size={22} /></button>
                    </div>
                </header>
                <div className="flex-grow overflow-y-auto"><NotificationContent notifications={notifications} onLinkClick={onClose} /></div>
            </motion.div>
        </motion.div>
    );
};

const DesktopNotificationPanel = ({ notifications, unreadCount, handleMarkAsRead, onClose }) => {
    return (
        <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.2, ease: "easeOut" }} className="absolute top-full right-0 mt-3 w-full max-w-sm sm:w-[26rem] bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-xl shadow-2xl z-20 overflow-hidden origin-top-right">
            <header className="p-4 border-b border-slate-200/80 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-800">Notifications</h3>
                {unreadCount > 0 && (<button onClick={handleMarkAsRead} className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-100/50 rounded-full transition-colors" title="Mark all as read"><CheckSquare size={20} /></button>)}
            </header>
            <div className="max-h-[70vh] overflow-y-auto"><NotificationContent notifications={notifications} onLinkClick={onClose} /></div>
        </motion.div>
    );
};

const SubmitWorkModal = ({ task, onClose, onWorkSubmitted }) => {
    const [description, setDescription] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const handleFileChange = (e) => { const files = Array.from(e.target.files); if (files.length === 0) return; const filePromises = files.map(file => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onloadend = () => resolve({ url: reader.result, filename: file.name }); reader.onerror = reject; reader.readAsDataURL(file); })); Promise.all(filePromises).then(newFiles => setAttachments(prev => [...prev, ...newFiles])).catch(() => toast.error("Error reading files.")); };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description.trim()) { setError('Please provide a description of the work you completed.'); return; }
        setIsSubmitting(true); setError('');
        try {
            const res = await fetch('/api/tasks/submit-work', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId: task._id, attachments, submissionDescription: description }) });
            if (!res.ok) { const errorResult = await res.json(); throw new Error(errorResult.message || 'Failed to submit work.'); }
            await onWorkSubmitted();
            toast.success('Work submitted successfully!');
            onClose();
        } catch (err) { setError(err.message); toast.error(err.message); } finally { setIsSubmitting(false); }
    };
    return (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4"><motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-white rounded-xl p-8 w-full max-w-lg"><div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-bold">Submit Work</h3><button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100"><X size={20} /></button></div><p className="text-sm text-slate-500 mb-6">For task: <span className="font-semibold text-slate-700">"{task.title}"</span></p><form
  onSubmit={handleSubmit}
  className="space-y-6 p-6 bg-white rounded-xl shadow-xl max-w-2xl mx-auto animate-fade-in"
>
  <div>
    <label
      htmlFor="submissionDescription"
      className="block text-sm font-medium text-slate-700"
    >
      Work Description <span className="text-red-500">*</span>
    </label>
    <textarea
      id="submissionDescription"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      rows={4}
      required
      className="mt-2 w-full border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
      placeholder="Describe the task or work completed..."
    />
  </div>
  <div>
    <label className="block text-sm font-medium text-slate-700">
      Attach Files <span className="text-slate-400 text-xs">(optional)</span>
    </label>
    <input
      type="file"
      multiple
      onChange={handleFileChange}
      className="mt-2 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-slate-200 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-300 transition"
    />
  </div>
  {attachments.length > 0 && (
    <div>
      <p className="text-sm font-semibold text-slate-600">Selected Files:</p>
      <div className="flex flex-wrap gap-2 mt-2">
        {attachments.map((f, i) => (
          <span
            key={i}
            className="bg-green-50 text-green-800 px-3 py-1 text-xs rounded-full border border-green-200 shadow-sm"
          >
            {f.filename}
          </span>
        ))}
      </div>
    </div>
  )}
  {error && (
    <p className="text-sm text-red-600 font-medium">{error}</p>
  )}
  <div className="pt-6 border-t flex justify-end gap-4">
    <button
      type="button"
      onClick={onClose}
      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={isSubmitting}
      className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg flex items-center gap-2 transition"
    >
      {isSubmitting ? (
        <span className="animate-pulse">Submitting...</span>
      ) : (
        "Submit & Complete"
      )}
    </button>
  </div>
</form>
</motion.div></motion.div>);
};

const PersonalTaskModal = ({ onClose, onTaskCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) { setError('Please provide a title.'); return; }
        setIsSubmitting(true); setError('');
        try {
            const res = await fetch('/api/tasks/self-assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, description }) });
            if (!res.ok) { const errorResult = await res.json(); throw new Error(errorResult.message || 'Failed to create task.'); }
            await onTaskCreated();
            toast.success('Personal task added!');
            onClose();
        } catch (err) { setError(err.message); toast.error(err.message); } finally { setIsSubmitting(false); }
    };
    return (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4"><motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-white rounded-xl p-8 w-full max-w-lg"><div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-bold">Add Personal Task</h3><button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100"><X size={20} /></button></div><form onSubmit={handleSubmit} className="space-y-6"><div><label htmlFor="title" className="block text-sm font-semibold text-slate-700">Task Title <span className="text-red-500">*</span></label><input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" required /></div><div><label htmlFor="description" className="block text-sm font-semibold text-slate-700">Description <span className="font-normal text-slate-500">(Optional)</span></label><textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"/></div>{error && <p className="text-sm text-red-600">{error}</p>}<div className="pt-6 border-t border-slate-200 flex items-center justify-end gap-4"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition">Cancel</button><button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition">{isSubmitting && (<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>)}{isSubmitting ? 'Adding...' : 'Add Task'}</button></div></form></motion.div></motion.div>);
};

const TaskDetailsModal = ({ task, onClose, onCommentAdded, currentUser }) => {
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const commentsEndRef = useRef(null);

    const pmAttachments = (task.attachments || []).filter(att => att.uploadedBy?._id.toString() === task.assignedBy?._id.toString());
    const userAttachments = (task.attachments || []).filter(att => att.uploadedBy?._id.toString() === task.assignedTo?._id.toString());

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/tasks/add-comment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId: task._id, content: newComment }) });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            onCommentAdded(task._id, result.data);
            setNewComment("");
            toast.success("Comment posted!");
        } catch (err) {
            toast.error(err.message || "Failed to post comment.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [task.comments]);

    if (!task) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="flex justify-between items-start pb-4 border-b border-slate-200 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">{task.title}</h2>
                        <span className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusPill(task.status)}`}>{task.status}</span>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 -mt-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"><X size={24}/></button>
                </header>
                <div className="flex-grow overflow-y-auto pr-3 -mr-3 space-y-6">
                    <div>
                        <h4 className="font-bold text-slate-600 mb-3 flex items-center gap-2"><Users size={16}/> Team</h4>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                                <Image src={task.assignedBy?.avatar || '/default-avatar.png'} width={40} height={40} className="rounded-full aspect-square object-cover" alt={task.assignedBy?.name || 'Assigner'} />
                                <div>
                                    <p className="font-semibold text-slate-800">{task.assignedBy?.name}</p>
                                    <p className="text-xs text-slate-500">Project Manager</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Image src={task.assignedTo?.avatar || '/default-avatar.png'} width={40} height={40} className="rounded-full aspect-square object-cover" alt={task.assignedTo?.name || 'Assignee'} />
                                <div>
                                    <p className="font-semibold text-slate-800">{task.assignedTo?.name}</p>
                                    <p className="text-xs text-slate-500">Assigned To</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-bold text-slate-600 mb-2 flex items-center gap-2"><Calendar size={16}/> Deadline</h4>
                            <p className={`text-sm ${getDeadlineInfo(task).classes}`}>{formatDeadline(task.deadline)}</p>
                        </div>
                        {task.completedAt && (
                            <div>
                                <h4 className="font-bold text-slate-600 mb-2 flex items-center gap-2"><CheckCircle size={16}/> Completed On</h4>
                                <p className="text-sm text-green-600">{formatEnglishDate(task.completedAt, true)}</p>
                            </div>
                        )}
                    </div>
                    {task.description && (
                        <div>
                            <h4 className="font-bold text-slate-600 mb-2 flex items-center gap-2"><FileText size={16}/> Description</h4>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border">{task.description}</p>
                        </div>
                    )}
                    {(pmAttachments.length > 0 || userAttachments.length > 0) && (
                         <div>
                            <h4 className="font-bold text-slate-600 mb-3 flex items-center gap-2"><Paperclip size={16}/> Attachments</h4>
                            {pmAttachments.length > 0 && (
                                <div className="mb-4">
                                    <h5 className="text-xs font-semibold text-slate-500 mb-2">From Project Manager:</h5>
                                    <div className="flex flex-wrap gap-2">{pmAttachments.map(file => (<a key={file.url} href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 flex items-center gap-2"><Paperclip size={14}/>{file.filename}</a>))}</div>
                                </div>
                            )}
                             {userAttachments.length > 0 && (
                                <div>
                                    <h5 className="text-xs font-semibold text-slate-500 mb-2">Your Submissions:</h5>
                                    <div className="flex flex-wrap gap-2">{userAttachments.map(file => (<a key={file.url} href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm bg-green-100 text-green-800 px-3 py-1.5 rounded-lg hover:bg-green-200 flex items-center gap-2"><CheckCircle size={14}/>{file.filename}</a>))}</div>
                                </div>
                            )}
                        </div>
                    )}
                    <div>
                        <h4 className="font-bold text-slate-600 mb-2 flex items-center gap-2"><MessageSquare size={16}/> Discussion</h4>
                        <div className="space-y-4 max-h-60 overflow-y-auto p-4 bg-slate-50 rounded-lg border">
                            {task.comments && task.comments.length > 0 ? (
                                task.comments.map(comment => (
                                    <div key={comment._id} className="flex items-start gap-3">
                                        <Image src={comment.author?.avatar || '/default-avatar.png'} width={32} height={32} className="rounded-full aspect-square object-cover mt-1" alt={comment.author?.name || 'User'} />
                                        <div className="flex-1 bg-white p-3 rounded-lg border">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold text-sm text-slate-800">{comment.author?.name || 'Unknown User'}</p>
                                                <p className="text-xs text-slate-400">{formatEnglishDate(comment.createdAt, true)}</p>
                                            </div>
                                            <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{comment.content}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500 text-center py-4">No comments yet. Start the conversation!</p>
                            )}
                            <div ref={commentsEndRef} />
                        </div>
                        <form onSubmit={handlePostComment} className="mt-4 flex items-start gap-3">
                            <Image src={currentUser.avatar} width={32} height={32} className="rounded-full aspect-square object-cover mt-1" alt="Your avatar" />
                            <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment..." rows="2" className="flex-1 p-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:ring-green-500 focus:border-green-500 transition" required />
                            <button type="submit" disabled={isSubmitting || !newComment.trim()} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 h-full transition-colors">Post</button>
                        </form>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const CompletedTaskCard = ({ task, onOpenDetails }) => {
    const userAttachments = task.attachments?.filter(att => att.uploadedBy?._id?.toString() === task.assignedTo?._id?.toString()) || [];
    return (
        <div className="p-4 bg-slate-50/80 rounded-lg cursor-pointer hover:bg-slate-100/70 transition-colors" onClick={() => onOpenDetails(task)}>
            <div className="flex justify-between items-start gap-4">
                <div><h4 className="font-semibold text-slate-600">{task.title}</h4><p className="text-sm text-green-600 font-medium mt-1">Completed on {formatEnglishDate(task.completedAt)}</p></div>
                <span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${getStatusPill(task.status)}`}>{task.status}</span>
            </div>
            {task.submissionDescription && (<div className="mt-3 pt-3 border-t border-slate-200/60"><div className="flex items-start gap-2.5 mt-2"><MessageSquare size={16} className="text-slate-400 mt-0.5 flex-shrink-0" /><p className="text-sm text-slate-600 whitespace-pre-wrap">{task.submissionDescription}</p></div></div>)}
            {userAttachments.length > 0 && <div className="mt-3 pt-3 border-t border-slate-200/60"><h4 className="text-xs font-bold text-green-700 mb-2">Your Submissions:</h4><div className="flex flex-wrap gap-2">{userAttachments.map(file => (<a key={file.url} href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-md hover:bg-green-200 flex items-center gap-1.5"><CheckCircle size={12}/>{file.filename}</a>))}</div></div>}
        </div>
    );
};

const DraggableTaskCard = ({ task, onUpdateTaskStatus, onOpenSubmitModal, onOpenDetails }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 'auto', opacity: isDragging ? 0.8 : 1 };
    const isSelfAssigned = task.assignedBy?._id === task.assignedTo?._id;
    
    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="p-4 border border-slate-200 bg-white rounded-lg transition-shadow shadow-sm hover:shadow-md touch-none cursor-grab" onClick={() => onOpenDetails(task)}>
            <div className="flex justify-between items-start gap-4">
                <div><h4 className="font-semibold text-slate-800">{task.title}</h4></div>
                {isSelfAssigned && <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">Personal</span>}
            </div>
            {task.description && <p className="text-sm text-slate-600 mt-2 line-clamp-2">{task.description}</p>}
            
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className={`flex items-center gap-1.5 text-xs font-medium ${getDeadlineInfo(task).classes}`}>
                    <Clock size={14} />
                    <span>{formatDeadline(task.deadline)}</span>
                </div>
                <div className="flex items-center -space-x-2">
                    <Image src={task.assignedTo?.avatar || '/default-avatar.png'} width={24} height={24} className="rounded-full object-cover aspect-square border-2 border-white" alt={task.assignedTo?.name || ''} title={`Lead: ${task.assignedTo?.name}`} />
                    {task.assistedBy?.map(assistant => (<Image key={assistant._id} src={assistant.avatar || '/default-avatar.png'} width={24} height={24} className="rounded-full object-cover aspect-square border-2 border-white" alt={assistant.name} title={`Assist: ${assistant.name}`} />))}
                </div>
            </div>

            {(task.status === 'To Do' || task.status === 'In Progress') && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    {task.status === 'To Do' && (
                        <button onClick={(e) => { e.stopPropagation(); onUpdateTaskStatus(task._id, 'In Progress');}} className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white font-medium py-1.5 px-3 rounded-lg text-sm transition-all"><Play size={14} /> Start</button>
                    )}
                    {task.status === 'In Progress' && (
                        <button onClick={(e) => { e.stopPropagation(); onOpenSubmitModal(task);}} className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white font-medium py-1.5 px-3 rounded-lg text-sm"><Upload size={14} /> Submit</button>
                    )}
                </div>
            )}
        </div>
    );
};

const TaskColumn = ({ title, tasks, onUpdateTaskStatus, onOpenSubmitModal, onOpenDetails }) => {
    let titleColor, icon;
    switch (title) {
        case 'In Progress': titleColor = 'text-amber-800'; icon = <Play size={16} className="text-amber-600"/>; break;
        default: titleColor = 'text-sky-800'; icon = <List size={16} className="text-sky-600"/>; break;
    }
    return (
        <div className="bg-white/60 p-4 rounded-xl shadow-sm h-full flex flex-col">
            <h2 className={`font-bold text-lg mb-4 flex items-center gap-2 ${titleColor}`}>{icon}{title}<span className="text-sm font-mono bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">{tasks.length}</span></h2>
            <div className="space-y-4 h-full overflow-y-auto pr-2 -mr-2 rounded-lg">
                <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
                    {tasks.length > 0 ? (
                        tasks.map(task => <DraggableTaskCard key={task._id} task={task} onUpdateTaskStatus={onUpdateTaskStatus} onOpenSubmitModal={onOpenSubmitModal} onOpenDetails={onOpenDetails} />)
                    ) : (
                        <div className="text-center py-10"><Inbox className="mx-auto h-12 w-12 text-slate-300"/><p className="mt-2 text-sm text-slate-500">No tasks here.</p></div>
                    )}
                </SortableContext>
            </div>
        </div>
    );
};

const MyStatsWidget = ({ tasks, attendance }) => {
    const stats = useMemo(() => {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfWeek.setHours(0, 0, 0, 0);

        const completedThisWeek = tasks.filter(task => 
            task.status === 'Completed' && new Date(task.completedAt) >= startOfWeek
        ).length;

        const overdueTasks = tasks.filter(task => 
            task.status !== 'Completed' && task.deadline && new Date(task.deadline) < new Date()
        ).length;
        
        // Calculate office and home hours for the current month and year
        const currentMonthRecords = attendance.filter(att => {
            const checkInDate = new Date(att.checkInTime);
            const now = new Date();
            return checkInDate.getMonth() === now.getMonth() && checkInDate.getFullYear() === now.getFullYear();
        });

        const totalOfficeSeconds = currentMonthRecords
            .filter(att => att.workLocation === 'Office')
            .reduce((acc, att) => acc + (att.duration || 0), 0);
            
        const totalHomeSeconds = currentMonthRecords
            .filter(att => att.workLocation === 'Home')
            .reduce((acc, att) => acc + (att.duration || 0), 0);

        return { 
            completedThisWeek, 
            overdueTasks, 
            totalHoursOffice: totalOfficeSeconds / 3600,
            totalHoursHome: totalHomeSeconds / 3600
        };
    }, [tasks, attendance]);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl shadow-sm border border-slate-200/80">
            <div className="px-6 py-5 border-b border-slate-200/80">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-3"><TrendingUp className="text-indigo-600"/>My Stats</h2>
            </div>
            <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-600 flex items-center gap-2"><Briefcase size={16} className="text-green-600"/> Work Hours (Office)</span>
                    <span className="font-bold text-lg text-slate-800">{stats.totalHoursOffice.toFixed(1)} hrs</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-600 flex items-center gap-2"><Home size={16} className="text-indigo-600"/> Work Hours (Home)</span>
                    <span className="font-bold text-lg text-slate-800">{stats.totalHoursHome.toFixed(1)} hrs</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-600">Tasks Completed (This Week)</span>
                    <span className="font-bold text-lg text-green-600">{stats.completedThisWeek}</span>
                </div>
                <div className={`flex items-center justify-between p-3 rounded-lg ${stats.overdueTasks > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
                    <span className={`font-semibold ${stats.overdueTasks > 0 ? 'text-red-600' : 'text-slate-600'}`}>Overdue Tasks</span>
                    <span className={`font-bold text-lg flex items-center gap-2 ${stats.overdueTasks > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                        {stats.overdueTasks > 0 && <AlertOctagon size={16} />}
                        {stats.overdueTasks}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

const WorkHoursChartCard = ({ attendance }) => {
    const chartData = useMemo(() => {
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const labels = [];
        const data = Array(7).fill(0);

        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            labels.push(days[day.getDay()]);
        }

        attendance.forEach(att => {
            if (att.checkInTime && att.duration) {
                const checkInDate = new Date(att.checkInTime);
                if (checkInDate >= startOfWeek) {
                    const dayIndex = checkInDate.getDay();
                    data[dayIndex] += att.duration / 3600; 
                }
            }
        });

        return {
            labels: labels,
            datasets: [{
                label: 'Work Hours',
                data: data,
                backgroundColor: 'rgba(22, 163, 74, 0.6)',
                borderColor: 'rgba(22, 163, 74, 1)',
                borderWidth: 1,
                borderRadius: 4,
            }]
        };
    }, [attendance]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'This Week\'s Work Hours', font: { size: 16, weight: 'bold' }, color: '#334155' }
        },
        scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Hours' } },
            x: { grid: { display: false } }
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
            <div style={{ height: '250px' }}>
                <Bar options={chartOptions} data={chartData} />
            </div>
        </motion.div>
    );
};


const DashboardSkeleton = () => (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-pulse">
        <div className="xl:col-span-4 space-y-8">
            <div className="h-72 bg-white rounded-2xl p-6 space-y-4"><div className="flex items-center space-x-4"><div className="h-24 w-24 bg-slate-200 rounded-full"></div><div className="space-y-2"><div className="h-8 w-40 bg-slate-200 rounded-md"></div><div className="h-5 w-24 bg-slate-200 rounded-md"></div></div></div><div className="h-20 w-full bg-slate-200 rounded-xl mt-6"></div></div>
            <div className="h-48 bg-white rounded-2xl p-6 space-y-4"><div className="h-6 w-3/4 bg-slate-200 rounded-md"></div><div className="h-6 w-full bg-slate-200 rounded-md"></div><div className="h-6 w-1/2 bg-slate-200 rounded-md"></div></div>
        </div>
        <div className="xl:col-span-8 space-y-8">
            <div className="bg-white rounded-2xl p-6"><div className="flex justify-between items-center mb-6"><div className="h-8 w-1/3 bg-slate-200 rounded-md"></div><div className="h-10 w-40 bg-slate-200 rounded-lg"></div></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{height: '450px'}}><div className="bg-slate-100 h-full rounded-xl p-4 space-y-4"><div className="h-20 bg-slate-200 rounded-lg"></div><div className="h-20 bg-slate-200 rounded-lg"></div><div className="h-20 bg-slate-200 rounded-lg"></div></div><div className="bg-slate-100 h-full rounded-xl p-4 space-y-4"><div className="h-20 bg-slate-200 rounded-lg"></div><div className="h-20 bg-slate-200 rounded-lg"></div></div><div className="bg-slate-100 h-full rounded-xl p-4 space-y-4"><div className="h-20 bg-slate-200 rounded-lg"></div></div></div></div>
            <div className="bg-white rounded-2xl p-6"><div className="h-8 w-1/4 bg-slate-200 rounded-md mb-6"></div><div className="space-y-2"><div className="h-12 w-full bg-slate-100 rounded-md"></div><div className="h-12 w-full bg-slate-100 rounded-md"></div><div className="h-12 w-full bg-slate-100 rounded-md"></div></div></div>
        </div>
    </div>
);


// --- Main Component ---
export default function Dashboard({ user }) {
  const router = useRouter();
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [activeAttendance, setActiveAttendance] = useState(null);
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
  const [isPersonalTaskModalOpen, setIsPersonalTaskModalOpen] = useState(false);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);
  
  const notificationDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const fetchDashboardData = useCallback(async () => {
      try {
          const res = await fetch('/api/dashboard/data');
          if (!res.ok) throw new Error('Failed to fetch dashboard data');
          const data = await res.json();
          setAttendance(data.initialAttendance || []);
          setTasks(data.initialTasks || []);
          setNotes(data.initialNotes || []);
          setNotifications(data.initialNotifications || []);
          if (data.activeCheckIn) {
              setActiveAttendance(data.activeCheckIn);
              setCheckInTime(data.activeCheckIn.checkInTime);
              setDescription(data.activeCheckIn.description || '');
              setIsOnBreak(data.initialIsOnBreak);
          } else {
              setActiveAttendance(null);
              setCheckInTime(null);
              setDescription('');
              setIsOnBreak(false);
          }
      } catch (err) {
          setError(err.message);
          toast.error(err.message);
      } finally {
          setIsDataLoading(false);
      }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const unreadNotifications = useMemo(() => notifications.filter(n => !n.isRead), [notifications]);
  
  const taskColumns = useMemo(() => {
    const columns = { 'To Do': [], 'In Progress': [], 'Completed': [] };
    tasks.forEach(task => { if (columns[task.status]) columns[task.status].push(task); });
    columns['Completed'].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    return columns;
  }, [tasks]);
  
  useEffect(() => { const handleScroll = () => setIsScrolled(window.scrollY > 10); window.addEventListener('scroll', handleScroll); return () => window.removeEventListener('scroll', handleScroll); }, []);
  useEffect(() => { if (checkInTime) { const timer = setInterval(() => setElapsedTime(formatElapsedTime(checkInTime)), 1000); return () => clearInterval(timer); } else { setElapsedTime(''); } }, [checkInTime]);
  useEffect(() => { const timer = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(timer); }, []);
  
  useEffect(() => {
    function handleClickOutside(event) {
        if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
            setIsNotificationOpen(false);
        }
        if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
            setIsDropdownOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const handleCheckIn = async (location) => {
    setIsAttendanceLoading(true);
    toast.loading(`Checking in from ${location}...`);
    try {
        const res = await fetch('/api/attendance/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workLocation: location })
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message);
        
        setActiveAttendance(result.data);
        setCheckInTime(result.data.checkInTime);
        setAttendance(prev => [result.data, ...prev]);
        toast.dismiss();
        toast.success(result.message);
    } catch (err) {
        toast.dismiss();
        toast.error(err.message || 'Failed to check in.');
    } finally {
        setIsAttendanceLoading(false);
    }
  };

  const handleCheckOut = async () => { 
    if (!description.trim()) { 
      toast.error('Work description is required.'); 
      return; 
    } 
    setIsAttendanceLoading(true); 
    try { 
      const res = await fetch('/api/attendance/checkout', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ description, attendanceId: activeAttendance._id }), 
      }); 
      if (!res.ok) throw new Error(await handleApiError(res)); 
      const { data } = await res.json(); 
      setActiveAttendance(null); 
      setCheckInTime(null); 
      setDescription(''); 
      setIsOnBreak(false); 
      setAttendance(prev => prev.map(att => att._id === data._id ? data : att)); 
      toast.success("Checked out successfully!"); 
    } catch (err) { 
      toast.error(err.message); 
    } finally { 
      setIsAttendanceLoading(false); 
    } 
  };

  const handleBreakIn = async () => { setIsAttendanceLoading(true); try { const res = await fetch('/api/attendance/break-in', { method: 'POST' }); if (!res.ok) throw new Error(await handleApiError(res)); setIsOnBreak(true); toast.success("Break started.");} catch (err) { toast.error(err.message);} finally { setIsAttendanceLoading(false); } };
  const handleBreakOut = async () => { setIsAttendanceLoading(true); try { const res = await fetch('/api/attendance/break-out', { method: 'POST' }); if (!res.ok) throw new Error(await handleApiError(res)); setIsOnBreak(false); toast.success("Resumed work.");} catch (err) { toast.error(err.message);} finally { setIsAttendanceLoading(false); } };
  const handleLogout = async () => { await fetch('/api/auth/logout'); router.push('/login'); };
  const handleUpdateTaskStatus = async (taskId, newStatus) => { setError(''); try { const res = await fetch('/api/tasks/update-status', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId, newStatus }), }); if (!res.ok) throw new Error(await handleApiError(res)); await fetchDashboardData(); toast.success(`Task marked as '${newStatus}'`); } catch (err) { setError(err.message); toast.error(err.message); }};
  const handleAvatarUpload = async (base64Image) => { setIsUploading(true); setError(''); try { const res = await fetch('/api/user/upload-avatar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64Image }), }); if (!res.ok) throw new Error(await handleApiError(res)); const data = await res.json(); setProfileUser(prev => ({ ...prev, avatar: data.avatar })); toast.success('Avatar updated!'); } catch (err) { setError(err.message); toast.error(err.message); } finally { setIsUploading(false); }};
  const handleFileChange = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.readAsDataURL(file); reader.onloadend = () => { handleAvatarUpload(reader.result); }; reader.onerror = () => { toast.error("Could not read file."); }; };
  const handleCreateNote = async (e) => { e.preventDefault(); if (!newNoteContent.trim()) return; setIsSubmittingNote(true); setError(''); try { const res = await fetch('/api/notes/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: newNoteContent }), }); if (!res.ok) throw new Error(await handleApiError(res)); const result = await res.json(); setNotes(prevNotes => [result.data, ...prevNotes]); setNewNoteContent(''); toast.success('Note saved.'); } catch (err) { setError(err.message); toast.error(err.message); } finally { setIsSubmittingNote(false); }};
  const handleUpdateNote = async () => { if (!editingNote || !editingNote.content.trim()) return; setIsSubmittingNote(true); setError(''); try { const res = await fetch('/api/notes/edit', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ noteId: editingNote._id, content: editingNote.content }), }); if (!res.ok) throw new Error(await handleApiError(res)); const result = await res.json(); setNotes(prevNotes => prevNotes.map(n => n._id === editingNote._id ? result.data : n)); setEditingNote(null); toast.success('Note updated.'); } catch (err) { setError(err.message); toast.error(err.message); } finally { setIsSubmittingNote(false); }};
  const handleDeleteNote = async (noteId) => { if (!window.confirm('Are you sure you want to delete this note?')) return; setError(''); try { const res = await fetch('/api/notes/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ noteId }), }); if (!res.ok) throw new Error(await handleApiError(res)); setNotes(prevNotes => prevNotes.filter(n => n._id !== noteId)); toast.success('Note deleted.'); } catch (err) { setError(err.message); toast.error(err.message); }};
  const handleMarkAsRead = async () => { if (unreadNotifications.length === 0) return; try { await fetch('/api/notification/mark-as-read', { method: 'POST' }); setNotifications(prev => prev.map(n => ({ ...n, isRead: true }))); } catch (err) { console.error(err); toast.error("Failed to mark notifications as read."); } };

  const handleCommentAdded = (taskId, newComment) => {
    setTasks(currentTasks => 
        currentTasks.map(task => {
            if (task._id === taskId) {
                const updatedComments = task.comments ? [...task.comments, newComment] : [newComment];
                if (selectedTaskDetails && selectedTaskDetails._id === taskId) {
                    setSelectedTaskDetails(prev => ({ ...prev, comments: updatedComments }));
                }
                return { ...task, comments: updatedComments };
            }
            return task;
        })
    );
  };

    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: { distance: 8 },
    }));

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over) return;
        let destinationStatus = null;
        for (const status in taskColumns) {
            if (taskColumns[status].some(task => task._id === over.id)) {
                destinationStatus = status;
                break;
            }
        }
        const activeTask = tasks.find(t => t._id === active.id);
        if (!activeTask || !destinationStatus || activeTask.status === destinationStatus) return;
        if (destinationStatus === 'Completed') {
            toast.error('Please use the "Submit Work" button to complete a task.');
            return;
        }
        if (activeTask.status === 'Completed') {
            toast.error('Completed tasks cannot be moved.');
            return;
        }
        const originalTasks = [...tasks];
        setTasks(tasks.map(t => t._id === active.id ? { ...t, status: destinationStatus } : t));
        try {
            const res = await fetch('/api/tasks/update-status', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId: active.id, newStatus: destinationStatus }),
            });
            if (!res.ok) throw new Error(await handleApiError(res));
            toast.success(`Task moved to "${destinationStatus}"`);
        } catch (err) {
            toast.error(err.message);
            setTasks(originalTasks);
        }
    };

  return (
    <>
      <Toaster position="top-center" />
      <AnimatePresence>
        {selectedTaskDetails && <TaskDetailsModal key={selectedTaskDetails._id} task={selectedTaskDetails} onClose={() => setSelectedTaskDetails(null)} onCommentAdded={handleCommentAdded} currentUser={user} />}
        {taskToSubmit && <SubmitWorkModal key="submit-modal" task={taskToSubmit} onClose={() => setTaskToSubmit(null)} onWorkSubmitted={fetchDashboardData} />}
        {isPersonalTaskModalOpen && <PersonalTaskModal key="personal-task-modal" onClose={() => setIsPersonalTaskModalOpen(false)} onTaskCreated={fetchDashboardData} />}
        {!isDesktop && isNotificationOpen && (
            <MobileNotificationPanel key="mobile-notif-panel" notifications={notifications} unreadCount={unreadNotifications.length} handleMarkAsRead={handleMarkAsRead} onClose={() => setIsNotificationOpen(false)} />
        )}
      </AnimatePresence>
      <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
        <div className="w-full h-full absolute inset-0 bg-slate-100 overflow-hidden"><div className="absolute top-0 -left-48 w-[40rem] h-[40rem] bg-green-200/50 rounded-full filter blur-3xl opacity-40 animate-blob"></div><div className="absolute top-0 -right-48 w-[40rem] h-[40rem] bg-sky-200/50 rounded-full filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div><div className="absolute bottom-0 left-1/4 w-[40rem] h-[40rem] bg-rose-200/50 rounded-full filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div></div>
        <div className="relative z-10">
            <header className={`sticky top-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-xl shadow-md' : 'bg-white/50'}`}>
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center space-x-4">
                            <Link href="/dashboard" className="flex items-center space-x-3">
                                <Image src="/geckoworks.png" alt="GeckoWorks Logo" width={42} height={42} className="rounded-full" style={{ height: 'auto', width: 'auto' }} />
                                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{user.name.split(' ')[0]}&apos;s Dashboard</h1>
                            </Link>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <div className="hidden md:flex items-center space-x-4 text-sm text-slate-500 bg-slate-100 px-4 py-2 rounded-full">
                                <div className="flex items-center space-x-2"><Calendar className="h-4 w-4 text-green-600" /><span>{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span></div>
                                <div className="h-4 w-px bg-slate-300"></div>
                                <div className="flex items-center space-x-2"><Clock className="h-4 w-4 text-green-600" /><span>{currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span></div>
                            </div>
                            <div ref={notificationDropdownRef} className="relative">
                                <button onClick={() => setIsNotificationOpen(prev => !prev)} className="relative p-2 text-slate-500 hover:text-green-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500" title="Notifications">
                                    <Bell className="h-6 w-6"/>
                                    {unreadNotifications.length > 0 && (<span className="absolute top-1.5 right-1.5 flex h-5 w-5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center">{unreadNotifications.length}</span></span>)}
                                </button>
                                <AnimatePresence>
                                    {isDesktop && isNotificationOpen && (<DesktopNotificationPanel notifications={notifications} unreadCount={unreadNotifications.length} handleMarkAsRead={handleMarkAsRead} onClose={() => setIsNotificationOpen(false)} />)}
                                </AnimatePresence>
                            </div>
                            <div ref={userDropdownRef} className="relative">
                                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 bg-white pl-1 pr-2 py-1 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                    <Image src={profileUser.avatar} alt={profileUser.name} width={36} height={36} className="rounded-full object-cover aspect-square"/>
                                    <span className="font-semibold text-sm text-slate-700 hidden sm:block">{profileUser.name.split(' ')[0]}</span>
                                    <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {isDropdownOpen && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`absolute top-full right-0 mt-3 w-64 rounded-xl shadow-2xl bg-white ring-1 ring-black ring-opacity-5 z-20 origin-top-right`}>
                                            <div className="p-4 border-b border-slate-100">
                                                <div className="flex items-center space-x-4">
                                                    <Image src={profileUser.avatar} alt={profileUser.name} width={48} height={48} className="rounded-full object-cover aspect-square"/>
                                                    <div>
                                                        <p className="font-bold text-slate-800 truncate">{profileUser.name}</p>
                                                        <p className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">{profileUser.role}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-2">
                                                <Link href="/performance" className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100/80 hover:text-green-600 flex items-center gap-3 transition-colors rounded-md">
                                                    <TrendingUp className="h-5 w-5" />
                                                    <span>My Performance</span>
                                                </Link>
                                                <Link href="/leaves" className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100/80 hover:text-green-600 flex items-center gap-3 transition-colors rounded-md">
                                                    <FileText className="h-5 w-5" />
                                                    <span>My Leave Requests</span>
                                                </Link>
                                                <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-3 transition-colors rounded-md">
                                                    <LogOut className="h-5 w-5" />
                                                    <span>Sign Out</span>
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <main className={`max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10`}>
                {isDataLoading ? <DashboardSkeleton /> : (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    <motion.div className="xl:col-span-4 space-y-8" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                            <div className="p-6 flex flex-col items-center sm:flex-row sm:items-center sm:space-x-5">
                                <div className="relative flex-shrink-0 mb-4 sm:mb-0">
                                    <Image src={profileUser.avatar} alt="Profile Picture" width={88} height={88} className="rounded-full object-cover aspect-square shadow-md" priority />
                                    <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 bg-green-600 text-white rounded-full p-2 cursor-pointer hover:bg-green-700 transition shadow-sm border-2 border-white transform hover:scale-110">
                                        <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isUploading} />
                                        <>{isUploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Edit size={16} />}</>
                                    </label>
                                </div>
                                <div className="text-center sm:text-left">
                                    <h2 className="text-2xl font-bold text-slate-900">{profileUser.name}</h2>
                                    <p className="text-slate-500 font-medium">{profileUser.role}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50/70 p-6 border-t border-slate-200/80">
                                {!checkInTime ? (
                                    <div className="text-center py-4 space-y-4">
                                        <h3 className="font-bold text-slate-800 text-lg">Ready to start your day?</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleCheckIn('Office')} disabled={isAttendanceLoading} className="flex flex-col items-center justify-center gap-2 p-4 bg-white border-2 border-green-200 hover:bg-green-50 rounded-xl transition-colors disabled:opacity-70">
                                                <Briefcase className="text-green-600" size={24}/>
                                                <span className="font-semibold text-green-800">Work From Office</span>
                                            </motion.button>
                                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleCheckIn('Home')} disabled={isAttendanceLoading} className="flex flex-col items-center justify-center gap-2 p-4 bg-white border-2 border-indigo-200 hover:bg-indigo-50 rounded-xl transition-colors disabled:opacity-70">
                                                <Home className="text-indigo-600" size={24}/>
                                                <span className="font-semibold text-indigo-800">Work From Home</span>
                                            </motion.button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg font-semibold text-slate-800">Work Session Active</h3>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${activeAttendance?.workLocation === 'Office' ? 'bg-green-100 text-green-800' : 'bg-indigo-100 text-indigo-800'}`}>
                                                {activeAttendance?.workLocation === 'Office' ? <Briefcase size={14} className="mr-1.5"/> : <Home size={14} className="mr-1.5"/>}
                                                {activeAttendance?.workLocation}
                                            </span>
                                        </div>
                                        {isOnBreak && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"><Coffee className="mr-1.5" size={14} /> On Break</span>}
                                        <div className={`text-center bg-white rounded-lg p-4 border border-green-200 shadow-inner relative overflow-hidden`}>
                                            <div className="absolute inset-0 bg-green-500/10 animate-pulse"></div>
                                            <p className="text-sm text-slate-500 relative">Elapsed Time</p>
                                            <div className="text-3xl sm:text-5xl font-bold text-green-600 tracking-tighter my-1 relative">{elapsedTime}</div>
                                            <p className="text-xs text-slate-400 relative">Checked in at {new Date(checkInTime).toLocaleTimeString()}</p>
                                        </div>
                                        <div>
                                            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">Work Description</label>
                                            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What are you working on?" rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/80 focus:border-transparent transition" disabled={isOnBreak} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {!isOnBreak ? (
                                                <>
                                                    <button onClick={handleBreakIn} disabled={isAttendanceLoading} className="flex items-center justify-center gap-2 bg-amber-100 hover:bg-amber-200/80 text-amber-800 font-semibold py-2.5 px-4 rounded-lg transition-all disabled:opacity-70"><Coffee size={16} /> Start Break</button>
                                                    <button onClick={handleCheckOut} disabled={isAttendanceLoading} className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all disabled:opacity-70"><LogOut size={16} /> Check Out</button>
                                                </>
                                            ) : (
                                                <button onClick={handleBreakOut} disabled={isAttendanceLoading} className="col-span-2 flex items-center justify-center gap-2 bg-green-100 hover:bg-green-200/80 text-green-800 font-semibold py-2.5 px-4 rounded-lg transition-all disabled:opacity-70"><CheckCircle size={16} /> Resume Work</button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <MyStatsWidget tasks={tasks} attendance={attendance} />
                        <WorkHoursChartCard attendance={attendance} />
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80">
                            <div className="px-6 py-5 border-b border-slate-200/80"><h2 className="text-xl font-semibold text-slate-800">Daily Notes</h2></div>
                            <div className="p-6">
                                <form onSubmit={handleCreateNote} className="space-y-3 mb-6">
                                    <textarea value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} placeholder="Write down a quick note..." rows="3" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/80"/>
                                    <button type="submit" disabled={isSubmittingNote || !newNoteContent.trim()} className="px-5 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2">{isSubmittingNote ? 'Saving...' : 'Save Note'}</button>
                                </form>
                                <div className="space-y-4 max-h-96 overflow-y-auto pr-2 -mr-2">
                                    {notes.map((note) => (
                                        <div key={note._id} className="p-4 bg-slate-50/70 rounded-lg group">
                                            {editingNote?._id === note._id ? (
                                                <div className="space-y-3">
                                                    <textarea value={editingNote.content} onChange={(e) => setEditingNote({...editingNote, content: e.target.value})} className="w-full px-2 py-1 border border-slate-300 rounded-md" rows="3"/>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={handleUpdateNote} disabled={isSubmittingNote} className="p-2 text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"><Save size={18} /></button>
                                                        <button onClick={() => setEditingNote(null)} className="p-2 text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-md"><X size={18} /></button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-slate-700 whitespace-pre-wrap">{note.content}</p>
                                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                                                        <p className="text-xs text-slate-400">{formatEnglishDate(note.createdAt, true)}</p>
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => setEditingNote(note)} className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-full hover:text-blue-600" title="Edit Note"><Edit size={15} /></button>
                                                            <button onClick={() => handleDeleteNote(note._id)} className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-full hover:text-red-600" title="Delete Note"><Trash2 size={15} /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {notes.length === 0 && <p className="text-center text-slate-500 py-8">No notes for today.</p>}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div className="xl:col-span-8 space-y-8" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80">
                            <div className="px-6 py-5 border-b border-slate-200/80 flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-3"><Briefcase className="text-green-600"/>My Task Board</h2>
                                <button onClick={() => setIsPersonalTaskModalOpen(true)} className="flex items-center gap-2 text-sm font-semibold bg-green-100 text-green-700 px-3 py-2 rounded-lg hover:bg-green-200 transition-colors">
                                    <Plus size={16} /> Add Personal Task
                                </button>
                            </div>
                            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-slate-50/50">
                                    <TaskColumn title="To Do" tasks={taskColumns['To Do']} onUpdateTaskStatus={handleUpdateTaskStatus} onOpenSubmitModal={setTaskToSubmit} onOpenDetails={setSelectedTaskDetails} />
                                    <TaskColumn title="In Progress" tasks={taskColumns['In Progress']} onUpdateTaskStatus={handleUpdateTaskStatus} onOpenSubmitModal={setTaskToSubmit} onOpenDetails={setSelectedTaskDetails} />
                                    <div className="bg-white/60 p-4 rounded-xl shadow-sm">
                                        <h2 className={`font-bold text-lg mb-4 flex items-center gap-2 text-green-800`}><CheckCircle size={16} className="text-green-600"/>Completed<span className="text-sm font-mono bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">{taskColumns['Completed'].length}</span></h2>
                                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 -mr-2">
                                            {taskColumns['Completed'].length > 0 ? (
                                            <>
                                                {taskColumns['Completed'].slice(0, 5).map(task => <CompletedTaskCard key={task._id} task={task} onOpenDetails={setSelectedTaskDetails} />)}
                                                {taskColumns['Completed'].length > 5 && (
                                                    <Link href="/tasks/completed" className="block text-center mt-4 py-2 text-sm font-semibold text-green-600 hover:text-indigo-800 bg-slate-100 hover:bg-slate-200 rounded-lg">
                                                        View All {taskColumns['Completed'].length} Completed Tasks
                                                    </Link>
                                                )}
                                            </>
                                            ) : (<div className="text-center py-10"><Star className="mx-auto h-12 w-12 text-slate-300"/><p className="mt-2 text-sm text-slate-500">No tasks completed yet.</p></div>)}
                                        </div>
                                    </div>
                                </div>
                            </DndContext>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80">
                            <div className="px-6 py-5 border-b border-slate-200/80"><h2 className="text-xl font-semibold text-slate-800">Attendance History</h2></div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Work</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Break</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200/80">
                                        {attendance.slice(0, 7).map((att) => (
                                            <tr key={att._id} className="hover:bg-slate-50/70">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{formatEnglishDate(att.checkInTime)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${att.workLocation === 'Office' ? 'bg-green-100 text-green-800' : 'bg-indigo-100 text-indigo-800'}`}>
                                                        {att.workLocation || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{att.checkInTime && new Date(att.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{att.checkOutTime && ` - ${new Date(att.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`font-bold ${att.checkOutTime ? att.duration >= MIN_WORK_SECONDS ? 'text-green-600' : 'text-red-600' : 'text-blue-600'}`}>{formatDuration(att.duration)}</span></td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDuration(att.totalBreakDuration)}</td>
                                                <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title={att.description}>{att.description || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {attendance.length === 0 && <p className="text-center text-slate-500 py-10">No attendance history found.</p>}
                        </div>
                    </motion.div>
                </div>
                )}
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
        const user = await User.findById(decoded.userId).select('-password').lean();
        
        if (!user) {
            context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
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
        
        return { props: { user: JSON.parse(JSON.stringify(user)) } };

    } catch (error) {
        console.error("Dashboard Auth Error:", error.message);
        context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        return { redirect: { destination: '/login', permanent: false } };
    }
}
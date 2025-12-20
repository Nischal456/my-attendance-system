import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { Edit, Trash2, AlertTriangle, Clock, X as XIcon, LogOut, Plus, Calendar, Paperclip, CheckCircle, MessageSquare, FileText, Users, ChevronRight, User as UserIcon, TrendingUp, List, Play,Briefcase,Upload,Send } from 'react-feather';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast'; // Using global Toaster
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Keep Chart imports
import { Chart, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement } from 'chart.js';
Chart.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement);

// --- Helper Functions ---
const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) setMatches(media.matches);
        const listener = () => setMatches(media.matches);
        window.addEventListener('resize', listener);
        return () => window.removeEventListener('resize', listener);
    }, [matches, query]);
    return matches;
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
};

const formatDeadline = (dateString, includeTime = true) => {
  if (!dateString) return 'No deadline';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.hour12 = true;
  }
  return new Date(dateString).toLocaleString('en-US', options);
};

const getDeadlineInfo = (task) => {
  if (task.status === 'Completed' || !task.deadline) return { style: 'text-slate-400 font-medium' };
  if (new Date(task.deadline) < new Date()) return { style: 'text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md' };
  return { style: 'text-slate-500 font-medium' };
};

const getStatusPill = (status) => {
    switch (status) {
        case 'In Progress': return 'bg-amber-100 text-amber-700 border border-amber-200';
        case 'Completed': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
        default: return 'bg-sky-100 text-sky-700 border border-sky-200';
    }
};

// --- Sub-Components ---

const DashboardEntryLoader = ({ userName }) => (
    <motion.div 
        className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center font-sans"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
    >
        <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative mb-8"
        >
            <div className="absolute inset-0 bg-green-200 blur-2xl rounded-full opacity-40 animate-pulse"></div>
            <Image src="/logo.png" alt="Logo" width={80} height={80} className="" priority style={{ width: 'auto', height: 'auto' }} />
        </motion.div>
        
        <h2 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">Welcome, {userName.split(' ')[0]}</h2>
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <span className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                Loading PM Command Center...
            </span>
        </div>
        
        <motion.div 
            className="mt-8 h-1.5 w-48 bg-slate-100 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
        >
            <motion.div 
                className="h-full bg-green-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
            />
        </motion.div>
    </motion.div>
);

const TaskDetailsModal = ({ task, onClose, onCommentAdded, currentUser }) => {
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const commentsEndRef = useRef(null);

    const pmAttachments = (task.attachments || []).filter(att => att.uploadedBy?._id?.toString() === task.assignedBy?._id?.toString());
    const userAttachments = (task.attachments || []).filter(att => att.uploadedBy?._id?.toString() === task.assignedTo?._id?.toString());

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

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <motion.div initial={{ y: 30, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0, scale: 0.95 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} className="bg-white rounded-[2rem] shadow-2xl p-6 sm:p-8 w-full max-w-3xl max-h-[85vh] flex flex-col border border-white/50" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-6 flex-shrink-0">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusPill(task.status)}`}>{task.status}</span>
                            <span className="text-xs text-slate-400 font-mono">ID: {task._id.slice(-4)}</span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">{task.title}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 rounded-full transition-colors"><XIcon size={20} /></button>
                </div>
                
                <div className="overflow-y-auto pr-2 -mr-2 space-y-8 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 uppercase text-xs tracking-wider"><Users size={14} className="text-green-600"/> Team Members</h4>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="relative"><Image src={task.assignedBy?.avatar || '/default-avatar.png'} width={40} height={40} className="rounded-xl object-cover shadow-sm" alt={task.assignedBy?.name || ''} /><div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-0.5 border border-white"><Briefcase size={8} className="text-white"/></div></div>
                                    <div><p className="font-bold text-slate-800 text-sm">{task.assignedBy?.name}</p><p className="text-[10px] uppercase font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full w-fit mt-0.5">Project Manager</p></div>
                                </div>
                                <div className="w-full h-px bg-slate-200"></div>
                                <div className="flex items-center gap-3">
                                    <div className="relative"><Image src={task.assignedTo?.avatar || '/default-avatar.png'} width={40} height={40} className="rounded-xl object-cover shadow-sm" alt={task.assignedTo?.name || ''} /><div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border border-white"><UserIcon size={8} className="text-white"/></div></div>
                                    <div><p className="font-bold text-slate-800 text-sm">{task.assignedTo?.name}</p><p className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full w-fit mt-0.5">Lead </p></div>
                                </div>
                                {task.assistedBy?.map(assistant => (
                                    <div key={assistant._id} className="flex items-center gap-3 pl-2 border-l-2 border-slate-200 ml-4">
                                        <Image src={assistant.avatar || '/default-avatar.png'} width={28} height={28} className="rounded-lg object-cover opacity-80" alt={assistant.name} />
                                        <span className="font-medium text-slate-600 text-xs">{assistant.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <h4 className="font-bold text-slate-700 mb-3 uppercase text-xs tracking-wider">Timeline</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm"><span className="text-slate-500 flex items-center gap-2"><Clock size={14}/> Due Date</span><span className={`${getDeadlineInfo(task).style}`}>{formatDeadline(task.deadline)}</span></div>
                                    <div className="flex items-center justify-between text-sm"><span className="text-slate-500 flex items-center gap-2"><Calendar size={14}/> Assigned</span><span className="font-medium text-slate-700">{formatDeadline(task.createdAt, false)}</span></div>
                                    {task.status === 'Completed' && <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200"><span className="text-slate-500 flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500"/> Completed</span><span className="font-bold text-emerald-600">{formatDeadline(task.completedAt, false)}</span></div>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2 uppercase text-xs tracking-wider"><FileText size={14} className="text-blue-500"/> Description</h4>
                        <div className="text-slate-600 text-sm whitespace-pre-wrap p-5 bg-slate-50 rounded-2xl border border-slate-100 leading-relaxed">
                            {task.description || <span className="italic text-slate-400">No description provided for this task.</span>}
                        </div>
                    </div>

                    {task.status === 'Completed' && task.submissionDescription && (
                        <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                            <div className="flex items-center gap-2 mb-2"><CheckCircle size={16} className="text-emerald-600" /><h4 className="font-bold text-emerald-800 text-sm uppercase tracking-wider">Submission Note</h4></div>
                            <p className="text-slate-700 text-sm whitespace-pre-wrap">{task.submissionDescription}</p>
                        </div>
                    )}

                    {(pmAttachments.length > 0 || userAttachments.length > 0) && (
                        <div>
                           <div className="flex items-center gap-2 mb-3"><Paperclip size={16} className="text-slate-400" /><h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Attachments</h4></div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                               {pmAttachments.map(file => (<a key={file.url} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 hover:bg-blue-100 border border-blue-100 transition-colors group"><div className="bg-white p-1.5 rounded-lg text-blue-600 shadow-sm"><FileText size={16}/></div><div className="overflow-hidden"><p className="text-sm font-semibold text-slate-700 truncate">{file.filename}</p><p className="text-[10px] text-blue-500 font-medium">Reference Material</p></div></a>))}
                               {userAttachments.map(file => (<a key={file.url} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/50 hover:bg-emerald-100 border border-emerald-100 transition-colors group"><div className="bg-white p-1.5 rounded-lg text-emerald-600 shadow-sm"><CheckCircle size={16}/></div><div className="overflow-hidden"><p className="text-sm font-semibold text-slate-700 truncate">{file.filename}</p><p className="text-[10px] text-emerald-500 font-medium">User Submission</p></div></a>))}
                            </div>
                        </div>
                    )}

                    <div className="bg-white pt-2">
                        <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 uppercase text-xs tracking-wider"><MessageSquare size={14} className="text-amber-500"/> Discussion</h4>
                        <div className="space-y-4 max-h-80 overflow-y-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            {task.comments && task.comments.length > 0 ? (
                                task.comments.map(comment => (
                                    <div key={comment._id} className="flex items-start gap-3 group">
                                        <Image src={comment.author?.avatar || '/default-avatar.png'} width={36} height={36} className="rounded-xl object-cover shadow-sm mt-1" alt={comment.author?.name || 'User'} />
                                        <div className="flex-1">
                                            <div className="flex items-baseline justify-between mb-1 pl-1">
                                                <span className="font-bold text-xs text-slate-700">{comment.author?.name}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm text-sm text-slate-600 leading-relaxed">
                                                {comment.content}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 opacity-50"><MessageSquare className="mx-auto h-8 w-8 text-slate-300 mb-2"/><p className="text-xs text-slate-500">No comments yet.</p></div>
                            )}
                            <div ref={commentsEndRef} />
                        </div>
                        <form onSubmit={handlePostComment} className="mt-4 flex items-end gap-3">
                            <Image src={currentUser.avatar} width={40} height={40} className="rounded-xl object-cover shadow-sm border border-slate-200" alt="Your avatar" />
                            <div className="flex-1 relative">
                                <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Type your comment..." rows="1" className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none min-h-[46px]" required />
                                <button type="submit" disabled={isSubmitting} className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"><Send size={16}/></button>
                            </div>
                        </form>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const TaskCard = ({ task, onEdit, onDelete, onOpenDetails }) => {
    const isCompleted = task.status === 'Completed';
    const isSelfAssigned = task.assignedBy?._id?.toString() === task.assignedTo?._id?.toString();
    return (
        <motion.div layoutId={task._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`bg-white border border-slate-100 rounded-2xl p-5 shadow-sm group cursor-pointer hover:shadow-lg hover:border-green-100 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden`} onClick={() => onOpenDetails(task)}>
             {isCompleted && <div className="absolute top-0 right-0 p-2 opacity-10"><CheckCircle size={60} className="text-emerald-500"/></div>}
            <div className="flex justify-between items-start gap-4 relative z-10">
                <h3 className={`font-bold text-[15px] text-slate-800 leading-snug line-clamp-2 ${isCompleted && 'text-slate-500'}`}>{task.title}</h3>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 bg-white/80 backdrop-blur-sm rounded-lg p-0.5 shadow-sm border border-slate-100">
                    {!isCompleted && <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors" title="Edit"><Edit size={14} /></button>}
                    <button onClick={(e) => { e.stopPropagation(); onDelete(task._id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete"><Trash2 size={14} /></button>
                </div>
            </div>
            
            <div className="flex items-center gap-2 mt-3">
                {isSelfAssigned && <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-md border border-green-100">Personal</span>}
                <div className={`flex items-center gap-1 text-[10px] font-bold ${getDeadlineInfo(task).style}`}>
                    <Clock size={12} /> {formatDeadline(task.deadline)}
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center relative z-10">
                <div className="flex items-center -space-x-2 pl-2">
                    <div className="relative z-10 hover:z-20 transition-transform hover:scale-110">
                        <Image src={task.assignedTo?.avatar || '/default-avatar.png'} width={26} height={26} className="rounded-full object-cover aspect-square border-2 border-white ring-1 ring-green-500 shadow-sm" alt={task.assignedTo?.name || ''} title={`Lead: ${task.assignedTo?.name}`} />
                    </div>
                    {task.assistedBy?.map(assistant => (
                        <div key={assistant._id} className="relative hover:z-20 transition-transform hover:scale-110">
                            <Image src={assistant.avatar || '/default-avatar.png'} width={26} height={26} className="rounded-full object-cover aspect-square border-2 border-white shadow-sm" alt={assistant.name} title={`Assist: ${assistant.name}`} />
                        </div>
                    ))}
                </div>
                <span className="text-xs font-semibold text-slate-400 group-hover:text-green-600 flex items-center gap-1 transition-colors">Details <ChevronRight size={12}/></span>
            </div>
        </motion.div>
    );
};

// --- UPDATED: Next Level Task Form Modal with Photo Previews ---
const TaskFormModal = ({ mode, taskData, onClose, allUsers, setTasks }) => {
    const isEditMode = mode === 'edit';
    const formatForInput = (date) => date ? new Date(new Date(date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
    const [formData, setFormData] = useState( isEditMode ? { taskId: taskData._id, title: taskData.title, description: taskData.description || '', assignedTo: taskData.assignedTo._id, deadline: formatForInput(taskData.deadline), assistedBy: taskData.assistedBy?.map(u => u._id) || [] } : { title: '', description: '', assignedTo: '', deadline: '', assistedBy: [] });
    const [attachments, setAttachments] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    
    const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
    
    // Updated File Handling with Preview Logic
    const handleFileChange = (e) => { 
        const files = Array.from(e.target.files); 
        if (files.length === 0) return;

        const filePromises = files.map(file => new Promise((resolve) => { 
            const reader = new FileReader(); 
            reader.onloadend = () => resolve({ 
                url: reader.result, // Data URL for backend
                filename: file.name,
                type: file.type // Store type for preview logic
            }); 
            reader.readAsDataURL(file); 
        })); 
        
        Promise.all(filePromises).then(newFiles => setAttachments(prev => [...prev, ...newFiles])); 
    };

    const handleAssistantChange = (userId) => { setFormData(prev => ({ ...prev, assistedBy: prev.assistedBy.includes(userId) ? prev.assistedBy.filter(id => id !== userId) : [...prev.assistedBy, userId] })); };
    
    const handleSubmit = async (e) => {
        e.preventDefault(); setIsSubmitting(true); setError('');
        try {
            const endpoint = isEditMode ? '/api/tasks/edit' : '/api/tasks/create';
            const method = isEditMode ? 'PUT' : 'POST';
            const body = { ...formData, attachments }; // Attachments contain DataURLs
            const res = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            if (isEditMode) {
                setTasks(prev => prev.map(t => t._id === result.data._id ? result.data : t));
            } else {
                setTasks(prev => [result.data, ...prev]);
            }
            toast.success(result.message || 'Task saved successfully!');
            onClose();
        } catch (err) { setError(err.message); toast.error(err.message); } finally { setIsSubmitting(false); }
    };
    
    const availableAssistants = allUsers.filter(u => u.role !== 'HR' && u.role !== 'Project Manager' && u._id !== formData.assignedTo);
    
    return ( 
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <motion.div initial={{ y: 20, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] flex flex-col border border-white/50">
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h3 className="text-2xl font-bold text-slate-800">{isEditMode ? 'Edit Task' : 'Assign New Task'}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"><XIcon size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2 -mr-2 custom-scrollbar">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Task Title <span className="text-rose-500">*</span></label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none" placeholder="e.g. Frontend Implementation"/>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                        <textarea name="description" value={formData.description || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none resize-none" rows="4" placeholder="Detailed requirements..."/>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Lead Developer <span className="text-rose-500">*</span></label>
                            <div className="relative">
                                <select name="assignedTo" value={formData.assignedTo} onChange={handleChange} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none appearance-none">
                                    <option value="" disabled>Select a Lead</option>
                                    {allUsers.filter(u => u.role !== 'HR' && u.role !== 'Project Manager').map(e => (<option key={e._id} value={e._id}>{e.name}</option>))}
                                </select>
                                <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Deadline</label>
                            <input type="datetime-local" name="deadline" value={formData.deadline} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none"/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Assistants</label>
                        <div className="max-h-40 overflow-y-auto space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                            {availableAssistants.length > 0 ? availableAssistants.map(user => (
                                <label key={user._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white hover:shadow-sm cursor-pointer transition-all border border-transparent hover:border-slate-100">
                                    <input type="checkbox" checked={formData.assistedBy.includes(user._id)} onChange={() => handleAssistantChange(user._id)} className="h-4 w-4 rounded text-green-600 focus:ring-green-500 border-slate-300"/>
                                    <Image src={user.avatar || '/default-avatar.png'} width={28} height={28} className="rounded-lg object-cover" alt={user.name}/>
                                    <span className="text-sm font-medium text-slate-700">{user.name}</span>
                                </label>
                            )) : <p className="text-xs text-center text-slate-400 py-4">No available team members to assist.</p>}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Attachments</label>
                        <label className="flex items-center gap-3 p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-green-50 hover:border-green-300 transition-all group">
                             <div className="p-3 bg-white rounded-lg shadow-sm text-slate-400 group-hover:text-green-500"><Upload size={20}/></div>
                             <div>
                                 <span className="text-sm font-semibold text-slate-700 group-hover:text-green-700 block">Click to upload files</span>
                                 <span className="text-xs text-slate-400">Images, documents, PDFs</span>
                             </div>
                             <input type="file" multiple onChange={handleFileChange} className="hidden"/>
                        </label>
                    </div>
                    
                    {/* --- Visual File Preview Section --- */}
                    {attachments.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ready to Upload ({attachments.length})</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {attachments.map((f, i) => (
                                    <div key={i} className="relative group bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center gap-2 overflow-hidden hover:shadow-md transition-all">
                                        {/* If it's an image, show thumbnail */}
                                        {f.type && f.type.startsWith('image/') ? (
                                            <div className="relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden border border-slate-100">
                                                <Image src={f.url} layout="fill" objectFit="cover" alt="Preview" />
                                            </div>
                                        ) : (
                                            /* Else show generic file icon */
                                            <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-white flex items-center justify-center border border-slate-100 text-slate-400">
                                                <FileText size={20}/>
                                            </div>
                                        )}
                                        
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-slate-700 truncate" title={f.filename}>{f.filename}</p>
                                            <p className="text-[9px] text-slate-400 font-medium">Ready</p>
                                        </div>

                                        {/* Remove Button (Visual only for now since we are appending) */}
                                        <button type="button" onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 p-1 bg-white/80 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <XIcon size={12}/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && <p className="text-sm text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100 flex items-center gap-2"><AlertTriangle size={16}/>{error}</p>}
                    
                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 disabled:opacity-70 transition-all flex items-center gap-2">
                             {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                             {isSubmitting ? 'Saving...' : 'Save Task'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div> 
    );
};

const DeleteModal = ({ taskId, onClose, setTasks }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleConfirmDelete = async () => { if (!taskId) return; setIsSubmitting(true); try { const res = await fetch('/api/tasks/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId }) }); if (!res.ok) { const result = await res.json(); throw new Error(result.message); } setTasks(prev => prev.filter(t => t._id !== taskId)); toast.success('Task deleted.'); onClose(); } catch (err) { console.error(err); toast.error(err.message); } finally { setIsSubmitting(false); } };
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center border border-white/50">
                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-rose-100 mb-6 shadow-sm"><AlertTriangle className="h-7 w-7 text-rose-600" /></div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Task?</h3>
                <p className="text-sm text-slate-500 mb-8 leading-relaxed">This action cannot be undone. The task and all associated data will be permanently removed.</p>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={onClose} disabled={isSubmitting} className="w-full px-5 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                    <button onClick={handleConfirmDelete} disabled={isSubmitting} className="w-full px-5 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all">{isSubmitting ? 'Deleting...' : 'Delete'}</button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const TaskColumn = ({ title, tasks, onEdit, onDelete, onOpenDetails }) => {
    let titleColor = 'text-slate-600';
    let icon = <List size={18} />;
    let bgGradient = 'from-slate-50 to-transparent';
    
    if (title === 'To Do') { titleColor = 'text-sky-700'; icon = <Calendar size={18} />; bgGradient = 'from-sky-50 to-transparent'; }
    if (title === 'In Progress') { titleColor = 'text-amber-700'; icon = <Clock size={18} />; bgGradient = 'from-amber-50 to-transparent'; }
    if (title === 'Completed') { titleColor = 'text-emerald-700'; icon = <CheckCircle size={18} />; bgGradient = 'from-emerald-50 to-transparent'; }

    // --- RE-IMPLEMENTED DRAG & DROP LOGIC ---
    // Use SortableContext to make items sortable
    return (
        <div className="flex flex-col h-full bg-white/40 p-1.5 rounded-[1.5rem]">
            <div className={`flex items-center justify-between mb-4 p-4 rounded-2xl bg-gradient-to-b ${bgGradient} border border-white/50 shadow-sm`}>
                <h2 className={`font-extrabold text-sm flex items-center gap-2 uppercase tracking-wide ${titleColor}`}>{icon} {title}</h2>
                <span className="text-xs font-bold bg-white shadow-sm text-slate-600 px-2.5 py-1 rounded-lg border border-slate-100">{tasks.length}</span>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto pr-1 pb-2 custom-scrollbar">
                <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
                    <AnimatePresence>
                        {tasks.map((task) => (
                            <motion.div key={task._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} layout>
                                <TaskCardWrapper task={task} onEdit={onEdit} onDelete={onDelete} onOpenDetails={onOpenDetails} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </SortableContext>
            </div>
        </div>
    );
};

// Wrapper for Drag and Drop functionality
const TaskCardWrapper = ({ task, onEdit, onDelete, onOpenDetails }) => {
     const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });
     const style = { 
        transform: CSS.Transform.toString(transform), 
        transition, 
        zIndex: isDragging ? 50 : 'auto', 
        opacity: isDragging ? 0.9 : 1, 
        scale: isDragging ? 1.05 : 1,
        touchAction: 'none' // CRITICAL for mobile dragging
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} onOpenDetails={onOpenDetails} />
        </div>
    )
}

export default function PMDashboard({ pmUser, allUsers, initialTasks }) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);
  
  // New States for UI Logic
  const [showSplash, setShowSplash] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);

  // Splash Screen Logic
  useEffect(() => { const timer = setTimeout(() => setShowSplash(false), 1500); return () => clearTimeout(timer); }, []);
  // Time Logic
  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);
  // Dropdown Logic
  useEffect(() => { const h = (e) => { if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) setIsDropdownOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  
  const handleLogout = async () => {
      await fetch('/api/auth/logout');
        
      toast.success('Logged out successfully');
      setTimeout(() => {
          router.push('/login');
      }, 800); 
  };
  
  const taskColumns = useMemo(() => { 
      const columns = { 'To Do': [], 'In Progress': [], 'Completed': [] }; 
      tasks.forEach(task => { if (columns[task.status]) columns[task.status].push(task); }); 
      columns['Completed'].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
      return columns; 
  }, [tasks]);

  const openEditModal = (task) => { setEditingTask(task); setIsEditModalOpen(true); };
  const closeEditModal = () => { setIsEditModalOpen(false); setEditingTask(null); };
  const openDeleteModal = (taskId) => { setTaskToDelete(taskId); setIsDeleteModalOpen(true); };
  const closeDeleteModal = () => setIsDeleteModalOpen(false);
  const openDetailsModal = (task) => setSelectedTaskDetails(task);
  const closeDetailsModal = () => setSelectedTaskDetails(null);

  const handleCommentAdded = (taskId, newComment) => {
      const updateTask = (task) => {
          if (task._id === taskId) {
              const updatedComments = task.comments ? [...task.comments, newComment] : [newComment];
              return { ...task, comments: updatedComments };
          }
          return task;
      };
      setTasks(currentTasks => currentTasks.map(updateTask));
      setSelectedTaskDetails(currentTask => currentTask ? updateTask(currentTask) : null);
  };

  // Drag and Drop Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;
    
    let destinationStatus = null;

    // Logic to determine destination column
    for (const status in taskColumns) {
        if (taskColumns[status].some(task => task._id === over.id)) {
            destinationStatus = status;
            break;
        }
    }
    // Fallback logic could go here if dropping on empty container

    const activeTask = tasks.find(t => t._id === active.id);
    
    if (!activeTask || !destinationStatus || activeTask.status === destinationStatus) return;
    
    // Prevent moving completed tasks
    if (activeTask.status === 'Completed') {
        toast.error('Completed tasks cannot be moved.');
        return;
    }

    // Optimistic UI Update
    const originalTasks = [...tasks];
    setTasks(tasks.map(t => t._id === active.id ? { ...t, status: destinationStatus } : t));
    
    try {
        const res = await fetch('/api/tasks/update-status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId: active.id, newStatus: destinationStatus }),
        });
        
        if (!res.ok) throw new Error("Failed to update status");
        
        toast.success(`Task moved to "${destinationStatus}"`);
    } catch (err) {
        toast.error("Failed to move task.");
        // Revert on error
        setTasks(originalTasks);
    }
  };

  if (showSplash) return <AnimatePresence mode="wait"><DashboardEntryLoader key="loader" userName={pmUser.name} /></AnimatePresence>;

  return (
    <>
      <AnimatePresence>
        {isNewTaskModalOpen && <TaskFormModal mode="new" onClose={() => setIsNewTaskModalOpen(false)} allUsers={allUsers} setTasks={setTasks} />}
        {isEditModalOpen && <TaskFormModal mode="edit" taskData={editingTask} onClose={closeEditModal} allUsers={allUsers} setTasks={setTasks} />}
        {isDeleteModalOpen && <DeleteModal taskId={taskToDelete} onClose={closeDeleteModal} setTasks={setTasks} />}
        {selectedTaskDetails && <TaskDetailsModal key={selectedTaskDetails._id} task={selectedTaskDetails} onClose={closeDetailsModal} onCommentAdded={handleCommentAdded} currentUser={pmUser} />}
      </AnimatePresence>
      
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="min-h-screen bg-slate-100 font-sans text-slate-800 selection:bg-green-100 selection:text-green-800">
        
        {/* Background Blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-green-100/40 rounded-full blur-[120px] opacity-60 will-change-transform"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-100/40 rounded-full blur-[120px] opacity-60 will-change-transform"></div>
        </div>

        <div className="relative z-10 flex flex-col h-screen">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-white/50 p-4 lg:px-8 flex justify-between items-center flex-shrink-0 sticky top-0 z-40 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="flex items-center gap-3 group">
                         <div className="relative">
                              <div className="absolute inset-0 bg-green-200 blur-md rounded-full opacity-0 group-hover:opacity-50 transition-opacity"></div>
                              <Image src="/logo.png" alt="Logo" width={52} height={52} className="" />
                         </div>
                         <div>
                             <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none hidden sm:block">Command Center</h1>
                             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden sm:block">Project Manager</p>
                         </div>
                    </Link>
                </div>

                <div className="flex items-center gap-3 sm:gap-6">
                    {/* Time Pill */}
                    <div className="hidden lg:flex items-center gap-6 text-sm text-slate-600 bg-white/70 backdrop-blur-md border border-white/50 shadow-sm px-5 py-2 rounded-full">
                        <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-green-500" /><span className="font-semibold">{currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span></div>
                        <div className="h-4 w-px bg-slate-300"></div>
                        <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-green-500" /><span className="font-mono font-bold">{currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span></div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={() => setIsNewTaskModalOpen(true)} className="flex items-center gap-2 text-sm font-bold bg-green-600 text-white px-4 py-2.5 rounded-full hover:bg-green-700 shadow-lg shadow-green-200 transition-all">
                            <Plus size={18} /> <span className="hidden sm:inline">New Task</span>
                        </motion.button>
                        <Link href="/pm/attendance-report" className="p-2.5 text-slate-500 bg-white hover:bg-slate-100 hover:text-green-600 rounded-full border border-slate-200 transition-colors shadow-sm" title="Attendance">
                            <Calendar size={20} />
                        </Link>
                    </div>

                    {/* Profile Capsule - The requested "Photo called PM" design */}
                    <div ref={userDropdownRef} className="relative pl-4 border-l border-slate-200/60 ml-2">
                        <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="group flex items-center gap-3 pl-1 pr-1.5 py-1 rounded-full transition-all duration-300 hover:bg-slate-50 focus:outline-none">
                            <div className="relative">
                                <div className={`absolute inset-0 rounded-2xl bg-green-400 blur-md opacity-0 group-hover:opacity-40 transition-opacity ${isDropdownOpen ? 'opacity-40' : ''}`}></div>
                                <Image src={pmUser.avatar} alt={pmUser.name} width={42} height={42} className="rounded-full object-cover border-2 border-white relative z-10 shadow-sm" style={{ width: 'auto', height: 'auto' }}/>
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full z-20"></div>
                            </div>
                            <div className="hidden md:flex flex-col items-start text-left">
                                <span className="text-sm font-bold text-slate-800 group-hover:text-green-700 transition-colors">{pmUser.name.split(' ')[0]}</span>
                                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md mt-0.5">{pmUser.role}</span>
                            </div>
                            <div className="hidden md:flex items-center justify-center w-6 h-6 rounded-full bg-slate-50 group-hover:bg-green-50 transition-colors">
                                <ChevronDown size={14} className={`text-slate-400 group-hover:text-green-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </button>
                        
                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-full right-0 mt-4 w-60 rounded-2xl shadow-2xl bg-white/95 backdrop-blur-xl border border-white/50 z-50 origin-top-right overflow-hidden">
                                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-3">
                                        <Image src={pmUser.avatar} alt={pmUser.name} width={40} height={40} className="rounded-full object-cover" />
                                        <div className="overflow-hidden"><p className="font-bold text-slate-800 truncate">{pmUser.name}</p><p className="text-xs text-slate-500 truncate">{pmUser.email}</p></div>
                                    </div>
                                    <div className="p-2">
                                        <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-xl flex items-center gap-3 transition-colors"><LogOut size={16} /> Sign Out</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-hidden flex flex-col">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex-shrink-0 mb-4">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">{getGreeting()}, {pmUser.name.split(' ')[0]}!</h1>
                    <p className="text-slate-500 font-medium">Here's the project overview for today.</p>
                </motion.div>
                
                {/* Horizontal Scrolling Container for Kanban Board */}
                <div className="flex-1 w-full overflow-x-auto pb-4 custom-scrollbar">
                  <div className="flex gap-6 min-w-[320px] md:min-w-full h-full">
                    {/* DndContext wrapping the columns */}
                    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                        <div className="w-full md:w-1/3 min-w-[300px] h-full">
                            <TaskColumn title="To Do" tasks={taskColumns['To Do']} onEdit={openEditModal} onDelete={openDeleteModal} onOpenDetails={openDetailsModal} />
                        </div>
                        <div className="w-full md:w-1/3 min-w-[300px] h-full">
                            <TaskColumn title="In Progress" tasks={taskColumns['In Progress']} onEdit={openEditModal} onDelete={openDeleteModal} onOpenDetails={openDetailsModal} />
                        </div>
                        <div className="w-full md:w-1/3 min-w-[300px] h-full">
                            <TaskColumn title="Completed" tasks={taskColumns['Completed']} onEdit={openEditModal} onDelete={openDeleteModal} onOpenDetails={openDetailsModal} />
                        </div>
                    </DndContext>
                  </div>
                </div>
            </main>
        </div>
      </motion.div>
    </>
  );
}


export async function getServerSideProps(context) {
    const dbConnect = require('../../../lib/dbConnect').default;
    const User = require('../../../models/User').default;
    const Task = require('../../../models/Task').default;
    const jwt = require('jsonwebtoken');

    await dbConnect();
    const { token } = context.req.cookies;
    if (!token) return { redirect: { destination: '/login', permanent: false } };

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const pmUser = await User.findById(decoded.userId).select('-password').lean();

        if (!pmUser || pmUser.role !== 'Project Manager') {
            return { redirect: { destination: '/dashboard', permanent: false } };
        }
        
        const allUsers = await User.find({}).select("name role avatar email").sort({ name: 1 }).lean();
        
        const teamMemberIds = allUsers.filter(u => u.role !== 'HR' && u.role !== 'Project Manager' && u.role !== 'Finance').map(u => u._id);

        const assignedTasks = await Task.find({
            $or: [
                { assignedBy: pmUser._id },
                { assignedTo: { $in: teamMemberIds }, assignedBy: { $in: teamMemberIds } }
            ]
        })
        .populate('assignedTo', 'name avatar')
        .populate('assignedBy', 'name avatar')
        .populate('assistedBy', 'name avatar')
        .populate({ path: 'attachments.uploadedBy', select: 'name' })
        .populate({ path: 'comments.author', select: 'name avatar' })
        .sort({ 'createdAt': -1 }).lean();
        
        return { 
            props: { 
                pmUser: JSON.parse(JSON.stringify(pmUser)), 
                allUsers: JSON.parse(JSON.stringify(allUsers)), 
                initialTasks: JSON.parse(JSON.stringify(assignedTasks)) 
            } 
        };
    } catch (error) {
        console.error("Error in PM dashboard getServerSideProps:", error);
        context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        return { redirect: { destination: '/login', permanent: false } };
    }
}
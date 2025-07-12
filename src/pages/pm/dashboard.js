"use client";
import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import jwt from 'jsonwebtoken';
import Link from 'next/link'; 
import Image from 'next/image';
import { Edit, Trash2, AlertTriangle, Clock, X as XIcon, LogOut, Plus, Calendar, Paperclip, MessageSquare, CheckCircle, FileText } from 'react-feather';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

// --- Helper Functions ---
const formatDeadline = (dateString, includeTime = true) => {
  if (!dateString) return 'No deadline';
  const options = { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' };
  if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.hour12 = true;
  }
  return new Date(dateString).toLocaleString('en-US', options);
};

const getDeadlineInfo = (task) => {
  if (task.status === 'Completed' || !task.deadline) return { style: 'text-slate-500' };
  if (new Date(task.deadline) < new Date()) return { style: 'text-red-600 font-semibold' };
  return { style: 'text-slate-500' };
};

// --- Sub-Components ---
const TaskDetailsModal = ({ task, onClose }) => {
    const userAttachments = (task.attachments || []).filter(
        att => att.uploadedBy?._id.toString() === task.assignedTo?._id.toString()
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ ease: "easeOut", duration: 0.3 }} className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800">{task.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                           <CheckCircle size={16} className="text-green-600"/>
                           <span>Completed on {formatDeadline(task.completedAt, false)} by {task.assignedTo?.name}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full"><XIcon size={20} /></button>
                </div>
                <div className="overflow-y-auto pr-3 -mr-3 space-y-6">
                    {/* --- NEW: Display User's Submission Description --- */}
                    <div className="p-4 bg-emerald-50/70 rounded-lg border border-emerald-200">
                        <div className="flex items-center gap-3 mb-2">
                            <MessageSquare size={18} className="text-emerald-600" />
                            <h4 className="font-bold text-emerald-800">User's Submission Note</h4>
                        </div>
                        <p className="text-slate-700 whitespace-pre-wrap pl-1">
                            {task.submissionDescription || "No description was provided."}
                        </p>
                    </div>

                    {userAttachments.length > 0 && (
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                           <div className="flex items-center gap-3 mb-3"><Paperclip size={18} className="text-slate-600" /><h4 className="font-bold text-slate-800">Submitted Files</h4></div>
                           <div className="space-y-2">
                                {userAttachments.map(file => (
                                    <a key={file.url} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-md bg-white hover:bg-indigo-50 border border-slate-200 transition-colors">
                                        <FileText size={20} className="text-indigo-600 flex-shrink-0"/><span className="text-sm font-medium text-indigo-700 break-all">{file.filename}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

const TaskCard = ({ task, onEdit, onDelete, onOpenDetails }) => {
    const deadlineInfo = getDeadlineInfo(task);
    const isCompleted = task.status === 'Completed';
    const cardVariants = { hidden: { opacity: 0, y: 20, scale: 0.98 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } } };
    const pmAttachments = (task.attachments || []).filter(att => att.uploadedBy?._id.toString() !== task.assignedTo?._id.toString());

    return (
        <motion.div variants={cardVariants} whileHover={{ y: -3, boxShadow: "0px 10px 20px rgba(0,0,0,0.07)" }} className={`bg-white border border-slate-200/80 rounded-xl p-4 transition-all duration-300 shadow-sm group ${isCompleted ? 'cursor-pointer hover:border-green-300' : 'cursor-grab hover:border-indigo-300'}`} onClick={isCompleted ? () => onOpenDetails(task) : undefined}>
            <div className="flex justify-between items-start gap-4">
                {/* --- FIX: Removed 'line-through' class --- */}
                <h3 className={`font-bold text-slate-800 break-words ${isCompleted && 'text-slate-500'}`}>{task.title}</h3>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">{!isCompleted && <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-full" title="Edit Task"><Edit size={16} /></button>}<button onClick={(e) => { e.stopPropagation(); onDelete(task._id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-full" title="Delete Task"><Trash2 size={16} /></button></div></div>
            {!isCompleted && task.description && <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{task.description}</p>}
            <div className="mt-4 pt-4 border-t border-slate-100/80 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"><div className="flex items-center gap-2"><Image src={task.assignedTo?.avatar || '/default-avatar.png'} width={24} height={24} className="rounded-full object-cover aspect-square" alt={task.assignedTo?.name || ''} /><span className="text-xs font-medium text-slate-600">{task.assignedTo?.name || 'N/A'}</span></div><div className={`flex items-center gap-1.5 text-xs ${deadlineInfo.style}`}><Clock size={14} /><span>{formatDeadline(task.deadline)}</span></div></div>
                {pmAttachments.length > 0 && (<div><h4 className="text-xs font-bold text-slate-500 mb-2">Attachments:</h4><div className="flex flex-wrap gap-2">{pmAttachments.map(file => (<a key={file.url} href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs bg-slate-100 px-2 py-1 rounded-md hover:bg-slate-200 flex items-center gap-1.5 break-all"><Paperclip size={12}/>{file.filename}</a>))}</div></div>)}
            </div>
        </motion.div>
    );
};

const TaskFormModal = ({ mode, taskData, onClose, allUsers, setTasks }) => {
    const isEditMode = mode === 'edit';
    const formatForInput = (date) => date ? new Date(new Date(date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
    const [formData, setFormData] = useState( isEditMode ? { taskId: taskData._id, title: taskData.title, description: taskData.description || '', assignedTo: taskData.assignedTo._id, deadline: formatForInput(taskData.deadline) } : { title: '', description: '', assignedTo: allUsers.find(u => u.role !== 'HR' && u.role !== 'Project Manager')?._id || '', deadline: '' });
    const [attachments, setAttachments] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
    const handleFileChange = (e) => { const files = Array.from(e.target.files); const filePromises = files.map(file => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onloadend = () => resolve({ url: reader.result, filename: file.name }); reader.onerror = reject; reader.readAsDataURL(file); })); Promise.all(filePromises).then(newFiles => setAttachments(prev => [...prev, ...newFiles])); };
    const handleSubmit = async (e) => {
        e.preventDefault(); setIsSubmitting(true); setError('');
        try {
            const endpoint = isEditMode ? '/api/tasks/edit' : '/api/tasks/create';
            const method = isEditMode ? 'PUT' : 'POST';
            const body = { ...formData, attachments };
            const res = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            const tasksRes = await fetch('/api/tasks/pm-tasks');
            const updatedTasksData = await tasksRes.json();
            if (updatedTasksData.success) { setTasks(updatedTasksData.data); }
            toast.success(result.message || 'Task saved successfully!');
            onClose();
        } catch (err) { setError(err.message); toast.error(err.message); } finally { setIsSubmitting(false); }
    };
    return ( <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in duration-300"><div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl animate-scale-in duration-300 max-h-[90vh] flex flex-col"><div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-bold text-slate-800">{isEditMode ? 'Edit Task' : 'Assign New Task'}</h3><button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full"><XIcon size={20} /></button></div><form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto pr-2 -mr-2"><div><label>Title</label><input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-lg"/></div><div><label>Description</label><textarea name="description" value={formData.description || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg" rows="4"/></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label>Assign To</label><select name="assignedTo" value={formData.assignedTo} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-lg">{allUsers.filter(u => u.role !== 'HR' && u.role !== 'Project Manager').map(e => (<option key={e._id} value={e._id}>{e.name}</option>))}</select></div><div><label>Deadline (Date & Time)</label><input type="datetime-local" name="deadline" value={formData.deadline} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg"/></div></div><div><label className="block text-sm font-medium text-slate-600">Attach Reference Files</label><input type="file" multiple onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/></div>{attachments.length > 0 && (<div className="space-y-2"><p className="text-xs font-semibold text-slate-600">New files to attach:</p><div className="flex flex-wrap gap-2">{attachments.map((file, i) => <span key={i} className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-md">{file.filename}</span>)}</div></div>)}{error && <p className="text-sm text-red-600 mt-2">{error}</p>}<div className="mt-8 pt-4 border-t flex justify-end gap-4"><button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-200 rounded-lg">Cancel</button><button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg">{isSubmitting ? 'Saving...' : 'Save'}</button></div></form></div></div> );
};

const DeleteModal = ({ taskId, onClose, setTasks }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleConfirmDelete = async () => { if (!taskId) return; setIsSubmitting(true); try { const res = await fetch('/api/tasks/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId }) }); if (!res.ok) { const result = await res.json(); throw new Error(result.message); } setTasks(prev => prev.filter(t => t._id !== taskId)); toast.success('Task deleted.'); onClose(); } catch (err) { console.error(err); toast.error(err.message); } finally { setIsSubmitting(false); } };
    return (<div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4"><div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"><div className="flex items-start"><div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"><AlertTriangle className="h-6 w-6 text-red-600" /></div><div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left"><h3 className="text-lg font-bold text-slate-900">Delete Task</h3><p className="text-sm text-slate-500 mt-2">Are you sure? This action is permanent.</p></div></div><div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3"><button onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 rounded-lg">Cancel</button><button onClick={handleConfirmDelete} disabled={isSubmitting} className="w-full sm:w-auto px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg">{isSubmitting ? 'Deleting...' : 'Delete'}</button></div></div></div>);
};

const TaskColumn = ({ title, tasks, onEdit, onDelete, onOpenDetails }) => {
    let titleColor = 'text-slate-600';
    if (title === 'To Do') titleColor = 'text-sky-600';
    if (title === 'In Progress') titleColor = 'text-amber-600';
    if (title === 'Completed') titleColor = 'text-green-600';
    return (<div className="flex flex-col h-full bg-white/60 p-4 rounded-xl shadow-sm border border-slate-200/80"><div className="flex items-center gap-2 mb-4 px-2"><h2 className={`font-bold text-lg ${titleColor}`}>{title}</h2><span className="text-sm font-mono bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">{tasks.length}</span></div><motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.07 } } }} className="flex-1 space-y-4 overflow-y-auto pr-2 -mr-2">{tasks.map((task) => (<TaskCard key={task._id} task={task} onEdit={onEdit} onDelete={onDelete} onOpenDetails={onOpenDetails} />))}</motion.div></div>);
};

export default function PMDashboard({ pmUser, allUsers, initialTasks }) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => { setIsMounted(true); }, []);
  const handleLogout = async () => { await fetch('/api/auth/logout'); router.push('/login'); };
  const taskColumns = useMemo(() => { const columns = { 'To Do': [], 'In Progress': [], 'Completed': [] }; tasks.forEach(task => { if (columns[task.status]) columns[task.status].push(task); }); return columns; }, [tasks]);
  const openEditModal = (task) => { setEditingTask(task); setIsEditModalOpen(true); };
  const closeEditModal = () => { setIsEditModalOpen(false); setEditingTask(null); };
  const openDeleteModal = (taskId) => { setTaskToDelete(taskId); setIsDeleteModalOpen(true); };
  const closeDeleteModal = () => setIsDeleteModalOpen(false);
  const openDetailsModal = (task) => setSelectedTaskDetails(task);
  const closeDetailsModal = () => setSelectedTaskDetails(null);

  return (
    <>
      <Toaster position="top-center" />
      {isNewTaskModalOpen && <TaskFormModal mode="new" onClose={() => setIsNewTaskModalOpen(false)} allUsers={allUsers} setTasks={setTasks} />}
      {isEditModalOpen && <TaskFormModal mode="edit" taskData={editingTask} onClose={closeEditModal} allUsers={allUsers} setTasks={setTasks} />}
      {isDeleteModalOpen && <DeleteModal taskId={taskToDelete} onClose={closeDeleteModal} setTasks={setTasks} />}
      <AnimatePresence>{selectedTaskDetails && <TaskDetailsModal task={selectedTaskDetails} onClose={closeDetailsModal} />}</AnimatePresence>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
        <div className="w-full h-full absolute inset-0 bg-slate-50 overflow-hidden"><div className="absolute top-0 -left-48 w-[40rem] h-[40rem] bg-green-200/50 rounded-full filter blur-3xl opacity-40 animate-blob"></div><div className="absolute top-0 -right-48 w-[40rem] h-[40rem] bg-sky-200/50 rounded-full filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div><div className="absolute bottom-0 left-1/4 w-[40rem] h-[40rem] bg-rose-200/50 rounded-full filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div></div>
        <div className="relative z-10 flex flex-col h-screen">
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 p-4 lg:px-10 flex justify-between items-center flex-shrink-0 sticky top-0"><div className="flex items-center gap-3"><Image src="/geckoworks.png" alt="Logo" width={40} height={40} /><h1 className="text-xl font-bold text-slate-800 hidden sm:block">PM Command Center</h1></div><div className="flex items-center gap-2 sm:gap-4"><button onClick={() => setIsNewTaskModalOpen(true)} className="flex items-center gap-2 text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm transform hover:scale-105"><Plus size={16} /><span className="hidden sm:inline">New Task</span></button><Link href="/pm/attendance-report" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100"><Calendar size={16} /><span className="hidden sm:inline">Attendance</span></Link><div className="h-6 w-px bg-slate-200"></div><div className="flex items-center gap-2"><Image src={pmUser.avatar} width={36} height={36} className="rounded-full object-cover aspect-square" alt="User Avatar"/><button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors" title="Sign Out"><LogOut size={20}/></button></div></div></header>
            <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto"><motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}><h1 className="text-3xl font-bold text-slate-800">Task Board</h1><p className="text-slate-500 mt-1">Manage your project workflow with a clear overview of all tasks.</p></motion.div><div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 h-full"><TaskColumn title="To Do" tasks={taskColumns['To Do']} onEdit={openEditModal} onDelete={openDeleteModal} onOpenDetails={openDetailsModal} /><TaskColumn title="In Progress" tasks={taskColumns['In Progress']} onEdit={openEditModal} onDelete={openDeleteModal} onOpenDetails={openDetailsModal} /><TaskColumn title="Completed" tasks={taskColumns['Completed']} onEdit={openEditModal} onDelete={openDeleteModal} onOpenDetails={openDetailsModal} /></div></main>
        </div>
      </div>
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
        const pmUser = await User.findById(decoded.userId).select('-password');
        if (!pmUser || pmUser.role !== 'Project Manager') {
            return { redirect: { destination: '/dashboard', permanent: false } };
        }
        const allUsers = await User.find({}).select("name role avatar").sort({ name: 1 }).lean();
        const assignedTasks = await Task.find({ assignedBy: pmUser._id }).populate('assignedTo', 'name avatar').populate('attachments.uploadedBy', 'name').sort({ createdAt: -1 }).lean();
        return { props: { pmUser: JSON.parse(JSON.stringify(pmUser)), allUsers: JSON.parse(JSON.stringify(allUsers)), initialTasks: JSON.parse(JSON.stringify(assignedTasks)) } };
    } catch (error) {
        return { redirect: { destination: '/login', permanent: false } };
    }
}
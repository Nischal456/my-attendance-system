"use client";
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import Task from '../../../models/Task';
import Link from 'next/link'; 
import Image from 'next/image';
import { Edit, Trash2, AlertTriangle, Clock, X as XIcon, LogOut, Plus, Send, Calendar, Users, List, CheckCircle, ChevronDown, Move } from 'react-feather';

// --- Helper Functions ---
const formatEnglishDate = (dateString, includeTime = false) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  };
  if (includeTime) {
      options.hour = 'numeric';
      options.minute = '2-digit';
      options.hour12 = true;
  }
  return date.toLocaleDateString('en-US', options);
};

const formatTime = (timeString) => {
    if (!timeString || typeof timeString !== 'string') return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};
const getDeadlineInfo = (task) => {
  if (task.status === 'Completed' || !task.deadline) return { isOverdue: false, text: 'text-slate-500' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(task.deadline) < today) {
    return { isOverdue: true, text: 'text-red-600 font-semibold' };
  }
  return { isOverdue: false, text: 'text-slate-500' };
};

// --- Main Component ---
export default function PMDashboard({ pmUser, allUsers, initialTasks }) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const handleLogout = async () => { await fetch('/api/auth/logout'); router.push('/login'); };
  
  const taskColumns = useMemo(() => {
    const columns = {
        'To Do': [],
        'In Progress': [],
        'Completed': [],
    };
    tasks.forEach(task => {
        if (columns[task.status]) {
            columns[task.status].push(task);
        }
    });
    return columns;
  }, [tasks]);

  const openEditModal = (task) => { const deadlineForInput = task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : ''; setEditingTask({ ...task, assignedTo: task.assignedTo._id, deadline: deadlineForInput, startTime: task.startTime || '09:30', endTime: task.endTime || '17:30' }); setIsEditModalOpen(true); };
  const closeEditModal = () => { setIsEditModalOpen(false); setEditingTask(null); };
  const openDeleteModal = (taskId) => { setTaskToDelete(taskId); setIsDeleteModalOpen(true); };
  const closeDeleteModal = () => setIsDeleteModalOpen(false);

  return (
    <>
      {isNewTaskModalOpen && <TaskFormModal mode="new" onClose={() => setIsNewTaskModalOpen(false)} allUsers={allUsers} setTasks={setTasks} />}
      {isEditModalOpen && <TaskFormModal mode="edit" task={editingTask} onClose={closeEditModal} allUsers={allUsers} setTasks={setTasks} />}
      {isDeleteModalOpen && <DeleteModal taskId={taskToDelete} onClose={closeDeleteModal} setTasks={setTasks} />}
      
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
        <div className="w-full h-full absolute inset-0 bg-slate-50 overflow-hidden">
            <div className="absolute top-0 -left-48 w-[40rem] h-[40rem] bg-green-200/50 rounded-full filter blur-3xl opacity-40 animate-blob"></div>
            <div className="absolute top-0 -right-48 w-[40rem] h-[40rem] bg-sky-200/50 rounded-full filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/4 w-[40rem] h-[40rem] bg-rose-200/50 rounded-full filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative z-10 flex flex-col h-screen">
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 p-4 lg:px-10 flex justify-between items-center flex-shrink-0 sticky top-0">
                <div className="flex items-center gap-3">
                    <Image src="/geckoworks.png" alt="Logo" width={40} height={40} />
                    <h1 className="text-xl font-bold text-slate-800 hidden sm:block">PM Command Center</h1>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    <button onClick={() => setIsNewTaskModalOpen(true)} className="flex items-center gap-2 text-sm font-semibold bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm transform hover:scale-105">
                        <Plus size={16} />
                        <span className="hidden sm:inline">New Task</span>
                    </button>
                    <Link href="/pm/attendance-report" className="text-sm font-semibold text-slate-600 hover:text-green-600 transition-colors flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100">
                        <Calendar size={16} />
                        <span className="hidden sm:inline">Attendance</span>
                    </Link>
                    <div className="h-6 w-px bg-slate-200"></div>
                    <div className="flex items-center gap-2">
                         <Image src={pmUser.avatar} width={36} height={36} className="rounded-full object-cover" alt="User Avatar"/>
                         <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors" title="Sign Out">
                            <LogOut size={20}/>
                         </button>
                    </div>
                </div>
            </header>
            
            <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto">
                <div className={`transition-all duration-500 ease-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
                    <h1 className="text-3xl font-bold text-slate-800">Task Board</h1>
                    <p className="text-slate-500 mt-1">Manage your project workflow with a clear overview of all tasks.</p>
                </div>

                <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
                    <TaskColumn title="To Do" tasks={taskColumns['To Do']} onEdit={openEditModal} onDelete={openDeleteModal} />
                    <TaskColumn title="In Progress" tasks={taskColumns['In Progress']} onEdit={openEditModal} onDelete={openDeleteModal} />
                    <TaskColumn title="Completed" tasks={taskColumns['Completed']} onEdit={openEditModal} onDelete={openDeleteModal} />
                </div>
            </main>
        </div>
      </div>
    </>
  );
}

const TaskColumn = ({ title, tasks, onEdit, onDelete }) => {
    let titleColor = '';
    if (title === 'To Do') titleColor = 'text-sky-600';
    if (title === 'In Progress') titleColor = 'text-amber-600';
    if (title === 'Completed') titleColor = 'text-green-600';
    
    return (
        <div className="flex flex-col h-full bg-white/60 p-4 rounded-xl shadow-sm border border-slate-200/80">
            <div className="flex items-center gap-2 mb-4 px-2">
                <h2 className={`font-bold text-lg ${titleColor}`}>{title}</h2>
                <span className="text-sm font-mono bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">{tasks.length}</span>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 -mr-2">
                {tasks.map((task, index) => (
                    <TaskCard key={task._id} task={task} onEdit={onEdit} onDelete={onDelete} animationDelay={index * 100} />
                ))}
            </div>
        </div>
    )
}

const TaskCard = ({ task, onEdit, onDelete, animationDelay }) => {
    const deadlineInfo = getDeadlineInfo(task);

    return (
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 transition-all duration-300 shadow-sm hover:shadow-lg hover:border-green-300 group animate-fade-in-up" style={{ animationDelay: `${animationDelay}ms` }}>
            <div className="flex justify-between items-start gap-4">
                <h3 className="font-bold text-slate-800">{task.title}</h3>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(task)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-full"><Edit size={16} /></button>
                    <button onClick={() => onDelete(task._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>
                </div>
            </div>
            {task.description && <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{task.description}</p>}
            <div className="mt-4 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                    <Image src={task.assignedTo?.avatar || '/default-avatar.png'} width={24} height={24} className="rounded-full object-cover" alt={task.assignedTo?.name || ''} />
                    <span className="text-xs font-medium text-slate-600">{task.assignedTo?.name || 'N/A'}</span>
                </div>
                <div className={`flex items-center gap-1.5 text-xs ${deadlineInfo.text}`}>
                    <Clock size={14} />
                    <span>
                        {task.deadline ? formatEnglishDate(task.deadline, task.endTime ? true : false) : 'No deadline'}
                    </span>
                </div>
            </div>
        </div>
    )
}

const TaskFormModal = ({ mode, task, onClose, allUsers, setTasks }) => {
    const isEditMode = mode === 'edit';
    const [formData, setFormData] = useState(isEditMode ? task : {
        title: '', description: '', assignedTo: allUsers.find(u => u.role !== 'HR' && u.role !== 'Project Manager')?._id || '',
        deadline: '', startTime: '09:30', endTime: '17:30',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            const endpoint = isEditMode ? '/api/tasks/edit' : '/api/tasks/create';
            const method = isEditMode ? 'PUT' : 'POST';
            
            const body = { ...formData };
            if(body.deadline && body.endTime) {
                const deadlineDate = new Date(body.deadline);
                const [hours, minutes] = body.endTime.split(':');
                deadlineDate.setUTCHours(hours, minutes, 0, 0);
                body.deadline = deadlineDate.toISOString();
            }
            
            const res = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);

            const taskWithPopulatedUser = { ...result.data, assignedTo: allUsers.find(u => u._id === result.data.assignedTo) };

            if (isEditMode) {
                setTasks(prev => prev.map(t => (t._id === task._id ? taskWithPopulatedUser : t)));
            } else {
                setTasks(prevTasks => [taskWithPopulatedUser, ...prevTasks]);
            }
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in duration-300">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl animate-scale-in duration-300 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-slate-800">{isEditMode ? 'Edit Task' : 'Assign New Task'}</h3>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full"><XIcon size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto pr-2 -mr-2">
                    <div><label className="block text-sm font-medium text-slate-600 mb-1">Title</label><input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"/></div>
                    <div><label className="block text-sm font-medium text-slate-600 mb-1">Description</label><textarea name="description" value={formData.description || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" rows="3"/></div>
                    <div><label className="block text-sm font-medium text-slate-600 mb-1">Assign To</label><select name="assignedTo" value={formData.assignedTo} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">{allUsers.filter(u => u.role !== 'HR' && u.role !== 'Project Manager').map(e => (<option key={e._id} value={e._id}>{e.name}</option>))}</select></div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-1"><label className="block text-sm font-medium text-slate-600 mb-1">Deadline Date</label><input type="date" name="deadline" value={formData.deadline} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"/></div>
                        <div><label className="block text-sm font-medium text-slate-600 mb-1">Start Time</label><input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"/></div>
                        <div><label className="block text-sm font-medium text-slate-600 mb-1">Deadline Time</label><input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"/></div>
                    </div>
                    {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                    <div className="mt-8 pt-4 border-t border-slate-200/80 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50">
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const DeleteModal = ({ taskId, onClose, setTasks }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleConfirmDelete = async () => {
        if (!taskId) return;
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/tasks/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId }) });
            if (!res.ok) {
                const result = await res.json();
                throw new Error(result.message);
            }
            setTasks(prev => prev.filter(t => t._id !== taskId));
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in duration-300">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-scale-in duration-300">
                <div className="flex items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg font-bold text-slate-900">Delete Task</h3>
                        <p className="text-sm text-slate-500 mt-2">Are you sure? This action is permanent and cannot be undone.</p>
                    </div>
                </div>
                <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                    <button onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors">Cancel</button>
                    <button onClick={handleConfirmDelete} disabled={isSubmitting} className="w-full sm:w-auto px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-red-700 transition-colors">
                        {isSubmitting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export async function getServerSideProps(context) {
    await dbConnect();
    const { token } = context.req.cookies;
    if (!token) return { redirect: { destination: '/login', permanent: false } };
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const pmUser = await User.findById(decoded.userId).select('-password');
        if (!pmUser || pmUser.role !== 'Project Manager') {
            return { redirect: { destination: '/dashboard', permanent: false } };
        }
        const allUsers = await User.find({}).select("name role avatar").sort({ name: 1 });
        const assignedTasks = await Task.find({ assignedBy: pmUser._id }).populate('assignedTo', 'name avatar').sort({ createdAt: -1 });
        return {
            props: { 
                pmUser: JSON.parse(JSON.stringify(pmUser)),
                allUsers: JSON.parse(JSON.stringify(allUsers)),
                initialTasks: JSON.parse(JSON.stringify(assignedTasks)),
            },
        };
    } catch (error) {
        return { redirect: { destination: '/login', permanent: false } };
    }
}
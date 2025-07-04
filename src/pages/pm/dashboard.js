import { useState } from 'react';
import { useRouter } from 'next/router';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import Task from '../../../models/Task';
import Link from 'next/link'; 
import { Edit, Trash2, AlertTriangle, Clock, X as XIcon, LogOut } from 'react-feather';

// Helper function for formatting dates
const formatEnglishDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
};

// Helper function to format time in 12-hour AM/PM format
const formatTime = (timeString) => {
    if (!timeString || typeof timeString !== 'string') return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const getStatusStyle = (status) => {
  const baseStyle = { padding: '4px 12px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '600', width: '110px', textAlign: 'center' };
  switch (status) {
    case 'In Progress': return { ...baseStyle, color: '#00529B', backgroundColor: '#BDE5F8' };
    case 'Completed': return { ...baseStyle, color: '#4F8A10', backgroundColor: '#DFF2BF' };
    default: return { ...baseStyle, color: '#666', backgroundColor: '#EEE' };
  }
};

const getDeadlineStyle = (task) => {
  if (task.status === 'Completed' || !task.deadline) return 'text-gray-500';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(task.deadline) < today) {
    return 'text-red-600 font-semibold';
  }
  return 'text-gray-500';
};

// --- Main Component ---
export default function PMDashboard({ pmUser, allUsers, initialTasks }) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: allUsers.find(u => u.role !== 'HR' && u.role !== 'Project Manager')?._id || '',
    deadline: '',
    startTime: '09:30',
    endTime: '17:30',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setError(''); setIsSubmitting(true);
    try {
      const res = await fetch('/api/tasks/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      const newTaskWithPopulatedUser = { ...result.data, assignedTo: allUsers.find(u => u._id === result.data.assignedTo) };
      setTasks(prevTasks => [newTaskWithPopulatedUser, ...prevTasks]);
      setMessage(result.message);
      setFormData({ title: '', description: '', assignedTo: allUsers.find(u => u.role !== 'HR' && u.role !== 'Project Manager')?._id || '', deadline: '', startTime: '09:30', endTime: '17:30' });
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleLogout = async () => { await fetch('/api/auth/logout'); router.push('/login'); };
  const openEditModal = (task) => { const deadlineForInput = task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : ''; setEditingTask({ ...task, assignedTo: task.assignedTo._id, deadline: deadlineForInput, startTime: task.startTime || '', endTime: task.endTime || '' }); setIsEditModalOpen(true); };
  const closeEditModal = () => { setIsEditModalOpen(false); setEditingTask(null); setError(''); };
  const handleEditFormChange = (e) => { const { name, value } = e.target; setEditingTask(prev => ({...prev, [name]: value})); };
  const handleUpdateTask = async (e) => { e.preventDefault(); setIsSubmitting(true); setError(''); try { const { _id, title, description, assignedTo, deadline, startTime, endTime } = editingTask; const res = await fetch('/api/tasks/edit', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId: _id, title, description, assignedTo, deadline, startTime, endTime }) }); const result = await res.json(); if (!res.ok) throw new Error(result.message); const updatedTaskWithPopulatedUser = { ...result.data, assignedTo: allUsers.find(u => u._id === result.data.assignedTo) }; setTasks(prev => prev.map(t => (t._id === _id ? updatedTaskWithPopulatedUser : t))); closeEditModal(); } catch (err) { setError(err.message); } finally { setIsSubmitting(false); } };
  const openDeleteModal = (taskId) => { setTaskToDelete(taskId); setIsDeleteModalOpen(true); };
  const closeDeleteModal = () => setIsDeleteModalOpen(false);
  const handleConfirmDelete = async () => { if (!taskToDelete) return; setIsSubmitting(true); setError(''); try { const res = await fetch('/api/tasks/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId: taskToDelete }) }); const result = await res.json(); if (!res.ok) throw new Error(result.message); setTasks(prev => prev.filter(t => t._id !== taskToDelete)); closeDeleteModal(); } catch (err) { setError(err.message); } finally { setIsSubmitting(false); } };

  return (
    <>
      {isTimeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm animate-fade-in-up">
            <h3 className="text-xl font-semibold mb-6">Set Task Time</h3>
            <div className="space-y-4"><div><label htmlFor="modalStartTime" className="block text-sm font-medium text-gray-700 mb-1">Start Time</label><input type="time" id="modalStartTime" name="startTime" value={formData.startTime} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm"/></div><div><label htmlFor="modalEndTime" className="block text-sm font-medium text-gray-700 mb-1">End Time</label><input type="time" id="modalEndTime" name="endTime" value={formData.endTime} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm"/></div></div>
            <div className="mt-6 flex justify-end"><button type="button" onClick={() => setIsTimeModalOpen(false)} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg">Done</button></div>
          </div>
        </div>
      )}
      {isEditModalOpen && editingTask && (<div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"><div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg animate-fade-in-up"><h3 className="text-xl font-semibold mb-4">Edit Task</h3><form onSubmit={handleUpdateTask} className="space-y-4"><div><label>Title</label><input type="text" name="title" value={editingTask.title} onChange={handleEditFormChange} required className="w-full mt-1 p-2 border rounded-md"/></div><div><label>Description</label><textarea name="description" value={editingTask.description || ''} onChange={handleEditFormChange} className="w-full mt-1 p-2 border rounded-md" rows="3"/></div><div><label>Assign To</label><select name="assignedTo" value={editingTask.assignedTo} onChange={handleEditFormChange} required className="w-full mt-1 p-2 border rounded-md">{allUsers.filter(u => u.role !== 'HR' && u.role !== 'Project Manager').map(e => (<option key={e._id} value={e._id}>{e.name}</option>))}</select></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><div className="sm:col-span-1"><label>Deadline</label><input type="date" name="deadline" value={editingTask.deadline} onChange={handleEditFormChange} className="w-full mt-1 p-2 border rounded-md"/></div><div><label>Start Time</label><input type="time" name="startTime" value={editingTask.startTime} onChange={handleEditFormChange} className="w-full mt-1 p-2 border rounded-md"/></div><div><label>End Time</label><input type="time" name="endTime" value={editingTask.endTime} onChange={handleEditFormChange} className="w-full mt-1 p-2 border rounded-md"/></div></div>{error && <p className="text-sm text-red-600 mt-2">{error}</p>}<div className="mt-6 flex justify-end gap-4"><button type="button" onClick={closeEditModal} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button><button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md">{isSubmitting ? 'Saving...' : 'Save'}</button></div></form></div></div>)}
      {isDeleteModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"><div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md animate-fade-in-up"><div className="flex items-start"><div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"><AlertTriangle className="h-6 w-6 text-red-600" /></div><div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left"><h3 className="text-lg font-medium text-gray-900">Delete Task</h3><p className="text-sm text-gray-500 mt-2">Are you sure? This action is permanent.</p></div></div><div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse"><button onClick={handleConfirmDelete} disabled={isSubmitting} className="w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm">{isSubmitting ? 'Deleting...' : 'Delete'}</button><button onClick={closeDeleteModal} disabled={isSubmitting} className="mt-3 w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 bg-white text-base font-medium sm:mt-0 sm:w-auto sm:text-sm">Cancel</button></div></div></div>)}
      
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div><h1 className="text-3xl font-bold text-gray-800">Project Manager Dashboard</h1><p className="text-gray-600 mt-1">Welcome, <span className="font-semibold text-indigo-600">{pmUser.name}</span></p></div>
            <div className="flex items-center gap-4 mt-4 md:mt-0"><Link href="/pm/attendance-report" legacyBehavior><a className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm">Attendance Report</a></Link><button onClick={handleLogout} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg shadow-sm flex items-center gap-1"><LogOut size={16}/>Logout</button></div>
          </div>
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Assign a New Task</h2>
              {message && <p className="text-green-600 bg-green-100 p-3 rounded-md my-2">{message}</p>}
              {error && <p className="text-red-500 bg-red-100 p-3 rounded-md my-2">{error}</p>}
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">Assign To <span className="text-red-500">*</span></label><select id="assignedTo" name="assignedTo" value={formData.assignedTo} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm">{allUsers.filter(u => u.role !== 'HR' && u.role !== 'Project Manager').map(e => (<option key={e._id} value={e._id}>{e.name} ({e.role})</option>))}</select></div>
                  <div><label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Task Title <span className="text-red-500">*</span></label><input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm"/></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div><label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">Deadline</label><input type="date" id="deadline" name="deadline" value={formData.deadline} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm"/></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label><div className="flex items-center gap-2 mt-1 p-2 border border-gray-300 rounded-lg bg-gray-50"><Clock size={16} className="text-gray-500"/><span className="font-mono text-gray-800">{formatTime(formData.startTime) || 'Not set'} - {formatTime(formData.endTime) || 'Not set'}</span><button type="button" onClick={() => setIsTimeModalOpen(true)} className="ml-auto text-sm text-indigo-600 hover:underline font-semibold">Set Time</button></div></div>
                </div>
                <div><label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm"/></div>
                <div className="flex justify-end"><button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-60">{isSubmitting ? 'Assigning...':'Assign Task'}</button></div>
              </form>
            </div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-6"><h2 className="text-xl font-semibold">Task Monitoring</h2></div>
              <div className="overflow-x-auto"><table className="min-w-full divide-y"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium uppercase">Task / Assigned To</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">Dates & Times</th><th className="px-6 py-3 text-center text-xs font-medium uppercase">Actions</th></tr></thead><tbody className="divide-y">{tasks.map(task => (<tr key={task._id}><td className="px-6 py-4"><div className="font-medium">{task.title}</div><div className="text-xs text-gray-500">{task.assignedTo?.name || 'N/A'}</div></td><td className="px-6 py-4"><span style={getStatusStyle(task.status)}>{task.status}</span></td><td className="px-6 py-4"><div className={`text-sm ${getDeadlineStyle(task)}`}>{task.deadline ? formatEnglishDate(task.deadline) : 'No deadline'}</div><div className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Clock size={12}/>{task.startTime && task.endTime ? `${formatTime(task.startTime)} - ${formatTime(task.endTime)}` : 'All day'}</div></td><td className="px-6 py-4 text-center"><div className="flex justify-center gap-4"><button onClick={() => openEditModal(task)} className="text-blue-600"><Edit size={18} /></button><button onClick={() => openDeleteModal(task._id)} className="text-red-600"><Trash2 size={18} /></button></div></td></tr>))}{tasks.length === 0 && (<tr><td colSpan="4" className="px-6 py-8 text-center">No tasks assigned yet.</td></tr>)}</tbody></table></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

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
        const allUsers = await User.find({}).select("name role").sort({ name: 1 });
        const assignedTasks = await Task.find({ assignedBy: pmUser._id }).populate('assignedTo', 'name').sort({ createdAt: -1 });
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
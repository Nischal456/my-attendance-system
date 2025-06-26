import { useState } from 'react';
import { useRouter } from 'next/router';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import Task from '../../../models/Task';
import Link from 'next/link'; 
import { Edit, Trash2, AlertTriangle } from 'react-feather';

// --- NEW: A reliable helper function for standard English dates ---
const formatEnglishDate = (dateString) => {
  if (!dateString) return '-';
  // This robustly handles date strings from the database or inputs
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC', // Ensures date is not shifted by timezone
  });
};

const getStatusStyle = (status) => {
  const baseStyle = { padding: '4px 12px', borderRadius: '16px', fontSize: '0.85em', fontWeight: 'bold', width: '110px', textAlign: 'center' };
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
    return 'text-red-600 font-semibold'; // Overdue
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
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      
      const newTaskFromApi = result.data;
      const newTaskWithPopulatedUser = { ...newTaskFromApi, assignedTo: allUsers.find(u => u._id === newTaskFromApi.assignedTo) };
      setTasks(prevTasks => [newTaskWithPopulatedUser, ...prevTasks]);
      setMessage(`Success! Task '${formData.title}' assigned.`);
      setFormData({ ...formData, title: '', description: '', deadline: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleLogout = async () => {
    await fetch('/api/auth/logout');
    router.push('/login');
  };

  const openEditModal = (task) => {
    const deadlineForInput = task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '';
    setEditingTask({ ...task, assignedTo: task.assignedTo._id, deadline: deadlineForInput });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTask(null);
    setError('');
  };
  
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditingTask(prev => ({...prev, [name]: value}));
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const { _id, title, description, assignedTo, deadline } = editingTask;
      const res = await fetch('/api/tasks/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: _id, title, description, assignedTo, deadline }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      setTasks(prev => prev.map(t => (t._id === _id ? result.data : t)));
      closeEditModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (taskId) => {
    setTaskToDelete(taskId);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => setIsDeleteModalOpen(false);

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/tasks/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: taskToDelete }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      setTasks(prev => prev.filter(t => t._id !== taskToDelete));
      closeDeleteModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Edit Task Modal */}
      {isEditModalOpen && editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg animate-fade-in-up">
            <h3 className="text-xl font-semibold mb-4">Edit Task</h3>
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700">Title</label><input type="text" name="title" value={editingTask.title} onChange={handleEditFormChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm"/></div>
              <div><label className="block text-sm font-medium text-gray-700">Description</label><textarea name="description" value={editingTask.description || ''} onChange={handleEditFormChange} className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm" rows="3"/></div>
              <div><label className="block text-sm font-medium text-gray-700">Assign To</label><select name="assignedTo" value={editingTask.assignedTo} onChange={handleEditFormChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm">{allUsers.filter(u => u.role !== 'HR' && u.role !== 'Project Manager').map(employee => (<option key={employee._id} value={employee._id}>{employee.name}</option>))}</select></div>
              <div><label className="block text-sm font-medium text-gray-700">Deadline</label><input type="date" name="deadline" value={editingTask.deadline} onChange={handleEditFormChange} className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm"/></div>
              {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
              <div className="mt-6 flex justify-end gap-4"><button type="button" onClick={closeEditModal} disabled={isSubmitting} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button><button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Save Changes'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md animate-fade-in-up">
            <div className="flex items-start"><div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"><AlertTriangle className="h-6 w-6 text-red-600" /></div><div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left"><h3 className="text-lg font-medium text-gray-900">Delete Task</h3><p className="text-sm text-gray-500 mt-2">Are you sure? This action is permanent.</p></div></div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse"><button onClick={handleConfirmDelete} disabled={isSubmitting} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">{isSubmitting ? 'Deleting...' : 'Confirm Delete'}</button><button onClick={closeDeleteModal} disabled={isSubmitting} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">Cancel</button></div>
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div><h1 className="text-3xl font-bold text-gray-800">Project Manager Dashboard</h1><p className="text-gray-600 mt-1">Welcome, <span className="font-semibold text-[#2ac759]">{pmUser.name}</span> ({pmUser.role})</p></div>
            <div className="flex items-center gap-4 mt-4 md:mt-0"><Link href="/pm/attendance-report"><button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm">View Attendance Report</button></Link><button onClick={handleLogout} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg shadow-sm">Logout</button></div>
          </div>
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Assign a New Task</h2>
              {error && <p className="text-red-500 bg-red-100 p-3 rounded-md my-2">{error}</p>}
              {message && <p className="text-green-500 bg-green-100 p-3 rounded-md my-2">{message}</p>}
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">Assign To <span className="text-red-500">*</span></label><select id="assignedTo" name="assignedTo" value={formData.assignedTo} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2ac759]">{allUsers.filter(u => u.role !== 'HR' && u.role !== 'Project Manager').map(employee => (<option key={employee._id} value={employee._id}>{employee.name} ({employee.role})</option>))}</select></div>
                  <div><label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Task Title <span className="text-red-500">*</span></label><input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm"/></div>
                </div>
                <div><label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">Deadline (Optional)</label><input type="date" id="deadline" name="deadline" value={formData.deadline} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm"/></div>
                <div><label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm"/></div>
                <div className="flex justify-end"><button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-[#2ac759] hover:bg-[#25b04f] text-white font-bold rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-60">{isSubmitting ? 'Assigning...':'Assign Task'}</button></div>
              </form>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6"><h2 className="text-xl font-semibold text-gray-800">Task Monitoring</h2></div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task / Assigned To</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Assigned</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map(task => (<tr key={task._id} className="hover:bg-gray-50"><td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{task.title}</div><div className="text-xs text-gray-500">{task.assignedTo?.name || 'N/A'}</div></td><td className="px-6 py-4 whitespace-nowrap"><span style={getStatusStyle(task.status)}>{task.status}</span></td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatEnglishDate(task.createdAt)}</td><td className={`px-6 py-4 whitespace-nowrap text-sm ${getDeadlineStyle(task)}`}>{task.deadline ? formatEnglishDate(task.deadline) : '-'}</td><td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium"><div className="flex justify-center gap-4"><button onClick={() => openEditModal(task)} className="text-blue-600 hover:text-blue-900" title="Edit Task"><Edit size={18} /></button><button onClick={() => openDeleteModal(task._id)} className="text-red-600 hover:text-red-900" title="Delete Task"><Trash2 size={18} /></button></div></td></tr>))}
                    {tasks.length === 0 && (<tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">You have not assigned any tasks yet.</td></tr>)}
                  </tbody>
                </table>
              </div>
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
        const allUsers = await User.find({}).sort({ name: 1 });
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
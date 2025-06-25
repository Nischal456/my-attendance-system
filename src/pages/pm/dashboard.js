import { useState } from 'react';
import { useRouter } from 'next/router';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import Task from '../../../models/Task';
import NepaliDate from 'nepali-date-converter';

const toNepaliDate = (gregorianDate) => {
  if (!gregorianDate) return '-';
  const nepaliDate = new NepaliDate(new Date(gregorianDate));
  return nepaliDate.format('DD MMMM, YYYY');
};

const getStatusStyle = (status) => {
  const baseStyle = { 
    padding: '4px 12px', 
    borderRadius: '16px', 
    fontSize: '0.85em', 
    fontWeight: 'bold', 
    width: '110px',
    textAlign: 'center' 
  };
  switch (status) {
    case 'In Progress':
      return { ...baseStyle, color: '#00529B', backgroundColor: '#BDE5F8' };
    case 'Completed':
      return { ...baseStyle, color: '#4F8A10', backgroundColor: '#DFF2BF' };
    case 'To Do':
    default:
      return { ...baseStyle, color: '#666', backgroundColor: '#EEE' };
  }
};

export default function PMDashboard({ pmUser, allUsers, initialTasks }) {
  const router = useRouter();
  
  const [tasks, setTasks] = useState(initialTasks);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: allUsers.find(u => u.role !== 'HR' && u.role !== 'Project Manager')?._id || '',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      
      const newTaskWithPopulatedUser = {
        ...result.data,
        assignedTo: allUsers.find(u => u._id === result.data.assignedTo)
      };
      setTasks(prevTasks => [newTaskWithPopulatedUser, ...prevTasks]);
      
      setMessage(`Success! Task '${formData.title}' assigned.`);
      setFormData({ ...formData, title: '', description: '' }); 

    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleLogout = async () => {
    await fetch('/api/auth/logout');
    router.push('/login');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: 'auto' }}>
      <h1>Project Manager Dashboard</h1>
      <p>Welcome, {pmUser.name}</p>
      <button onClick={handleLogout} style={{marginBottom: '20px'}}>Logout</button>
      <hr />

      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h2>Assign a New Task</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="assignedTo" style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Assign To</label>
            <select id="assignedTo" name="assignedTo" value={formData.assignedTo} onChange={handleChange} required style={{ width: '100%', padding: '8px' }}>
              {allUsers
                .filter(u => u.role !== 'HR' && u.role !== 'Project Manager')
                .map(employee => (
                  <option key={employee._id} value={employee._id}>{employee.name} ({employee.role})</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="title" style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Task Title</label>
            <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="description" style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Description (Optional)</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="3" style={{ width: '100%', padding: '8px' }} />
          </div>
          <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>Assign Task</button>
          {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
          {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        </form>
      </div>

      <h2>Task Monitoring</h2>
      <table style={{width: "100%", borderCollapse: 'collapse', marginTop: '20px'}}>
        <thead>
          <tr style={{background: '#f2f2f2'}}>
            <th style={{padding: '12px', border: '1px solid #ddd', textAlign: 'left'}}>Task Title</th>
            <th style={{padding: '12px', border: '1px solid #ddd', textAlign: 'left'}}>Assigned To</th>
            <th style={{padding: '12px', border: '1px solid #ddd', textAlign: 'left'}}>Status</th>
            <th style={{padding: '12px', border: '1px solid #ddd', textAlign: 'left'}}>Date Assigned</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <tr key={task._id}>
              <td style={{padding: '12px', border: '1px solid #ddd'}}>{task.title}</td>
              <td style={{padding: '12px', border: '1px solid #ddd'}}>{task.assignedTo?.name || 'User Not Found'}</td>
              <td style={{padding: '12px', border: '1px solid #ddd'}}><span style={getStatusStyle(task.status)}>{task.status}</span></td>
              {/* --- MODIFIED: Using the toNepaliDate function --- */}
              <td style={{padding: '12px', border: '1px solid #ddd'}}>{toNepaliDate(task.createdAt)}</td>
            </tr>
          ))}
           {tasks.length === 0 && (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>You have not assigned any tasks yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Fetches all the necessary data and secures the page before it loads
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

    const assignedTasks = await Task.find({ assignedBy: pmUser._id })
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 });

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
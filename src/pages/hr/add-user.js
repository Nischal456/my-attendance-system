// pages/hr/add-user.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';

export default function AddUserPage({ user }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Staff',
    phoneNumber: '', 
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // --- CORRECTED: Full function logic is now included ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      setMessage(`Success! User '${formData.name}' created. Redirecting to HR dashboard...`);
      setFormData({ name: '', email: '', password: '', role: 'Staff', phoneNumber: '' });
      
      setTimeout(() => {
        router.push('/hr/dashboard');
      }, 2000);

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <Link href="/hr/dashboard">← Back to HR Dashboard</Link>
      <h1>Add New Employee</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
            <label htmlFor="name">Full Name</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
            <label htmlFor="password">Initial Password</label>
            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="phoneNumber">Phone Number (Optional)</label>
          <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="role">Role</label>
          <select id="role" name="role" value={formData.role} onChange={handleChange} required style={{ width: '100%', padding: '8px' }}>
            <option value="Staff">Staff</option>
            <option value="Intern">Intern</option>
            <option value="Manager">Manager</option>
          </select>
        </div>
        <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>Create User</button>
      </form>
      {message && <p style={{ color: 'green', marginTop: '15px' }}>{message}</p>}
      {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}
    </div>
  );
}

// --- SECURITY: This getServerSideProps function remains unchanged ---
export async function getServerSideProps(context) {
  await dbConnect();
  const { token } = context.req.cookies;
  if (!token) return { redirect: { destination: '/login', permanent: false } };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || user.role !== 'HR') {
      return { redirect: { destination: '/dashboard', permanent: false } };
    }
    
    return {
      props: { 
        user: JSON.parse(JSON.stringify(user)),
      },
    };
  } catch (error) {
    return { redirect: { destination: '/login', permanent: false } };
  }
}

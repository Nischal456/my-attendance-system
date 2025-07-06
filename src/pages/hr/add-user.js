import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import Image from 'next/image';
import { ArrowLeft, UserPlus, AlertTriangle, CheckCircle } from 'react-feather'; // FIX: Added AlertTriangle

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
      const res = await fetch('/api/hr/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      setMessage(`Success! User '${formData.name}' created.`);
      setFormData({ name: '', email: '', password: '', role: 'Staff', phoneNumber: '' });
      
      setTimeout(() => {
        setMessage('');
      }, 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <Link href="/hr/dashboard" legacyBehavior>
                <a className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold">
                    <ArrowLeft size={16} />
                    Back to HR Dashboard
                </a>
            </Link>
        </div>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-8">
                <h1 className="text-2xl font-bold text-gray-900">Create New User Account</h1>
                <p className="mt-1 text-sm text-gray-500">This will create a new user and allow them to log in to the system.</p>
                
                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address <span className="text-red-500">*</span></label>
                            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Initial Password <span className="text-red-500">*</span></label>
                            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number (Optional)</label>
                            <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role <span className="text-red-500">*</span></label>
                            <select id="role" name="role" value={formData.role} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                <option value="Staff">Staff</option>
                                <option value="Intern">Intern</option>
                                <option value="Manager">Manager</option>
                                <option value="Project Manager">Project Manager</option>
                                <option value="Finance">Finance</option>
                                <option value="HR">HR</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-5">
                        <div className="flex justify-end">
                            <button type="submit" disabled={isSubmitting} className={`inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                {isSubmitting ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </div>
                </form>

                {message && (
                    <div className="mt-6 p-4 bg-green-50 text-green-800 rounded-md border border-green-200 flex items-center gap-3">
                        <CheckCircle className="h-5 w-5"/>
                        <span>{message}</span>
                    </div>
                )}
                {error && (
                    <div className="mt-6 p-4 bg-red-50 text-red-800 rounded-md border border-red-200 flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5"/>
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

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
        return { props: { user: JSON.parse(JSON.stringify(user)) } };
    } catch (error) {
        return { redirect: { destination: '/login', permanent: false } };
    }
}
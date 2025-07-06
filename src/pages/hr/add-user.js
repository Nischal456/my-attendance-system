"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import { ArrowLeft, User as UserIcon, Mail, Lock, Phone, Briefcase, Shield, UserPlus, AlertTriangle, CheckCircle, Loader } from 'react-feather';

// --- Reusable Form Field Component ---
const FormField = ({ id, label, type, name, value, onChange, required, icon, placeholder }) => (
    <div className="relative">
        <label htmlFor={id} className="block text-sm font-semibold text-slate-600 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                {icon}
            </div>
            <input 
                type={type} 
                id={id} 
                name={name} 
                value={value} 
                onChange={onChange} 
                required={required}
                placeholder={placeholder}
                className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/80 focus:border-transparent transition"
            />
        </div>
    </div>
);

// --- Reusable Role Selection Card ---
const RoleCard = ({ label, icon, value, selectedValue, onSelect }) => {
    const isSelected = value === selectedValue;
    return (
        <button
            type="button"
            onClick={() => onSelect(value)}
            className={`group w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-4 ${
                isSelected 
                ? 'bg-green-50 border-green-500 shadow-md' 
                : 'bg-slate-50/80 border-slate-200 hover:border-green-400'
            }`}
        >
            <div className={`p-3 rounded-full transition-all duration-200 ${
                isSelected ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500 group-hover:bg-green-100 group-hover:text-green-600'
            }`}>
                {icon}
            </div>
            <span className={`font-bold text-md transition-colors duration-200 ${
                isSelected ? 'text-green-800' : 'text-slate-700'
            }`}>
                {label}
            </span>
        </button>
    );
};


export default function AddUserPage() {
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      
      setMessage(`Success! User '${formData.name}' has been created.`);
      setFormData({ name: '', email: '', password: '', role: 'Staff', phoneNumber: '' });
      
      setTimeout(() => {
        setMessage('');
      }, 4000);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white/80 backdrop-blur-xl shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto py-5 px-4 sm:px-6 lg:px-8">
            <Link href="/hr/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 mb-2 transition-colors">
                <ArrowLeft size={16} />
                Back to HR Dashboard
            </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Add New Employee</h1>
          <p className="text-slate-500 mt-1">Create a new user account and assign them a role in the system.</p>
        </div>
      </header>

      <main className="py-10">
        <div className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-500 ease-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <FormField id="name" label="Full Name" type="text" name="name" value={formData.name} onChange={handleChange} required icon={<UserIcon size={20} />} placeholder="e.g., Nischal Shrestha" />
                        <FormField id="email" label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} required icon={<Mail size={20} />} placeholder="e.g., nischal@example.com" />
                        <FormField id="password" label="Initial Password" type="password" name="password" value={formData.password} onChange={handleChange} required icon={<Lock size={20} />} placeholder="Min. 8 characters" />
                        <FormField id="phoneNumber" label="Phone Number" type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} icon={<Phone size={20} />} placeholder="(Optional)" />
                    </div>

                    <div>
                        <label className="block text-md font-semibold text-slate-800 mb-3">Assign Role <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <RoleCard label="Staff" icon={<UserIcon size={22} />} value="Staff" selectedValue={formData.role} onSelect={(v) => setFormData({...formData, role: v})} />
                            <RoleCard label="Intern" icon={<UserIcon size={22} />} value="Intern" selectedValue={formData.role} onSelect={(v) => setFormData({...formData, role: v})} />
                            <RoleCard label="Manager" icon={<Briefcase size={22} />} value="Manager" selectedValue={formData.role} onSelect={(v) => setFormData({...formData, role: v})} />
                            <RoleCard label="Project Manager" icon={<Briefcase size={22} />} value="Project Manager" selectedValue={formData.role} onSelect={(v) => setFormData({...formData, role: v})} />
                            <RoleCard label="Finance" icon={<Briefcase size={22} />} value="Finance" selectedValue={formData.role} onSelect={(v) => setFormData({...formData, role: v})} />
                            <RoleCard label="HR Admin" icon={<Shield size={22} />} value="HR" selectedValue={formData.role} onSelect={(v) => setFormData({...formData, role: v})} />
                        </div>
                    </div>

                    {message && (
                        <div className="p-4 bg-green-50 text-green-800 rounded-lg border border-green-200 flex items-center gap-3 animate-fade-in-up">
                            <CheckCircle className="h-5 w-5"/>
                            <span className="font-medium">{message}</span>
                        </div>
                    )}
                    {error && (
                        <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200 flex items-center gap-3 animate-fade-in-up">
                            <AlertTriangle className="h-5 w-5"/>
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    <div className="pt-5 flex justify-end">
                        <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-3 px-8 border border-transparent shadow-lg shadow-green-500/20 text-sm font-bold rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all transform hover:scale-105">
                            {isSubmitting ? <Loader className="animate-spin h-5 w-5" /> : 'Create User Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      </main> {/* <-- This was the missing closing tag */}
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
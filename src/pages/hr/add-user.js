"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import { ArrowLeft, User as UserIcon, Mail, Lock, Phone, Briefcase, Shield, AlertTriangle, CheckCircle, Loader, DollarSign } from 'react-feather';
import { motion, AnimatePresence } from 'framer-motion';

// --- Reusable Form Field Component (Memoized for Speed) ---
const FormField = ({ id, label, type, name, value, onChange, required, icon, placeholder }) => (
    <div className="relative group">
        <label htmlFor={id} className="block text-sm font-bold text-slate-700 mb-1.5 transition-colors group-focus-within:text-emerald-600">
            {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-200">
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
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 shadow-sm hover:border-slate-300"
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
            className={`relative group w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-4 overflow-hidden ${
                isSelected 
                ? 'bg-emerald-50 border-emerald-500 shadow-md ring-1 ring-emerald-500/20' 
                : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:-translate-y-0.5'
            }`}
        >
            <div className={`p-3 rounded-full transition-all duration-200 relative z-10 ${
                isSelected ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600'
            }`}>
                {icon}
            </div>
            <div className="relative z-10">
                <span className={`font-bold text-sm block transition-colors duration-200 ${
                    isSelected ? 'text-emerald-900' : 'text-slate-700 group-hover:text-emerald-900'
                }`}>
                    {label}
                </span>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`}>
                    Role
                </span>
            </div>
            {/* Background Decor */}
            {isSelected && <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-emerald-100/50 to-transparent pointer-events-none"></div>}
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

    // Simulate smoother interaction delay if fast network
    await new Promise(r => setTimeout(r, 600));

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
      
      // Auto-dismiss success message
      setTimeout(() => setMessage(''), 5000);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* --- Header --- */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-30 transition-all">
        <div className="max-w-5xl mx-auto py-5 px-6">
            <Link href="/hr/dashboard" className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-600 mb-3 transition-colors">
                <div className="p-1 rounded-lg bg-slate-100 group-hover:bg-emerald-50 transition-colors">
                    <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform"/>
                </div>
                Back to Dashboard
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Onboard New Employee</h1>
                    <p className="text-slate-500 font-medium mt-1">Create a secure account and assign system access.</p>
                </div>
                {/* Visual Indicator Step */}
                <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">System Active</span>
                </div>
            </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="py-10 px-4 sm:px-6">
        <div className={`max-w-5xl mx-auto transition-all duration-700 ease-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white/50 p-8 sm:p-10 relative overflow-hidden"
            >
                {/* Decorative Top Border */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400"></div>

                <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
                    
                    {/* Section 1: Personal Info */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">01</span>
                            Personal Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <FormField id="name" label="Full Name" type="text" name="name" value={formData.name} onChange={handleChange} required icon={<UserIcon size={18} />} placeholder="e.g. Nischal Shrestha" />
                            <FormField id="email" label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} required icon={<Mail size={18} />} placeholder="e.g. nischal@company.com" />
                            <FormField id="phoneNumber" label="Phone Number" type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} icon={<Phone size={18} />} placeholder="+977 9800000000" />
                            <FormField id="password" label="Temporary Password" type="text" name="password" value={formData.password} onChange={handleChange} required icon={<Lock size={18} />} placeholder="Strong password (min 8 chars)" />
                        </div>
                    </div>

                    {/* Section 2: Role Assignment */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">02</span>
                            System Role & Access
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <RoleCard label="Staff" icon={<UserIcon size={20} />} value="Staff" selectedValue={formData.role} onSelect={(v) => setFormData({...formData, role: v})} />
                            <RoleCard label="Intern" icon={<UserIcon size={20} />} value="Intern" selectedValue={formData.role} onSelect={(v) => setFormData({...formData, role: v})} />
                            <RoleCard label="Manager" icon={<Briefcase size={20} />} value="Manager" selectedValue={formData.role} onSelect={(v) => setFormData({...formData, role: v})} />
                            <RoleCard label="Project Manager" icon={<Briefcase size={20} />} value="Project Manager" selectedValue={formData.role} onSelect={(v) => setFormData({...formData, role: v})} />
                            <RoleCard label="Finance" icon={<DollarSign size={20} />} value="Finance" selectedValue={formData.role} onSelect={(v) => setFormData({...formData, role: v})} />
                            <RoleCard label="HR Admin" icon={<Shield size={20} />} value="HR" selectedValue={formData.role} onSelect={(v) => setFormData({...formData, role: v})} />
                        </div>
                    </div>

                    {/* Feedback Messages */}
                    <AnimatePresence>
                        {message && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center gap-3">
                                <div className="p-1 bg-emerald-100 rounded-full"><CheckCircle size={18} className="text-emerald-600"/></div>
                                <span className="font-semibold">{message}</span>
                            </motion.div>
                        )}
                        {error && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 flex items-center gap-3">
                                <div className="p-1 bg-rose-100 rounded-full"><AlertTriangle size={18} className="text-rose-600"/></div>
                                <span className="font-semibold">{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Action Buttons */}
                    <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:justify-end gap-4">
                        <Link href="/hr/dashboard" className="px-6 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all text-center">
                            Cancel
                        </Link>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="inline-flex justify-center items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
                        >
                            {isSubmitting ? <Loader className="animate-spin h-5 w-5" /> : 'Create Account'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
      </main>
    </div>
  );
}

// --- Server Side Props (Authentication Check) ---
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
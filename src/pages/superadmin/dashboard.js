import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Shield, Users, Search, Loader, AlertTriangle, CheckCircle, ChevronDown } from 'react-feather';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';

export default function SuperAdminDashboard({ superAdminUser, allUsers }) {
    const router = useRouter();
    const [users, setUsers] = useState(allUsers);
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingUserId, setUpdatingUserId] = useState(null);
    const [openDropdownId, setOpenDropdownId] = useState(null);

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAccessToggle = async (user, targetAccessRole) => {
        if (updatingUserId) return;
        setUpdatingUserId(user._id);

        let currentAccessRoles = user.accessRoles || [];

        // Toggle Logic
        if (currentAccessRoles.includes(targetAccessRole)) {
            currentAccessRoles = currentAccessRoles.filter(r => r !== targetAccessRole);
        } else {
            currentAccessRoles = [...currentAccessRoles, targetAccessRole];
        }

        try {
            const res = await fetch('/api/superadmin/update-role', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user._id, accessRoles: currentAccessRoles })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message);

            setUsers(prev => prev.map(u => u._id === user._id ? { ...u, accessRoles: currentAccessRoles } : u));
            toast.success('Access rights updated.');
        } catch (error) {
            toast.error(error.message || "Failed to update access");
        } finally {
            setUpdatingUserId(null);
        }
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'Superadmin': return 'bg-rose-100 text-rose-700 border-rose-200 ring-rose-500/20 shadow-rose-100';
            case 'HR': return 'bg-indigo-100 text-indigo-700 border-indigo-200 ring-indigo-500/20 shadow-indigo-100';
            case 'Finance': return 'bg-amber-100 text-amber-700 border-amber-200 ring-amber-500/20 shadow-amber-100';
            case 'Project Manager': return 'bg-blue-100 text-blue-700 border-blue-200 ring-blue-500/20 shadow-blue-100';
            case 'Manager': return 'bg-purple-100 text-purple-700 border-purple-200 ring-purple-500/20 shadow-purple-100';
            default: return 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/20 shadow-slate-100';
        }
    };

    const getAccessColor = (roleId, hasAccess, isPrimary) => {
        const base = "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ";
        const cursor = isPrimary ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-0.5 active:translate-y-0 shadow-sm hover:shadow-md";
        if (!hasAccess) return base + "bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600 hover:border-slate-300 " + cursor;

        switch (roleId) {
            case 'HR': return base + "bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-500/20 " + cursor;
            case 'Project Manager': return base + "bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/20 " + cursor;
            case 'Finance': return base + "bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/20 " + cursor;
            case 'Superadmin': return base + "bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/20 " + cursor;
            case 'Expense Manager': return base + "bg-teal-50 text-teal-700 border-teal-200 ring-1 ring-teal-500/20 " + cursor;
            default: return base;
        }
    };

    const ACCESS_ROLES = [
        { id: 'HR', label: 'HR' },
        { id: 'Project Manager', label: 'PM' },
        { id: 'Finance', label: 'FIN' },
        { id: 'Expense Manager', label: 'EXP' },
        { id: 'Superadmin', label: 'SUPER' }
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 selection:bg-rose-100 selection:text-rose-900 pb-20">
            <Head>
                <title>System Command | Gecko OMS</title>
            </Head>

            {/* Premium Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-rose-200/30 rounded-full filter blur-[120px] opacity-60"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-slate-300/30 rounded-full filter blur-[120px] opacity-60"></div>
            </div>

            {/* Header */}
            <header className="relative z-10 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 transition-all">
                <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors group">
                            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-rose-500 rounded-xl shadow-lg shadow-rose-200">
                                <Shield className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">System Command</h1>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <AlertTriangle size={10} className="text-rose-500" /> Superadmin Clearance
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-xs font-bold text-slate-500">
                            <Users size={14} /> {users.length} Total Accounts
                        </div>
                        <Image src={superAdminUser.avatar} alt="Admin" width={40} height={40} className="rounded-full border-2 border-white shadow-sm" />
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 mt-8">

                {/* Control Panel */}
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 mb-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Access Control Matrix</h2>
                        <p className="text-sm text-slate-500 mt-1">Instantly provision or revoke administrative roles.</p>
                    </div>
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search accounts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                        />
                    </div>
                </div>

                {/* Users Ledger */}
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="py-5 px-6 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Account</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Contact</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Current Role</th>
                                    <th className="py-5 px-6 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 text-right">Access Provisioning</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <AnimatePresence>
                                    {filteredUsers.map((u) => (
                                        <motion.tr
                                            key={u._id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="hover:bg-slate-50/50 transition-colors group"
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-4">
                                                    <Image src={u.avatar || '/default-avatar.png'} width={44} height={44} className="rounded-2xl shadow-sm border border-slate-100" alt={u.name} />
                                                    <div>
                                                        <p className="font-bold text-slate-800">{u.name}</p>
                                                        <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {u._id.slice(-6)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="text-sm font-medium text-slate-600">{u.email}</p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ring-1 shadow-sm ${getRoleBadge(u.role)}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right relative">
                                                {/* Premium Access Toggles */}
                                                <div className="flex justify-end gap-2">
                                                    {ACCESS_ROLES.map(roleObj => {
                                                        const hasAccess = (u.accessRoles || []).includes(roleObj.id) || u.role === roleObj.id;
                                                        const isPrimary = u.role === roleObj.id;

                                                        return (
                                                            <button
                                                                key={roleObj.id}
                                                                disabled={isPrimary || updatingUserId === u._id}
                                                                onClick={() => handleAccessToggle(u, roleObj.id)}
                                                                className={getAccessColor(roleObj.id, hasAccess, isPrimary)}
                                                                title={isPrimary ? 'Granted by Primary Role' : `Toggle ${roleObj.label} Access`}
                                                            >
                                                                {roleObj.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>

                        {filteredUsers.length === 0 && (
                            <div className="py-20 text-center flex flex-col items-center">
                                <Search size={40} className="text-slate-200 mb-4" />
                                <p className="text-slate-500 font-bold">No accounts found matching your search.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
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

        // Strictly Superadmin Only
        if (!user || user.role !== 'Superadmin') {
            return { redirect: { destination: '/dashboard', permanent: false } };
        }

        const allUsers = await User.find({}).select('-password').sort({ createdAt: -1 }).lean();

        return {
            props: {
                superAdminUser: JSON.parse(JSON.stringify(user)),
                allUsers: JSON.parse(JSON.stringify(allUsers))
            }
        };
    } catch (error) {
        return { redirect: { destination: '/login', permanent: false } };
    }
}

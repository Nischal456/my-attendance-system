import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Layers, Briefcase, Users, DollarSign, Command, ArrowRight, LogOut, Settings, CreditCard } from 'react-feather';
import jwt from 'jsonwebtoken';
import { Bank } from "lucide-react";
import dbConnect from '../../lib/dbConnect';
import User from '../../models/User';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';

export default function SmartLobby({ user }) {
    const router = useRouter();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout');
        toast.success('Logged out successfully');
        router.push('/login');
    };

    // --- HUB PORTAL MAPPING (The Digital Keychain) ---
    // Here we define the full universe of modules.
    const allPortals = [
        {
            id: 'workspace',
            title: 'My Workspace',
            description: 'Log attendance, track tasks, and submit leave requests.',
            icon: <Briefcase className="w-8 h-8 text-emerald-500" />,
            href: '/workspace',
            gradient: 'from-emerald-400/20 to-teal-400/20',
            border: 'border-emerald-200/50',
            rolesAllowed: ['Staff', 'Intern', 'Trainee', 'Manager', 'Superadmin'] // HR, Finance, PM are routed to their own hubs.
        },
        {
            id: 'hr',
            title: 'HR Portal',
            description: 'Manage staff leaves, company broadcasts, and onboarding.',
            icon: <Users className="w-8 h-8 text-indigo-500" />,
            href: '/hr/dashboard',
            gradient: 'from-indigo-400/20 to-purple-400/20',
            border: 'border-indigo-200/50',
            rolesAllowed: ['HR', 'Superadmin']
        },
        {
            id: 'pm',
            title: 'Project Command',
            description: 'Oversee timelines, assign tasks, and track deliverables.',
            icon: <Command className="w-8 h-8 text-blue-500" />,
            href: '/pm/dashboard',
            gradient: 'from-blue-400/20 to-cyan-400/20',
            border: 'border-blue-200/50',
            rolesAllowed: ['Project Manager', 'Superadmin']
        },
        {
            id: 'finance',
            title: 'Finance Hub',
            description: 'Manage log expenses, and generate reports.',
            icon: <CreditCard className="w-8 h-8 text-amber-500" />,
            href: '/finance/dashboard',
            gradient: 'from-amber-400/20 to-orange-400/20',
            border: 'border-amber-200/50',
            rolesAllowed: ['Finance', 'Superadmin']
        },
        {
            id: 'superadmin',
            title: 'System Command',
            description: 'Manage users, grant top-level access, and oversee the entire ecosystem.',
            icon: <Settings className="w-8 h-8 text-rose-500" />,
            href: '/superadmin/dashboard',
            gradient: 'from-rose-400/20 to-pink-400/20',
            border: 'border-rose-200/50',
            rolesAllowed: ['Superadmin']
        }
    ];

    // Filter the portals dynamically based on the user's base role AND their access roles.
    const allUserRoles = [user.role, ...(user.accessRoles || [])];
    const accessiblePortals = allPortals.filter(portal => allUserRoles.some(r => portal.rolesAllowed.includes(r)));

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 selection:bg-emerald-100 selection:text-emerald-900 flex flex-col relative overflow-hidden">
            <Head>
                <title>Gecko OMS</title>
            </Head>

            {/* Premium Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-200/40 rounded-full filter blur-[150px] opacity-70 animate-pulse-slow"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-200/40 rounded-full filter blur-[150px] opacity-70 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Minimal Header */}
            <header className="relative z-10 px-6 py-6 md:px-12 md:py-8 flex justify-between items-center w-full max-w-[1400px] mx-auto">
                <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 sm:h-12 sm:w-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden">
                        <Image src="/logo.png" alt="Logo" width={42} height={42} className="object-contain" />
                    </div>
                    <span className="font-extrabold text-xl tracking-tight text-slate-900">Gecko<span className="text-emerald-600">OMS</span></span>
                </div>

                <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-rose-500 bg-white hover:bg-rose-50 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-slate-100 transition-all group">
                    <span className="hidden sm:inline">Secure Logout</span>
                    <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
            </header>

            {/* Main Content - The Hub */}
            <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-4 py-12 md:py-0 w-full max-w-[1400px] mx-auto">

                <div className="text-center mb-12 sm:mb-16">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
                        <div className="inline-block relative mb-6">
                            <div className="absolute inset-0 bg-emerald-400 blur-xl opacity-20 rounded-full"></div>
                            <Image src={user.avatar || '/default-avatar.png'} alt="Avatar" width={80} height={80} className="rounded-full shadow-xl border-[4px] border-white relative z-10" />
                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full shadow-md z-20 border-2 border-white">
                                {user.role}
                            </div>
                        </div>
                    </motion.div>

                    <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-2">
                        {getGreeting()}, {user.name.split(' ')[0]}
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-slate-500 font-medium text-lg">
                        Select a portal to access your workspaces.
                    </motion.p>
                </div>

                {/* Adaptive Glassmorphism Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl"
                >
                    {accessiblePortals.map((portal) => (
                        <motion.div key={portal.id} variants={itemVariants}>
                            <Link href={portal.href} className="block group h-full">
                                <div className={`relative h-full bg-white/70 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border ${portal.border} hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col`}>

                                    {/* Subtle Gradient Splash inside card */}
                                    <div className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${portal.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                                    <div className="mb-6 bg-slate-50 p-4 rounded-2xl inline-flex shadow-inner border border-slate-100/50 relative z-10 group-hover:scale-110 group-hover:bg-white transition-all duration-300">
                                        {portal.icon}
                                    </div>

                                    <h2 className="text-xl font-extrabold text-slate-800 mb-2 relative z-10 group-hover:text-slate-900">{portal.title}</h2>
                                    <p className="text-sm text-slate-500 leading-relaxed relative z-10 flex-1">{portal.description}</p>

                                    <div className="mt-8 flex items-center justify-between text-slate-400 group-hover:text-slate-700 font-bold text-sm transition-colors relative z-10">
                                        <span>Enter Portal</span>
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md">
                                            <ArrowRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Superadmin Settings Hint */}
                {user.role === 'Superadmin' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-12 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100/50 border border-slate-200/50 rounded-full text-slate-400 text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-slate-200 transition-colors">
                            <Settings size={14} /> Global System Clearance Active
                        </div>
                    </motion.div>
                )}
            </main>

            {/* Footer */}
            <footer className="relative z-10 py-6 text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Powered by Gecko OMS Engine</p>
            </footer>
        </div>
    );
}

export async function getServerSideProps(context) {
    await dbConnect();
    const { token } = context.req.cookies;

    if (!token) {
        return { redirect: { destination: '/login', permanent: false } };
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('name role avatar accessRoles').lean();

        if (!user) {
            context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
            return { redirect: { destination: '/login', permanent: false } };
        }

        // --- SMART ROUTING LOGIC ---
        const role = user.role;
        const accessRoles = user.accessRoles || [];
        const allUserRoles = [role, ...accessRoles];
        let allowedRoutes = [];

        // Determine accessible portals based on ALL roles
        const hasAccess = (requiredRoles) => allUserRoles.some(r => requiredRoles.includes(r));

        if (hasAccess(['Staff', 'Intern', 'Trainee', 'Manager', 'Superadmin'])) {
            allowedRoutes.push('/workspace');
        }
        if (hasAccess(['HR', 'Superadmin'])) {
            allowedRoutes.push('/hr/dashboard');
        }
        if (hasAccess(['Project Manager', 'Superadmin'])) {
            allowedRoutes.push('/pm/dashboard');
        }
        if (hasAccess(['Finance', 'Superadmin'])) {
            allowedRoutes.push('/finance/dashboard');
        }
        if (hasAccess(['Superadmin'])) {
            allowedRoutes.push('/superadmin/dashboard');
        }

        // De-duplicate allowed routes just in case
        allowedRoutes = [...new Set(allowedRoutes)];

        // If the user only has access to exactly 1 portal, bypass the Lobby completely!
        if (allowedRoutes.length === 1) {
            return { redirect: { destination: allowedRoutes[0], permanent: false } };
        }

        // Return user data directly to the Hub for users with multiple options (Superadmin).
        return { props: { user: JSON.parse(JSON.stringify(user)) } };

    } catch (error) {
        console.error("Hub Auth Error:", error.message);
        context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        return { redirect: { destination: '/login', permanent: false } };
    }
}

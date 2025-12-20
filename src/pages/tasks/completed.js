import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, CheckCircle, MessageSquare, Users, ArrowLeft, Calendar, FileText, Paperclip } from 'react-feather';
import { motion, AnimatePresence } from 'framer-motion';

// Imports moved from getServerSideProps
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import Task from '../../../models/Task';

// Helper Function
const formatEnglishDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
};

// Sub-Component to display a single completed task
const CompletedTaskCard = ({ task }) => {
    const userAttachments = task.attachments?.filter(att => att.uploadedBy?._id?.toString() === task.assignedTo?._id?.toString()) || [];
    
    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01, y: -2 }}
            transition={{ duration: 0.2 }}
            className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 group"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                    <h4 className="text-lg font-bold text-slate-800 group-hover:text-green-700 transition-colors line-clamp-2">{task.title}</h4>
                    <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full w-fit">
                        <CheckCircle size={14} />
                        <span>Completed on {formatEnglishDate(task.completedAt)}</span>
                    </div>
                </div>
                <span className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200 uppercase tracking-wider shadow-sm">
                    Verified
                </span>
            </div>

            {/* --- NEW: Team Display Section --- */}
            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <Users size={14} /> Team
                </div>
                <div className="flex items-center -space-x-3 pl-2">
                    <div className="relative z-10 hover:z-20 transition-transform hover:scale-110 duration-200">
                        <Image 
                            src={task.assignedTo?.avatar || '/default-avatar.png'} 
                            width={32} 
                            height={32} 
                            className="rounded-full object-cover aspect-square border-2 border-white ring-2 ring-indigo-100 shadow-sm" 
                            alt={task.assignedTo?.name || ''} 
                            title={`Lead: ${task.assignedTo?.name}`} 
                        />
                    </div>
                    {task.assistedBy?.map(assistant => (
                        <div key={assistant._id} className="relative hover:z-20 transition-transform hover:scale-110 duration-200">
                            <Image 
                                src={assistant.avatar || '/default-avatar.png'} 
                                width={32} 
                                height={32} 
                                className="rounded-full object-cover aspect-square border-2 border-white shadow-sm" 
                                alt={assistant.name} 
                                title={`Assist: ${assistant.name}`} 
                            />
                        </div>
                    ))}
                </div>
            </div>

            {task.submissionDescription && (
                <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-start gap-3">
                        <div className="bg-white p-1.5 rounded-lg shadow-sm text-slate-400">
                            <FileText size={16} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Work Summary</p>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{task.submissionDescription}</p>
                        </div>
                    </div>
                </div>
            )}

            {userAttachments.length > 0 && (
                <div className="mt-4 pt-2">
                    <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                        <Paperclip size={12}/> Attachments
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {userAttachments.map(file => (
                            <a 
                                key={file.url} 
                                href={file.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-xs font-semibold bg-white text-slate-600 px-3 py-2 rounded-xl border border-slate-200 hover:border-green-300 hover:text-green-700 hover:bg-green-50 flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
                            >
                                <div className="bg-green-100 p-1 rounded-md text-green-600">
                                    <CheckCircle size={10} />
                                </div>
                                {file.filename}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default function CompletedTasksPage({ user, completedTasks }) {
    const router = useRouter();
    
    const handleLogout = async () => {
        await fetch('/api/auth/logout');
        router.push('/login');
    };

    // Animation Variants for Staggered List
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-green-100 selection:text-green-800">
             
             {/* Background Atmosphere */}
             <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-green-100/40 rounded-full blur-[120px] opacity-60"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-100/40 rounded-full blur-[120px] opacity-60"></div>
            </div>

            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm transition-all">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-full border border-slate-200 hover:border-slate-300 shadow-sm group">
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
                        </Link>
                        
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-slate-800">{user.name}</p>
                                    <p className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full inline-block">{user.role}</p>
                                </div>
                                <div className="relative">
                                     <div className="absolute inset-0 bg-green-400 rounded-full blur-sm opacity-20"></div>
                                     <Image src={user.avatar} width={40} height={40} className="rounded-full object-cover border-2 border-white shadow-sm relative z-10" alt="User Avatar" />
                                </div>
                                <button 
                                    onClick={handleLogout} 
                                    className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-300" 
                                    title="Sign Out"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.5 }}
                    className="mb-10 text-center sm:text-left"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold mb-3 border border-green-200 shadow-sm">
                        <CheckCircle size={12} /> Work History
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Completed Tasks</h1>
                    <p className="mt-2 text-slate-500 text-lg">A full record of all your successfully delivered work.</p>
                </motion.div>

                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="space-y-6"
                >
                    {completedTasks.length > 0 ? (
                        completedTasks.map(task => <CompletedTaskCard key={task._id} task={task} />)
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200 shadow-sm"
                        >
                            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                <CheckCircle className="text-slate-300" size={40} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">No completed tasks yet</h3>
                            <p className="text-slate-400 text-sm mt-1">When you finish tasks, they will appear here.</p>
                            <Link href="/dashboard" className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 hover:shadow-xl">
                                Go to Dashboard
                            </Link>
                        </motion.div>
                    )}
                </motion.div>
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
        const user = await User.findById(decoded.userId).select('-password').lean();
        if (!user) { return { redirect: { destination: '/login', permanent: false } }; }

        const completedTasks = await Task.find({ $or: [{ assignedTo: user._id }, { assistedBy: user._id }], status: 'Completed' })
            .populate('assignedTo', 'name avatar')
            .populate('assistedBy', 'name avatar') 
            .populate('attachments.uploadedBy', 'name')
            .sort({ completedAt: -1 })
            .lean();

        return {
            props: {
                user: JSON.parse(JSON.stringify(user)),
                completedTasks: JSON.parse(JSON.stringify(completedTasks)),
            },
        };
    } catch (error) {
        context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        return { redirect: { destination: '/login', permanent: false } };
    }
}
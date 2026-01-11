import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, Clock, Calendar, Coffee, CheckCircle, Play, Star, Bell, Edit, Trash2, Save, X, User as UserIcon, FileText, Briefcase, Info, DollarSign, CheckSquare, Paperclip, Upload, Inbox, MessageSquare, Users, List, Plus, BarChart2, TrendingUp, AlertOctagon, Home, Send, Search, ArrowLeft, AlertTriangle, AlertCircle } from 'react-feather';
import { ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast'; // Uses global _app.js Toaster
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Pusher from 'pusher-js';
import { formatDistanceToNow } from 'date-fns';

// --- Configuration ---
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- Helpers ---
const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) setMatches(media.matches);
        const listener = () => setMatches(media.matches);
        window.addEventListener('resize', listener);
        return () => window.removeEventListener('resize', listener);
    }, [matches, query]);
    return matches;
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
};

const formatEnglishDate = (dateString, includeTime = false) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    if (includeTime) { options.hour = 'numeric'; options.minute = '2-digit'; options.hour12 = true; }
    return date.toLocaleDateString('en-US', options);
};

const formatDuration = (totalSeconds) => {
    if (totalSeconds == null || totalSeconds < 0) return '0m';
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    return parts.join(' ') || '0m';
};

const formatElapsedTime = (startTime) => {
    if (!startTime) return '00:00:00';
    const now = new Date();
    const start = new Date(startTime);
    const s = Math.floor((now - start) / 1000);
    if (s < 0) return '00:00:00';
    const hh = Math.floor(s / 3600).toString().padStart(2, '0');
    const mm = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const ss = (s % 60).toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
};

const formatDeadline = (dateString) => {
    if (!dateString) return 'No deadline';
    return new Date(dateString).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
};

const MIN_WORK_SECONDS = 21600;

const getStatusPill = (status) => {
    switch (status) {
        case 'In Progress': return 'bg-amber-100 text-amber-800 border border-amber-200';
        case 'Completed': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
        default: return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
};

const getDeadlineInfo = (task) => {
    if (!task.deadline || task.status === 'Completed') return { classes: 'text-slate-400' };
    if (new Date(task.deadline) < new Date()) { return { classes: 'text-rose-500 font-bold' }; }
    return { classes: 'text-slate-500' };
};

const handleApiError = async (response) => {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        const errorData = await response.json();
        return errorData.message || `HTTP error! status: ${response.status}`;
    }
    return `HTTP error! status: ${response.status}`;
};

const getSenderUI = (author) => {
    const lower = author?.toLowerCase() || '';
    if (lower.includes('hr')) return { Icon: UserIcon, iconBg: 'bg-rose-100 text-rose-600' };
    if (lower.includes('project')) return { Icon: Briefcase, iconBg: 'bg-purple-100 text-purple-600' };
    if (lower.includes('finance')) return { Icon: DollarSign, iconBg: 'bg-emerald-100 text-emerald-600' };
    return { Icon: Info, iconBg: 'bg-blue-100 text-blue-600' };
};

// --- Sub-Components ---

const ButtonLoader = () => (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const DashboardEntryLoader = ({ userName }) => (
    <motion.div 
        className="fixed inset-0 z-[100] bg-slate-50/95 flex flex-col items-center justify-center font-sans overflow-hidden perspective-[1200px]"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.1, filter: "blur(25px)" }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
    >
        {/* 1. ULTRA Background - Deeper depth */}
        <div className="absolute inset-0 bg-white z-0">
             {/* Stronger central light source */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#10b98120_0%,transparent_60%)]"></div>
            {/* Sharper Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_60%,transparent_100%)]"></div>
        </div>

        {/* 2. Main Content Wrapper */}
        <div className="relative z-10 flex flex-col items-center justify-center">
            
            {/* 3. THE ULTRA TILTED GLASS CARD */}
            <motion.div 
                initial={{ scale: 0.6, rotateX: 20, rotateY: 20, opacity: 0, y: 150 }} 
                animate={{ scale: 1, rotateX: 5, rotateY: -5, opacity: 1, y: 0 }} 
                transition={{ 
                    type: "spring", 
                    stiffness: 250, // Much stiffer for "fastest" feel
                    damping: 25,    // Snappy stop without too much wobble
                    mass: 0.8
                }} 
                className="relative mb-14 md:mb-20 transform-gpu preserve-3d"
            >
                {/* Intense Ambient Glow Core */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-emerald-500/40 blur-[100px] rounded-full animate-pulse-slow"></div>

                {/* The Hyper-Realistic Glass Container */}
                <motion.div 
                    animate={{ y: [0, -10, 0], rotateX: [5, 2, 5], rotateY: [-5, -2, -5] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    // Complex borders and shadows for realism
                    className="relative bg-white/40 backdrop-blur-[80px] p-8 md:p-12 rounded-[3.5rem] 
                               border-t-[1.5px] border-l-[1.5px] border-white/90 
                               border-b border-r border-white/20
                               shadow-[0_30px_70px_-20px_rgba(16,185,129,0.4),inset_0_0_40px_rgba(255,255,255,0.3)] 
                               flex items-center justify-center overflow-hidden"
                >
                    {/* Sharp Specular Reflection */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-transparent to-transparent opacity-80 pointer-events-none -rotate-12 scale-125"></div>
                    
                    {/* THE HOLOGRAPHIC USER TOKEN (Not zoomed) */}
                    <div className="relative w-40 h-40 md:w-64 md:h-64 flex items-center justify-center transform-gpu translate-z-10">
                         {/* Rotating Energy Ring */}
                        <div className="absolute inset-0 rounded-full border-[3px] border-emerald-400/30 border-t-emerald-400/80 border-l-emerald-400/80 animate-spin-slow glow-emerald-md"></div>
                        {/* Pulsing Inner Core */}
                        <div className="absolute inset-4 rounded-full bg-emerald-500/10 animate-pulse"></div>
                        {/* Holographic Base Projection */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-4 bg-emerald-500/50 blur-md rounded-[100%]"></div>

                        {/* The Image - Floating freely, object-contain to prevent zoom cropping */}
                        <div className="relative w-full h-full filter drop-shadow-[0_15px_35px_rgba(16,185,129,0.35)] z-20">
                            <Image 
                                src="/user.png" 
                                alt="User Profile" 
                                fill
                                className="object-contain p-2" 
                                priority 
                                sizes="(max-width: 768px) 160px, 256px"
                            />
                        </div>
                    </div>
                </motion.div>
                
                {/* Premium Badge */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0, rotate: 45 }}
                    animate={{ opacity: 1, scale: 1, rotate: 12 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="absolute -right-6 -top-6 bg-gradient-to-r from-slate-900 to-slate-800 text-emerald-100 text-xs font-extrabold tracking-wider px-4 py-1.5 rounded-full shadow-xl border-[1.5px] border-white transform translate-z-20"
                >
                    Version 2.0
                </motion.div>
            </motion.div>

            {/* 4. Typography - Snappier entrance */}
            <div className="text-center relative z-20 space-y-5">
                <motion.h2 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} // Fast easing
                    className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-none"
                >
                    Hello, <br className="md:hidden" />
                    {/* The "Next Level" Text Gradient */}
                    <span className="text-transparent bg-clip-text bg-[linear-gradient(to_right,theme(colors.emerald.600),theme(colors.teal.400),theme(colors.emerald.600),theme(colors.teal.400))] bg-[length:300%_auto] animate-[gradient_3s_linear_infinite] drop-shadow-sm">
                        {userName.split(' ')[0]}
                    </span>
                </motion.h2>
                
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center justify-center gap-4 text-xs md:text-sm font-bold text-slate-400 uppercase tracking-[0.4em]"
                >
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-slate-300"></div>
                    <span className="text-slate-500">Welcome to your personal Dashboard</span>
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-slate-300"></div>
                </motion.div>
            </div>

            {/* 5. Loader - Faster & Brighter */}
            <div className="mt-16 relative flex flex-col items-center gap-3">
                
                {/* Status Text - Monospace & Technical */}
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: 0.6 }}
                    className="text-[10px] font-mono font-medium text-emerald-600/60 uppercase tracking-[0.3em]"
                >
                    Initializing Gecko Dashboard...
                </motion.div>

                {/* The Loader Track */}
                <div className="relative w-64 h-[2px] bg-slate-200/30 rounded-full">
                    
                    {/* The Moving Progress Bar */}
                    <motion.div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-emerald-500 to-emerald-400" 
                        initial={{ width: "0%" }} 
                        animate={{ width: "100%" }} 
                        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }} 
                    >
                        {/* THE SPARK (The glow at the tip) */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
                            {/* Hard Core */}
                            <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,1)]"></div>
                            {/* Soft Glow */}
                            <div className="absolute inset-0 w-full h-full bg-emerald-400 blur-[6px] scale-[3]"></div>
                            {/* Lens Flare Line */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-[1px] bg-white opacity-50"></div>
                        </div>
                    </motion.div>

                </div>

                {/* Reflection under the loader for depth */}
                <motion.div 
                    className="absolute -bottom-2 w-64 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent blur-sm"
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 1.4, delay: 0.1, ease: "circOut" }}
                />
            </div>
        </div>
    </motion.div>
);

const NotificationContent = ({ notifications, onLinkClick }) => (
    <>
        {notifications.length > 0 ? (
            <div className="divide-y divide-slate-100">
                {notifications.map((notif) => {
                    const senderUI = getSenderUI(notif.author);
                    const isUnread = !notif.isRead;
                    return (
                        <Link key={notif._id} href={notif.link || '#'} onClick={onLinkClick} className={`block group`}>
                            <div className={`flex items-start gap-4 p-4 transition-all duration-200 ${isUnread ? 'bg-emerald-50/60' : 'hover:bg-slate-50'}`}>
                                <div className={`flex-shrink-0 mt-0.5 w-10 h-10 flex items-center justify-center rounded-2xl shadow-sm ${senderUI.iconBg}`}>
                                    <senderUI.Icon size={18} />
                                </div>
                                <div className="flex-1 text-sm">
                                    <p className={`leading-snug ${isUnread ? 'text-slate-800 font-bold' : 'text-slate-600'}`}>{notif.content}</p>
                                    <p className={`text-xs mt-1.5 ${isUnread ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>{formatEnglishDate(notif.createdAt, true)}</p>
                                </div>
                                {isUnread && (<div className="mt-2 w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 shadow-sm shadow-emerald-200" title="Unread"></div>)}
                            </div>
                        </Link>
                    );
                })}
            </div>
        ) : (
            <div className="p-10 text-center flex flex-col justify-center items-center h-full">
                <div className="bg-slate-50 p-4 rounded-full mb-4">
                    <Bell className="h-8 w-8 text-slate-300" />
                </div>
                <h4 className="text-base font-semibold text-slate-700">All caught up!</h4>
                <p className="mt-1 text-xs text-slate-400">You have no new notifications.</p>
            </div>
        )}
    </>
);

const MobileNotificationPanel = ({ notifications, unreadCount, handleMarkAsRead, onClose }) => {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);
    return (
        <motion.div className="fixed inset-0 z-[100] bg-slate-900/20 backdrop-blur-sm flex justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
            <motion.div className="h-full w-full max-w-md bg-white shadow-2xl flex flex-col" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 350, damping: 35 }} onClick={(e) => e.stopPropagation()}>
                <header className="p-5 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Notifications</h3>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (<button onClick={handleMarkAsRead} className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors" title="Mark all as read"><CheckSquare size={20} /></button>)}
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors" title="Close"><X size={22} /></button>
                    </div>
                </header>
                <div className="flex-grow overflow-y-auto"><NotificationContent notifications={notifications} onLinkClick={onClose} /></div>
            </motion.div>
        </motion.div>
    );
};

const DesktopNotificationPanel = ({ notifications, unreadCount, handleMarkAsRead, onClose }) => {
    return (
        <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.2, ease: "easeOut" }} className="absolute top-full right-0 mt-4 w-full max-w-sm sm:w-[28rem] bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl shadow-slate-200/50 z-50 overflow-hidden origin-top-right ring-1 ring-slate-100">
            <header className="p-4 px-5 border-b border-slate-100 flex justify-between items-center bg-white/50">
                <h3 className="text-base font-bold text-slate-800">Notifications</h3>
                {unreadCount > 0 && (<button onClick={handleMarkAsRead} className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1" title="Mark all as read"><CheckSquare size={14} /> Mark all read</button>)}
            </header>
            <div className="max-h-[65vh] overflow-y-auto custom-scrollbar"><NotificationContent notifications={notifications} onLinkClick={onClose} /></div>
        </motion.div>
    );
};

const SubmitWorkModal = ({ task, onClose, onWorkSubmitted }) => {
    const [description, setDescription] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const handleFileChange = (e) => { const files = Array.from(e.target.files); if (files.length === 0) return; const filePromises = files.map(file => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onloadend = () => resolve({ url: reader.result, filename: file.name }); reader.onerror = reject; reader.readAsDataURL(file); })); Promise.all(filePromises).then(newFiles => setAttachments(prev => [...prev, ...newFiles])).catch(() => toast.error("Error reading files.")); };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description.trim()) { setError('Please provide a description of the work you completed.'); return; }
        setIsSubmitting(true); setError('');
        try {
            const res = await fetch('/api/tasks/submit-work', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId: task._id, attachments, submissionDescription: description }) });
            if (!res.ok) { const errorResult = await res.json(); throw new Error(errorResult.message || 'Failed to submit work.'); }
            await onWorkSubmitted();
            toast.success('Work submitted successfully!');
            onClose();
        } catch (err) { setError(err.message); toast.error(err.message); } finally { setIsSubmitting(false); }
    };
    return (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex justify-center items-center p-4"><motion.div initial={{ y: 20, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg border border-white/50"><div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-bold text-slate-800">Submit Work</h3><button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors"><X size={20} className="text-slate-500" /></button></div><div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-100"><p className="text-sm text-slate-500">Submitting for task:</p><p className="font-bold text-slate-800 text-lg">{task.title}</p></div><form
        onSubmit={handleSubmit}
        className="space-y-6"
    >
        <div>
            <label
                htmlFor="submissionDescription"
                className="block text-sm font-semibold text-slate-700 mb-2"
            >
                Work Description <span className="text-rose-500">*</span>
            </label>
            <textarea
                id="submissionDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl shadow-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none resize-none"
                placeholder="Describe the task or work completed..."
            />
        </div>
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
                Attach Files <span className="text-slate-400 text-xs font-normal">(optional)</span>
            </label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                </div>
                <input type="file" multiple onChange={handleFileChange} className="hidden" />
            </label>
        </div>
        {attachments.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-xl p-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Selected Files:</p>
                <div className="flex flex-wrap gap-2">
                    {attachments.map((f, i) => (
                        <span
                            key={i}
                            className="bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-medium rounded-full border border-emerald-100 shadow-sm flex items-center gap-1"
                        >
                            <Paperclip size={10} /> {f.filename}
                        </span>
                    ))}
                </div>
            </div>
        )}
        {error && (
            <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg flex items-center gap-2">
                <AlertTriangle size={16} /> {error}
            </div>
        )}
        <div className="pt-4 flex justify-end gap-3">
            <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition active:scale-95"
            >
                Cancel
            </button>
            <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center gap-2 transition shadow-lg shadow-emerald-200 active:scale-95 disabled:opacity-70 disabled:active:scale-100"
            >
                {isSubmitting ? (
                    <span className="flex items-center gap-2"><ButtonLoader /> Processing...</span>
                ) : (
                    <>Submit & Complete <CheckCircle size={18} /></>
                )}
            </button>
        </div>
    </form>
    </motion.div></motion.div>);
};

const PersonalTaskModal = ({ onClose, onTaskCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) { setError('Please provide a title.'); return; }
        setIsSubmitting(true); setError('');
        try {
            const res = await fetch('/api/tasks/self-assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, description }) });
            if (!res.ok) { const errorResult = await res.json(); throw new Error(errorResult.message || 'Failed to create task.'); }
            await onTaskCreated();
            toast.success('Personal task added!');
            onClose();
        } catch (err) { setError(err.message); toast.error(err.message); } finally { setIsSubmitting(false); }
    };
    return (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex justify-center items-center p-4"><motion.div initial={{ y: 20, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg border border-white/50"><div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-bold text-slate-800">Add Personal Task</h3><button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition"><X size={22} /></button></div><form onSubmit={handleSubmit} className="space-y-6"><div><label htmlFor="title" className="block text-sm font-bold text-slate-700 mb-2">Task Title <span className="text-rose-500">*</span></label><input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl shadow-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none" placeholder="e.g. Update portfolio design" required /></div><div><label htmlFor="description" className="block text-sm font-bold text-slate-700 mb-2">Description <span className="font-normal text-slate-400 text-xs">(Optional)</span></label><textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl shadow-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none resize-none" placeholder="Add more details..." /></div>{error && <p className="text-sm text-rose-600 bg-rose-50 p-3 rounded-lg flex items-center gap-2"><AlertCircle size={16} />{error}</p>}<div className="pt-4 flex items-center justify-end gap-3"><button type="button" onClick={onClose} className="px-5 py-3 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition active:scale-95">Cancel</button><button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-emerald-300 transition-all active:scale-95 disabled:opacity-70">{isSubmitting && (<ButtonLoader />)}{isSubmitting ? 'Adding...' : 'Add Task'}</button></div></form></motion.div></motion.div>);
};

const TaskDetailsModal = ({ task, onClose, onCommentAdded, currentUser }) => {
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const commentsEndRef = useRef(null);

    const pmAttachments = (task.attachments || []).filter(att => att.uploadedBy?._id.toString() === task.assignedBy?._id.toString());
    const userAttachments = (task.attachments || []).filter(att => att.uploadedBy?._id.toString() === task.assignedTo?._id.toString());

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/tasks/add-comment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId: task._id, content: newComment }) });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            onCommentAdded(task._id, result.data);
            setNewComment("");
            toast.success("Comment posted!");
        } catch (err) {
            toast.error(err.message || "Failed to post comment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [task.comments]);

    if (!task) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex justify-center items-center p-4" onClick={onClose}>
            <motion.div initial={{ y: 40, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0, scale: 0.9 }} transition={{ type: "spring", bounce: 0.3 }} className="bg-white rounded-[2rem] shadow-2xl overflow-hidden w-full max-w-4xl max-h-[85vh] flex flex-col border border-white/40" onClick={(e) => e.stopPropagation()}>
                <header className="flex justify-between items-start p-8 pb-6 border-b border-slate-100 bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{task.title}</h2>
                        <div className="flex items-center gap-3 mt-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusPill(task.status)}`}>{task.status}</span>
                            <span className="text-slate-300">|</span>
                            <span className="text-sm text-slate-500 font-medium"> {formatEnglishDate(task.createdAt)}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-full transition-all transform hover:rotate-90"><X size={24} /></button>
                </header>
                <div className="flex-grow overflow-y-auto p-8 pt-6 space-y-8 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-8">
                            <div>
                                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide"><FileText size={16} className="text-emerald-500" /> Description</h4>
                                <div className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50/50 p-6 rounded-2xl border border-slate-100 leading-relaxed">
                                    {task.description || <span className="italic text-slate-400">No description provided.</span>}
                                </div>
                            </div>
                            {(pmAttachments.length > 0 || userAttachments.length > 0) && (
                                <div>
                                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide"><Paperclip size={16} className="text-emerald-500" /> Attachments</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {pmAttachments.length > 0 && (
                                            <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
                                                <h5 className="text-xs font-bold text-blue-600 mb-3 uppercase">Project Files</h5>
                                                <div className="flex flex-col gap-2">{pmAttachments.map(file => (<a key={file.url} href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm bg-white p-2.5 rounded-xl hover:shadow-md transition-all flex items-center gap-3 text-slate-700 border border-blue-100/50"><div className="bg-blue-100 p-1.5 rounded-lg"><Paperclip size={14} className="text-blue-600" /></div><span className="truncate">{file.filename}</span></a>))}</div>
                                            </div>
                                        )}
                                        {userAttachments.length > 0 && (
                                            <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100">
                                                <h5 className="text-xs font-bold text-emerald-600 mb-3 uppercase">My Submissions</h5>
                                                <div className="flex flex-col gap-2">{userAttachments.map(file => (<a key={file.url} href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm bg-white p-2.5 rounded-xl hover:shadow-md transition-all flex items-center gap-3 text-slate-700 border border-emerald-100/50"><div className="bg-emerald-100 p-1.5 rounded-lg"><CheckCircle size={14} className="text-emerald-600" /></div><span className="truncate">{file.filename}</span></a>))}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div>
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide"><MessageSquare size={16} className="text-emerald-500" /> Discussion</h4>
                                <div className="space-y-4 max-h-80 overflow-y-auto p-1 pr-2">
                                    {task.comments && task.comments.length > 0 ? (
                                        task.comments.map(comment => (
                                            <div key={comment._id} className="flex items-start gap-4 group">
                                                <Image src={comment.author?.avatar || '/default-avatar.png'} width={40} height={40} className="rounded-2xl object-cover shadow-sm" alt={comment.author?.name || 'User'} />
                                                <div className="flex-1">
                                                    <div className="flex items-baseline justify-between mb-1">
                                                        <p className="font-bold text-sm text-slate-800">{comment.author?.name}</p>
                                                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{formatEnglishDate(comment.createdAt, true)}</span>
                                                    </div>
                                                    <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none border border-slate-100 text-sm text-slate-600 leading-relaxed shadow-sm">
                                                        {comment.content}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                            <MessageSquare className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                                            <p className="text-sm text-slate-500">No comments yet. Start the conversation!</p>
                                        </div>
                                    )}
                                    <div ref={commentsEndRef} />
                                </div>
                                <form onSubmit={handlePostComment} className="mt-6 flex items-start gap-3 relative">
                                    <Image src={currentUser.avatar} width={36} height={36} className="rounded-xl object-cover shadow-sm" alt="Your avatar" />
                                    <div className="flex-1 relative">
                                        <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment..." rows="1" className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm shadow-inner focus:bg-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none overflow-hidden min-h-[46px]" required />
                                        <button type="submit" disabled={isSubmitting || !newComment.trim()} className="absolute right-2 top-2 p-1.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-all shadow-md shadow-emerald-200"><Send size={16} /></button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Right Column: Meta Info */}
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide"><Users size={16} className="text-emerald-500" /> The Team</h4>
                                <div className="space-y-4">
                                    {/* Assigned By */}
                                    {task.assignedBy && (
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <Image src={task.assignedBy.avatar || '/default-avatar.png'} width={44} height={44} className="rounded-2xl object-cover shadow-sm" alt={task.assignedBy.name} />
                                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5"><div className="bg-purple-500 p-1 rounded-full"><Briefcase size={8} className="text-white" /></div></div>
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-800">{task.assignedBy.name}</p>
                                                <p className="text-xs text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-full inline-block mt-0.5">Manager</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="w-full h-px bg-slate-200/50"></div>
                                    {/* Assigned To */}
                                    {task.assignedTo && (
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <Image src={task.assignedTo.avatar || '/default-avatar.png'} width={44} height={44} className="rounded-2xl object-cover shadow-sm" alt={task.assignedTo.name} />
                                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5"><div className="bg-emerald-500 p-1 rounded-full"><UserIcon size={8} className="text-white" /></div></div>
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-800">{task.assignedTo.name}</p>
                                                <p className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">Assigned To</p>
                                            </div>
                                        </div>
                                    )}
                                    {/* [FIX] Collaborators Section Added Here */}
                                    {task.assistedBy && task.assistedBy.length > 0 && (
                                        <>
                                            <div className="w-full h-px bg-slate-200/50"></div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Collaborators</p>
                                                <div className="flex flex-col gap-3">
                                                    {task.assistedBy.map(assistant => (
                                                        <div key={assistant._id} className="flex items-center gap-3">
                                                            <div className="relative">
                                                                <Image src={assistant.avatar || '/default-avatar.png'} width={36} height={36} className="rounded-xl object-cover shadow-sm" alt={assistant.name} />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm text-slate-700">{assistant.name}</p>
                                                                <p className="text-[10px] text-blue-500 font-semibold bg-blue-50 px-1.5 py-0.5 rounded-full inline-block">Assistant</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-4">
                                <div>
                                    <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wide mb-1">Deadline</h4>
                                    <div className={`flex items-center gap-2 font-bold ${getDeadlineInfo(task).classes.replace('text-slate-500', 'text-slate-700')}`}>
                                        <Clock size={18} />
                                        <span>{formatDeadline(task.deadline)}</span>
                                    </div>
                                </div>
                                {task.completedAt && (
                                    <div>
                                        <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wide mb-1">Completed On</h4>
                                        <div className="flex items-center gap-2 font-bold text-emerald-600">
                                            <CheckCircle size={18} />
                                            <span>{formatEnglishDate(task.completedAt, true)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const CompletedTaskCard = ({ task, onOpenDetails }) => {
    const userAttachments = task.attachments?.filter(att => att.uploadedBy?._id?.toString() === task.assignedTo?._id?.toString()) || [];
    return (
        <motion.div whileHover={{ scale: 1.01, y: -2 }} className="p-3 bg-white rounded-2xl cursor-pointer shadow-sm hover:shadow-lg border border-slate-100 transition-all duration-200 group" onClick={() => onOpenDetails(task)}>
            <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-700 group-hover:text-emerald-700 transition-colors line-through decoration-emerald-500/50 truncate">{task.title}</h4>
                    <p className="text-[10px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1"><CheckCircle size={10} /> {formatEnglishDate(task.completedAt)}</p>
                </div>
                <div className="bg-emerald-100 text-emerald-600 p-1 rounded-lg flex-shrink-0"><CheckCircle size={14} /></div>
            </div>
        </motion.div>
    );
};

const DraggableTaskCard = ({ task, onUpdateTaskStatus, onOpenSubmitModal, onOpenDetails }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.9 : 1,
        scale: isDragging ? 1.05 : 1,
        touchAction: 'none' // CRITICAL: Allows dragging on mobile without scrolling page
    };
    const isSelfAssigned = task.assignedBy?._id === task.assignedTo?._id;

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 touch-none cursor-grab active:cursor-grabbing group will-change-transform ${isDragging ? 'shadow-2xl ring-2 ring-emerald-400 rotate-2' : ''}`} onClick={() => onOpenDetails(task)}>
            <div className="flex justify-between items-start gap-2 mb-1.5">
                <h4 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">{task.title}</h4>
                {isSelfAssigned && <span className="flex-shrink-0 text-[9px] uppercase font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md border border-indigo-100">Personal</span>}
            </div>

            {task.description && <p className="text-[11px] text-slate-500 line-clamp-2 mb-3 leading-relaxed">{task.description}</p>}

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-50">
                <div className={`flex items-center gap-1 text-[10px] font-semibold ${getDeadlineInfo(task).classes}`}>
                    <Clock size={12} />
                    <span>{formatDeadline(task.deadline)}</span>
                </div>
                <div className="flex items-center -space-x-1.5 pl-2">
                    <div className="relative z-10 hover:z-20 transition-all hover:scale-110">
                        <Image src={task.assignedTo?.avatar || '/default-avatar.png'} width={22} height={22} className="rounded-full object-cover aspect-square border-2 border-white shadow-sm" alt={task.assignedTo?.name || ''} title={`Lead: ${task.assignedTo?.name}`} />
                    </div>
                    {task.assistedBy?.map(assistant => (<div key={assistant._id} className="relative hover:z-20 transition-all hover:scale-110"><Image src={assistant.avatar || '/default-avatar.png'} width={22} height={22} className="rounded-full object-cover aspect-square border-2 border-white shadow-sm" alt={assistant.name} title={`Assist: ${assistant.name}`} /></div>))}
                </div>
            </div>

            {(task.status === 'To Do' || task.status === 'In Progress') && (
                <div className="mt-3 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {task.status === 'To Do' && (
                        <button onClick={(e) => { e.stopPropagation(); onUpdateTaskStatus(task._id, 'In Progress'); }} className="w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-1.5 px-2 rounded-lg text-[10px] transition-all shadow-lg shadow-slate-200"><Play size={10} fill="currentColor" /> Start</button>
                    )}
                    {task.status === 'In Progress' && (
                        <button onClick={(e) => { e.stopPropagation(); onOpenSubmitModal(task); }} className="w-full flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-1.5 px-2 rounded-lg text-[10px] transition-all shadow-lg shadow-emerald-200"><Upload size={10} /> Submit</button>
                    )}
                </div>
            )}
        </div>
    );
};

const TaskColumn = ({ title, tasks, onUpdateTaskStatus, onOpenSubmitModal, onOpenDetails }) => {
    // [FIX] Enable drop on empty column
    const { setNodeRef } = useDroppable({ id: title });

    let titleColor, icon, bgGradient;
    switch (title) {
        case 'In Progress':
            titleColor = 'text-amber-700';
            icon = <div className="bg-amber-100 p-1.5 rounded-lg"><Play size={14} className="text-amber-600 fill-amber-600" /></div>;
            bgGradient = 'from-amber-50/50 to-transparent';
            break;
        default:
            titleColor = 'text-slate-700';
            icon = <div className="bg-slate-200 p-1.5 rounded-lg"><List size={14} className="text-slate-600" /></div>;
            bgGradient = 'from-slate-50/50 to-transparent';
            break;
    }
    return (
        // [FIX] Added ref={setNodeRef} here
        <div ref={setNodeRef} className={`bg-white/40 p-1 rounded-3xl h-full flex flex-col min-h-[150px]`}>
            <div className={`flex items-center justify-between mb-3 p-3 rounded-2xl bg-gradient-to-b ${bgGradient}`}>
                <h2 className={`font-bold text-sm flex items-center gap-2 ${titleColor}`}>{icon}{title}</h2>
                <span className="text-[10px] font-bold bg-white shadow-sm text-slate-600 px-2 py-0.5 rounded-lg border border-slate-100">{tasks.length}</span>
            </div>
            <div className="space-y-3 h-full overflow-y-auto px-1 pb-4 custom-scrollbar">
                <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
                    {tasks.length > 0 ? (
                        tasks.map(task => <DraggableTaskCard key={task._id} task={task} onUpdateTaskStatus={onUpdateTaskStatus} onOpenSubmitModal={onOpenSubmitModal} onOpenDetails={onOpenDetails} />)
                    ) : (
                        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50"><Inbox className="mx-auto h-8 w-8 text-slate-300 mb-1" /><p className="text-[10px] font-semibold text-slate-400">Empty</p></div>
                    )}
                </SortableContext>
            </div>
        </div>
    );
};

const MyStatsWidget = ({ tasks, attendance }) => {
    const stats = useMemo(() => {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfWeek.setHours(0, 0, 0, 0);

        const completedThisWeek = tasks.filter(task =>
            task.status === 'Completed' && new Date(task.completedAt) >= startOfWeek
        ).length;

        const overdueTasks = tasks.filter(task =>
            task.status !== 'Completed' && task.deadline && new Date(task.deadline) < new Date()
        ).length;

        const currentMonthRecords = attendance.filter(att => {
            const checkInDate = new Date(att.checkInTime);
            const today = new Date();
            return checkInDate.getMonth() === today.getMonth() && checkInDate.getFullYear() === today.getFullYear();
        });

        const totalOfficeSeconds = currentMonthRecords
            .filter(att => att.workLocation === 'Office')
            .reduce((acc, att) => acc + (att.duration || 0), 0);

        const totalHomeSeconds = currentMonthRecords
            .filter(att => att.workLocation === 'Home')
            .reduce((acc, att) => acc + (att.duration || 0), 0);

        return {
            completedThisWeek,
            overdueTasks,
            totalHoursOffice: totalOfficeSeconds / 3600,
            totalHoursHome: totalHomeSeconds / 3600
        };
    }, [tasks, attendance]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-[2.5rem] shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden relative"
        >
            {/* Background Decoration */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

            <div className="px-8 py-6 border-b border-slate-50 relative z-10 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                    <div className="bg-green-600 text-white p-2.5 rounded-xl shadow-md">
                        <TrendingUp size={18} />
                    </div>
                    My Stats
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-full">Monthly Overview</span>
            </div>

            <div className="p-8 grid grid-cols-2 gap-5 relative z-10">
                {/* Office Hours Card */}
                <motion.div whileHover={{ scale: 1.02 }} className="col-span-2 sm:col-span-1 p-5 rounded-3xl bg-gradient-to-br from-emerald-50/80 to-teal-50/30 border border-emerald-100/60 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Briefcase size={60} className="text-emerald-600" /></div>
                    <p className="text-xs font-bold text-emerald-600/80 uppercase tracking-wider mb-1">Office Hours</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-slate-800">{stats.totalHoursOffice.toFixed(1)}</span>
                        <span className="text-sm font-medium text-slate-500">hrs</span>
                    </div>
                </motion.div>

                {/* Remote Hours Card */}
                <motion.div whileHover={{ scale: 1.02 }} className="col-span-2 sm:col-span-1 p-5 rounded-3xl bg-gradient-to-br from-indigo-50/80 to-blue-50/30 border border-indigo-100/60 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Home size={60} className="text-indigo-600" /></div>
                    <p className="text-xs font-bold text-indigo-600/80 uppercase tracking-wider mb-1">Remote Hours</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-slate-800">{stats.totalHoursHome.toFixed(1)}</span>
                        <span className="text-sm font-medium text-slate-500">hrs</span>
                    </div>
                </motion.div>

                {/* Tasks Row */}
                <div className="col-span-2 grid grid-cols-2 gap-4 mt-2">
                    <div className="col-span-2 sm:col-span-1 flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:border-emerald-200 hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl"><CheckCircle size={18} /></div>
                            <div>
                                <p className="text-xs text-slate-400 font-semibold uppercase">Done (Week)</p>
                                <p className="text-lg font-bold text-slate-800">{stats.completedThisWeek} Tasks</p>
                            </div>
                        </div>
                    </div>

                    <div className={`col-span-2 sm:col-span-1 flex items-center justify-between p-4 rounded-2xl border hover:shadow-md transition-all ${stats.overdueTasks > 0 ? 'bg-rose-50/50 border-rose-100' : 'bg-white border-slate-100'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${stats.overdueTasks > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                                <AlertOctagon size={18} />
                            </div>
                            <div>
                                <p className={`text-xs font-semibold uppercase ${stats.overdueTasks > 0 ? 'text-rose-400' : 'text-slate-400'}`}>Overdue</p>
                                <p className={`text-lg font-bold ${stats.overdueTasks > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{stats.overdueTasks} Tasks</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const WorkHoursChartCard = ({ attendance }) => {
    const chartData = useMemo(() => {
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const labels = [];
        const data = Array(7).fill(0);

        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            labels.push(days[day.getDay()]);
        }

        attendance.forEach(att => {
            if (att.checkInTime && att.duration) {
                const checkInDate = new Date(att.checkInTime);
                if (checkInDate >= startOfWeek) {
                    const dayIndex = checkInDate.getDay();
                    data[dayIndex] += att.duration / 3600;
                }
            }
        });

        return {
            labels: labels,
            datasets: [{
                label: 'Work Hours',
                data: data,
                backgroundColor: 'rgba(16, 185, 129, 0.8)', // emerald-500
                hoverBackgroundColor: 'rgba(5, 150, 105, 1)', // emerald-600
                borderRadius: 6,
                barThickness: 20,
            }]
        };
    }, [attendance]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Weekly Activity', font: { size: 13, weight: 'bold', family: 'sans-serif' }, color: '#64748b', padding: { bottom: 15 } },
            tooltip: {
                backgroundColor: '#1e293b',
                padding: 10,
                cornerRadius: 8,
                titleFont: { size: 12 },
                bodyFont: { size: 12, weight: 'bold' },
                displayColors: false,
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#f1f5f9', borderDash: [5, 5] },
                border: { display: false },
                ticks: { font: { size: 10 }, color: '#94a3b8' }
            },
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: { font: { size: 10, weight: '600' }, color: '#64748b' }
            }
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-5">
            <div className="h-52">
                <Bar options={chartOptions} data={chartData} />
            </div>
        </motion.div>
    );
};

// ✅ NEW: Daily Standup Report Component
const DailyStandupReport = () => {
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchReports = useCallback(async () => {
        try {
            const res = await fetch('/api/reports/daily-standup');
            const data = await res.json();
            if (data.success) {
                setReports(data.reports);
            }
        } catch (error) {
            console.error("Failed to fetch standup reports:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReports();
        const interval = setInterval(fetchReports, 60000);
        return () => clearInterval(interval);
    }, [fetchReports]);

    return (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/30">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-xl text-green-600"><Calendar size={18} /></div>
                    Team Daily Updates
                </h2>
            </div>
            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <div className="flex justify-center py-10"><ButtonLoader /></div>
                ) : reports.length > 0 ? (
                    reports.map((report, idx) => (
                        <motion.div
                            key={report._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100"
                        >
                            <div className="flex-shrink-0">
                                <Image src={report.user.avatar} alt={report.user.name} width={40} height={40} className="rounded-xl object-cover shadow-sm" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-bold text-sm text-slate-800">{report.user.name}</h4>
                                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                                        {new Date(report.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="bg-slate-50 p-2.5 rounded-xl rounded-tl-none text-xs text-slate-600 leading-relaxed border border-slate-100">
                                    {report.description}
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="text-center py-10">
                        <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Clock className="text-slate-300" size={24} />
                        </div>
                        <p className="font-semibold text-sm text-slate-600">No updates yet.</p>
                        <p className="text-xs text-slate-400">Updates appear when team members check out.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- UPDATED CHAT COMPONENTS ---

const DeleteChatModal = ({ onConfirm, onClose, isDeleting }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[101] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
  >
    <motion.div
      initial={{ scale: 0.95, y: 20, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0.95, y: 20, opacity: 0 }}
      className="bg-white w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl"
    >
      <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-6">
        <AlertTriangle className="text-rose-500" />
      </div>
      <h3 className="text-xl font-bold mb-2">Delete Conversation?</h3>
      <p className="text-sm text-slate-500 mb-8">
        This will permanently remove all messages. This action cannot be undone.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="py-3 rounded-xl border font-bold hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          className="py-3 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600"
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </motion.div>
  </motion.div>
);


const ChatSidebar = ({
    conversations,
    users,
    onSelect,
    selectedConvId,
    currentUser,
    onDelete
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const sortedConversations = useMemo(() => {
        return [...conversations].sort(
            (a, b) =>
                (b.unreadCount || 0) - (a.unreadCount || 0) ||
                new Date(b.lastMessage?.createdAt || 0) -
                    new Date(a.lastMessage?.createdAt || 0)
        );
    }, [conversations]);

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return [];
        return users.filter(
            u =>
                u._id !== currentUser._id &&
                u.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm, currentUser._id]);

    return (
        <div className="w-full h-full flex flex-col bg-white border-r border-slate-100">
            {/* Search */}
            <div className="p-6 pb-2">
                <div className="relative group">
                    <Search
                        size={18}
                        className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
                    />
                    <input
                        type="text"
                        placeholder="Search team..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all placeholder-slate-400"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar space-y-1">
                {searchTerm ? (
                    <>
                        <h3 className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                            Results
                        </h3>

                        {filteredUsers.length > 0 ? (
                            filteredUsers.map(user => (
                                <div
                                    key={user._id}
                                    onClick={() => onSelect(user)}
                                    className="p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-2xl transition-all"
                                >
                                    {/* Avatar */}
                                    <div className="relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0">
                                        <Image
                                            src={user.avatar}
                                            alt={user.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>

                                    <p className="font-bold text-slate-700 text-sm">
                                        {user.name}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="p-4 text-center text-sm text-slate-400 italic">
                                No users found.
                            </p>
                        )}
                    </>
                ) : (
                    <>
                        <h3 className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                            Recent Chats
                        </h3>

                        {sortedConversations.map(conv => {
                            const otherUser = conv.participants.find(
                                p => p._id !== currentUser._id
                            );
                            if (!otherUser) return null;

                            const isUnread = conv.unreadCount > 0;
                            const isSelected = selectedConvId === conv._id;

                            return (
                                <div
                                    key={conv._id}
                                    onClick={() => onSelect(otherUser, conv)}
                                    className={`group relative p-3 flex items-center gap-4 cursor-pointer rounded-2xl transition-all duration-200 ${
                                        isSelected
                                            ? 'bg-emerald-50/80 shadow-sm'
                                            : 'hover:bg-slate-50'
                                    }`}
                                >
                                    {/* Avatar */}
                                    <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                                        <Image
                                            src={otherUser.avatar}
                                            alt={otherUser.name}
                                            fill
                                            className={`object-cover transition-all ${
                                                isUnread
                                                    ? 'ring-2 ring-emerald-400 ring-offset-2'
                                                    : ''
                                            }`}
                                        />

                                        {isUnread && (
                                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <p
                                                className={`font-bold truncate text-sm ${
                                                    isUnread
                                                        ? 'text-slate-900'
                                                        : 'text-slate-700'
                                                }`}
                                            >
                                                {otherUser.name}
                                            </p>

                                            <span className="text-[10px] text-slate-400 font-medium">
                                                {conv.lastMessage &&
                                                    formatDistanceToNow(
                                                        new Date(
                                                            conv.lastMessage.createdAt
                                                        ),
                                                        { addSuffix: false }
                                                    )}
                                            </span>
                                        </div>

                                        <p
                                            className={`text-xs truncate ${
                                                isUnread
                                                    ? 'text-slate-800 font-semibold'
                                                    : 'text-slate-500'
                                            }`}
                                        >
                                            {conv.lastMessage?.message ||
                                                'No messages yet'}
                                        </p>
                                    </div>

                                    {/* Delete */}
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            onDelete(conv._id);
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all scale-90 hover:scale-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
};


const ChatBox = ({ selectedUser, conversation, currentUser, onMessageSent, onBack }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  /* ---------------- FETCH MESSAGES ---------------- */
  useEffect(() => {
    let mounted = true;

    const loadMessages = async () => {
      if (!conversation) {
        setMessages([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/chat/messages?conversationId=${conversation._id}`);
        const data = await res.json();
        if (mounted && data.success) {
          setMessages(data.messages.map(m => ({ ...m, status: 'sent' })));
        }
      } catch {
        toast.error('Failed to load messages');
      } finally {
        mounted && setIsLoading(false);
      }
    };

    loadMessages();

    let pusher, channel;
    if (conversation) {
      pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      });

      channel = pusher.subscribe(`chat-${conversation._id}`);
      channel.bind('new-message', data => {
        if (data.senderId._id !== currentUser._id) {
          setMessages(prev => [...prev, { ...data, status: 'sent' }]);
        }
      });
    }

    return () => {
      mounted = false;
      if (pusher && conversation) {
        pusher.unsubscribe(`chat-${conversation._id}`);
        pusher.disconnect();
      }
    };
  }, [conversation, currentUser._id]);

  /* ---------------- MARK READ ---------------- */
  useEffect(() => {
    if (!conversation?.unreadCount) return;
    fetch('/api/chat/mark-as-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: conversation._id }),
    }).then(onMessageSent);
  }, [conversation, onMessageSent]);

  /* ---------------- AUTO SCROLL (FAST) ---------------- */
  useEffect(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [messages.length]);

  /* ---------------- SEND MESSAGE ---------------- */
  const handleSendMessage = useCallback(async e => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text) return;

    const tempId = `temp_${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        _id: tempId,
        senderId: currentUser,
        message: text,
        createdAt: new Date().toISOString(),
        status: 'sending',
      },
    ]);

    setNewMessage('');

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: selectedUser._id, message: text }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error();

      setMessages(prev =>
        prev.map(m => (m._id === tempId ? { ...result.data, status: 'sent' } : m))
      );
      onMessageSent();
    } catch {
      setMessages(prev =>
        prev.map(m => (m._id === tempId ? { ...m, status: 'failed' } : m))
      );
    }
  }, [newMessage, currentUser, selectedUser, onMessageSent]);

  /* ---------------- EMPTY STATE ---------------- */
  if (!selectedUser) {
    return (
      <div className="hidden md:flex flex-1 items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={36} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-semibold">Select a user to start chatting</p>
          <p className="text-xs text-slate-400 mt-1">Ultra-fast • Secure • Premium</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-white">

      {/* HEADER */}
      <header className="flex items-center gap-4 p-4 border-b bg-white/90 backdrop-blur sticky top-0 z-10">
        {isMobile && (
          <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100">
            <ArrowLeft size={18} />
          </button>
        )}

        <div className="relative w-11 h-11">
          <Image
            src={selectedUser.avatar}
            fill
            className="rounded-full object-cover ring-2 ring-emerald-500"
            alt={selectedUser.name}
          />
        </div>

        <div>
          <h3 className="font-bold text-slate-800">{selectedUser.name}</h3>
          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
            {selectedUser.role}
          </span>
        </div>
      </header>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
        {messages.length === 0 && !isLoading && (
          <div className="text-center mt-24">
            <p className="text-slate-400 font-medium">No messages yet</p>
            <p className="text-xs text-slate-300">Say hello 👋</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.senderId._id === currentUser._id;
          const prev = messages[i - 1];
          const showAvatar = !isMe && (!prev || prev.senderId._id !== msg.senderId._id);

          return (
            <div
              key={msg._id}
              className={`flex items-end gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              {!isMe && (
                <div className="w-8 h-8">
                  {showAvatar && (
                    <Image
                      src={msg.senderId.avatar}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                      alt=""
                    />
                  )}
                </div>
              )}

              <div
                className={`px-4 py-2 text-sm max-w-[75%] shadow-sm ${
                  isMe
                    ? 'bg-emerald-600 text-white rounded-2xl rounded-br-sm'
                    : 'bg-white border rounded-2xl rounded-bl-sm'
                }`}
              >
                {msg.message}
                <div className="text-[10px] opacity-60 mt-1 text-right">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <footer className="p-4 border-t bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
          <input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 px-4 py-3 rounded-full bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <button
            disabled={!newMessage.trim()}
            className="p-3 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition"
          >
            <Send size={18} />
          </button>
        </form>
      </footer>
    </div>
  );
};

const ChatView = ({ user, onBack }) => {
    const [conversations, setConversations] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingConvId, setDeletingConvId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const isMobile = useMediaQuery('(max-width: 767px)');
    const [activeChatUser, setActiveChatUser] = useState(null);

    const fetchChatData = useCallback(async () => {
        try {
            const res = await fetch('/api/chat/messages');
            const data = await res.json();
            if (data.success) {
                setConversations(data.conversations);
                setAllUsers(data.users);
            }
        } catch (error) {
            toast.error("Failed to load chat data.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchChatData();
    }, [fetchChatData]);

    const handleSelectConversation = (user, conversation = null) => {
        setSelectedUser(user);
        const existingConv = conversation || conversations.find(c => c.participants.some(p => p._id === user._id));
        setSelectedConversation(existingConv);
        if (isMobile) {
            setActiveChatUser(user);
        }
    };

    const handleDeleteConversation = async () => {
        if (!deletingConvId) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/chat/messages?conversationId=${deletingConvId}`, {
                method: 'DELETE'
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);

            toast.success("Conversation deleted.");
            setConversations(prev => prev.filter(c => c._id !== deletingConvId));
            if (selectedConversation?._id === deletingConvId) {
                setSelectedConversation(null);
                setSelectedUser(null);
                if (isMobile) setActiveChatUser(null);
            }
        } catch (err) {
            toast.error(err.message || "Failed to delete conversation.");
        } finally {
            setIsDeleting(false);
            setDeletingConvId(null);
        }
    };

    const handleBackToSidebar = () => {
        setActiveChatUser(null);
        setTimeout(() => {
            setSelectedUser(null);
            setSelectedConversation(null);
        }, 300);
    };

    const slideAnimation = {
        initial: { x: '100%' },
        animate: { x: 0 },
        exit: { x: '100%' },
        transition: { type: 'spring', stiffness: 400, damping: 40 }
    };

    return (
        <>
            <AnimatePresence>
                {deletingConvId && (
                    <DeleteChatModal
                        onClose={() => setDeletingConvId(null)}
                        onConfirm={handleDeleteConversation}
                        isDeleting={isDeleting}
                    />
                )}
            </AnimatePresence>
            <div className="fixed inset-0 z-50 bg-white flex flex-col md:relative md:inset-auto md:h-[calc(100vh-8rem)] md:rounded-[2rem] md:shadow-xl md:border md:border-slate-100 overflow-hidden">
                <header className="p-4 border-b flex-shrink-0 flex items-center justify-between bg-white md:hidden">
                    <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold">
                        <ArrowLeft size={20} />
                        Dashboard
                    </button>
                    <div className="flex items-center gap-2">
                        <Image src={user.avatar} width={36} height={36} className="rounded-full object-cover" alt="User Avatar" />
                    </div>
                </header>
                <header className="p-5 px-6 border-b border-slate-100 flex-shrink-0 hidden md:flex items-center justify-between bg-white">
                    <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3"><MessageSquare className="text-emerald-500" fill="currentColor" /> Messages</h2>
                    <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold text-sm bg-slate-50 hover:bg-emerald-50 px-4 py-2 rounded-xl transition-all">
                        <ArrowLeft size={16} />
                        Back to Dashboard
                    </button>
                </header>
                <div className="flex flex-1 overflow-hidden relative">
                    <div className={`w-full md:w-96 h-full flex-col bg-white ${isMobile && activeChatUser ? 'hidden' : 'flex'}`}>
                        <ChatSidebar conversations={conversations} users={allUsers} onSelect={handleSelectConversation} selectedConvId={selectedConversation?._id} currentUser={user} onDelete={setDeletingConvId} />
                    </div>

                    <div className="flex-1 hidden md:flex border-l border-slate-100">
                        {selectedUser ? <ChatBox selectedUser={selectedUser} conversation={selectedConversation} currentUser={user} onMessageSent={fetchChatData} onBack={() => { }} /> : <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50"><div className="bg-white p-8 rounded-full shadow-sm mb-4"><MessageSquare size={48} className="text-slate-200" /></div><p className="text-slate-400 font-semibold">Select a team member to start chatting</p></div>}
                    </div>

                    <AnimatePresence>
                        {isMobile && activeChatUser && (
                            <motion.div key="chatbox" className="absolute inset-0 z-20 bg-white" variants={slideAnimation} initial="initial" animate="animate" exit="exit">
                                <ChatBox selectedUser={selectedUser} conversation={selectedConversation} currentUser={user} onMessageSent={fetchChatData} onBack={handleBackToSidebar} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
};

const DashboardSkeleton = () => (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-pulse p-4">
        <div className="xl:col-span-4 space-y-8">
            <div className="h-80 bg-white rounded-[2rem] p-8 space-y-6"><div className="flex items-center space-x-6"><div className="h-24 w-24 bg-slate-100 rounded-full"></div><div className="space-y-3 flex-1"><div className="h-6 w-3/4 bg-slate-100 rounded-lg"></div><div className="h-4 w-1/2 bg-slate-100 rounded-lg"></div></div></div><div className="h-24 w-full bg-slate-50 rounded-2xl mt-6"></div></div>
            <div className="h-56 bg-white rounded-[2rem] p-8 space-y-4"><div className="h-6 w-1/3 bg-slate-100 rounded-lg"></div><div className="h-32 w-full bg-slate-50 rounded-2xl"></div></div>
        </div>
        <div className="xl:col-span-8 space-y-8">
            <div className="bg-white rounded-[2rem] p-8"><div className="flex justify-between items-center mb-8"><div className="h-8 w-1/4 bg-slate-100 rounded-xl"></div><div className="h-10 w-32 bg-slate-100 rounded-xl"></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ height: '500px' }}><div className="bg-slate-50 h-full rounded-2xl"></div><div className="bg-slate-50 h-full rounded-2xl"></div><div className="bg-slate-50 h-full rounded-2xl"></div></div></div>
        </div>
    </div>
);


// --- Main Component ---
export default function Dashboard({ user }) {
    const router = useRouter();
    const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' or 'chat'
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [showSplash, setShowSplash] = useState(true); // Control splash screen duration
    const [attendance, setAttendance] = useState([]);
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [activeAttendance, setActiveAttendance] = useState(null);
    const [checkInTime, setCheckInTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState('');
    const [isOnBreak, setIsOnBreak] = useState(false);
    const [activeBreakStartTime, setActiveBreakStartTime] = useState(null);
    const [elapsedBreakTime, setElapsedBreakTime] = useState('');
    const [loadingStates, setLoadingStates] = useState({});
    const [currentTime, setCurrentTime] = useState(new Date());
    const [tasks, setTasks] = useState([]);
    const [profileUser, setProfileUser] = useState(user);
    const [isUploading, setIsUploading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [notes, setNotes] = useState([]);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [editingNote, setEditingNote] = useState(null);
    const [isSubmittingNote, setIsSubmittingNote] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [taskToSubmit, setTaskToSubmit] = useState(null);
    const [isPersonalTaskModalOpen, setIsPersonalTaskModalOpen] = useState(false);
    const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);

    const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);

    const notificationDropdownRef = useRef(null);
    const userDropdownRef = useRef(null);
    const isDesktop = useMediaQuery('(min-width: 768px)');

    // --- RE-IMPLEMENTED DRAG & DROP LOGIC ---
    // Use PointerSensor for robust handling of both mouse and touch
    // activationConstraint ensures a 'click' is not mistaken for a 'drag'
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Find the active task
        const activeTask = tasks.find(t => t._id === activeId);
        if (!activeTask) return;

        let destinationStatus = null;

        // 1. Check if dropped over a Task ID
        const overTask = tasks.find(t => t._id === overId);
        if (overTask) {
            destinationStatus = overTask.status;
        }
        // 2. Check if dropped over a Column ID (we used title as ID in useDroppable)
        else if (['To Do', 'In Progress', 'Completed'].includes(overId)) {
            destinationStatus = overId;
        }

        if (!destinationStatus || activeTask.status === destinationStatus) return;

        // Prevent moving to 'Completed' via drag (must use Submit Work)
        if (destinationStatus === 'Completed') {
            toast.error('Please use the "Submit Work" button to complete a task.');
            return;
        }

        // Prevent moving completed tasks
        if (activeTask.status === 'Completed') {
            toast.error('Completed tasks cannot be moved.');
            return;
        }

        // Optimistic UI Update
        const originalTasks = [...tasks];
        setTasks(tasks.map(t => t._id === active.id ? { ...t, status: destinationStatus } : t));

        try {
            const res = await fetch('/api/tasks/update-status', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId: active.id, newStatus: destinationStatus }),
            });

            if (!res.ok) throw new Error(await handleApiError(res));

            toast.success(`Task moved to "${destinationStatus}"`);
        } catch (err) {
            toast.error(err.message);
            // Revert on error
            setTasks(originalTasks);
        }
    };

    // Ensure Splash Screen shows for at least 1.5s for smoother UX
    useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const res = await fetch('/api/chat/messages?getTotalUnread=true');
                const data = await res.json();
                if (data.success) {
                    setTotalUnreadMessages(data.totalUnreadCount);
                }
            } catch (error) {
                console.error("Failed to fetch unread message count");
            }
        };
        fetchUnreadCount();
    }, [activeView]);

    const fetchDashboardData = useCallback(async () => {
        try {
            const res = await fetch('/api/dashboard/data');
            if (!res.ok) throw new Error('Failed to fetch dashboard data');
            const data = await res.json();
            setAttendance(data.initialAttendance || []);
            setTasks(data.initialTasks || []);
            setNotes(data.initialNotes || []);
            setNotifications(data.initialNotifications || []);
            if (data.activeCheckIn) {
                setActiveAttendance(data.activeCheckIn);
                setCheckInTime(data.activeCheckIn.checkInTime);
                setDescription(data.activeCheckIn.description || '');
                setIsOnBreak(data.initialIsOnBreak);
                setActiveBreakStartTime(data.activeBreakStartTime);
            } else {
                setActiveAttendance(null);
                setCheckInTime(null);
                setDescription('');
                setIsOnBreak(false);
                setActiveBreakStartTime(null);
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setIsDataLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const unreadNotifications = useMemo(() => notifications.filter(n => !n.isRead), [notifications]);

    const taskColumns = useMemo(() => {
        const columns = { 'To Do': [], 'In Progress': [], 'Completed': [] };
        tasks.forEach(task => { if (columns[task.status]) columns[task.status].push(task); });
        columns['Completed'].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
        return columns;
    }, [tasks]);

    useEffect(() => { const handleScroll = () => setIsScrolled(window.scrollY > 10); window.addEventListener('scroll', handleScroll); return () => window.removeEventListener('scroll', handleScroll); }, []);
    useEffect(() => { if (checkInTime) { const timer = setInterval(() => setElapsedTime(formatElapsedTime(checkInTime)), 1000); return () => clearInterval(timer); } else { setElapsedTime(''); } }, [checkInTime]);
    useEffect(() => { const timer = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(timer); }, []);

    useEffect(() => {
        if (isOnBreak && activeBreakStartTime) {
            const timer = setInterval(() => {
                setElapsedBreakTime(formatElapsedTime(activeBreakStartTime));
            }, 1000);
            return () => clearInterval(timer);
        } else {
            setElapsedBreakTime('');
        }
    }, [isOnBreak, activeBreakStartTime]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAction = async (action, actionFn, successMessage) => {
        setLoadingStates(prev => ({ ...prev, [action]: true }));
        const toastId = toast.loading(`Processing...`);
        try {
            await actionFn();
            toast.success(successMessage, { id: toastId });
        } catch (err) {
            toast.error(err.message || `Failed to process ${action}.`, { id: toastId });
        } finally {
            setLoadingStates(prev => ({ ...prev, [action]: false }));
        }
    };

    const handleCheckIn = (location) => handleAction(`check-in`, async () => {
        const res = await fetch('/api/attendance/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workLocation: location })
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message);

        setActiveAttendance(result.data);
        setCheckInTime(result.data.checkInTime);
        setAttendance(prev => [result.data, ...prev]);
    }, `Checked in from ${location}!`);

    const handleCheckOut = () => handleAction('checkout', async () => {
        if (!description.trim()) throw new Error('Work description is required.');
        const res = await fetch('/api/attendance/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description, attendanceId: activeAttendance._id }) });
        if (!res.ok) throw new Error(await handleApiError(res));
        const { data } = await res.json();
        setActiveAttendance(null); setCheckInTime(null); setDescription(''); setIsOnBreak(false); setActiveBreakStartTime(null);
        setAttendance(prev => prev.map(att => att._id === data._id ? data : att));
    }, 'Checked out successfully!');

    const handleBreakIn = () => handleAction('break-in', async () => {
        const res = await fetch('/api/attendance/break-in', { method: 'POST' });
        if (!res.ok) throw new Error(await handleApiError(res));
        setIsOnBreak(true);
        await fetchDashboardData();
    }, 'Break started.');

    const handleBreakOut = () => handleAction('break-out', async () => {
        const res = await fetch('/api/attendance/break-out', { method: 'POST' });
        if (!res.ok) throw new Error(await handleApiError(res));
        setIsOnBreak(false);
        setActiveBreakStartTime(null);
    }, 'Resumed work.');

    const handleLogout = async () => {
        await fetch('/api/auth/logout');

        toast.success('Logged out successfully');
        setTimeout(() => {
            router.push('/login');
        }, 800);
    }; const handleUpdateTaskStatus = async (taskId, newStatus) => { setError(''); try { const res = await fetch('/api/tasks/update-status', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId, newStatus }), }); if (!res.ok) throw new Error(await handleApiError(res)); await fetchDashboardData(); toast.success(`Task marked as '${newStatus}'`); } catch (err) { setError(err.message); toast.error(err.message); } };
    const handleAvatarUpload = async (base64Image) => { setIsUploading(true); setError(''); try { const res = await fetch('/api/user/upload-avatar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64Image }), }); if (!res.ok) throw new Error(await handleApiError(res)); const data = await res.json(); setProfileUser(prev => ({ ...prev, avatar: data.avatar })); toast.success('Avatar updated!'); } catch (err) { setError(err.message); toast.error(err.message); } finally { setIsUploading(false); } };
    const handleFileChange = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.readAsDataURL(file); reader.onloadend = () => { handleAvatarUpload(reader.result); }; reader.onerror = () => { toast.error("Could not read file."); }; };
    const handleCreateNote = async (e) => { e.preventDefault(); if (!newNoteContent.trim()) return; setIsSubmittingNote(true); setError(''); try { const res = await fetch('/api/notes/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: newNoteContent }), }); if (!res.ok) throw new Error(await handleApiError(res)); const result = await res.json(); setNotes(prevNotes => [result.data, ...prevNotes]); setNewNoteContent(''); toast.success('Note saved.'); } catch (err) { setError(err.message); toast.error(err.message); } finally { setIsSubmittingNote(false); } };
    const handleUpdateNote = async () => { if (!editingNote || !editingNote.content.trim()) return; setIsSubmittingNote(true); setError(''); try { const res = await fetch('/api/notes/edit', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ noteId: editingNote._id, content: editingNote.content }), }); if (!res.ok) throw new Error(await handleApiError(res)); const result = await res.json(); setNotes(prevNotes => prevNotes.map(n => n._id === editingNote._id ? result.data : n)); setEditingNote(null); toast.success('Note updated.'); } catch (err) { setError(err.message); toast.error(err.message); } finally { setIsSubmittingNote(false); } };
    const handleDeleteNote = async (noteId) => { if (!window.confirm('Are you sure you want to delete this note?')) return; setError(''); try { const res = await fetch('/api/notes/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ noteId }), }); if (!res.ok) throw new Error(await handleApiError(res)); setNotes(prevNotes => prevNotes.filter(n => n._id !== noteId)); toast.success('Note deleted.'); } catch (err) { setError(err.message); toast.error(err.message); } };
    const handleMarkAsRead = async () => { if (unreadNotifications.length === 0) return; try { await fetch('/api/notification/mark-as-read', { method: 'POST' }); setNotifications(prev => prev.map(n => ({ ...n, isRead: true }))); } catch (err) { console.error(err); toast.error("Failed to mark notifications as read."); } };

    const handleCommentAdded = (taskId, newComment) => {
        setTasks(currentTasks =>
            currentTasks.map(task => {
                if (task._id === taskId) {
                    const updatedComments = task.comments ? [...task.comments, newComment] : [newComment];
                    if (selectedTaskDetails && selectedTaskDetails._id === taskId) {
                        setSelectedTaskDetails(prev => ({ ...prev, comments: updatedComments }));
                    }
                    return { ...task, comments: updatedComments };
                }
                return task;
            })
        );
    };

    // Show Splash Screen logic - Replaces "Loading" state
    if (showSplash || isDataLoading) {
        return (
            <AnimatePresence mode="wait">
                <DashboardEntryLoader key="loader" userName={user.name} />
            </AnimatePresence>
        );
    }

    if (activeView === 'chat') {
        return (
            <div className="min-h-screen bg-slate-50 md:p-6 lg:p-10">
                <ChatView user={user} onBack={() => setActiveView('dashboard')} />
            </div>
        );
    }

    return (
        <>
            <AnimatePresence>
                {selectedTaskDetails && <TaskDetailsModal key={selectedTaskDetails._id} task={selectedTaskDetails} onClose={() => setSelectedTaskDetails(null)} onCommentAdded={handleCommentAdded} currentUser={user} />}
                {taskToSubmit && <SubmitWorkModal key="submit-modal" task={taskToSubmit} onClose={() => setTaskToSubmit(null)} onWorkSubmitted={fetchDashboardData} />}
                {isPersonalTaskModalOpen && <PersonalTaskModal key="personal-task-modal" onClose={() => setIsPersonalTaskModalOpen(false)} onTaskCreated={fetchDashboardData} />}
                {!isDesktop && isNotificationOpen && (
                    <MobileNotificationPanel key="mobile-notif-panel" notifications={notifications} unreadCount={unreadNotifications.length} handleMarkAsRead={handleMarkAsRead} onClose={() => setIsNotificationOpen(false)} />
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-emerald-100 selection:text-emerald-800"
            >

                {/* Subtle Background Elements */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-100/30 rounded-full blur-[120px] opacity-60 will-change-transform"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100/30 rounded-full blur-[120px] opacity-60 will-change-transform"></div>
                </div>

                <div className="relative z-10">
                    {/* Header */}
                    <header className={`sticky top-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-xl shadow-md border-b border-white/20' : 'bg-transparent'}`}>
                        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
                            <div className="flex justify-between items-center h-20 sm:h-24">
                                {/* Logo Area */}
                                <div className="flex items-center space-x-4">
                                    <Link href="/dashboard" className="flex items-center gap-3 sm:gap-4 group">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-emerald-200 blur-md rounded-full opacity-0 group-hover:opacity-50 transition-opacity"></div>
                                            <Image src="/logo.png" alt="GeckoWorks Logo" width={55} height={55} className="" style={{ width: 'auto', height: 'auto' }} />
                                        </div>
                                        <div>
                                            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                                                Dashboard
                                            </h1>

                                            <p className="text-[10px] sm:text-xs text-slate-500 font-medium hidden sm:block">
                                                {getGreeting()}, <span className="font-semibold text-slate-700">{user.name.split(' ')[0]}</span>
                                            </p>
                                        </div>

                                    </Link>
                                </div>

                                {/* Controls Area */}
                                <div className="flex items-center gap-2 sm:gap-6">

                                    {/* Date/Time Pill */}
                                    <div className="hidden lg:flex items-center gap-6 text-sm text-slate-600 bg-white/70 backdrop-blur-md border border-white/50 shadow-sm px-6 py-2.5 rounded-2xl">
                                        <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-emerald-500" /><span className="font-semibold">{currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}</span></div>
                                        <div className="h-4 w-px bg-slate-200"></div>
                                        <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-emerald-500" /><span className="font-mono font-bold">{currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span></div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Chat Button */}
                                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setActiveView('chat')} className="relative p-2.5 sm:p-3 text-slate-500 bg-white hover:bg-emerald-50 hover:text-emerald-600 rounded-2xl shadow-sm border border-slate-100 transition-all" title="Messages">
                                            <MessageSquare className="h-5 w-5" />
                                            {totalUnreadMessages > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">{totalUnreadMessages}</span>}
                                        </motion.button>

                                        {/* Notification Button */}
                                        <div ref={notificationDropdownRef} className="relative">
                                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsNotificationOpen(prev => !prev)} className={`relative p-2.5 sm:p-3 rounded-2xl shadow-sm border border-slate-100 transition-all ${isNotificationOpen ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'}`} title="Notifications">
                                                <Bell className="h-5 w-5" />
                                                {unreadNotifications.length > 0 && (<span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">{unreadNotifications.length}</span>)}
                                            </motion.button>
                                            <AnimatePresence>
                                                {isDesktop && isNotificationOpen && (<DesktopNotificationPanel notifications={notifications} unreadCount={unreadNotifications.length} handleMarkAsRead={handleMarkAsRead} onClose={() => setIsNotificationOpen(false)} />)}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* Profile Dropdown */}
                                    <div ref={userDropdownRef} className="relative pl-2 ml-2">
    {/* TRIGGER BUTTON - Clean, Pill Shape, No Borders */}
    <motion.button
        whileHover={{ scale: 1.02, backgroundColor: "rgba(241, 245, 249, 0.6)" }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`group flex items-center gap-3 pr-3 pl-1.5 py-1.5 rounded-full transition-all duration-300 focus:outline-none ${isDropdownOpen ? 'bg-slate-100 shadow-inner' : 'hover:bg-slate-50'}`}
    >
        {/* Avatar Wrapper - Enforces Perfect Circle */}
        <div className="relative">
            {/* Animated Glow Ring on Hover */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[2px]" />
            
            <div className="relative h-[44px] w-[44px] rounded-full ring-[3px] ring-white shadow-md overflow-hidden z-10">
                <Image
                    src={profileUser.avatar}
                    alt={profileUser.name}
                    fill
                    className="object-cover"
                    priority
                />
            </div>
            
            {/* Status Dot */}
            <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full z-20 shadow-sm" />
        </div>

        {/* User Info */}
        <div className="hidden md:flex flex-col items-start text-left mr-1">
            <span className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors leading-tight">
                {profileUser.name.split(' ')[0]}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">
                {profileUser.role}
            </span>
        </div>

        {/* Smooth Chevron */}
        <motion.div 
            animate={{ rotate: isDropdownOpen ? 180 : 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} // Custom Bezier for smoothness
            className="hidden md:flex items-center justify-center text-slate-400 group-hover:text-emerald-600"
        >
            <ChevronDown size={16} strokeWidth={2.5} />
        </motion.div>
    </motion.button>

    {/* DROPDOWN MENU */}
    <AnimatePresence>
        {isDropdownOpen && (
            <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 8, scale: 0.98, filter: "blur(4px)" }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-full right-0 mt-3 w-72 rounded-[28px] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1),0_10px_30px_-10px_rgba(0,0,0,0.05)] bg-white/90 backdrop-blur-2xl border border-white/60 z-50 origin-top-right overflow-hidden ring-1 ring-slate-900/5"
            >
                {/* Header with Subtle Gradient */}
                <div className="p-5 relative overflow-hidden bg-gradient-to-b from-white to-slate-50/50">
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="relative h-12 w-12 rounded-full ring-4 ring-white shadow-sm overflow-hidden shrink-0">
                            <Image src={profileUser.avatar} alt={profileUser.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 truncate text-base">{profileUser.name}</h4>
                            <p className="text-xs font-medium text-slate-500 truncate flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Online
                            </p>
                        </div>
                    </div>
                </div>

                {/* Menu List */}
                <div className="p-2 space-y-1 bg-white/50">
                    <Link href="/performance">
                        <motion.div 
                            whileHover={{ x: 4, backgroundColor: "rgba(255, 255, 255, 1)" }}
                            className="group flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all hover:shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]"
                        >
                            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                                <TrendingUp size={18} strokeWidth={2.5} />
                            </div>
                            <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900">Performance</span>
                        </motion.div>
                    </Link>

                    <Link href="/leaves">
                        <motion.div 
                             whileHover={{ x: 4, backgroundColor: "rgba(255, 255, 255, 1)" }}
                             className="group flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all hover:shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]"
                        >
                            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                                <FileText size={18} strokeWidth={2.5} />
                            </div>
                            <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900">Leave Requests</span>
                        </motion.div>
                    </Link>
                    
                    {/* Soft Separator */}
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-2 mx-6" />
                    
                    <button onClick={handleLogout} className="w-full">
                        <motion.div 
                             whileHover={{ x: 4, backgroundColor: "rgba(255, 241, 242, 1)" }}
                             className="group flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all"
                        >
                            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors duration-300">
                                <LogOut size={18} strokeWidth={2.5} />
                            </div>
                            <span className="text-sm font-bold text-rose-500 group-hover:text-rose-600">Sign Out</span>
                        </motion.div>
                    </button>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
</div>
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className={`max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10`}>
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8">

                            {/* Left Column (Profile, Actions, Notes) */}
                            <motion.div className="xl:col-span-4 space-y-6 sm:space-y-8" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>

                                {/* Profile & Actions Card */}
                                <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden relative">
                                    <div className="absolute top-0 w-full h-24 bg-gradient-to-r from-emerald-100 to-blue-50 opacity-50"></div>
                                    <div className="p-6 sm:p-8 pt-8 sm:pt-10 relative">
                                        <div className="flex flex-col items-center">
                                            <div className="relative mb-4 group">
                                                <div className="absolute inset-0 bg-emerald-300 rounded-3xl blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
                                                <Image src={profileUser.avatar} alt="Profile Picture" width={110} height={110} className="rounded-[2rem] object-cover aspect-square shadow-lg border-4 border-white relative z-10" priority style={{ width: 'auto', height: 'auto' }} />
                                                <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 z-20 bg-white text-slate-700 p-2.5 rounded-2xl cursor-pointer hover:bg-emerald-50 hover:text-emerald-600 transition shadow-lg border border-slate-100 transform hover:scale-110 active:scale-95">
                                                    <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isUploading} />
                                                    <>{isUploading ? <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div> : <Edit size={16} />}</>
                                                </label>
                                            </div>
                                            <h2 className="text-2xl font-extrabold text-slate-800">{profileUser.name}</h2>
                                            <p className="text-slate-500 font-medium">{profileUser.role}</p>
                                        </div>
                                    </div>

                                    <div className="px-6 sm:px-8 pb-8">
                                        {!checkInTime ? (
                                            <div className="text-center py-2 space-y-6">
                                                <div className="bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200">
                                                    <h3 className="font-bold text-slate-700 text-lg mb-4">Start your day</h3>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <motion.button whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }} onClick={() => handleCheckIn('Office')} disabled={loadingStates['check-in']} className="flex flex-col items-center justify-center gap-3 p-5 bg-white shadow-sm border border-slate-100 hover:border-emerald-200 hover:shadow-emerald-100/50 rounded-2xl transition-all disabled:opacity-70 group">
                                                            <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors"><Briefcase size={24} /></div>
                                                            <span className="font-bold text-slate-700 text-sm">Office</span>
                                                        </motion.button>
                                                        <motion.button whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }} onClick={() => handleCheckIn('Home')} disabled={loadingStates['check-in']} className="flex flex-col items-center justify-center gap-3 p-5 bg-white shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-indigo-100/50 rounded-2xl transition-all disabled:opacity-70 group">
                                                            <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-colors"><Home size={24} /></div>
                                                            <span className="font-bold text-slate-700 text-sm">Remote</span>
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                <div className={`text-center rounded-3xl p-6 border shadow-sm relative overflow-hidden transition-all duration-500 ${isOnBreak ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isOnBreak ? 'text-amber-600' : 'text-emerald-600'}`}>{isOnBreak ? 'On Break' : 'Currently Working'}</p>
                                                    <div className={`text-5xl font-extrabold tracking-tighter my-2 tabular-nums ${isOnBreak ? 'text-amber-700' : 'text-emerald-700'}`}>{elapsedTime}</div>
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${isOnBreak ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                        {isOnBreak ? <Coffee size={12} /> : <Clock size={12} />}
                                                        Checked in: {new Date(checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>

                                                    <AnimatePresence>
                                                        {isOnBreak && (
                                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 pt-4 border-t border-amber-200/50">
                                                                <p className="text-xs font-bold text-amber-600/70 mb-1">BREAK DURATION</p>
                                                                <p className="text-2xl font-bold text-amber-800">{elapsedBreakTime}</p>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                                <div className="bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                                                    <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What are you working on today?" rows={3} className="w-full px-4 py-3 border-none bg-transparent rounded-xl focus:ring-0 text-slate-700 placeholder-slate-400 text-sm resize-none" disabled={isOnBreak} />
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    {!isOnBreak ? (
                                                        <>
                                                            <motion.button whileTap={{ scale: 0.95 }} onClick={handleBreakIn} disabled={loadingStates['break-in']} className="flex items-center justify-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold py-3.5 px-4 rounded-2xl transition-all disabled:opacity-70">{loadingStates['break-in'] ? <ButtonLoader /> : <Coffee size={18} />} Break</motion.button>
                                                            <motion.button whileTap={{ scale: 0.95 }} onClick={handleCheckOut} disabled={loadingStates['checkout']} className="flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3.5 px-4 rounded-2xl transition-all disabled:opacity-70 shadow-lg shadow-rose-200">{loadingStates['checkout'] ? <ButtonLoader /> : <LogOut size={18} />} Check Out</motion.button>
                                                        </>
                                                    ) : (
                                                        <motion.button whileTap={{ scale: 0.95 }} onClick={handleBreakOut} disabled={loadingStates['break-out']} className="col-span-2 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-2xl transition-all disabled:opacity-70 shadow-lg shadow-emerald-200">{loadingStates['break-out'] ? <ButtonLoader /> : <Play size={18} />} Resume Work</motion.button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <MyStatsWidget tasks={tasks} attendance={attendance} />
                                <WorkHoursChartCard attendance={attendance} />

                                {/* Notes Section */}
                                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden relative z-10">
                                    <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                                        <h2 className="text-lg font-bold text-slate-800">Quick Notes</h2>
                                        <div className="bg-yellow-100 text-yellow-600 p-1.5 rounded-lg"><Edit size={16} /></div>
                                    </div>
                                    <div className="p-6">
                                        <form onSubmit={handleCreateNote} className="mb-6 relative">
                                            <textarea value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} placeholder="Draft notes to remember..." rows="3" className="w-full pl-4 pr-12 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-yellow-200 transition-all resize-none placeholder-slate-400" />
                                            <button type="submit" disabled={isSubmittingNote || !newNoteContent.trim()} className="absolute right-2 bottom-2 p-2 bg-yellow-400 text-yellow-900 rounded-xl hover:bg-yellow-500 disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-sm"><Plus size={18} /></button>
                                        </form>
                                        <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                                            <AnimatePresence>
                                                {notes.map((note) => (
                                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} key={note._id} className="p-4 bg-yellow-50/50 hover:bg-yellow-50 rounded-2xl border border-yellow-100 group transition-colors relative z-0">
                                                        {editingNote?._id === note._id ? (
                                                            <div className="space-y-2">
                                                                <textarea value={editingNote.content} onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })} className="w-full p-2 bg-white border border-yellow-200 rounded-xl text-sm" rows="3" />
                                                                <div className="flex items-center gap-2 justify-end">
                                                                    <button onClick={() => setEditingNote(null)} className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg"><X size={16} /></button>
                                                                    <button onClick={handleUpdateNote} disabled={isSubmittingNote} className="p-1.5 text-white bg-green-500 hover:bg-green-600 rounded-lg shadow-sm"><Save size={16} /></button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="relative">
                                                                <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">{note.content}</p>
                                                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-yellow-200/50">
                                                                    <p className="text-[10px] font-bold text-yellow-700/60 uppercase">{formatEnglishDate(note.createdAt)}</p>
                                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button onClick={() => setEditingNote(note)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={14} /></button>
                                                                        <button onClick={() => handleDeleteNote(note._id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                            {notes.length === 0 && <div className="text-center py-8 opacity-50"><FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" /><p className="text-xs text-slate-400">Empty notepad</p></div>}
                                        </div>
                                    </div>
                                </div>

                            </motion.div>

                            {/* Right Column (Tasks & Reports) */}
                            <motion.div className="xl:col-span-8 space-y-6 sm:space-y-8" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>

                                {/* Task Board */}
                                <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                                    <div className="px-6 sm:px-8 py-5 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/30">
                                        <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-3">
                                            <div className="bg-green-600 text-white p-2 rounded-xl"><Briefcase size={20} /></div>
                                            Task Board
                                        </h2>
                                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={() => setIsPersonalTaskModalOpen(true)} className="flex items-center gap-2 text-sm font-bold bg-emerald-50 text-emerald-600 px-5 py-2.5 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors shadow-sm">
                                            <Plus size={18} strokeWidth={3} /> Add Personal Task
                                        </motion.button>
                                    </div>

                                    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 p-6 min-h-[500px] bg-slate-50/30">
                                            <TaskColumn title="To Do" tasks={taskColumns['To Do']} onUpdateTaskStatus={handleUpdateTaskStatus} onOpenSubmitModal={setTaskToSubmit} onOpenDetails={setSelectedTaskDetails} />
                                            <TaskColumn title="In Progress" tasks={taskColumns['In Progress']} onUpdateTaskStatus={handleUpdateTaskStatus} onOpenSubmitModal={setTaskToSubmit} onOpenDetails={setSelectedTaskDetails} />

                                            {/* Completed Column (Compact & Limited) */}
                                            <div className="bg-white/40 p-1 rounded-3xl h-full flex flex-col">
                                                <div className="flex items-center justify-between mb-3 p-3 rounded-2xl bg-gradient-to-b from-emerald-50/50 to-transparent">
                                                    <h2 className="font-bold text-sm flex items-center gap-2 text-emerald-800">
                                                        <div className="bg-emerald-100 p-1.5 rounded-lg"><CheckCircle size={14} className="text-emerald-600" /></div>
                                                        Done
                                                    </h2>
                                                    <span className="text-[10px] font-bold bg-white shadow-sm text-emerald-600 px-2 py-0.5 rounded-lg border border-emerald-100">{taskColumns['Completed'].length}</span>
                                                </div>
                                                <div className="space-y-3 h-full overflow-y-auto px-1 pb-4 custom-scrollbar">
                                                    {taskColumns['Completed'].length > 0 ? (
                                                        <>
                                                            {taskColumns['Completed'].slice(0, 2).map(task => <CompletedTaskCard key={task._id} task={task} onOpenDetails={setSelectedTaskDetails} />)}
                                                            {taskColumns['Completed'].length > 2 && (
                                                                <Link href="/tasks/completed" className="block text-center mt-4 py-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors">
                                                                    View All {taskColumns['Completed'].length} Tasks
                                                                </Link>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50"><Star className="mx-auto h-8 w-8 text-slate-300 mb-1" /><p className="text-[10px] font-semibold text-slate-400">Empty</p></div>
                                                    )}
                                                </div>
                                            </div>

                                        </div>
                                    </DndContext>
                                </div>

                                <DailyStandupReport />

                                {/* Attendance History */}
                                <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                                    <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/30"><h2 className="text-xl font-bold text-slate-800">Attendance Log</h2></div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-100">
                                            <thead className="bg-slate-50/80">
                                                <tr>
                                                    <th className="px-8 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                                    <th className="px-8 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Location</th>
                                                    <th className="px-8 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Timeline</th>
                                                    <th className="px-8 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Duration</th>
                                                    <th className="px-8 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Break</th>
                                                    <th className="px-8 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Note</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-slate-50">
                                                {attendance.slice(0, 7).map((att) => (
                                                    <tr key={att._id} className="hover:bg-slate-50/80 transition-colors group">
                                                        <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-slate-700">{formatEnglishDate(att.checkInTime)}</td>
                                                        <td className="px-8 py-5 whitespace-nowrap text-sm">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${att.workLocation === 'Office' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                                                                {att.workLocation || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-5 whitespace-nowrap text-sm text-slate-500 font-medium font-mono text-[13px]">
                                                            {att.checkInTime && new Date(att.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            <span className="mx-2 text-slate-300">→</span>
                                                            {att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : <span className="text-emerald-500 font-bold animate-pulse">Active</span>}
                                                        </td>
                                                        <td className="px-8 py-5 whitespace-nowrap text-sm"><span className={`font-bold ${att.checkOutTime ? att.duration >= MIN_WORK_SECONDS ? 'text-emerald-600' : 'text-rose-500' : 'text-blue-600'}`}>{formatDuration(att.duration)}</span></td>
                                                        <td className="px-8 py-5 whitespace-nowrap text-sm text-slate-400">{formatDuration(att.totalBreakDuration)}</td>
                                                        <td className="px-8 py-5 text-sm text-slate-500 max-w-xs truncate group-hover:text-slate-800 transition-colors" title={att.description}>{att.description || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {attendance.length === 0 && <div className="text-center text-slate-400 py-12 italic">No attendance history found.</div>}
                                </div>
                            </motion.div>
                        </div>
                    </main>
                </div>
            </motion.div>
        </>
    );
}

export async function getServerSideProps(context) {
    const jwt = require('jsonwebtoken');
    const dbConnect = require('../../lib/dbConnect').default;
    const User = require('../../models/User').default;

    await dbConnect();
    const { token } = context.req.cookies;
    if (!token) {
        return { redirect: { destination: '/login', permanent: false } };
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password').lean();

        if (!user) {
            context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
            return { redirect: { destination: '/login', permanent: false } };
        }

        const roleRedirects = {
            'HR': '/hr/dashboard',
            'Project Manager': '/pm/dashboard',
            'Finance': '/finance/dashboard'
        };

        if (roleRedirects[user.role]) {
            return { redirect: { destination: roleRedirects[user.role], permanent: false } };
        }

        return { props: { user: JSON.parse(JSON.stringify(user)) } };

    } catch (error) {
        console.error("Dashboard Auth Error:", error.message);
        context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        return { redirect: { destination: '/login', permanent: false } };
    }
}
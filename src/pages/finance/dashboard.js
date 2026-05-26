import { useState, useMemo, useEffect, useRef, useCallback, memo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from 'next/image';
import {
    LogOut, ChevronDown, Plus, Minus, TrendingUp, TrendingDown,
    DollarSign, Send, CreditCard, Bell, ArrowUpRight, ArrowDownLeft,
    X as XIcon, CheckCircle, Download, Globe, Layers,
    Trash2, Target, Search, Grid, Activity,
    Facebook, Instagram, Linkedin, Video, AlertTriangle, AlertCircle,
    Eye, EyeOff, BarChart2
} from 'react-feather';
import { Sparkles, ArrowLeft } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
// Import the generator helper
import { generateFinancialStatement } from '../../utils/financeGenerator';

// --- Register ChartJS ---
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

// --- Animation Variants (GPU Optimized) ---
const fadeInUp = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } }
};

const modalBackdrop = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
};

const modalContent = {
    initial: { scale: 0.95, opacity: 0, y: 20 },
    animate: { scale: 1, opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } },
    exit: { scale: 0.95, opacity: 0, y: 10, transition: { duration: 0.15 } }
};

// --- Helper Functions & Haptic Feedback ---
let globalIsBalanceHidden = false;
const formatCurrency = (amount) => globalIsBalanceHidden ? 'Rs. ••••' : `Rs. ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(amount || 0)}`;
const formatUSD = (amount) => globalIsBalanceHidden ? '$ ••••' : `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(amount || 0)}`;

const triggerHaptic = (pattern = 50) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
            navigator.vibrate(pattern);
        } catch (e) {
            // Ignore fail-silent
        }
    }
};

const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    if (includeTime) { options.hour = '2-digit'; options.minute = '2-digit'; options.hour12 = true; }
    return date.toLocaleString('en-US', options);
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
};

// --- Sub-Components ---

// 1. Loader (Premium Visuals)
const DashboardEntryLoader = ({ userName }) => (
    <motion.div
        className="fixed inset-0 z-[100] bg-slate-50 flex flex-col items-center justify-center font-sans overflow-hidden perspective-[1000px]"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
        transition={{ duration: 0.8 }}
    >
        {/* 1. Ultra-Premium Background */}
        <div className="absolute inset-0 bg-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#10b98115_0%,transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        </div>

        {/* 2. Main Content Wrapper */}
        <div className="relative z-10 flex flex-col items-center justify-center">

            {/* 3. THE TILTED GLASS CARD (Hero Element) */}
            <motion.div
                initial={{ scale: 0.4, rotate: -20, opacity: 0, y: 100 }}
                animate={{ scale: 1, rotate: -6, opacity: 1, y: 0 }}
                transition={{
                    type: "spring",
                    stiffness: 100,
                    damping: 15,
                    mass: 1
                }}
                className="relative mb-12 md:mb-16"
            >
                {/* Intense Glow Behind */}
                <div className="absolute inset-0 bg-emerald-500/30 blur-[80px] rounded-full transform rotate-6 animate-pulse-slow"></div>

                {/* Glass Container - Tilted & Floating */}
                <motion.div
                    animate={{ y: [0, -15, 0], rotate: [-6, -4, -6] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="relative bg-white/40 backdrop-blur-[50px] p-8 md:p-14 rounded-[3rem] border border-white/80 shadow-[0_40px_80px_-20px_rgba(16,185,129,0.25)] ring-1 ring-white/60 transform-gpu"
                >
                    {/* Glossy Reflection Gradient */}
                    <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-white/80 via-transparent to-white/20 opacity-70 pointer-events-none"></div>

                    {/* The Logo Image - HUGE */}
                    <div className="relative w-36 h-36 md:w-60 md:h-60 lg:w-72 lg:h-72 filter drop-shadow-2xl">
                        <Image
                            src="/finance.png"
                            alt="Logo"
                            fill
                            className="object-contain"
                            priority
                            sizes="(max-width: 768px) 144px, 288px"
                        />
                    </div>
                </motion.div>

                {/* Decor elements around the card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute -right-6 -top-6 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white rotate-12"
                >
                    Version2.0
                </motion.div>
            </motion.div>

            {/* 4. Typography - Balancing the Tilt */}
            <div className="text-center relative z-20 space-y-4">
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8, ease: "backOut" }}
                    className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tighter"
                >
                    Welcome <span className="text-slate-300"> </span> <br className="md:hidden" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-400 to-emerald-600 bg-[length:200%_auto] animate-[gradient_4s_linear_infinite]">
                        {userName.split(' ')[0]}
                    </span>
                </motion.h2>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-center gap-3 text-xs md:text-sm font-bold text-slate-400 uppercase tracking-[0.4em]"
                >
                    <div className="h-px w-8 bg-slate-300"></div>
                    <span>Loding Your Financial Dashboard</span>
                    <div className="h-px w-8 bg-slate-300"></div>
                </motion.div>
            </div>

            {/* 5. Loader - Modern Pill */}
            <motion.div
                className="mt-12 md:mt-20 w-48 md:w-80 h-1.5 bg-slate-200/60 rounded-full overflow-hidden relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <motion.div
                    className="absolute inset-y-0 left-0 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />
            </motion.div>
        </div>
    </motion.div>
);

// 2. Unified Stats Widget (Unified Premium Box)
const UnifiedStatsWidget = memo(({ summary, balance, refetchData, isBalanceHidden, onTogglePrivacy }) => {
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async () => {
        triggerHaptic(60);
        setIsSyncing(true);
        await new Promise(resolve => setTimeout(resolve, 1200));
        await refetchData();
        setIsSyncing(false);
        triggerHaptic([40, 40]);
        toast.success("secure bank ledger synchronized and verified with 100% accuracy!", {
            id: 'bank-sync-toast',
            duration: 4000,
            icon: '🔒'
        });
    };

    return (
        <motion.div
            variants={fadeInUp}
            className="bg-white rounded-[2.5rem] p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 w-full transition-all duration-300 hover:shadow-xl hover:shadow-emerald-100/10 transform-gpu relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-8 -mt-8"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 divide-y-0 divide-x-0 sm:divide-x sm:divide-slate-100/80">
                {/* 1. Income */}
                <div className="group flex flex-col justify-between p-3 sm:p-4 rounded-2xl hover:bg-slate-50/50 transition-all duration-300 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                            <TrendingUp size={16} />
                        </div>
                        <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase truncate">Income</span>
                    </div>
                    <div className="flex items-baseline gap-1 min-w-0">
                        <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-800 truncate font-mono">
                            {formatCurrency(summary.totalIncome)}
                        </span>
                    </div>
                </div>

                {/* 2. Expense */}
                <div className="group flex flex-col justify-between p-3 sm:p-4 lg:pl-6 rounded-2xl hover:bg-slate-50/50 transition-all duration-300 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 group-hover:rotate-[-6deg] transition-transform duration-300">
                            <TrendingDown size={16} />
                        </div>
                        <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase truncate">Expense</span>
                    </div>
                    <div className="flex items-baseline gap-1 min-w-0">
                        <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-800 truncate font-mono">
                            {formatCurrency(summary.totalExpenses)}
                        </span>
                    </div>
                </div>

                {/* 3. Net Profit */}
                <div className="group flex flex-col justify-between p-3 sm:p-4 lg:pl-6 rounded-2xl hover:bg-slate-50/50 transition-all duration-300 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 group-hover:-translate-y-0.5 transition-transform duration-300">
                            <BarChart2 size={16} />
                        </div>
                        <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase truncate">Net Profit</span>
                    </div>
                    <div className="flex items-baseline gap-1 min-w-0">
                        <span className={`text-xl sm:text-2xl font-black tracking-tight truncate font-mono ${summary.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatCurrency(summary.netProfit)}
                        </span>
                    </div>
                </div>

                {/* 4. Bank Balance Widget */}
                <div className="group flex flex-col justify-between p-3 sm:p-4 lg:pl-6 rounded-2xl hover:bg-slate-50/50 transition-all duration-300 min-w-0 relative">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
                                <CreditCard size={16} />
                            </div>
                            <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase truncate">Bank Balance</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            {/* Sync Button */}
                            <button
                                onClick={handleSync}
                                disabled={isSyncing}
                                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg transition-all active:scale-90 border border-slate-200/50 shadow-sm bg-white cursor-pointer flex items-center justify-center"
                                title="Synchronize ledger"
                            >
                                <svg
                                    className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-500' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3.5"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                            </button>
                            {/* Privacy Toggle */}
                            <button
                                onClick={(e) => { e.stopPropagation(); triggerHaptic(40); onTogglePrivacy(); }}
                                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-emerald-600 rounded-lg transition-all active:scale-90 border border-slate-200/50 shadow-sm bg-white cursor-pointer flex items-center justify-center"
                                title={isBalanceHidden ? "Show balance" : "Hide balance"}
                            >
                                {isBalanceHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 truncate font-mono">
                            {formatCurrency(balance)}
                        </span>

                        {/* Live Sync badge */}
                        <motion.div
                            animate={{ y: [0, -2, 0] }}
                            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                            className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wide border border-emerald-100/50 shadow-sm flex-shrink-0"
                        >
                            <span className="relative flex h-1 w-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1 w-1 bg-emerald-500"></span>
                            </span>
                            <span>Live balance</span>
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
});
UnifiedStatsWidget.displayName = "UnifiedStatsWidget";

// 3. Profit Margin Widget (Doughnut Chart)
const ProfitMarginWidget = ({ income, expense }) => {
    const profit = income - expense;
    const margin = income > 0 ? Math.round((profit / income) * 100) : 0;
    const clampedMargin = Math.min(100, Math.max(0, margin));
    const isHealthy = clampedMargin > 20;
    const color = isHealthy ? '#10b981' : clampedMargin > 0 ? '#f59e0b' : '#f43f5e';
    const data = { labels: ['Margin', 'Cost'], datasets: [{ data: [clampedMargin, 100 - clampedMargin], backgroundColor: [color, '#f1f5f9'], borderWidth: 0, circumference: 230, rotation: 245, cutout: '85%' }] };

    return (
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center h-full relative overflow-hidden group hover:shadow-lg transition-all duration-500 min-h-[220px]">
            <div className="w-full flex justify-between items-center mb-2 z-10 relative">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Activity size={14} className="text-emerald-500" /> Profit Margin</h3>
                <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wide border ${isHealthy ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{clampedMargin > 0 ? 'Healthy' : 'Critical'}</span>
            </div>
            <div className="relative w-40 h-40 z-10 mt-2 flex justify-center items-center">
                <Doughnut data={data} options={{ plugins: { legend: { display: false }, tooltip: { enabled: false } }, animation: { duration: 2000, easing: 'easeOutQuart' }, maintainAspectRatio: false }} />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-4xl font-black text-slate-800 tracking-tighter">{clampedMargin}%</span>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1">Efficiency</p>
                </div>
            </div>
        </div>
    );
};

// 4. Quick Actions Grid (Premium Deposit & Withdraw Buttons Only)
const ActionCard = ({ onAction }) => (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 h-full flex flex-col justify-between min-h-[220px]">
        <div>
            <h2 className="text-lg font-black text-slate-800 mb-0.5 flex items-center gap-2"><Grid size={18} className="text-emerald-500" /> Quick Actions</h2>
            <p className="text-[11px] text-slate-400 font-bold mb-4 tracking-wide leading-none">Manage bank transactions instantly</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <button
                onClick={() => {
                    triggerHaptic(40);
                    onAction('Deposit');
                }}
                className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold p-4 rounded-[2rem] border border-emerald-400/20 flex flex-col items-center justify-center gap-2.5 transition-all duration-300 hover:-translate-y-1.5 shadow-[0_10px_20px_rgba(16,185,129,0.15)] hover:shadow-[0_20px_35px_rgba(16,185,129,0.35)] w-full min-h-[105px] group/btn active:scale-95 transform-gpu cursor-pointer text-center"
            >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div className="p-2 bg-white/20 shadow-inner rounded-xl group-hover/btn:bg-white group-hover/btn:text-emerald-600 transition-all duration-300 text-white transform group-hover/btn:rotate-90 flex items-center justify-center">
                    <Plus size={18} className="stroke-[3]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white text-center w-full block leading-none">Deposit</span>
            </button>
            <button
                onClick={() => {
                    triggerHaptic(40);
                    onAction('Withdrawal');
                }}
                className="relative overflow-hidden bg-gradient-to-br from-rose-500 to-orange-600 text-white font-bold p-4 rounded-[2rem] border border-rose-400/20 flex flex-col items-center justify-center gap-2.5 transition-all duration-300 hover:-translate-y-1.5 shadow-[0_10px_20px_rgba(244,63,94,0.15)] hover:shadow-[0_20px_35px_rgba(244,63,94,0.35)] w-full min-h-[105px] group/btn active:scale-95 transform-gpu cursor-pointer text-center"
            >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div className="p-2 bg-white/20 shadow-inner rounded-xl group-hover/btn:bg-white group-hover/btn:text-rose-600 transition-all duration-300 text-white transform group-hover/btn:scale-110 flex items-center justify-center">
                    <Minus size={18} className="stroke-[3]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white text-center w-full block leading-none">Withdraw</span>
            </button>
        </div>
    </div>
);

// 5. Notification Dropdown
const NotificationDropdown = ({ isOpen, notifications, onClose, onMarkRead }) => (
    <AnimatePresence>
        {isOpen && (
            <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40 bg-transparent" />
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 mt-4 w-80 sm:w-96 bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white/50 z-50 origin-top-right overflow-hidden ring-1 ring-slate-900/5 transform-gpu">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider"><Bell size={14} className="text-emerald-500" /> Notifications</h3>
                        {notifications.some(n => !n.isRead) && (<button onClick={onMarkRead} className="text-[10px] font-bold text-emerald-600 bg-white border border-emerald-100 px-3 py-1.5 rounded-full hover:bg-emerald-50 transition-colors shadow-sm">MARK ALL READ</button>)}
                    </div>
                    <div className="max-h-[24rem] overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {notifications.length > 0 ? notifications.map(notif => (
                            <motion.div layout key={notif._id} className={`p-4 rounded-2xl transition-all relative overflow-hidden group ${!notif.isRead ? 'bg-emerald-50/40' : 'hover:bg-slate-50'}`}>
                                {!notif.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-2xl"></div>}
                                <div className="flex gap-3 pl-2">
                                    <div className={`p-2 rounded-full h-fit flex-shrink-0 ${!notif.isRead ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}><Bell size={14} /></div>
                                    <div>
                                        <p className={`text-sm leading-snug ${!notif.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>{notif.content}</p>
                                        <p className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase tracking-wide">{formatDate(notif.createdAt, true)}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="py-12 text-center flex flex-col items-center text-slate-400">
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3"><Bell size={20} className="opacity-30" /></div>
                                <p className="text-xs font-bold uppercase tracking-wide opacity-50">No new alerts</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </>
        )}
    </AnimatePresence>
);

// 6. Dollar Spend Card (Credit Card Style)
const DollarCardWidget = ({ dollarData, dollarBalance, auditLogs, onAddClick, onLoadClick, onItemClick, onDelete, isBalanceHidden, onTogglePrivacy }) => {
    const recentActivity = [...dollarData].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    return (
        <div id="cards-widget" className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            {/* Virtual Card */}
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }} className="relative h-80 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-emerald-900/20 bg-[#0f172a] group transform-gpu">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-[#0f172a] to-slate-900 opacity-100"></div>
                {/* Decorative Blobs */}
                <div className="absolute top-[-50%] left-[-50%] w-[100%] h-[100%] bg-emerald-500/20 rounded-full blur-[80px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-blue-500/20 rounded-full blur-[80px]"></div>
                {/* Card Content */}
                <div className="relative p-8 flex flex-col justify-between h-full text-white z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-emerald-200/80 text-[10px] font-black tracking-[0.2em] uppercase mb-2">ADS DOLLAR FUND</p>
                            <div className="flex items-center gap-3">
                                <h3 className="text-5xl font-black tracking-tighter text-white drop-shadow-sm">{formatUSD(dollarBalance)}</h3>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onTogglePrivacy(); }}
                                    className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all active:scale-90 flex-shrink-0 cursor-pointer"
                                    title={isBalanceHidden ? "Show balance" : "Hide balance"}
                                >
                                    {isBalanceHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner"><Globe size={24} className="text-emerald-200" /></div>
                    </div>
                    <div className="mt-auto">
                        <div className="flex gap-3 mb-8">
                            <button
                                onClick={onLoadClick}
                                className="h-11 px-5 rounded-2xl bg-white text-slate-900 hover:bg-slate-50 hover:scale-[1.02] shadow-lg shadow-black/10 flex items-center justify-center gap-2 transition-all text-xs font-black uppercase tracking-wider cursor-pointer active:scale-95 border border-transparent"
                            >
                                <ArrowDownLeft size={16} /> Load Fund
                            </button>
                            <button
                                onClick={onAddClick}
                                className="h-11 px-5 rounded-2xl bg-white/10 hover:bg-white/20 hover:scale-[1.02] text-white border border-white/15 flex items-center justify-center gap-2 transition-all text-xs font-black uppercase tracking-wider cursor-pointer active:scale-95"
                            >
                                <Minus size={16} /> Record Spend
                            </button>
                        </div>
                        <div className="flex justify-between items-end opacity-90">
                            <div><div className="flex items-center gap-3 mb-1"><div className="flex -space-x-2"><div className="w-8 h-8 rounded-full bg-rose-500/80 border-2 border-slate-900 backdrop-blur-md"></div><div className="w-8 h-8 rounded-full bg-amber-400/80 border-2 border-slate-900 backdrop-blur-md"></div></div><span className="text-sm text-emerald-100/60 font-mono tracking-widest">•••• 5869</span></div></div>
                            <img src="/logo.png" alt="Logo" style={{ width: 30, height: 30 }} className="opacity-50 grayscale brightness-200" />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Activity List */}
            <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-80 overflow-hidden">
                <div className="flex justify-between items-center mb-4 px-1 flex-shrink-0">
                    <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-lg">
                        <Layers size={20} className="text-emerald-500" />
                        <span className="hidden sm:inline">Recent Activity</span>
                        <span className="sm:hidden">Activity</span>
                    </h3>
                    <Link href="/finance/dollar-history" className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-wider flex items-center gap-1">View All <ChevronDown size={12} className="-rotate-90" /></Link>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                    {recentActivity.length > 0 ? recentActivity.map((d, i) => (
                        <motion.div
                            whileHover={{ x: 4, backgroundColor: "#f8fafc" }}
                            key={d._id || i}
                            className="flex justify-between items-center p-3 rounded-2xl cursor-pointer group transition-all border border-transparent hover:border-slate-100"
                            onClick={() => onItemClick(d)}
                        >
                            <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${d.type === 'Load' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
                                    {d.type === 'Load' ? <ArrowDownLeft size={18} /> : <Target size={18} />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-slate-800 text-sm truncate block">{d.type === 'Load' ? 'Wallet Load' : d.companyName}</p>
                                        {d.addedBy && (
                                            <div className="hidden sm:flex items-center gap-1 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-full" title={`Entered by ${d.addedBy.name || 'System'}`}>
                                                <img src={d.addedBy.avatar || '/default-avatar.png'} style={{ width: 10, height: 10 }} className="rounded-full opacity-80" alt="avatar" />
                                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[60px]">{(d.addedBy.name || 'System').split(' ')[0]}</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate block mt-0.5">{d.type === 'Load' ? formatDate(d.date) : d.campaignName || 'Ad Spend'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`font-black text-sm whitespace-nowrap ${d.type === 'Load' ? 'text-emerald-600' : 'text-slate-800'}`}>{d.type === 'Load' ? '+' : '-'}{formatUSD(d.amount)}</span>
                                <button onClick={(e) => { e.stopPropagation(); onDelete(d._id); }} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"><Trash2 size={14} /></button>
                            </div>
                        </motion.div>
                    )) : <div className="h-full flex flex-col items-center justify-center text-slate-400"><Layers size={24} className="mb-2 opacity-20" /><span className="text-xs font-bold uppercase tracking-wide opacity-50">No Data</span></div>}
                </div>
            </div>
        </div>
    );
};

// 6.5 Audit History Box
const AuditHistoryBox = ({ auditLogs, unreadCount, onMarkRead }) => {
    return (
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-80 overflow-hidden">
            <div className="flex justify-between items-center mb-4 px-1 flex-shrink-0">
                <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-lg">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span className="hidden sm:flex items-center gap-2">History {unreadCount > 0 && <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">{unreadCount}</span>}</span>
                    <span className="sm:hidden flex items-center gap-2">Audit {unreadCount > 0 && <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">{unreadCount}</span>}</span>
                </h3>
                {unreadCount > 0 && (
                    <button onClick={onMarkRead} className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-wider flex items-center gap-1">Mark as read</button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                {auditLogs && auditLogs.length > 0 ? auditLogs.map((log, i) => (
                    <div key={log._id || i} className={`flex gap-3 items-start p-3 rounded-2xl border ${log.isRead ? 'bg-slate-50/50 border-slate-100' : 'bg-indigo-50/30 border-indigo-100/50 relative'}`}>
                        {!log.isRead && <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-rose-500 rounded-full"></div>}
                        <img src={log.user?.avatar || '/default-avatar.png'} style={{ width: 28, height: 28 }} className="rounded-full shadow-sm mt-0.5 border border-slate-200" alt="avatar" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-600 leading-tight">
                                <span className="font-bold text-slate-800">{log.user?.name?.split(' ')[0]}</span>{' '}
                                <span className={`font-bold ${log.action === 'Added' ? 'text-emerald-600' : log.action === 'Edited' ? 'text-blue-600' : 'text-rose-600'}`}>
                                    {log.action.toLowerCase()}
                                </span>{' '}
                                <span className="text-slate-500">{log.details.substring(log.details.indexOf(':') + 1)}</span>
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${log.action === 'Added' ? 'bg-emerald-400' : log.action === 'Edited' ? 'bg-blue-400' : 'bg-rose-400'}`}></span>
                                {new Date(log.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                )) : <div className="h-full flex flex-col items-center justify-center text-slate-400"><svg className="w-6 h-6 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span className="text-xs font-bold uppercase tracking-wide opacity-50">System Clear</span></div>}
            </div>
        </div>
    );
};

// 7. Notification Form
const NotificationCard = ({ allUsers, onSubmit, content, setContent, targetUser, setTargetUser, isSending }) => (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-full">
        <h2 className="text-lg font-extrabold text-slate-800 mb-6 px-1 flex items-center gap-2"><Send size={18} className="text-emerald-500" /> Notify Team</h2>
        <form onSubmit={onSubmit} className="space-y-4 px-1">
            <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Recipient</label><select id="targetUser" value={targetUser} onChange={(e) => setTargetUser(e.target.value)} required className="w-full px-4 py-3.5 border-none bg-slate-50 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold text-slate-700 transition-all"><option value="" disabled>Select Employee</option>{allUsers.map((u) => (<option key={u._id} value={u._id}>{u.name} ({u.role})</option>))}</select></div>
            <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Message</label><textarea id="notification-content" value={content} onChange={(e) => setContent(e.target.value)} rows="3" className="w-full px-4 py-3.5 border-none bg-slate-50 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-sm font-medium text-slate-700 placeholder:text-slate-400 transition-all" required placeholder="Type your update here..." /></div>
            <div className="flex justify-end pt-2"><button type="submit" disabled={isSending} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-3.5 rounded-2xl flex items-center gap-2 disabled:opacity-50 transition-all shadow-xl shadow-slate-200 active:scale-95 text-sm transform-gpu"><Send size={16} />{isSending ? 'Sending...' : 'Send Blast'}</button></div>
        </form>
    </div>
);

// 8. Transaction Row (Optimized Hover Interactions)
const TransactionRow = memo(({ transaction, remainingBalance, onRowClick, index }) => {
    const isIncome = transaction.type === 'Income' || transaction.type === 'Deposit';
    return (
        <motion.div
            whileHover={{ y: -3, scale: 1.008 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`relative overflow-hidden rounded-[1.5rem] bg-white shadow-sm border border-slate-100/80 transition-all duration-300 ${isIncome
                ? "hover:border-emerald-200/80 hover:shadow-[0_12px_30px_-5px_rgba(16,185,129,0.12)]"
                : "hover:border-rose-200/80 hover:shadow-[0_12px_30px_-5px_rgba(244,63,94,0.12)]"
                }`}
        >
            {/* Foreground Row Card */}
            <div
                onClick={onRowClick}
                className="bg-white p-4 sm:p-5 flex items-center justify-between cursor-pointer w-full transform-gpu"
            >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 mr-2">
                    <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-2xl shadow-sm ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {isIncome ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-800 truncate text-sm sm:text-base">{transaction.title}</p>
                            <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-600 border border-emerald-100">
                                <CheckCircle size={8} /> Verified
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 w-full overflow-hidden">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 truncate max-w-[120px]">{transaction.category}</span>
                            <span className="text-[10px] font-bold text-slate-400 flex-shrink-0">{formatDate(transaction.date)}</span>
                            {(transaction.createdBy || transaction.loggedBy) && (() => {
                                const author = transaction.createdBy || transaction.loggedBy;
                                return (
                                    <div className="flex items-center gap-1.5 ml-1 px-2 py-0.5 rounded-md bg-indigo-50/50 border border-indigo-100/50" title={`Entered by ${author.name || 'System'}`}>
                                        <img src={author.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'} style={{ width: 14, height: 14 }} className="rounded-full border border-indigo-200" alt="avatar" />
                                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1"><CheckCircle size={8} className="text-indigo-400" /> By {(author.name || 'System').split(' ')[0]}</span>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                <div className="text-right flex-shrink-0">
                    <p className={`text-base sm:text-lg font-black ${isIncome ? 'text-emerald-600' : 'text-slate-800'}`}>{isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">Bal: {formatCurrency(remainingBalance)}</p>
                </div>
            </div>
        </motion.div>
    );
});
TransactionRow.displayName = "TransactionRow";

// --- Modals (Standard) ---
const TransactionModal = ({ type, onClose, onSuccess }) => {
    let defaultCategory = 'General';
    if (type === 'Income' || type === 'Deposit') defaultCategory = 'Bank Deposit';
    if (type === 'Expense' || type === 'Withdrawal') defaultCategory = 'Bank Withdrawal';
    const [formData, setFormData] = useState({ title: '', amount: '', category: defaultCategory, date: new Date().toISOString().split('T')[0], description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
    const handleSubmit = async (e) => {
        e.preventDefault(); setIsSubmitting(true);
        try { const res = await fetch('/api/finance/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, type }) }); if (!res.ok) throw new Error('Failed'); triggerHaptic([40, 40]); toast.success('Logged successfully!'); await onSuccess(); onClose(); } catch (err) { toast.error(err.message); } finally { setIsSubmitting(false); }
    };
    return (
        <motion.div variants={modalBackdrop} initial="initial" animate="animate" exit="exit" className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[80] flex justify-center items-center p-4">
            <motion.div variants={modalContent} className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-lg border border-white/60">
                <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-extrabold text-slate-800">Add {type}</h3><button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><XIcon className="text-slate-400" /></button></div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Title</label><input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-800" placeholder="Transaction Title" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Amount</label><input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleChange} required className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none font-black text-slate-800" placeholder="0.00" /></div>
                        <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} required className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-600" /></div>
                    </div>
                    <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label><input type="text" name="category" value={formData.category} onChange={handleChange} required className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none font-medium" /></div>

                    {/* ✅ ADDED: Description Box */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description <span className="text-slate-300 font-normal normal-case">(Optional)</span></label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-600 resize-none"
                            placeholder="Add notes..."
                        />
                    </div>

                    <div className="pt-4"><button type="submit" disabled={isSubmitting} className={`w-full py-4 text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-xl active:scale-95 ${type.includes('Income') || type.includes('Deposit') ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'}`}>{isSubmitting ? 'Saving...' : 'Confirm Transaction'}</button></div>
                </form>
            </motion.div>
        </motion.div>
    );
};

const AddDollarSpendModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ companyName: '', platform: 'Facebook', campaignName: '', amount: '', exchangeRate: '135.0' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const platforms = [{ id: 'Facebook', icon: <Facebook size={18} />, color: 'bg-blue-600' }, { id: 'Instagram', icon: <Instagram size={18} />, color: 'bg-pink-600' }, { id: 'Google', icon: <Globe size={18} />, color: 'bg-red-500' }, { id: 'LinkedIn', icon: <Linkedin size={18} />, color: 'bg-blue-700' }, { id: 'TikTok', icon: <Video size={18} />, color: 'bg-black' }];
    const handleSubmit = async (e) => { e.preventDefault(); setIsSubmitting(true); try { const res = await fetch('/api/finance/dollar-spend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, type: 'Spend' }) }); if (!res.ok) throw new Error('Failed'); triggerHaptic([40, 40]); toast.success('Spend recorded!'); await onSuccess(); onClose(); } catch (error) { toast.error(error.message); } finally { setIsSubmitting(false); } };
    return (
        <motion.div variants={modalBackdrop} initial="initial" animate="animate" exit="exit" className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] flex justify-center items-center p-4">
            <motion.div variants={modalContent} className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-md border border-white/60">
                <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2"><Target size={24} className="text-emerald-500" /> Record Spend</h3><button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><XIcon className="text-slate-400" /></button></div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Platform</label><div className="flex flex-wrap gap-2">{platforms.map((p) => (<button key={p.id} type="button" onClick={() => setFormData({ ...formData, platform: p.id })} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${formData.platform === p.id ? `${p.color} text-white shadow-lg ring-2 ring-offset-2 ring-slate-200 scale-105` : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>{p.icon} {p.id}</button>))}</div></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Client</label><input type="text" required value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800" placeholder="Client Name" /></div>
                        <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Campaign</label><input type="text" value={formData.campaignName} onChange={e => setFormData({ ...formData, campaignName: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium" placeholder="Campaign" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                        <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Amount ($)</label><input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full p-2 bg-transparent border-none font-black text-xl text-slate-800 outline-none placeholder:text-slate-300" placeholder="0.00" /></div>
                        <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Rate (NPR)</label><input type="number" step="0.01" required value={formData.exchangeRate} onChange={e => setFormData({ ...formData, exchangeRate: e.target.value })} className="w-full p-2 bg-white border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm text-center" /></div>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl mt-4 transition-all shadow-xl shadow-slate-200 active:scale-95">{isSubmitting ? 'Saving...' : 'Confirm Spend'}</button>
                </form>
            </motion.div>
        </motion.div>
    );
};

const LoadFundsModal = ({ onClose, onSuccess }) => {
    const [amount, setAmount] = useState(''); const [rate, setRate] = useState('135.0'); const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = async (e) => { e.preventDefault(); setIsSubmitting(true); try { const res = await fetch('/api/finance/dollar-spend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'Load', amount, exchangeRate: rate }) }); if (!res.ok) throw new Error('Failed'); triggerHaptic([40, 40]); toast.success(`Loaded $${amount} successfully!`); await onSuccess(); onClose(); } catch (error) { toast.error(error.message); } finally { setIsSubmitting(false); } };
    return (
        <motion.div variants={modalBackdrop} initial="initial" animate="animate" exit="exit" className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[70] flex justify-center items-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-md border border-white/60">
                <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-extrabold text-slate-800">Load Wallet</h3><button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><XIcon className="text-slate-400" /></button></div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Amount (USD)</label><input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="0.00" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Exchange Rate</label><input type="number" step="0.01" required value={rate} onChange={e => setRate(e.target.value)} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-emerald-200 active:scale-95">{isSubmitting ? 'Loading...' : 'Add Funds'}</button>
                </form>
            </div>
        </motion.div>
    );
};

const DollarDetailModal = ({ transaction, onClose }) => {
    return (
        <motion.div variants={modalBackdrop} initial="initial" animate="animate" exit="exit" className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[80] flex justify-center items-center p-4">
            <motion.div variants={modalContent} className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-md relative overflow-hidden border border-white/60">
                <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:bg-slate-100 rounded-full p-2 transition-colors"><XIcon size={20} /></button>
                <div className="flex items-center gap-4 mb-6 mt-2">
                    <div className={`p-4 rounded-2xl ${transaction.type === 'Load' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{transaction.type === 'Load' ? <ArrowDownLeft size={28} /> : <Target size={28} />}</div>
                    <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{transaction.type === 'Load' ? 'Credit Added' : 'Ad Spend'}</p><h3 className="text-xl font-extrabold text-slate-800 leading-tight">{transaction.type === 'Load' ? 'Funds Loaded' : transaction.companyName}</h3></div>
                </div>
                <div className="flex items-baseline gap-1 mb-8"><span className={`text-4xl font-black ${transaction.type === 'Load' ? 'text-emerald-600' : 'text-slate-900'}`}>{transaction.type === 'Load' ? '+' : '-'}{formatUSD(transaction.amount)}</span><span className="text-slate-500 font-bold text-sm">USD</span></div>
                <div className="bg-slate-50 rounded-2xl p-5 space-y-3 border border-slate-100">
                    <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Date</span><span className="font-bold text-slate-700">{formatDate(transaction.date, true)}</span></div>
                    {transaction.type === 'Spend' && (<div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Platform</span><span className="font-bold text-slate-700 flex items-center gap-1">{transaction.platform}</span></div>)}
                    <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Rate</span><span className="font-bold text-slate-700">Rs. {transaction.exchangeRate}</span></div>
                    {transaction.addedBy && (
                        <div className="flex justify-between text-sm pt-3 border-t border-slate-200"><span className="text-slate-500 font-medium">Logged By</span><span className="font-bold text-slate-700 flex items-center gap-2"><img src={transaction.addedBy.avatar || '/default-avatar.png'} style={{ width: 16, height: 16 }} className="rounded-full" alt="avatar" /> {transaction.addedBy.name || 'System'}</span></div>
                    )}
                    <div className="flex justify-between text-sm pt-3 border-t border-slate-200"><span className="text-slate-500 font-bold">Total Cost (NPR)</span><span className="font-extrabold text-slate-800">{formatCurrency(transaction.nprEquivalent || (transaction.amount * transaction.exchangeRate))}</span></div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const TransactionDetailModal = ({ transaction, onClose, onDelete }) => (
    <AnimatePresence>
        {transaction && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex justify-center items-center p-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-lg relative border border-white/60">
                    <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:bg-slate-100 rounded-full p-2"><XIcon size={20} /></button>
                    <h3 className="text-2xl font-extrabold mb-2 text-slate-800 pr-8">{transaction.title}</h3>
                    <p className={`text-xl font-bold ${transaction.type.includes('Income') || transaction.type.includes('Deposit') ? 'text-emerald-600' : 'text-rose-600'}`}>{transaction.type.includes('Expense') || transaction.type.includes('Withdrawal') ? '-' : '+'}{formatCurrency(transaction.amount)}</p>
                    <div className="mt-8 space-y-4 text-sm border-t border-slate-100 pt-6">
                        <div className="flex justify-between items-center"><span className="text-slate-400 font-bold uppercase text-xs tracking-wider">Date</span><span className="font-bold text-slate-700">{formatDate(transaction.date, true)}</span></div>
                        <div className="flex justify-between items-center"><span className="text-slate-400 font-bold uppercase text-xs tracking-wider">Type</span><span className="font-bold text-slate-700 px-3 py-1 bg-slate-100 rounded-lg">{transaction.type}</span></div>
                        <div className="flex justify-between items-center"><span className="text-slate-400 font-bold uppercase text-xs tracking-wider">Category</span><span className="font-bold text-slate-700">{transaction.category}</span></div>
                        {transaction.description && (<div className="pt-4"><p className="text-slate-400 font-bold uppercase text-xs tracking-wider mb-2">Description</p><p className="text-slate-600 bg-slate-50 p-4 rounded-2xl leading-relaxed border border-slate-100">{transaction.description}</p></div>)}
                    </div>

                    {/* --- THE DIGITAL FINGERPRINT (AUDIT TRAIL) --- */}
                    {(transaction.createdBy || transaction.loggedBy) && (() => {
                        const author = transaction.createdBy || transaction.loggedBy;
                        return (
                            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-end gap-2 text-slate-400">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 opacity-70">↳ Entered By</span>
                                <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-full border border-slate-100/50 hover:bg-slate-100 transition-colors">
                                    <img src={author.avatar || '/default-avatar.png'} style={{ width: 16, height: 16 }} className="rounded-full border border-slate-200" alt="Avatar" />
                                    <span className="text-xs font-bold text-slate-600">{(author.name || 'System').split(' ')[0]}</span>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Actions Panel */}
                    <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                        >
                            Close
                        </button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                triggerHaptic(60);
                                onDelete(transaction);
                            }}
                            className="px-5 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-rose-200 transition-all cursor-pointer"
                        >
                            <Trash2 size={14} className="stroke-[2.5] text-white" /> Delete Transaction
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>
);

// --- Delete Confirmation Modal (Premium Dialog) ---
const DeleteConfirmModal = ({ transaction, onClose, onConfirm }) => {
    return (
        <motion.div
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex justify-center items-center p-4"
        >
            <motion.div
                variants={modalContent}
                className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-md relative overflow-hidden border border-white/60 text-center"
            >
                {/* Visual warning icon with soft red pulse */}
                <div className="mx-auto w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6 animate-pulse shadow-inner">
                    <AlertTriangle size={32} className="stroke-[2.5]" />
                </div>

                <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Delete Transaction?</h3>
                <p className="text-slate-500 font-medium text-sm px-2 leading-relaxed mb-6">
                    Are you absolutely sure you want to delete <span className="font-extrabold text-slate-800">"{transaction.title}"</span>? This action is permanent and will adjust your balance by <span className="font-mono font-black text-rose-600">{formatCurrency(transaction.amount)}</span>.
                </p>

                {/* Actions Panel */}
                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs uppercase tracking-widest transition-all cursor-pointer active:scale-95"
                    >
                        Cancel
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onConfirm}
                        className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-rose-200 transition-all cursor-pointer"
                    >
                        <Trash2 size={14} className="stroke-[2.5] text-white" /> Delete
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- Main Finance Dashboard Component ---
export default function FinanceDashboard({ financeUser, allUsers, initialTransactions, canAccessHub }) {
    const router = useRouter();

    // States
    const [showSplash, setShowSplash] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [transactions, setAllTransactions] = useState(initialTransactions);
    const [bankAccount, setBankAccount] = useState({ balance: 0 });
    const [allUsersList, setAllUsersList] = useState(allUsers);
    const [notifications, setNotifications] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);

    // Privacy Mode State
    const [isBalanceHidden, setIsBalanceHidden] = useState(false);
    useEffect(() => {
        globalIsBalanceHidden = isBalanceHidden;
    }, [isBalanceHidden]);
    const [unreadAuditCount, setUnreadAuditCount] = useState(0);
    const [dollarData, setDollarData] = useState([]);
    const [dollarBalance, setDollarBalance] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('Income');
    const [isDollarModalOpen, setIsDollarModalOpen] = useState(false);
    const [isLoadFundsModalOpen, setIsLoadFundsModalOpen] = useState(false);
    const [viewingDollarTransaction, setViewingDollarTransaction] = useState(null);
    const [viewingTransaction, setViewingTransaction] = useState(null);
    const [transactionToDelete, setTransactionToDelete] = useState(null);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    // Filter States
    const [statementType, setStatementType] = useState('monthly'); // 'monthly' | 'yearly'
    const [viewingMonth, setViewingMonth] = useState(new Date().getMonth());
    const [viewingYear, setViewingYear] = useState(new Date().getFullYear());

    // Refs & Messaging
    const userDropdownRef = useRef(null);
    const notificationDropdownRef = useRef(null);
    const [notificationContent, setNotificationContent] = useState('');
    const [targetUser, setTargetUser] = useState('');
    const [isSending, setIsSending] = useState(false);

    const unreadNotifications = useMemo(() => notifications.filter(n => !n.isRead), [notifications]);

    useEffect(() => { const timer = setTimeout(() => setShowSplash(false), 2200); return () => clearTimeout(timer); }, []);

    // Fetch Data
    const refetchData = useCallback(async () => {
        try {
            const [dashRes, dollarRes] = await Promise.all([
                fetch('/api/finance/dashboard-data'),
                fetch('/api/finance/dollar-spend')
            ]);
            const dashData = await dashRes.json();
            const dollarJson = await dollarRes.json();

            if (dashRes.ok) {
                setAllTransactions(dashData.transactions || []);
                setBankAccount(dashData.bankAccount || { balance: 0 });
                setAllUsersList(dashData.allUsers || []);
                setNotifications(dashData.notifications || []);
                setAuditLogs(dashData.auditLogs || []);
                setUnreadAuditCount(dashData.unreadAuditCount || 0);
                if (!targetUser && dashData.allUsers?.length) setTargetUser(dashData.allUsers[0]._id);
            }
            if (dollarJson.success) {
                setDollarData(dollarJson.data || []);
                setDollarBalance(dollarJson.balance || 0);
            }
        } catch (err) { toast.error("Connection Sync Error"); }
    }, [targetUser]);

    useEffect(() => { refetchData(); }, [refetchData]);

    // Outside Clicks
    useEffect(() => {
        function handleClickOutside(event) {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) setIsDropdownOpen(false);
            if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) setIsNotificationOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- Core Calculations ---

    // 0. Calculate Running Balances (Reverse Chronological)
    const transactionsWithBalance = useMemo(() => {
        let currentBal = bankAccount.balance;
        return transactions.map(t => {
            const runningBal = currentBal;
            if (t.type === 'Income' || t.type === 'Deposit') currentBal -= t.amount;
            else currentBal += t.amount;
            return { ...t, runningBalance: runningBal };
        });
    }, [transactions, bankAccount.balance]);

    // 1. Filter Logic
    const filteredTransactionsForDisplay = useMemo(() => {
        return transactionsWithBalance.filter(t => {
            const d = new Date(t.date);
            const matchesYear = d.getUTCFullYear() === viewingYear;
            const matchesMonth = d.getUTCMonth() === viewingMonth;

            return statementType === 'yearly' ? matchesYear : (matchesYear && matchesMonth);
        }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first
    }, [transactions, viewingMonth, viewingYear, statementType]);

    // 2. Summary Logic (Dynamic)
    const summary = useMemo(() => {
        let inc = 0, exp = 0;
        filteredTransactionsForDisplay.forEach(t => { if (t.type === 'Income' || t.type === 'Deposit') inc += t.amount; else exp += t.amount; });
        return { totalIncome: inc, totalExpenses: exp, netProfit: inc - exp };
    }, [filteredTransactionsForDisplay]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout');

        toast.success('Logged out successfully');
        setTimeout(() => {
            router.push('/login');
        }, 800);
    };
    const openModal = (type) => { setModalType(type); setIsModalOpen(true); };
    const handleMarkAsRead = async () => { if (!unreadNotifications.length) return; await fetch('/api/notification/mark-as-read', { method: 'POST' }); setNotifications(p => p.map(n => ({ ...n, isRead: true }))); };

    const handleMarkAuditRead = async () => {
        if (!unreadAuditCount) return;
        await fetch('/api/finance/mark-audit-read', { method: 'POST' });
        setUnreadAuditCount(0);
        setAuditLogs(prev => prev.map(log => ({ ...log, isRead: true })));
    };

    const handleDeleteTransaction = async (id) => {
        try {
            const res = await fetch(`/api/finance/transactions?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Failed");
            triggerHaptic(70);
            toast.success("Deleted successfully.");
            refetchData();
        } catch (e) {
            toast.error(e.message);
        }
    };
    const handleDeleteDollarSpend = async (id) => { if (!confirm("Delete record?")) return; try { const res = await fetch(`/api/finance/dollar-spend?id=${id}`, { method: 'DELETE' }); if (!res.ok) throw new Error("Failed"); triggerHaptic(70); toast.success("Deleted."); refetchData(); } catch (e) { toast.error(e.message); } };

    const handleSendNotification = async (e) => { e.preventDefault(); if (!notificationContent.trim() || !targetUser) return toast.error('Check fields.'); setIsSending(true); try { const res = await fetch('/api/finance/send-notification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: notificationContent, targetUser }) }); if (!res.ok) throw new Error("Failed"); toast.success('Sent!'); setNotificationContent(''); } catch (err) { toast.error("Error sending."); } finally { setIsSending(false); } };

    // --- Export Handler ---
    const handleDownloadStatement = () => {
        if (filteredTransactionsForDisplay.length === 0) return toast.error("No transactions to export");

        // Determine the period string for the report title
        const periodString = statementType === 'yearly'
            ? `Fiscal Year ${viewingYear}`
            : `${new Date(viewingYear, viewingMonth).toLocaleString('default', { month: 'long' })} ${viewingYear}`;

        // Call the generator utility
        generateFinancialStatement({
            transactions: filteredTransactionsForDisplay,
            summary, // This comes from your existing useMemo calculation
            period: periodString,
            type: statementType, // 'monthly' or 'yearly'
            user: financeUser // The logged in user object
        });

        toast.success("Statement Generated Successfully");
    };

    const yearOptions = [...Array(5)].map((_, i) => new Date().getFullYear() - i);
    const monthOptions = Array.from({ length: 12 }, (_, i) => ({ value: i, label: new Date(0, i).toLocaleString('default', { month: 'long' }) }));

    if (showSplash) return <AnimatePresence mode="wait"><DashboardEntryLoader key="loader" userName={financeUser.name} /></AnimatePresence>;

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 selection:bg-emerald-100 selection:text-emerald-900 flex flex-col pb-24 md:pb-8">
            {/* Background Gradients */}
            <div className="fixed inset-0 overflow-hidden -z-0 pointer-events-none">
                <div className="absolute top-0 -left-48 w-[40rem] h-[40rem] bg-emerald-200/30 rounded-full filter blur-[120px] opacity-50"></div>
                <div className="absolute bottom-0 -right-48 w-[40rem] h-[40rem] bg-teal-200/30 rounded-full filter blur-[120px] opacity-50"></div>
            </div>

            {/* --- Sticky Header --- */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-4 py-3 lg:px-8 flex justify-between items-center sticky top-0 z-40 transition-all">
                <Link href="/dashboard" className="flex items-center gap-3 group hover:scale-[1.02] transition-transform cursor-pointer">
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-300 blur-md rounded-full opacity-0 group-hover:opacity-40 transition-opacity"></div>
                        <img src="/finance.png" alt="Finance" style={{ width: 44, height: 44 }} />
                    </div>
                    <div className="hidden sm:block leading-tight">
                        <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Finance <span className="text-emerald-600">Dashboard</span></h1>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            {canAccessHub && (
                                <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg text-xs font-bold transition-colors mt-1">
                                    <ArrowLeft size={10} className="text-emerald-500" /> Return to Hub
                                </span>
                            )}
                        </div>
                    </div>
                </Link>

                <div className="flex items-center gap-3">
                    {/* Privacy Mode Eye Toggle */}
                    <button
                        onClick={() => {
                            triggerHaptic(60);
                            setIsBalanceHidden(prev => !prev);
                            toast.success(isBalanceHidden ? "Balances displayed safely." : "Balances hidden for your privacy!", {
                                id: 'privacy-toast',
                                duration: 2000,
                                icon: isBalanceHidden ? '🔓' : '🔒'
                            });
                        }}
                        className="p-2.5 text-slate-500 hover:text-emerald-600 hover:bg-white bg-slate-100/50 rounded-xl transition-all active:scale-90 cursor-pointer flex items-center justify-center"
                        title={isBalanceHidden ? "Show balances" : "Hide balances"}
                    >
                        {isBalanceHidden ? <EyeOff size={20} className="stroke-[2.5]" /> : <Eye size={20} className="stroke-[2.5]" />}
                    </button>

                    <div ref={notificationDropdownRef} className="relative">
                        <button onClick={() => setIsNotificationOpen(!isNotificationOpen)} className="p-2.5 text-slate-500 hover:text-emerald-600 hover:bg-white bg-slate-100/50 rounded-xl transition-all relative cursor-pointer">
                            <Bell size={20} />
                            {unreadNotifications.length > 0 && <span className="absolute top-2 right-2.5 h-2.5 w-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>}
                        </button>
                        <NotificationDropdown isOpen={isNotificationOpen} notifications={notifications} onClose={() => setIsNotificationOpen(false)} onMarkRead={handleMarkAsRead} />
                    </div>
                    <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
                    <div ref={userDropdownRef} className="relative">
                        <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 pl-1 pr-2 py-1 bg-white border border-slate-200/60 rounded-full hover:shadow-md transition-all group">
                            <img src={financeUser.avatar} style={{ width: 34, height: 34 }} className="rounded-full border border-slate-100 group-hover:scale-105 transition-transform" alt="User" />
                            <span className="text-xs font-bold text-slate-700 hidden sm:block group-hover:text-emerald-700 transition-colors">{financeUser.name.split(' ')[0]}</span>
                            <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-full right-0 mt-3 w-56 rounded-2xl shadow-2xl bg-white border border-slate-100 z-50 overflow-hidden origin-top-right">
                                    <div className="p-4 border-b border-slate-50 bg-slate-50/50"><p className="text-sm font-bold text-slate-800">{financeUser.name}</p><p className="text-[10px] uppercase font-bold text-emerald-600">{financeUser.role}</p></div>

                                    {/* --- UNIVERSAL WORKSPACE SWITCHER --- */}
                                    {financeUser.role === 'Superadmin' && (
                                        <div className="p-2 border-b border-slate-50">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 mb-1">Workspaces</p>
                                            <Link href="/dashboard" className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg flex items-center gap-2 transition-colors"><Layers size={14} /> Personal Portal</Link>
                                            <Link href="/hr/dashboard" className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg flex items-center gap-2 transition-colors"><Layers size={14} /> HR Dashboard</Link>
                                            <Link href="/pm/dashboard" className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg flex items-center gap-2 transition-colors"><Layers size={14} /> PM Dashboard</Link>
                                        </div>
                                    )}

                                    <div className="p-1"><button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-xl flex items-center gap-3 transition-colors"><LogOut size={16} /> Sign Out</button></div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {/* --- Main Content --- */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto z-10">
                <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="space-y-6 lg:space-y-8">

                    {/* Stats Row */}
                    <UnifiedStatsWidget
                        summary={summary}
                        balance={bankAccount.balance}
                        refetchData={refetchData}
                        isBalanceHidden={isBalanceHidden}
                        onTogglePrivacy={() => setIsBalanceHidden(prev => !prev)}
                    />

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">

                        {/* Left Column (5 Cols) */}
                        <motion.div variants={fadeInUp} className="xl:col-span-5 flex flex-col gap-6 lg:gap-8">
                            <div className="h-auto xl:h-[24rem]">
                                <DollarCardWidget
                                    dollarData={dollarData}
                                    dollarBalance={dollarBalance}
                                    auditLogs={auditLogs}
                                    isBalanceHidden={isBalanceHidden}
                                    onTogglePrivacy={() => setIsBalanceHidden(prev => !prev)}
                                    onAddClick={() => { triggerHaptic(40); setIsDollarModalOpen(true); }}
                                    onLoadClick={() => { triggerHaptic(40); setIsLoadFundsModalOpen(true); }}
                                    onItemClick={(transaction) => { triggerHaptic(40); setViewingDollarTransaction(transaction); }}
                                    onDelete={(id) => handleDeleteDollarSpend(id)}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-h-[300px]">
                                <ActionCard onAction={openModal} />
                                <ProfitMarginWidget income={summary.totalIncome} expense={summary.totalExpenses} />
                            </div>

                            <AuditHistoryBox auditLogs={auditLogs} unreadCount={unreadAuditCount} onMarkRead={handleMarkAuditRead} />

                            <div className="flex-1">
                                <NotificationCard allUsers={allUsersList} onSubmit={handleSendNotification} content={notificationContent} setContent={setNotificationContent} targetUser={targetUser} setTargetUser={setTargetUser} isSending={isSending} />
                            </div>
                        </motion.div>

                        {/* Right Column (7 Cols): Transactions */}
                        <motion.div variants={fadeInUp} className="xl:col-span-7 bg-white p-6 lg:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col min-h-[800px]">
                            {/* Header & Filters */}
                            <div className="flex flex-col xl:flex-row justify-between xl:items-center mb-8 gap-6 px-1">
                                <div>
                                    <h2 className="text-2xl font-extrabold text-slate-800">Transactions</h2>
                                    <p className="text-sm font-medium text-slate-400 mt-1">
                                        {statementType === 'yearly' ? `Fiscal Year ${viewingYear}` : `${new Date(viewingYear, viewingMonth).toLocaleString('default', { month: 'long' })} ${viewingYear}`}
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                    <div className="flex bg-slate-100/80 p-1.5 rounded-2xl">
                                        <button onClick={() => setStatementType('monthly')} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${statementType === 'monthly' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Monthly</button>
                                        <button onClick={() => setStatementType('yearly')} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${statementType === 'yearly' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Yearly</button>
                                    </div>

                                    <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                        {statementType === 'monthly' && (
                                            <select value={viewingMonth} onChange={e => setViewingMonth(parseInt(e.target.value))} className="p-2.5 bg-white border-none rounded-xl text-sm font-bold text-slate-700 outline-none hover:shadow-sm transition-all cursor-pointer shadow-sm appearance-none pl-4 pr-8">{monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select>
                                        )}
                                        <select value={viewingYear} onChange={e => setViewingYear(parseInt(e.target.value))} className="p-2.5 bg-white border-none rounded-xl text-sm font-bold text-slate-700 outline-none hover:shadow-sm transition-all cursor-pointer shadow-sm appearance-none pl-4 pr-8">{yearOptions.map(y => <option key={y} value={y}>{y}</option>)}</select>
                                    </div>

                                    <button onClick={handleDownloadStatement} className="flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-lg shadow-slate-200 transition-all active:scale-95 whitespace-nowrap">
                                        <Download size={14} /> Download {statementType === 'yearly' ? 'Year' : 'Month'}
                                    </button>
                                </div>
                            </div>

                            <LayoutGroup>
                                <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                                    <AnimatePresence mode="popLayout">
                                        {filteredTransactionsForDisplay.length > 0 ? (
                                            filteredTransactionsForDisplay.map((t, index) => (
                                                <TransactionRow
                                                    key={t._id}
                                                    transaction={t}
                                                    remainingBalance={t.runningBalance} // Accurate historical balance!
                                                    index={index}
                                                    onRowClick={() => setViewingTransaction(t)}
                                                />
                                            ))
                                        ) : (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 flex flex-col items-center">
                                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4"><Search size={36} className="text-slate-300" /></div>
                                                <p className="text-slate-400 font-bold text-lg">No transactions found.</p>
                                                <p className="text-slate-400 text-sm">Change the filter to see data.</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </LayoutGroup>
                        </motion.div>
                    </div>
                </motion.div>
            </main>

            <AnimatePresence>
                {isModalOpen && <TransactionModal type={modalType} onClose={() => setIsModalOpen(false)} onSuccess={refetchData} />}
                {isDollarModalOpen && <AddDollarSpendModal onClose={() => setIsDollarModalOpen(false)} onSuccess={refetchData} />}
                {isLoadFundsModalOpen && <LoadFundsModal onClose={() => setIsLoadFundsModalOpen(false)} onSuccess={refetchData} />}
                {viewingDollarTransaction && <DollarDetailModal transaction={viewingDollarTransaction} onClose={() => setViewingDollarTransaction(null)} />}
                {transactionToDelete && (
                    <DeleteConfirmModal
                        transaction={transactionToDelete}
                        onClose={() => setTransactionToDelete(null)}
                        onConfirm={() => {
                            handleDeleteTransaction(transactionToDelete._id);
                            setTransactionToDelete(null);
                        }}
                    />
                )}
            </AnimatePresence>
            <TransactionDetailModal
                transaction={viewingTransaction}
                onClose={() => setViewingTransaction(null)}
                onDelete={(t) => {
                    setTransactionToDelete(t);
                    setViewingTransaction(null);
                }}
            />

            {/* Mobile Bottom Navigation Bar (Mobile Only) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-2xl border-t border-slate-200/60 px-6 py-4 pb-6 shadow-[0_-12px_40px_rgba(0,0,0,0.08)] flex justify-around items-center">
                {/* 1. Withdraw Tab */}
                <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => {
                        triggerHaptic(45);
                        openModal('Withdrawal');
                    }}
                    className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-rose-600 transition-all cursor-pointer bg-transparent border-none outline-none active:text-rose-600 group px-3 py-1 rounded-2xl hover:bg-rose-50/50"
                >
                    <div className="relative flex items-center justify-center">
                        <Minus size={22} className="stroke-[3] group-hover:scale-110 transition-transform" />
                        <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-rose-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider">Withdraw</span>
                </motion.button>

                {/* 2. Deposit Tab */}
                <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => {
                        triggerHaptic(45);
                        openModal('Deposit');
                    }}
                    className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-emerald-600 transition-all cursor-pointer bg-transparent border-none outline-none active:text-emerald-600 group px-3 py-1 rounded-2xl hover:bg-emerald-50/50"
                >
                    <div className="relative flex items-center justify-center">
                        <Plus size={22} className="stroke-[3] group-hover:rotate-90 transition-transform" />
                        <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider">Deposit</span>
                </motion.button>

                {/* 3. Cards Tab */}
                <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => {
                        triggerHaptic(45);
                        const el = document.getElementById('cards-widget');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-all cursor-pointer bg-transparent border-none outline-none active:text-blue-600 group px-3 py-1 rounded-2xl hover:bg-blue-50/50"
                >
                    <div className="relative flex items-center justify-center">
                        <CreditCard size={22} className="stroke-[2.5] group-hover:translate-y-[-1px] transition-transform" />
                        <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider">Cards</span>
                </motion.button>

                {/* 4. Privacy Tab */}
                <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => {
                        triggerHaptic(60);
                        setIsBalanceHidden(prev => !prev);
                        toast.success(isBalanceHidden ? "Balances displayed safely." : "Balances hidden for your privacy!", {
                            id: 'privacy-toast',
                            duration: 2000,
                            icon: isBalanceHidden ? '🔓' : '🔒'
                        });
                    }}
                    className={`flex flex-col items-center gap-1.5 transition-all cursor-pointer bg-transparent border-none outline-none group px-3 py-1 rounded-2xl ${isBalanceHidden ? 'text-emerald-600 bg-emerald-50/50' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50'}`}
                >
                    <div className="relative flex items-center justify-center">
                        {isBalanceHidden ? <EyeOff size={22} className="stroke-[2.5]" /> : <Eye size={22} className="stroke-[2.5]" />}
                        <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider">{isBalanceHidden ? 'Masked' : 'Privacy'}</span>
                </motion.button>
            </div>
        </div>
    );
}

// --- Server Side Props ---
export async function getServerSideProps(context) {
    const jwt = require('jsonwebtoken');
    const dbConnect = require('../../../lib/dbConnect').default;
    const User = require('../../../models/User').default;

    await dbConnect();
    const { token } = context.req.cookies;
    if (!token) return { redirect: { destination: "/login", permanent: false } };

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const financeUser = await User.findById(decoded.userId).select("-password").lean();

        if (!financeUser) {
            context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
            return { redirect: { destination: "/login", permanent: false } };
        }

        const allUserRoles = [financeUser.role, ...(financeUser.accessRoles || [])];
        if (!allUserRoles.some(r => ['Finance', 'Superadmin'].includes(r))) {
            return { redirect: { destination: '/dashboard', permanent: false } };
        }

        const Transaction = require('../../../models/Transaction').default;
        const transactions = await Transaction.find({}).populate('loggedBy', 'name avatar').sort({ date: -1 }).lean();
        const allUsers = await User.find({}).select('name role avatar email').lean();

        const hasAccess = (requiredRoles) => allUserRoles.some(r => requiredRoles.includes(r));
        let allowedRoutes = [];
        if (hasAccess(['Staff', 'Intern', 'Manager', 'Superadmin'])) allowedRoutes.push('/workspace');
        if (hasAccess(['HR', 'Superadmin'])) allowedRoutes.push('/hr/dashboard');
        if (hasAccess(['Project Manager', 'Superadmin'])) allowedRoutes.push('/pm/dashboard');
        if (hasAccess(['Finance', 'Superadmin'])) allowedRoutes.push('/finance/dashboard');
        if (hasAccess(['Superadmin'])) allowedRoutes.push('/superadmin/dashboard');
        allowedRoutes = [...new Set(allowedRoutes)];
        const canAccessHub = allowedRoutes.length > 1;

        return {
            props: {
                financeUser: JSON.parse(JSON.stringify(financeUser)),
                allUsers: JSON.parse(JSON.stringify(allUsers)),
                initialTransactions: JSON.parse(JSON.stringify(transactions)),
                canAccessHub
            }
        };
    } catch (error) {
        console.error("Finance Auth Error:", error.message);
        context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        return { redirect: { destination: "/login", permanent: false } };
    }
}
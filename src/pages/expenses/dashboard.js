import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet, TrendingUp, Receipt, Search, Plus, Calendar as CalendarIcon, ArrowLeft,
    CheckCircle, Clock, XCircle, Share2, Eye, X, UploadCloud,
    Coffee, Bus, Utensils, Wrench, Globe, Briefcase, ChevronLeft, ChevronRight, MessageSquare, List, Activity
} from 'lucide-react'; // Trigger rebuild
import NepaliDate from 'nepali-date-converter';
import toast, { Toaster } from 'react-hot-toast';
import {
    startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths
} from 'date-fns';

const holidays2026 = [
    { date: '2026-01-11', name: 'Prithvi Jayanti' }, { date: '2026-01-14', name: 'Maghe Sankranti' },
    { date: '2026-01-18', name: 'Sonam Lhosar' }, { date: '2026-01-23', name: 'Saraswati Puja' },
    { date: '2026-01-30', name: 'Sahid Diwas' }, { date: '2026-02-15', name: 'Maha Shivaratri' },
    { date: '2026-02-18', name: 'Gyalpo Lhosar' }, { date: '2026-02-19', name: 'Prajatantra Diwas' },
    { date: '2026-03-03', name: 'Fagu Purnima' }, { date: '2026-03-08', name: "Women's Day" },
    { date: '2026-03-27', name: 'Ram Navami' }, { date: '2026-04-14', name: 'Nepali New Year' },
    { date: '2026-05-01', name: 'Labour/Buddha Jayanti' }, { date: '2026-05-29', name: 'Ganatantra Diwas' },
    { date: '2026-08-28', name: 'Janai Purnima' }, { date: '2026-09-04', name: 'Krishna Janmashtami' },
    { date: '2026-09-15', name: 'Indra Jatra' }, { date: '2026-09-19', name: 'Constitution Day' },
    { date: '2026-10-12', name: 'Ghatasthapana' }, { date: '2026-10-18', name: 'Dashain' },
    { date: '2026-10-19', name: 'Dashain' }, { date: '2026-10-20', name: 'Dashain' },
    { date: '2026-10-21', name: 'Dashain' }, { date: '2026-10-22', name: 'Dashain' },
    { date: '2026-10-23', name: 'Dashain' }, { date: '2026-11-08', name: 'Tihar' },
    { date: '2026-11-09', name: 'Tihar' }, { date: '2026-11-10', name: 'Tihar' },
    { date: '2026-11-11', name: 'Tihar' }, { date: '2026-11-12', name: 'Tihar' },
    { date: '2026-11-15', name: 'Chhath Parva' }, { date: '2026-12-30', name: 'Tamu Lhosar' },
];

const getCategoryIcon = (cat) => {
    switch (cat) {
        case 'Tea & Snacks': return <Coffee size={18} />;
        case 'Stationery': return <Briefcase size={18} />;
        case 'Transport': return <Bus size={18} />;
        case 'Meals': return <Utensils size={18} />;
        case 'Internet/Comm': return <Globe size={18} />;
        case 'Maintenance': return <Wrench size={18} />;
        default: return <Receipt size={18} />;
    }
};

const getStatusBadge = (status) => {
    switch (status) {
        case 'Approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'Rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
        default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
};

export default function PremiumExpenseDashboard({ userData }) {
    const router = useRouter();
    const [expenses, setExpenses] = useState([]);
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState(userData?.role || null);
    const [userId, setUserId] = useState(userData?._id || null);

    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [isDayModalOpen, setIsDayModalOpen] = useState(false);

    // UI States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    const [accessRoles, setAccessRoles] = useState([]);

    // Form States
    const [formData, setFormData] = useState({
        title: '', amount: '', category: 'Tea & Snacks', paymentMethod: 'Cash', notes: '', date: new Date().toISOString().split('T')[0]
    });
    const [receiptImage, setReceiptImage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
        if (userData) {
            setUserRole(userData.role);
            setUserId(userData._id);
            setAccessRoles(userData.accessRoles || []);
        }
    }, [userData]);

    const fetchData = async () => {
        try {
            const [expRes, statsRes] = await Promise.all([
                fetch('/api/expenses'),
                fetch('/api/expenses/dashboard-stats')
            ]);

            if (expRes.ok && statsRes.ok) {
                const expData = await expRes.json();
                const statsData = await statsRes.json();
                setExpenses(expData.data);
                setStats(statsData.stats);
            }
        } catch (error) {
            toast.error("Failed to load expenses.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image must be less than 5MB");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => setReceiptImage(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const submitExpense = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const selectedDateObj = new Date(formData.date);
        const npDate = new NepaliDate(selectedDateObj).format('YYYY-MM-DD');

        try {
            const payload = {
                ...formData,
                englishDate: selectedDateObj.toISOString(),
                nepaliDate: npDate,
                receiptImage
            };

            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to add expense");

            toast.success("Expense added successfully!");
            setIsAddModalOpen(false);
            setFormData({ title: '', amount: '', category: 'Tea & Snacks', paymentMethod: 'Cash', notes: '', date: new Date().toISOString().split('T')[0] });
            setReceiptImage(null);
            fetchData();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            const res = await fetch(`/api/expenses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'markRead' })
            });
            if (!res.ok) throw new Error("Update failed");
            fetchData();
        } catch (err) {
            console.error("Mark read failed", err);
        }
    };


    const shareToWhatsApp = (targetDate = new Date(), targetExpenses = null) => {
        const expsToShare = targetExpenses || expenses.filter(e => isSameDay(new Date(e.englishDate), targetDate));

        if (expsToShare.length === 0) {
            toast.error(isSameDay(targetDate, new Date()) ? "No expenses today to share." : "No expenses on this date to share.");
            return;
        }

        const npDate = new NepaliDate(targetDate).format('YYYY-MM-DD');
        const adDate = format(targetDate, 'yyyy-MM-dd');
        const dayName = format(targetDate, 'EEEE');

        let msg = `Daily Expense Report (${dayName}) \nBS: ${npDate} | AD: ${adDate}\n\n`;
        let total = 0;

        expsToShare.forEach(e => {
            msg += `- ${e.title} : Rs. ${e.amount}\n`;
            if (e.notes) msg += `   Note: _${e.notes}_\n`;
            total += e.amount;
        });

        msg += `\n Total: Rs. ${total} \n`;

        const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    // Calendar Generation
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const dateFormat = "d";
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const getDayExpenses = (day) => expenses.filter(e => isSameDay(new Date(e.englishDate), day));

    const openDayModal = (day) => {
        setSelectedDate(day);
        setIsDayModalOpen(true);
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]"><div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div></div>;

    const selectedDayExpenses = selectedDate ? getDayExpenses(selectedDate) : [];
    const dayTotal = selectedDayExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    // Calculate unread activity log for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const unreadActivity = expenses.filter(e => {
        const expDate = new Date(e.createdAt);
        return expDate >= sevenDaysAgo && !e.readBy?.includes(userId);
    });

    // Get all activity log
    const activityLog = expenses.filter(e => new Date(e.createdAt) >= sevenDaysAgo).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const getRelativeTime = (dateStr) => {
        const d = new Date(dateStr);
        const today = new Date();

        if (isSameDay(d, today)) return "Today";

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (isSameDay(d, yesterday)) return "Yesterday";

        return format(d, 'MMM d, yyyy'); // Just show date if older
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] text-slate-900 font-sans selection:bg-indigo-200">
            <Head><title>Expense Tracking</title></Head>

            {/* Minimal Header */}
            <header className="bg-white/70 backdrop-blur-2xl border-b border-slate-200/50 sticky top-0 z-40">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-6">
                        <Link href="/dashboard" className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors group shrink-0">
                            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5 sm:gap-2">
                                Finance <span className="hidden sm:inline text-slate-400 font-medium">| Expenses</span>
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-2.5">
                        <div className="hidden sm:flex items-center gap-2 pr-3 border-r border-slate-200 mr-1">
                            <img src={userData?.avatar} alt={userData?.name} className="w-7 h-7 rounded-full border border-slate-200 shadow-sm" />
                        </div>
                        <button onClick={() => setIsActivityLogOpen(true)} className="relative flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 font-bold text-[10px] sm:text-xs rounded-full transition-all shadow-sm hover:shadow">
                            <Activity size={14} className="sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Activity Log</span>
                            {unreadActivity.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 items-center justify-center text-[9px] font-black text-white shadow-sm">{unreadActivity.length}</span>
                                </span>
                            )}
                        </button>
                        <button onClick={shareToWhatsApp} className="hidden md:flex items-center gap-1.5 px-3.5 py-2 bg-[#E8F5E9]/80 text-[#2E7D32] hover:bg-[#C8E6C9]/80 border border-[#C8E6C9] font-bold text-xs rounded-full transition-all shadow-sm hover:shadow">
                            <Share2 size={14} /> Share Today
                        </button>
                        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-900 text-white hover:bg-slate-800 font-bold text-[10px] sm:text-xs rounded-full transition-all shadow-lg shadow-slate-900/20 transform hover:-translate-y-0.5">
                            <Plus size={14} className="sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">New Expense</span><span className="sm:hidden">New</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">

                {/* Premium Analytics Ribbon */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { title: 'Today', value: stats.todayExpenses, icon: <CalendarIcon size={16} />, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                            { title: 'This Month', value: stats.monthlyExpenses, icon: <TrendingUp size={16} />, color: 'text-blue-500', bg: 'bg-blue-50' },
                            { title: 'Total Expenses', value: stats.totalExpensesCount, prefix: '', icon: <Receipt size={16} />, color: 'text-amber-500', bg: 'bg-amber-50', isCount: true },
                            { title: 'Top Category', value: stats.topCategoryAmount, sub: stats.topCategory, icon: <Wallet size={16} />, color: 'text-purple-500', bg: 'bg-purple-50' }
                        ].map((stat, i) => (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={i} className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/40 group relative overflow-hidden">
                                <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${stat.bg} opacity-50 blur-2xl group-hover:scale-150 transition-transform duration-700`}></div>
                                <div className="relative z-10">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                                        <span className={`p-1.5 rounded-lg ${stat.bg} ${stat.color}`}>{stat.icon}</span> {stat.title}
                                    </p>
                                    <h3 className="text-3xl font-black text-slate-800 tracking-tighter">
                                        {!stat.isCount && 'Rs. '}{(stat.value || 0).toLocaleString()}
                                    </h3>
                                    {stat.sub && <p className="text-xs font-bold text-slate-400 mt-1">{stat.sub}</p>}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Main Calendar View (Apple/Linear Inspired) */}
                <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
                    <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white gap-3 sm:gap-0">
                        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">{format(currentMonth, "MMMM yyyy")}</h2>
                            <div className="px-2 sm:px-3 py-1 bg-slate-100 rounded-lg text-[10px] sm:text-xs font-bold text-slate-500 tracking-widest whitespace-nowrap">
                                BS: {new NepaliDate(currentMonth).format('YYYY MMMM')}
                            </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto justify-end">
                            <button onClick={prevMonth} className="p-2 sm:p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"><ChevronLeft size={18} className="sm:w-5 sm:h-5" /></button>
                            <button onClick={nextMonth} className="p-2 sm:p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"><ChevronRight size={18} className="sm:w-5 sm:h-5" /></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className={`py-2 sm:py-4 text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest ${d === 'Sat' ? 'text-rose-500' : 'text-slate-400'}`}>{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 bg-slate-100 gap-[1px]">
                        {days.map((day, idx) => {
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isToday = isSameDay(day, new Date());
                            const isSaturday = format(day, 'EEE') === 'Sat';
                            const dayStr = format(day, 'yyyy-MM-dd');
                            const holidayMatch = holidays2026.find(h => h.date === dayStr);
                            const isHoliday = isSaturday || holidayMatch;

                            const dayExps = getDayExpenses(day);
                            const approvedCount = dayExps.filter(e => e.status === 'Approved').length;
                            const pendingCount = dayExps.filter(e => e.status === 'Pending').length;
                            const rejectedCount = dayExps.filter(e => e.status === 'Rejected').length;

                            return (
                                <motion.div
                                    whileHover={{ scale: 0.98 }}
                                    onClick={() => openDayModal(day)}
                                    key={day.toString()}
                                    className={`min-h-[70px] sm:min-h-[140px] bg-white p-1 sm:p-4 cursor-pointer relative group transition-all overflow-hidden
                                        ${!isCurrentMonth ? 'opacity-40 hover:opacity-80' : ''}
                                        ${isToday ? 'bg-indigo-50/10' : ''}
                                        ${isHoliday ? 'bg-rose-50/20' : ''}
                                    `}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className={`w-5 h-5 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-[10px] sm:text-sm font-bold transition-all shrink-0
                                            ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' :
                                                isHoliday ? 'text-rose-500 group-hover:bg-rose-50' :
                                                    'text-slate-600 group-hover:bg-slate-100'}`}>
                                            {format(day, dateFormat)}
                                        </span>
                                        <span className={`text-[8px] sm:text-[10px] font-bold transition-colors mt-0.5 sm:mt-0 ${isHoliday ? 'text-rose-300 group-hover:text-rose-400' : 'text-slate-300 group-hover:text-slate-400'}`}>
                                            {new NepaliDate(day).format('DD')}
                                        </span>
                                    </div>

                                    {/* Holiday Label */}
                                    {holidayMatch && (
                                        <div className="mt-1 text-[7px] sm:text-[9px] font-bold text-rose-500 uppercase tracking-tight leading-tight truncate px-1">
                                            {holidayMatch.name}
                                        </div>
                                    )}

                                    {/* Indicators */}
                                    <div className="mt-1 sm:mt-4 space-y-0.5 sm:space-y-1.5 flex flex-col items-end">
                                        {dayExps.length > 0 && (
                                            <div className="px-1 sm:px-2 py-0.5 sm:py-1 bg-slate-50 text-slate-700 text-[8px] sm:text-[10px] font-bold rounded sm:rounded-md flex items-center justify-center sm:justify-start gap-0.5 sm:gap-1.5 shadow-sm w-full truncate border border-slate-100">
                                                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-slate-400 shrink-0"></div>
                                                <span className="truncate">{dayExps.length} <span className="hidden sm:inline">Expenses</span></span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </main>

            {/* Premium Day Modal (Drawer) */}
            <AnimatePresence>
                {isDayModalOpen && selectedDate && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsDayModalOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: '100%' }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-[#F9FAFB] rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl relative z-10 flex flex-col border border-white/20"
                        >
                            {/* Drawer Header */}
                            <div className="p-6 sm:p-8 bg-white border-b border-slate-100 flex justify-between items-start shrink-0 relative overflow-hidden">
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
                                <div className="relative z-10">
                                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                                        {format(selectedDate, "EEEE, MMMM d")}
                                    </h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        BS: {new NepaliDate(selectedDate).format('YYYY MMMM DD')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 relative z-10">
                                    <button onClick={() => shareToWhatsApp(selectedDate, selectedDayExpenses)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#C8E6C9] font-bold text-[10px] sm:text-xs rounded-full transition-all shadow-sm">
                                        <Share2 size={12} /> <span className="hidden sm:inline">Share Daily Report</span><span className="sm:hidden">Share</span>
                                    </button>
                                    <button onClick={() => setIsDayModalOpen(false)} className="p-2.5 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded-full transition-colors"><X size={18} /></button>
                                </div>
                            </div>

                            {/* Summary Cards */}
                            <div className="px-6 sm:px-8 py-6 bg-slate-50 border-b border-slate-200/50 shrink-0 overflow-x-auto">
                                <div className="flex gap-4 min-w-max">
                                    <div className="bg-white px-5 py-3.5 rounded-2xl shadow-sm border border-slate-100 min-w-[140px]">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Daily Expenses</p>
                                        <p className="text-xl font-black text-slate-800">Rs. {dayTotal.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Expense List */}
                            <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-4">
                                {selectedDayExpenses.length === 0 ? (
                                    <div className="py-20 text-center flex flex-col items-center">
                                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                            <Receipt size={32} className="text-slate-300" />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-800">No Expenses</h3>
                                        <p className="text-sm font-medium text-slate-500 mt-1">There are no expenses recorded for this day.</p>
                                    </div>
                                ) : (
                                    selectedDayExpenses.map(exp => (
                                        <div key={exp._id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
                                            <div className="flex flex-col sm:flex-row justify-between gap-6">
                                                <div className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner bg-slate-50 border border-slate-100">
                                                        {React.cloneElement(getCategoryIcon(exp.category), { size: 16 })}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-black text-slate-800 leading-tight mb-1">{exp.title}</h4>
                                                        <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-500">
                                                            <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-md">
                                                                <img src={exp.createdBy?.avatar} alt="" className="w-4 h-4 rounded-full" />
                                                                <span>{exp.createdBy?.name}</span>
                                                            </div>
                                                            <span className="bg-slate-100 px-2 py-0.5 rounded-md">{exp.category}</span>
                                                            <span className="bg-slate-100 px-2 py-0.5 rounded-md">{exp.paymentMethod}</span>
                                                        </div>
                                                        {exp.notes && (
                                                            <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">{exp.notes}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:items-end justify-between border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6 shrink-0">
                                                    <div className="text-left sm:text-right mb-4 sm:mb-0">
                                                        <p className="text-xl font-black text-slate-800 tracking-tight">Rs. {exp.amount.toLocaleString()}</p>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {exp.receiptUrl && (
                                                            <button onClick={() => setSelectedReceipt(exp.receiptUrl)} className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5">
                                                                <Eye size={14} /> Receipt
                                                            </button>
                                                        )}

                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Activity Log Modal */}
            <AnimatePresence>
                {isActivityLogOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsActivityLogOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl relative z-10 flex flex-col">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Activity className="text-slate-500" /> Activity Log</h3>
                                    <p className="text-xs text-slate-500 mt-1 font-medium">Recent expenses from the last 7 days.</p>
                                </div>
                                <button onClick={() => setIsActivityLogOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/30">
                                {activityLog.length === 0 ? (
                                    <div className="py-10 text-center font-bold text-slate-400">No recent activity.</div>
                                ) : (
                                    activityLog.map(exp => {
                                        const isUnread = !exp.readBy?.includes(userId);
                                        return (
                                            <div key={exp._id} className={`bg-white rounded-xl p-4 shadow-sm border transition-colors flex flex-col gap-3 ${isUnread ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200'}`}>
                                                <div className="flex items-start gap-3">
                                                    <img src={exp.createdBy?.avatar} alt="" className="w-10 h-10 rounded-full shrink-0 border border-slate-200" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-slate-700 leading-snug">
                                                            <span className="font-bold text-slate-900">{exp.createdBy?.name}</span> added an expense <span className="font-bold text-slate-800">"{exp.title}"</span> for <span className="font-black text-slate-900">Rs. {exp.amount}</span>.
                                                        </p>
                                                        <div className="flex items-center justify-between mt-2">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                                <Clock size={10} /> {getRelativeTime(exp.createdAt)}
                                                            </p>
                                                            {isUnread && (
                                                                <button onClick={() => markAsRead(exp._id)} className="text-[10px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 transition-colors">
                                                                    <CheckCircle size={12} /> Mark as Read
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Expense Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl relative z-10">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-xl font-black text-slate-800">Add New Expense</h3>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
                            </div>
                            <form onSubmit={submitExpense} className="p-6 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Amount (Rs)</label>
                                        <input type="number" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-lg font-black text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="0" />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Category</label>
                                        <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
                                            {['Tea & Snacks', 'Stationery', 'Transport', 'Meals', 'Office Supplies', 'Internet/Comm', 'Maintenance', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Title / Description</label>
                                    <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="e.g. Client meeting coffee" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Notes (Optional)</label>
                                    <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="Additional details..." rows="2"></textarea>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Payment Method</label>
                                        <select value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
                                            {['Cash', 'Bank Transfer', 'Digital Wallet', 'Card'].map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Receipt (Optional)</label>
                                        <div className="relative">
                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                            <div className="w-full bg-slate-50 border border-dashed border-slate-300 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors">
                                                {receiptImage ? <span className="text-indigo-600 flex items-center gap-1"><CheckCircle size={14} /> Attached</span> : <><UploadCloud size={16} /> Upload Bill</>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Date</label>
                                    <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
                                </div>
                                <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-xl shadow-slate-900/20">
                                    {isSubmitting ? 'Saving...' : 'Submit Expense'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Receipt Modal */}
            <AnimatePresence>
                {selectedReceipt && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={() => setSelectedReceipt(null)} />
                        <motion.img
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            src={selectedReceipt} alt="Receipt"
                            className="relative z-10 max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain border border-white/10"
                        />
                        <button onClick={() => setSelectedReceipt(null)} className="absolute top-6 right-6 z-20 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 backdrop-blur-md transition-colors border border-white/20">
                            <X size={24} />
                        </button>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export async function getServerSideProps(context) {
    const dbConnect = (await import('../../../lib/dbConnect')).default;
    const User = (await import('../../../models/User')).default;
    const jwt = require('jsonwebtoken');

    await dbConnect();
    const { token } = context.req.cookies;

    if (!token) return { redirect: { destination: '/login', permanent: false } };

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('role accessRoles name avatar').lean();

        if (!user) return { redirect: { destination: '/login', permanent: false } };

        return {
            props: {
                userData: {
                    _id: user._id.toString(),
                    role: user.role || '',
                    accessRoles: user.accessRoles || [],
                    name: user.name || '',
                    avatar: user.avatar || ''
                }
            }
        };
    } catch (error) {
        return { redirect: { destination: '/login', permanent: false } };
    }
}

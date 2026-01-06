import { useState, useMemo, useEffect, useRef, useCallback, memo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from 'next/image';
import { 
  LogOut, ChevronDown, Plus, Minus, TrendingUp, TrendingDown, 
  DollarSign, Send, CreditCard, Bell, ArrowUpRight, ArrowDownLeft, 
  X as XIcon, CheckCircle, Download, Globe, Layers, 
  Trash2, Target, Search, Grid, Activity, 
  Facebook, Instagram, Linkedin, Video
} from 'react-feather';
import toast from 'react-hot-toast'; 
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
// Import the fixed generator
import { generateFinancialStatement } from '../../utils/financeGenerator';

// --- Register ChartJS ---
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

// --- Animation Variants ---
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
  exit: { scale: 0.95, opacity: 0, y: 10, transition: { duration: 0.2 } }
};

// --- Helper Functions ---
const formatCurrency = (amount) => `Rs. ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(amount || 0)}`;
const formatUSD = (amount) => `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(amount || 0)}`;
const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    if(includeTime) { options.hour = '2-digit'; options.minute = '2-digit'; options.hour12 = true; }
    return date.toLocaleString('en-US', options);
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
};

// --- Sub-Components ---

// 1. Loader
const DashboardEntryLoader = ({ userName }) => (
    <motion.div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center font-sans" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} className="relative mb-8">
            <div className="absolute inset-0 bg-emerald-300 blur-3xl rounded-full opacity-40 animate-pulse"></div>
            <Image src="/finance.png" alt="Logo" width={90} height={90} className="relative z-10" priority />
        </motion.div>
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">Welcome, {userName.split(' ')[0]}</h2>
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <span className="flex items-center gap-2">Initializing Secure Dashboard...</span>
        </div>
        <motion.div className="mt-8 h-1.5 w-48 bg-slate-100 rounded-full overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <motion.div className="h-full bg-emerald-500 rounded-full" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.5, ease: "easeInOut" }} />
        </motion.div>
    </motion.div>
);

// 2. Stat Card
const StatCard = memo(({ title, value, icon, color }) => (
  <motion.div variants={fadeInUp} className="bg-white/80 backdrop-blur-md p-5 rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex items-start gap-4 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-100/50 hover:border-emerald-100 group cursor-default hover:-translate-y-1">
    <div className={`w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-2xl transition-all duration-300 ${color.bg} group-hover:scale-110 shadow-sm`}>{icon}</div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">{title}</p>
      <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${color.text}`}>{value}</p>
    </div>
  </motion.div>
));
StatCard.displayName = "StatCard";

// 3. Profit Widget
const ProfitMarginWidget = ({ income, expense }) => {
    const profit = income - expense;
    const margin = income > 0 ? Math.round((profit / income) * 100) : 0;
    const color = margin > 20 ? '#10b981' : margin > 0 ? '#f59e0b' : '#f43f5e';
    const data = { labels: ['Margin', 'Cost'], datasets: [{ data: [Math.max(0, margin), 100 - Math.max(0, margin)], backgroundColor: [color, '#f1f5f9'], borderWidth: 0, circumference: 230, rotation: 245, cutout: '85%' }] };

    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center h-full relative overflow-hidden group hover:shadow-lg transition-all duration-500 min-h-[200px]">
            <div className="w-full flex justify-between items-center mb-2 z-10 relative">
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Activity size={14} className="text-emerald-500"/> Profit Margin</h3>
                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${margin > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{margin > 0 ? 'Healthy' : 'Critical'}</span>
            </div>
            <div className="relative w-36 h-36 z-10 mt-2 flex justify-center items-center">
                <Doughnut data={data} options={{ plugins: { legend: { display: false }, tooltip: { enabled: false } }, animation: { duration: 2000, easing: 'easeOutQuart' }, maintainAspectRatio: false }} />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-3xl font-black text-slate-800 tracking-tighter">{margin}%</span>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1">Efficiency</p>
                </div>
            </div>
        </div>
    );
};

// 4. Quick Actions
const ActionCard = ({ onAction }) => (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 h-full flex flex-col">
        <h2 className="text-lg font-extrabold text-slate-800 mb-5 px-1 flex items-center gap-2"><Grid size={18} className="text-emerald-500"/> Actions</h2>
        <div className="grid grid-cols-2 gap-4 h-full">
            {[ 
                { label: 'Income', icon: <Plus size={24}/>, color: 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100', action: 'Income' },
                { label: 'Expense', icon: <Minus size={24}/>, color: 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100', action: 'Expense' },
                { label: 'Deposit', icon: <ArrowUpRight size={24}/>, color: 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100', action: 'Deposit' },
                { label: 'Withdraw', icon: <ArrowDownLeft size={24}/>, color: 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100', action: 'Withdrawal' }
            ].map((btn) => (
                <button key={btn.label} onClick={() => onAction(btn.action)} className={`${btn.color} font-bold p-4 rounded-[1.5rem] border flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md w-full h-full min-h-[100px] aspect-[4/3] group active:scale-95`}>
                    <div className="p-2.5 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">{btn.icon}</div>
                    <span className="text-xs font-bold uppercase tracking-wide">{btn.label}</span>
                </button>
            ))}
        </div>
    </div>
);

// 5. Notifications
const NotificationDropdown = ({ isOpen, notifications, onClose, onMarkRead }) => (
    <AnimatePresence>
        {isOpen && (
            <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40 bg-transparent" />
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/50 z-50 origin-top-right overflow-hidden ring-1 ring-slate-900/5">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider"><Bell size={14} className="text-emerald-500"/> Notification</h3>
                        {notifications.some(n => !n.isRead) && (<button onClick={onMarkRead} className="text-[10px] font-bold text-emerald-600 bg-white border border-emerald-100 px-3 py-1.5 rounded-full hover:bg-emerald-50 transition-colors shadow-sm">MARK ALL READ</button>)}
                    </div>
                    <div className="max-h-[24rem] overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {notifications.length > 0 ? notifications.map(notif => (
                            <motion.div layout key={notif._id} className={`p-4 rounded-2xl transition-all relative overflow-hidden group ${!notif.isRead ? 'bg-emerald-50/40' : 'hover:bg-slate-50'}`}>
                                {!notif.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-2xl"></div>}
                                <div className="flex gap-3 pl-2">
                                    <div className={`p-2 rounded-full h-fit flex-shrink-0 ${!notif.isRead ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}><Bell size={14}/></div>
                                    <div>
                                        <p className={`text-sm leading-snug ${!notif.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>{notif.content}</p>
                                        <p className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase tracking-wide">{formatDate(notif.createdAt, true)}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="py-12 text-center flex flex-col items-center text-slate-400">
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3"><Bell size={20} className="opacity-30"/></div>
                                <p className="text-xs font-bold uppercase tracking-wide opacity-50">No new alerts</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </>
        )}
    </AnimatePresence>
);

// 6. Dollar Card
const DollarCardWidget = ({ dollarData, dollarBalance, onAddClick, onLoadClick, onItemClick, onDelete }) => {
    const recentActivity = [...dollarData].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            {/* Virtual Card */}
            <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.4 }} className="relative h-80 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-emerald-900/20 bg-[#064e3b] group">
                 <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 to-[#0f172a] opacity-100"></div>
                 <div className="absolute top-[-50%] left-[-50%] w-[100%] h-[100%] bg-emerald-400/10 rounded-full blur-[100px] animate-pulse"></div>
                 <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-teal-500/10 rounded-full blur-[80px]"></div>
                <div className="relative p-8 flex flex-col justify-between h-full text-white">
                    <div className="flex justify-between items-start">
                        <div><p className="text-emerald-200/60 text-[10px] font-black tracking-[0.2em] uppercase mb-2">ADS DOLLAR FUND</p><h3 className="text-5xl font-black tracking-tighter text-white drop-shadow-sm">{formatUSD(dollarBalance)}</h3></div>
                        <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner"><Globe size={24} className="text-emerald-200"/></div>
                    </div>
                    <div className="mt-auto">
                        <div className="flex gap-3 mb-8">
                            <button onClick={onLoadClick} className="bg-white text-emerald-950 text-xs font-bold py-3.5 px-6 rounded-2xl flex items-center gap-2 transition-all hover:bg-emerald-50 shadow-lg hover:shadow-emerald-900/20 active:scale-95"><ArrowDownLeft size={16}/> Load</button>
                            <button onClick={onAddClick} className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-3.5 px-6 rounded-2xl border border-white/10 flex items-center gap-2 transition-all backdrop-blur-sm active:scale-95"><Minus size={16}/> Spend</button>
                        </div>
                        <div className="flex justify-between items-end opacity-90">
                            <div><div className="flex items-center gap-3 mb-1"><div className="flex -space-x-2"><div className="w-8 h-8 rounded-full bg-rose-500/80 border-2 border-[#064e3b] backdrop-blur-md"></div><div className="w-8 h-8 rounded-full bg-amber-400/80 border-2 border-[#064e3b] backdrop-blur-md"></div></div><span className="text-sm text-emerald-100/60 font-mono tracking-widest">•••• 5869</span></div></div>
                            <Image src="/geckoworks.png" alt="Logo" width={30} height={30} className="opacity-50 grayscale brightness-200" />
                        </div>
                    </div>
                </div>
            </motion.div>
            
            {/* Activity List */}
            <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-80 overflow-hidden">
                 <div className="flex justify-between items-center mb-4 px-1 flex-shrink-0">
                    <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-lg">
                        <Layers size={20} className="text-emerald-500"/> 
                        <span className="hidden sm:inline">Recent Activity</span>
                        <span className="sm:hidden">Activity</span>
                    </h3>
                    <Link href="/finance/dollar-history" className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-wider flex items-center gap-1">View All <ChevronDown size={12} className="-rotate-90"/></Link>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                     {recentActivity.length > 0 ? recentActivity.map((d, i) => (
                         <motion.div 
                            whileHover={{ x: 2, backgroundColor: "#f8fafc" }} 
                            key={d._id || i} 
                            className="flex justify-between items-center p-3 rounded-2xl cursor-pointer group transition-all border border-transparent hover:border-slate-100" 
                            onClick={() => onItemClick(d)}
                         >
                             <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${d.type === 'Load' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                     {d.type === 'Load' ? <ArrowDownLeft size={18}/> : <Target size={18}/>}
                                 </div>
                                 <div className="min-w-0 flex-1">
                                     <p className="font-bold text-slate-800 text-sm truncate block">{d.type === 'Load' ? 'Wallet Load' : d.companyName}</p>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate block">{d.type === 'Load' ? formatDate(d.date) : d.campaignName || 'Ad Spend'}</p>
                                 </div>
                             </div>
                             <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`font-black text-sm whitespace-nowrap ${d.type === 'Load' ? 'text-emerald-600' : 'text-slate-800'}`}>{d.type === 'Load' ? '+' : '-'}{formatUSD(d.amount)}</span>
                                <button onClick={(e) => { e.stopPropagation(); onDelete(d._id); }} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"><Trash2 size={14}/></button>
                             </div>
                         </motion.div>
                     )) : <div className="h-full flex flex-col items-center justify-center text-slate-400"><Layers size={24} className="mb-2 opacity-20"/><span className="text-xs font-bold uppercase tracking-wide opacity-50">No Data</span></div>}
                 </div>
            </div>
        </div>
    );
};

// 7. Notification Form
const NotificationCard = ({ allUsers, onSubmit, content, setContent, targetUser, setTargetUser, isSending }) => (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-full">
        <h2 className="text-lg font-extrabold text-slate-800 mb-6 px-1 flex items-center gap-2"><Send size={18} className="text-emerald-500"/> Notify Team</h2>
        <form onSubmit={onSubmit} className="space-y-4 px-1">
            <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Recipient</label><select id="targetUser" value={targetUser} onChange={(e) => setTargetUser(e.target.value)} required className="w-full px-4 py-3.5 border-none bg-slate-50 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold text-slate-700 transition-all"><option value="" disabled>Select Employee</option>{allUsers.map((u) => (<option key={u._id} value={u._id}>{u.name} ({u.role})</option>))}</select></div>
            <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Message</label><textarea id="notification-content" value={content} onChange={(e) => setContent(e.target.value)} rows="3" className="w-full px-4 py-3.5 border-none bg-slate-50 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-sm font-medium text-slate-700 placeholder:text-slate-400 transition-all" required placeholder="Type your update here..." /></div>
            <div className="flex justify-end pt-2"><button type="submit" disabled={isSending} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-3.5 rounded-2xl flex items-center gap-2 disabled:opacity-50 transition-all shadow-xl shadow-slate-200 active:scale-95 text-sm"><Send size={16}/>{isSending ? 'Sending...':'Send Blast'}</button></div>
        </form>
    </div>
);

// 8. Transaction Row
const TransactionRow = memo(({ transaction, remainingBalance, onRowClick, onDelete, index }) => {
    const isIncome = transaction.type === 'Income' || transaction.type === 'Deposit';
    return (
        <motion.div 
            variants={modalContent} 
            layout 
            onClick={onRowClick} 
            className="bg-white p-4 sm:p-5 rounded-[1.5rem] shadow-sm border border-slate-100 hover:shadow-lg hover:border-emerald-100 transition-all duration-300 cursor-pointer group relative overflow-hidden pr-3 sm:pr-4"
        >
            <div className="flex items-center justify-between relative z-10 w-full">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 mr-2">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center rounded-2xl shadow-sm ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {isIncome ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                             <p className="font-bold text-slate-800 truncate text-sm sm:text-base">{transaction.title}</p>
                             <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-600 border border-emerald-100">
                                 <CheckCircle size={8}/> Verified
                             </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 w-full overflow-hidden">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 truncate max-w-[120px]">{transaction.category}</span>
                            <span className="text-[10px] font-bold text-slate-400 flex-shrink-0">{formatDate(transaction.date)}</span>
                        </div>
                    </div>
                </div>

                <div className="text-right flex-shrink-0 transition-transform duration-300 group-hover:-translate-x-12">
                      <p className={`text-base sm:text-lg font-black ${isIncome ? 'text-emerald-600' : 'text-slate-800'}`}>{isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">Bal: {formatCurrency(remainingBalance)}</p>
                </div>
            </div>

            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                <button onClick={(e) => { e.stopPropagation(); onDelete(transaction._id); }} className="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-full shadow-md transition-all transform scale-90 group-hover:scale-100 hover:rotate-90"><Trash2 size={18}/></button>
            </div>
        </motion.div>
    );
});
TransactionRow.displayName = "TransactionRow";

// --- Modals ---
const TransactionModal = ({ type, onClose, onSuccess }) => {
    let defaultCategory = 'General';
    if (type === 'Income') defaultCategory = 'Client Payment';
    if (type === 'Expense') defaultCategory = 'Office Supplies';
    const [formData, setFormData] = useState({ title: '', amount: '', category: defaultCategory, date: new Date().toISOString().split('T')[0], description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({...prev, [name]: value})); };
    const handleSubmit = async (e) => {
        e.preventDefault(); setIsSubmitting(true);
        try { const res = await fetch('/api/finance/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, type }) }); if (!res.ok) throw new Error('Failed'); toast.success('Logged successfully!'); await onSuccess(); onClose(); } catch (err) { toast.error(err.message); } finally { setIsSubmitting(false); }
    };
    return (
        <motion.div variants={modalBackdrop} initial="initial" animate="animate" exit="exit" className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[80] flex justify-center items-center p-4">
            <motion.div variants={modalContent} className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-lg border border-white/60">
                <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-extrabold text-slate-800">Add {type}</h3><button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><XIcon className="text-slate-400"/></button></div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Title</label><input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-800" placeholder="Transaction Title"/></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Amount</label><input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleChange} required className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none font-black text-slate-800" placeholder="0.00"/></div>
                        <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} required className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-600"/></div>
                    </div>
                    <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label><input type="text" name="category" value={formData.category} onChange={handleChange} required className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"/></div>
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
    const handleSubmit = async (e) => { e.preventDefault(); setIsSubmitting(true); try { const res = await fetch('/api/finance/dollar-spend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, type: 'Spend' }) }); if (!res.ok) throw new Error('Failed'); toast.success('Spend recorded!'); await onSuccess(); onClose(); } catch (error) { toast.error(error.message); } finally { setIsSubmitting(false); } };
    return (
        <motion.div variants={modalBackdrop} initial="initial" animate="animate" exit="exit" className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] flex justify-center items-center p-4">
            <motion.div variants={modalContent} className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-md border border-white/60">
                <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2"><Target size={24} className="text-emerald-500"/> Record Spend</h3><button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><XIcon className="text-slate-400"/></button></div>
                <form onSubmit={handleSubmit} className="space-y-6">
                      <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Platform</label><div className="flex flex-wrap gap-2">{platforms.map((p) => (<button key={p.id} type="button" onClick={() => setFormData({...formData, platform: p.id})} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${formData.platform === p.id ? `${p.color} text-white shadow-lg ring-2 ring-offset-2 ring-slate-200 scale-105` : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>{p.icon} {p.id}</button>))}</div></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Client</label><input type="text" required value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800" placeholder="Client Name"/></div>
                        <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Campaign</label><input type="text" value={formData.campaignName} onChange={e => setFormData({...formData, campaignName: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium" placeholder="Campaign"/></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                        <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Amount ($)</label><input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-2 bg-transparent border-none font-black text-xl text-slate-800 outline-none placeholder:text-slate-300" placeholder="0.00"/></div>
                        <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Rate (NPR)</label><input type="number" step="0.01" required value={formData.exchangeRate} onChange={e => setFormData({...formData, exchangeRate: e.target.value})} className="w-full p-2 bg-white border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm text-center"/></div>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl mt-4 transition-all shadow-xl shadow-slate-200 active:scale-95">{isSubmitting ? 'Saving...' : 'Confirm Spend'}</button>
                </form>
            </motion.div>
        </motion.div>
    );
};

const LoadFundsModal = ({ onClose, onSuccess }) => {
    const [amount, setAmount] = useState(''); const [rate, setRate] = useState('135.0'); const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = async (e) => { e.preventDefault(); setIsSubmitting(true); try { const res = await fetch('/api/finance/dollar-spend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'Load', amount, exchangeRate: rate }) }); if (!res.ok) throw new Error('Failed'); toast.success(`Loaded $${amount} successfully!`); await onSuccess(); onClose(); } catch (error) { toast.error(error.message); } finally { setIsSubmitting(false); } };
    return (
        <motion.div variants={modalBackdrop} initial="initial" animate="animate" exit="exit" className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[70] flex justify-center items-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-md border border-white/60">
                <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-extrabold text-slate-800">Load Wallet</h3><button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><XIcon className="text-slate-400"/></button></div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Amount (USD)</label><input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="0.00"/></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Exchange Rate</label><input type="number" step="0.01" required value={rate} onChange={e => setRate(e.target.value)} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none"/></div>
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
                <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:bg-slate-100 rounded-full p-2 transition-colors"><XIcon size={20}/></button>
                <div className="flex items-center gap-4 mb-6 mt-2">
                    <div className={`p-4 rounded-2xl ${transaction.type === 'Load' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{transaction.type === 'Load' ? <ArrowDownLeft size={28}/> : <Target size={28}/>}</div>
                    <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{transaction.type === 'Load' ? 'Credit Added' : 'Ad Spend'}</p><h3 className="text-xl font-extrabold text-slate-800 leading-tight">{transaction.type === 'Load' ? 'Funds Loaded' : transaction.companyName}</h3></div>
                </div>
                <div className="flex items-baseline gap-1 mb-8"><span className={`text-4xl font-black ${transaction.type === 'Load' ? 'text-emerald-600' : 'text-slate-900'}`}>{transaction.type === 'Load' ? '+' : '-'}{formatUSD(transaction.amount)}</span><span className="text-slate-500 font-bold text-sm">USD</span></div>
                <div className="bg-slate-50 rounded-2xl p-5 space-y-3 border border-slate-100">
                    <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Date</span><span className="font-bold text-slate-700">{formatDate(transaction.date, true)}</span></div>
                    {transaction.type === 'Spend' && (<div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Platform</span><span className="font-bold text-slate-700 flex items-center gap-1">{transaction.platform}</span></div>)}
                    <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Rate</span><span className="font-bold text-slate-700">Rs. {transaction.exchangeRate}</span></div>
                    <div className="flex justify-between text-sm pt-3 border-t border-slate-200"><span className="text-slate-500 font-bold">Total Cost (NPR)</span><span className="font-extrabold text-slate-800">{formatCurrency(transaction.nprEquivalent || (transaction.amount * transaction.exchangeRate))}</span></div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const TransactionDetailModal = ({ transaction, onClose }) => (
    <AnimatePresence>
        {transaction && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex justify-center items-center p-4">
                <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9}} className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-lg relative border border-white/60">
                    <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:bg-slate-100 rounded-full p-2"><XIcon size={20}/></button>
                    <h3 className="text-2xl font-extrabold mb-2 text-slate-800 pr-8">{transaction.title}</h3>
                    <p className={`text-xl font-bold ${transaction.type.includes('Income') || transaction.type.includes('Deposit') ? 'text-emerald-600' : 'text-rose-600'}`}>{transaction.type.includes('Expense') || transaction.type.includes('Withdrawal') ? '-' : '+'}{formatCurrency(transaction.amount)}</p>
                    <div className="mt-8 space-y-4 text-sm border-t border-slate-100 pt-6">
                        <div className="flex justify-between items-center"><span className="text-slate-400 font-bold uppercase text-xs tracking-wider">Date</span><span className="font-bold text-slate-700">{formatDate(transaction.date, true)}</span></div>
                        <div className="flex justify-between items-center"><span className="text-slate-400 font-bold uppercase text-xs tracking-wider">Type</span><span className="font-bold text-slate-700 px-3 py-1 bg-slate-100 rounded-lg">{transaction.type}</span></div>
                        <div className="flex justify-between items-center"><span className="text-slate-400 font-bold uppercase text-xs tracking-wider">Category</span><span className="font-bold text-slate-700">{transaction.category}</span></div>
                        {transaction.description && (<div className="pt-4"><p className="text-slate-400 font-bold uppercase text-xs tracking-wider mb-2">Description</p><p className="text-slate-600 bg-slate-50 p-4 rounded-2xl leading-relaxed border border-slate-100">{transaction.description}</p></div>)}
                    </div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>
);

// --- Main Finance Dashboard Component ---
export default function FinanceDashboard({ user }) {
  const router = useRouter();
  
  // States
  const [showSplash, setShowSplash] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [transactions, setAllTransactions] = useState([]);
  const [bankAccount, setBankAccount] = useState({ balance: 0 });
  const [allUsers, setAllUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [dollarData, setDollarData] = useState([]);
  const [dollarBalance, setDollarBalance] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('Income');
  const [isDollarModalOpen, setIsDollarModalOpen] = useState(false);
  const [isLoadFundsModalOpen, setIsLoadFundsModalOpen] = useState(false);
  const [viewingDollarTransaction, setViewingDollarTransaction] = useState(null);
  const [viewingTransaction, setViewingTransaction] = useState(null);
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
            setAllUsers(dashData.allUsers || []);
            setNotifications(dashData.notifications || []);
            if (!targetUser && dashData.allUsers?.length) setTargetUser(dashData.allUsers[0]._id);
        }
        if (dollarJson.success) {
            setDollarData(dollarJson.data || []);
            setDollarBalance(dollarJson.balance || 0);
        }
    } catch (err) { toast.error("Connection Sync Error"); }
  }, [targetUser]);

  useEffect(() => { refetchData(); }, []); 

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
  
  // 1. Filter Logic
  const filteredTransactionsForDisplay = useMemo(() => {
    return transactions.filter(t => {
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

  // 3. Running Balance Logic (Reverse Calculation for Accuracy)
  // This ensures that when we sort by Date Ascending for the Statement, the balance is correct.
  const transactionsWithRunningBalance = useMemo(() => {
    // 1. Get ALL transactions sorted by Date (Oldest First)
    const allSorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // 2. We don't have an "opening balance" in the DB usually, so we calculate "current balance" at every step
    // by starting from 0 (or a fixed opening if you had one) and adding up.
    // However, to make it match the CURRENT bank balance perfectly, we often work backwards.
    // BUT for a Statement, forward calculation is best if we assume history is complete.
    
    // Let's assume we want to show the balance *as it was* after each transaction.
    // We will filter first, then calculate? No, balance depends on previous history.
    
    let runningBalance = 0; // This should ideally be the Opening Balance of the fiscal year
    // Since we don't have opening balance, we will calculate a virtual running balance for the *filtered view*
    // OR (Better): We attach the running balance to the filtered view starting from the net of previous months.
    
    // Simplest robust approach for this View:
    // Calculate running balance for ALL transactions, then slice the array.
    const allWithBalance = allSorted.map(t => {
        if (t.type === 'Income' || t.type === 'Deposit') runningBalance += t.amount;
        else runningBalance -= t.amount;
        return { ...t, remainingBalance: runningBalance };
    });

    // Now filter this enhanced array
    return allWithBalance.filter(t => {
        const d = new Date(t.date);
        const matchesYear = d.getUTCFullYear() === viewingYear;
        const matchesMonth = d.getUTCMonth() === viewingMonth;
        return statementType === 'yearly' ? matchesYear : (matchesYear && matchesMonth);
    }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Return to Newest First for UI
    
  }, [transactions, viewingMonth, viewingYear, statementType]);

  const handleLogout = async () => { await fetch("/api/auth/logout"); router.push("/login"); };
  const openModal = (type) => { setModalType(type); setIsModalOpen(true); };
  const handleMarkAsRead = async () => { if (!unreadNotifications.length) return; await fetch('/api/notification/mark-as-read', { method: 'POST' }); setNotifications(p => p.map(n => ({ ...n, isRead: true }))); };
  
  const handleDeleteTransaction = async (id) => { if(!confirm("Are you sure? This affects the balance.")) return; try { const res = await fetch(`/api/finance/transactions?id=${id}`, { method: 'DELETE' }); if(!res.ok) throw new Error("Failed"); toast.success("Deleted."); refetchData(); } catch (e) { toast.error(e.message); } };
  const handleDeleteDollarSpend = async (id) => { if(!confirm("Delete record?")) return; try { const res = await fetch(`/api/finance/dollar-spend?id=${id}`, { method: 'DELETE' }); if(!res.ok) throw new Error("Failed"); toast.success("Deleted."); refetchData(); } catch (e) { toast.error(e.message); } };

  const handleSendNotification = async (e) => { e.preventDefault(); if (!notificationContent.trim() || !targetUser) return toast.error('Check fields.'); setIsSending(true); try { const res = await fetch('/api/finance/send-notification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: notificationContent, targetUser }) }); if (!res.ok) throw new Error("Failed"); toast.success('Sent!'); setNotificationContent(''); } catch (err) { toast.error("Error sending."); } finally { setIsSending(false); } };

  // --- Export Handler ---
  const handleDownloadStatement = () => {
    if (transactionsWithRunningBalance.length === 0) return toast.error("No transactions to export");
    
    const periodString = statementType === 'yearly' 
        ? `Fiscal Year ${viewingYear}` 
        : `${new Date(viewingYear, viewingMonth).toLocaleString('default', { month: 'long' })} ${viewingYear}`;
    
    // Pass the transactions that ALREADY have the correct running balance attached
    generateFinancialStatement({
        transactions: transactionsWithRunningBalance, 
        summary,
        period: periodString,
        type: statementType,
        user
    });

    toast.success("Statement Generated Successfully");
  };

  const yearOptions = [...Array(5)].map((_, i) => new Date().getFullYear() - i);
  const monthOptions = Array.from({length: 12}, (_, i) => ({ value: i, label: new Date(0, i).toLocaleString('default', { month: 'long' })}));

  if (showSplash) return <AnimatePresence mode="wait"><DashboardEntryLoader key="loader" userName={user.name} /></AnimatePresence>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden -z-0 pointer-events-none">
          <div className="absolute top-0 -left-48 w-[40rem] h-[40rem] bg-emerald-200/30 rounded-full filter blur-[120px] opacity-50"></div>
          <div className="absolute bottom-0 -right-48 w-[40rem] h-[40rem] bg-teal-200/30 rounded-full filter blur-[120px] opacity-50"></div>
      </div>

      {/* --- Sticky Header --- */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-4 py-3 lg:px-8 flex justify-between items-center sticky top-0 z-40 transition-all">
          <div className="flex items-center gap-3 group">
            <div className="relative">
                <div className="absolute inset-0 bg-emerald-300 blur-md rounded-full opacity-0 group-hover:opacity-40 transition-opacity"></div>
                <Image src="/finance.png" alt="Finance" width={44} height={44} />
            </div>
            <div className="hidden sm:block leading-tight">
                <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Finance <span className="text-emerald-600">Dashboard</span></h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{getGreeting()}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
              <div ref={notificationDropdownRef} className="relative">
                  <button onClick={() => setIsNotificationOpen(!isNotificationOpen)} className="p-2.5 text-slate-500 hover:text-emerald-600 hover:bg-white bg-slate-100/50 rounded-xl transition-all relative">
                      <Bell size={20} />
                      {unreadNotifications.length > 0 && <span className="absolute top-2 right-2.5 h-2.5 w-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>}
                  </button>
                  <NotificationDropdown isOpen={isNotificationOpen} notifications={notifications} onClose={() => setIsNotificationOpen(false)} onMarkRead={handleMarkAsRead} />
              </div>
              <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
              <div ref={userDropdownRef} className="relative">
                  <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 pl-1 pr-2 py-1 bg-white border border-slate-200/60 rounded-full hover:shadow-md transition-all group">
                      <Image src={user.avatar} width={34} height={34} className="rounded-full border border-slate-100 group-hover:scale-105 transition-transform" alt="User"/>
                      <span className="text-xs font-bold text-slate-700 hidden sm:block group-hover:text-emerald-700 transition-colors">{user.name.split(' ')[0]}</span>
                      <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                      {isDropdownOpen && (
                          <motion.div initial={{opacity:0, y:10, scale:0.95}} animate={{opacity:1, y:0, scale:1}} exit={{opacity:0, y:10, scale:0.95}} className="absolute top-full right-0 mt-3 w-56 rounded-2xl shadow-xl bg-white border border-slate-100 z-50 overflow-hidden origin-top-right"><div className="p-4 border-b border-slate-50 bg-slate-50/50"><p className="text-sm font-bold text-slate-800">{user.name}</p><p className="text-[10px] uppercase font-bold text-emerald-600">{user.role}</p></div><div className="p-1"><button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-xl flex items-center gap-3 transition-colors"><LogOut size={16}/> Sign Out</button></div></motion.div>
                      )}
                  </AnimatePresence>
              </div>
          </div>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto z-10">
          <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="space-y-6 lg:space-y-8">
              
              {/* Stats Row */}
              <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <StatCard title="Income (Selected Period)" value={formatCurrency(summary.totalIncome)} icon={<TrendingUp className="text-emerald-600"/>} color={{ bg: 'bg-emerald-50', text: 'text-emerald-900' }} />
                <StatCard title="Expense (Selected Period)" value={formatCurrency(summary.totalExpenses)} icon={<TrendingDown className="text-rose-600"/>} color={{ bg: 'bg-rose-50', text: 'text-rose-900' }} />
                <StatCard title="Net Profit" value={formatCurrency(summary.netProfit)} icon={<DollarSign className="text-indigo-600"/>} color={{ bg: 'bg-indigo-50', text: 'text-indigo-900' }} />
                <StatCard title="Current Available Balance" value={formatCurrency(bankAccount.balance)} icon={<CreditCard className="text-blue-600"/>} color={{ bg: 'bg-blue-50', text: 'text-blue-900' }} />
              </motion.div>
              
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
                
                {/* Left Column (5 Cols) */}
                <motion.div variants={fadeInUp} className="xl:col-span-5 flex flex-col gap-6 lg:gap-8">
                   <div className="h-auto xl:h-[24rem]"> 
                       <DollarCardWidget 
                          dollarData={dollarData} 
                          dollarBalance={dollarBalance} 
                          onAddClick={() => setIsDollarModalOpen(true)} 
                          onLoadClick={() => setIsLoadFundsModalOpen(true)} 
                          onItemClick={(transaction) => setViewingDollarTransaction(transaction)}
                          onDelete={(id) => handleDeleteDollarSpend(id)}
                       />
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-h-[300px]">
                       <ActionCard onAction={openModal} />
                       <ProfitMarginWidget income={summary.totalIncome} expense={summary.totalExpenses} />
                   </div>
                   <div className="flex-1">
                      <NotificationCard allUsers={allUsers} onSubmit={handleSendNotification} content={notificationContent} setContent={setNotificationContent} targetUser={targetUser} setTargetUser={setTargetUser} isSending={isSending} />
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
                              {transactionsWithRunningBalance.length > 0 ? (
                                  transactionsWithRunningBalance.map((t, index) => (
                                    <TransactionRow 
                                      key={t._id} 
                                      transaction={t} 
                                      remainingBalance={t.remainingBalance} // Passing current balance as reference
                                      index={index} 
                                      onRowClick={() => setViewingTransaction(t)} 
                                      onDelete={(id) => handleDeleteTransaction(id)}
                                    />
                                  ))
                              ) : (
                                  <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center py-32 flex flex-col items-center">
                                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4"><Search size={36} className="text-slate-300"/></div>
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
      </AnimatePresence>
      <TransactionDetailModal transaction={viewingTransaction} onClose={() => setViewingTransaction(null)} />
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
        const user = await User.findById(decoded.userId).select("-password").lean();
        if (!user || user.role !== "Finance") {
          context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
          return { redirect: { destination: "/login", permanent: false } };
        }
        return { props: { user: JSON.parse(JSON.stringify(user)) } };
    } catch (error) {
        context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        return { redirect: { destination: "/login", permanent: false } };
    }
}
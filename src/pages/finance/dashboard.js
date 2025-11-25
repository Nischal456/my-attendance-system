import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from 'next/image';
import { 
  LogOut, ChevronDown, Plus, Minus, TrendingUp, TrendingDown, 
  DollarSign, Send, CreditCard, Bell, ArrowUpRight, ArrowDownLeft, 
  AlertTriangle, X as XIcon, CheckCircle, Download, Globe, Layers, 
  Facebook, Instagram, Linkedin, Video, Trash2, ExternalLink, Target, Zap, Search 
} from 'react-feather';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

// --- Register ChartJS Components ---
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// --- Helper Functions ---
const formatCurrency = (amount) => `Rs. ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(amount || 0)}`;
const formatUSD = (amount) => `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(amount || 0)}`;
const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    if(includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.hour12 = true;
    }
    return date.toLocaleString('en-US', options);
};

// --- Sub-Components ---

// 1. DOLLAR DETAIL MODAL (Updated Design)
const DollarDetailModal = ({ transaction, onClose }) => {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex justify-center items-center p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-2 ${transaction.type === 'Load' ? 'bg-green-500' : 'bg-indigo-500'}`}></div>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:bg-slate-100 rounded-full p-2"><XIcon size={20}/></button>
                
                <div className="flex items-center gap-3 mb-4 mt-2">
                    <div className={`p-3 rounded-xl ${transaction.type === 'Load' ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {transaction.type === 'Load' ? <ArrowDownLeft size={28}/> : <Target size={28}/>}
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{transaction.type === 'Load' ? 'Credit' : 'Ad Spend'}</p>
                        <h3 className="text-xl font-bold text-slate-800">{transaction.type === 'Load' ? 'Funds Added' : transaction.companyName}</h3>
                    </div>
                </div>
                
                <div className="flex items-baseline gap-1 mb-6">
                    <span className={`text-4xl font-extrabold ${transaction.type === 'Load' ? 'text-green-600' : 'text-slate-900'}`}>
                        {transaction.type === 'Load' ? '+' : '-'}{formatUSD(transaction.amount)}
                    </span>
                    <span className="text-slate-500 font-medium text-sm">USD</span>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Date</span><span className="font-semibold text-slate-800">{formatDate(transaction.date, true)}</span></div>
                    {transaction.type === 'Spend' && (
                         <div className="flex justify-between text-sm"><span className="text-slate-500">Platform</span><span className="font-semibold text-slate-800 flex items-center gap-1">{transaction.platform}</span></div>
                    )}
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Exchange Rate</span><span className="font-semibold text-slate-800">Rs. {transaction.exchangeRate}</span></div>
                    <div className="flex justify-between text-sm pt-2 border-t border-slate-200"><span className="text-slate-500">Total Cost (NPR)</span><span className="font-bold text-slate-800">{formatCurrency(transaction.nprEquivalent || (transaction.amount * transaction.exchangeRate))}</span></div>
                </div>
                
                {transaction.campaignName && (
                    <div className="mt-4">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Campaign Details</span>
                        <p className="text-sm text-slate-700 bg-blue-50/50 p-3 rounded-lg border border-blue-100 leading-relaxed flex gap-2">
                            <Zap size={16} className="text-blue-500 flex-shrink-0 mt-0.5"/> {transaction.campaignName}
                        </p>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

// 2. ADD SPEND MODAL (Updated Design)
const AddDollarSpendModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ companyName: '', platform: 'Facebook', campaignName: '', amount: '', exchangeRate: '135.0' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const platforms = [{ id: 'Facebook', icon: <Facebook size={18} />, color: 'bg-blue-600' }, { id: 'Instagram', icon: <Instagram size={18} />, color: 'bg-pink-600' }, { id: 'Google', icon: <Globe size={18} />, color: 'bg-red-500' }, { id: 'LinkedIn', icon: <Linkedin size={18} />, color: 'bg-blue-700' }, { id: 'TikTok', icon: <Video size={18} />, color: 'bg-black' }];

    const handleSubmit = async (e) => {
        e.preventDefault(); setIsSubmitting(true);
        try {
            const res = await fetch('/api/finance/dollar-spend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, type: 'Spend' }) });
            if (!res.ok) throw new Error('Failed');
            toast.success('Spend recorded!'); await onSuccess(); onClose();
        } catch (error) { toast.error(error.message); } finally { setIsSubmitting(false); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex justify-center items-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Target size={20} className="text-green-600"/> Record Ad Spend</h3><button onClick={onClose}><XIcon className="text-slate-400 hover:text-slate-600"/></button></div>
                <form onSubmit={handleSubmit} className="space-y-5">
                      <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Platform</label><div className="flex flex-wrap gap-2">{platforms.map((p) => (<button key={p.id} type="button" onClick={() => setFormData({...formData, platform: p.id})} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${formData.platform === p.id ? `${p.color} text-white shadow-md ring-2 ring-offset-1 ring-gray-200` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{p.icon} {p.id}</button>))}</div></div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Client</label><input type="text" required value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Client Name"/></div>
                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Campaign</label><input type="text" value={formData.campaignName} onChange={e => setFormData({...formData, campaignName: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Dashain Sale"/></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount ($)</label><input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-2 bg-white border rounded-lg font-bold text-slate-800 outline-none focus:border-indigo-500" placeholder="0.00"/></div>
                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rate (NPR)</label><input type="number" step="0.01" required value={formData.exchangeRate} onChange={e => setFormData({...formData, exchangeRate: e.target.value})} className="w-full p-2 bg-white border rounded-lg outline-none focus:border-indigo-500"/></div>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl mt-2 transition-all shadow-lg shadow-green-500/20">Save Spend Record</button>
                </form>
            </motion.div>
        </motion.div>
    );
};

// 3. LOAD FUNDS MODAL (Updated Design)
const LoadFundsModal = ({ onClose, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [rate, setRate] = useState('135.0');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault(); setIsSubmitting(true);
        try {
            const res = await fetch('/api/finance/dollar-spend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'Load', amount, exchangeRate: rate }) });
            if (!res.ok) throw new Error('Failed to load funds');
            toast.success(`Loaded $${amount} successfully!`); await onSuccess(); onClose();
        } catch (error) { toast.error(error.message); } finally { setIsSubmitting(false); }
    };
    return (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex justify-center items-center p-4"><div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"><div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-slate-900">Load Dollar Card</h3><button onClick={onClose}><XIcon className="text-slate-400 hover:text-slate-600"/></button></div><form onSubmit={handleSubmit} className="space-y-5"><div><label className="block text-sm mb-1">Amount (USD)</label><input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-3 border rounded-xl text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00"/></div><div><label className="block text-sm mb-1">Exchange Rate</label><input type="number" step="0.01" required value={rate} onChange={e => setRate(e.target.value)} className="w-full p-3 border rounded-xl"/></div><button type="submit" disabled={isSubmitting} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl">{isSubmitting ? 'Loading...' : 'Add Funds'}</button></form></div></motion.div>);
};

// 4. DOLLAR CARD WIDGET (With Delete & Detail)
const DollarCardWidget = ({ dollarData, dollarBalance, onAddClick, onLoadClick, onItemClick, onDelete }) => {
    // Sort: Newest first
    const recentActivity = [...dollarData].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    
    // Optional Chart Data Calculation (preserved for future use or if you want to enable charts)
    const companyStats = dollarData.filter(d => d.type === 'Spend').reduce((acc, item) => {
        acc[item.companyName] = (acc[item.companyName] || 0) + item.amount;
        return acc;
    }, {});
    const sortedCompanies = Object.entries(companyStats).sort((a,b) => b[1] - a[1]).slice(0, 4);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Virtual Card */}
            <div className="relative h-72 rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/20 bg-slate-900 group transform transition hover:scale-[1.01]">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                 <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-indigo-950 to-purple-900 opacity-90"></div>
                 <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                <div className="relative p-8 flex flex-col justify-between h-full text-white">
                    <div className="flex justify-between items-start">
                        <div><p className="text-blue-200/80 text-xs font-bold tracking-[0.2em] uppercase mb-2">Ads Dollar Wallet</p><h3 className="text-4xl lg:text-5xl font-bold tracking-tight text-white">{formatUSD(dollarBalance)}</h3></div>
                        <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner"><Globe size={22} className="text-blue-300"/></div>
                    </div>
                    <div className="mt-auto">
                        <div className="flex gap-3 mb-8">
                            <button onClick={onLoadClick} className="bg-green-500 hover:bg-green-400 text-slate-900 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-green-900/20"><ArrowDownLeft size={16}/> Load Funds</button>
                            <button onClick={onAddClick} className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2.5 px-4 rounded-xl border border-white/20 flex items-center gap-2 transition-all"><Minus size={16}/> Record Spend</button>
                        </div>
                        <div className="flex justify-between items-end">
                            <div><div className="flex items-center gap-3 mb-1"><div className="flex -space-x-2"><div className="w-8 h-8 rounded-full bg-red-500/90 border-2 border-slate-900"></div><div className="w-8 h-8 rounded-full bg-yellow-500/90 border-2 border-slate-900"></div></div><span className="text-sm text-slate-300 font-mono tracking-widest">XXXX 5869</span></div><p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider ml-1">GECKO WORKS DOLLAR CARD</p></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Smart Activity List */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col h-72">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg"><Layers size={20} className="text-indigo-500"/> Recent Activity</h3>
                 </div>
                 <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                     {recentActivity.length > 0 ? recentActivity.map((d, i) => (
                         <motion.div whileHover={{ x: 4 }} key={d._id || i} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2.5 last:border-0 cursor-pointer group relative">
                             <div className="flex items-center gap-3" onClick={() => onItemClick(d)}>
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${d.type === 'Load' ? 'bg-green-100 text-green-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                     {d.type === 'Load' ? <ArrowDownLeft size={18}/> : <Target size={18}/>}
                                 </div>
                                 <div>
                                     <p className="font-bold text-slate-700">{d.type === 'Load' ? 'Wallet Load' : d.companyName}</p>
                                     <p className="text-xs text-slate-500 flex items-center gap-1">
                                         {d.type === 'Load' ? formatDate(d.date) : <><span className="truncate max-w-[120px]">{d.campaignName || 'General'}</span> • {formatDate(d.date)}</>}
                                     </p>
                                 </div>
                             </div>
                             <div className="flex items-center gap-3">
                                 <span className={`font-bold text-base ${d.type === 'Load' ? 'text-green-600' : 'text-slate-800'}`} onClick={() => onItemClick(d)}>
                                     {d.type === 'Load' ? '+' : '-'}{formatUSD(d.amount)}
                                 </span>
                                 {/* ✅ NEW: Delete Button for Dollar Transactions */}
                                 <button onClick={(e) => { e.stopPropagation(); onDelete(d._id); }} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                                     <Trash2 size={14}/>
                                 </button>
                             </div>
                         </motion.div>
                     )) : <div className="h-full flex items-center justify-center text-slate-400 text-sm">No activity yet.</div>}
                 </div>
                 {dollarData.length > 5 && (
                    <Link href="/finance/dollar-history" className="mt-2 w-full py-2.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-center transition-colors flex items-center justify-center gap-2">
                        View Full History <ExternalLink size={14}/>
                    </Link>
                 )}
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, iconBgColor }) => (
    <div className={`bg-white/70 backdrop-blur-sm p-5 rounded-2xl shadow-sm border border-slate-200/80 transition-all duration-300 hover:shadow-lg hover:border-indigo-300/50 transform hover:-translate-y-1`}>
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${iconBgColor}`}>{icon}</div>
            <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <p className={`text-2xl font-bold text-slate-800`}>{value}</p>
            </div>
        </div>
    </div>
);

const ActionCard = ({ onAction }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 h-full">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
            <button onClick={() => onAction('Income')} className="bg-green-50 text-green-700 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-green-100 transition-colors transform hover:scale-105"><Plus size={18}/> Income</button>
            <button onClick={() => onAction('Expense')} className="bg-red-50 text-red-700 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-red-100 transition-colors transform hover:scale-105"><Minus size={18}/> Expense</button>
            <button onClick={() => onAction('Deposit')} className="bg-blue-50 text-blue-700 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors transform hover:scale-105"><ArrowUpRight size={18}/> Deposit</button>
            <button onClick={() => onAction('Withdrawal')} className="bg-yellow-50 text-yellow-700 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-yellow-100 transition-colors transform hover:scale-105"><ArrowDownLeft size={18}/> Withdraw</button>
        </div>
    </div>
);

const NotificationCard = ({ allUsers, onSubmit, content, setContent, targetUser, setTargetUser, isSending }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Send Notification</h2>
        <form onSubmit={onSubmit} className="space-y-4">
            <div><label htmlFor="targetUser" className="block text-sm font-medium text-slate-600 mb-1">Select Employee</label><select id="targetUser" value={targetUser} onChange={(e) => setTargetUser(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"><option value="" disabled>-- Select --</option>{allUsers.map((u) => (<option key={u._id} value={u._id}>{u.name} ({u.role})</option>))}</select></div>
            <div><label htmlFor="notification-content" className="block text-sm font-medium text-slate-600 mb-1">Message</label><textarea id="notification-content" value={content} onChange={(e) => setContent(e.target.value)} rows="2" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required /></div>
            <div className="flex justify-end"><button type="submit" disabled={isSending} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors"><Send size={16}/>{isSending ? 'Sending...':'Send'}</button></div>
        </form>
    </div>
);

const TransactionRow = ({ transaction, remainingBalance, onRowClick, onDelete, index }) => {
    const isIncome = transaction.type === 'Income' || transaction.type === 'Deposit';
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05, ease: "easeOut" } }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            onClick={onRowClick}
            className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200/60 hover:shadow-md hover:border-indigo-300/50 transition-all duration-300 cursor-pointer group"
        >
            <div className="flex items-center gap-3 sm:gap-4">
                <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full ${isIncome ? 'bg-green-100' : 'bg-red-100'}`}>
                    {isIncome ? <ArrowUpRight className="text-green-600" size={20} /> : <ArrowDownLeft className="text-red-600" size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{transaction.title}</p>
                    <p className="text-xs text-slate-500 sm:hidden">{formatDate(transaction.date)}</p>
                    <p className="text-xs text-slate-500 hidden sm:block">{transaction.category}</p>
                </div>
                 <div className="text-sm text-slate-500 mx-4 hidden md:block whitespace-nowrap">{formatDate(transaction.date)}</div>
                <div className="text-right flex-shrink-0">
                      <p className={`text-base font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>{isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}</p>
                      <p className="text-xs text-slate-500 font-medium">Balance: {formatCurrency(remainingBalance)}</p>
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(transaction._id); }} 
                    className="ml-2 p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                    title="Delete Transaction"
                >
                    <Trash2 size={16}/>
                </button>
            </div>
        </motion.div>
    );
};

const TransactionModal = ({ type, onClose, onSuccess }) => {
    let defaultCategory = 'General';
    if (type === 'Income') defaultCategory = 'Client Payment';
    if (type === 'Expense') defaultCategory = 'Office Supplies';
    if (type === 'Deposit' || type === 'Withdrawal') defaultCategory = 'Bank Transfer';
    const [formData, setFormData] = useState({ title: '', amount: '', category: defaultCategory, date: new Date().toISOString().split('T')[0], description: '' });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({...prev, [name]: value})); };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true); setError('');
        try {
            const res = await fetch('/api/finance/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, type }) });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'Failed to submit transaction');
            toast.success('Transaction logged successfully!');
            await onSuccess();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9}} className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-slate-800">Add New {type}</h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><XIcon size={20}/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div><label htmlFor="title" className="block text-sm font-medium text-slate-600 mb-1">Title <span className="text-red-500">*</span></label><input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"/></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label htmlFor="amount" className="block text-sm font-medium text-slate-600 mb-1">Amount (NPR) <span className="text-red-500">*</span></label><input type="number" step="0.01" name="amount" id="amount" value={formData.amount} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"/></div>
                        <div><label htmlFor="date" className="block text-sm font-medium text-slate-600 mb-1">Date <span className="text-red-500">*</span></label><input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"/></div>
                    </div>
                    <div><label htmlFor="category" className="block text-sm font-medium text-slate-600 mb-1">Category</label><input type="text" name="category" id="category" value={formData.category} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"/></div>
                    <div><label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-1">Description</label><textarea name="description" id="description" value={formData.description} onChange={handleChange} rows="3" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"/></div>
                    {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2"><AlertTriangle size={18}/><span>{error}</span></div>}
                    <div className="mt-8 pt-5 border-t border-slate-200 flex justify-end gap-4">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className={`px-5 py-2.5 text-white font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors transform hover:scale-105 ${type.includes('Income') || type.includes('Deposit') ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>{isSubmitting ? 'Saving...' : `Save ${type}`}</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const TransactionDetailModal = ({ transaction, onClose }) => { 
    return (
        <AnimatePresence>
            {transaction && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                    <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9}} className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg relative">
                        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:bg-slate-100 rounded-full p-2"><XIcon size={20}/></button>
                        <h3 className="text-2xl font-bold mb-1 text-slate-800">{transaction.title}</h3>
                        <p className={`text-lg font-semibold ${transaction.type.includes('Income') || transaction.type.includes('Deposit') ? 'text-green-600' : 'text-red-600'}`}>{transaction.type.includes('Expense') || transaction.type.includes('Withdrawal') ? '-' : '+'}{formatCurrency(transaction.amount)}</p>
                        <div className="mt-6 space-y-3 text-sm border-t pt-6">
                            <div className="flex justify-between"><span className="text-slate-500 font-medium">Date:</span><span className="font-semibold">{formatDate(transaction.date, true)}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500 font-medium">Type:</span><span className="font-semibold">{transaction.type}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500 font-medium">Category:</span><span className="font-semibold">{transaction.category}</span></div>
                            {transaction.description && (<div className="pt-2"><p className="text-slate-500 font-medium mb-1">Description:</p><p className="text-slate-700 bg-slate-50 p-3 rounded-md whitespace-pre-wrap">{transaction.description}</p></div>)}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};


// --- Main Finance Dashboard Component ---
export default function FinanceDashboard({ user }) {
  const router = useRouter();
  
  // States
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setAllTransactions] = useState([]);
  const [bankAccount, setBankAccount] = useState({ balance: 0 });
  const [allUsers, setAllUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Dollar Card State
  const [dollarData, setDollarData] = useState([]);
  const [dollarBalance, setDollarBalance] = useState(0);
  const [isDollarModalOpen, setIsDollarModalOpen] = useState(false);
  const [isLoadFundsModalOpen, setIsLoadFundsModalOpen] = useState(false);
  // NEW: State for viewing single dollar transaction
  const [viewingDollarTransaction, setViewingDollarTransaction] = useState(null);

  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('Income');
  const [isMounted, setIsMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [viewingTransaction, setViewingTransaction] = useState(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);
  const [notificationContent, setNotificationContent] = useState('');
  const [targetUser, setTargetUser] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Filter States
  const [viewingMonth, setViewingMonth] = useState(new Date().getMonth());
  const [viewingYear, setViewingYear] = useState(new Date().getFullYear());
  const [reportType, setReportType] = useState('monthly');
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(new Date().getMonth());
  
  const unreadNotifications = useMemo(() => notifications.filter(n => !n.isRead), [notifications]);

  // Data Fetching
  const refetchData = useCallback(async () => {
    try {
        const res = await fetch('/api/finance/dashboard-data');
        if (!res.ok) throw new Error('Could not refetch dashboard data');
        const data = await res.json();
        setAllTransactions(data.transactions || []);
        setBankAccount(data.bankAccount || { balance: 0 });
        setAllUsers(data.allUsers || []);
        setNotifications(data.notifications || []);
        
        if (data.allUsers && data.allUsers.length > 0 && !targetUser) {
            setTargetUser(data.allUsers.find(u => u.role !== 'Admin')?._id || data.allUsers[0]?._id || '');
        }

        const dollarRes = await fetch('/api/finance/dollar-spend');
        const dollarJson = await dollarRes.json();
        if (dollarJson.success) {
            setDollarData(dollarJson.data || []);
            setDollarBalance(dollarJson.balance || 0);
        }

    } catch (err) {
        toast.error(err.message);
    } finally {
        setIsLoading(false);
    }
  }, [targetUser]);

  useEffect(() => {
    setIsMounted(true);
    refetchData();
  }, []); 

  useEffect(() => {
      function handleClickOutside(event) {
          if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) setIsDropdownOpen(false);
          if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) setIsNotificationOpen(false);
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // Calculations
  const { summary } = useMemo(() => {
    const filtered = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getUTCFullYear() === viewingYear && transactionDate.getUTCMonth() === viewingMonth;
    });
    let totalIncome = 0, totalExpenses = 0;
    filtered.forEach(t => {
        if (t.type === 'Income' || t.type === 'Deposit') totalIncome += t.amount;
        else if (t.type === 'Expense' || t.type === 'Withdrawal') totalExpenses += t.amount;
    });
    return { summary: { totalIncome, totalExpenses, netProfit: totalIncome - totalExpenses } };
  }, [transactions, viewingMonth, viewingYear]);

  const transactionsWithRunningBalance = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date) || new Date(a.createdAt) - new Date(b.createdAt));
    let balanceBeforeFirst = bankAccount.balance;
    for (let i = sorted.length - 1; i >= 0; i--) {
        const t = sorted[i];
        if (t.type === 'Income' || t.type === 'Deposit') balanceBeforeFirst -= t.amount;
        else balanceBeforeFirst += t.amount;
    }
    let runningBalance = balanceBeforeFirst;
    return sorted.map(t => {
        if (t.type === 'Income' || t.type === 'Deposit') runningBalance += t.amount;
        else runningBalance -= t.amount;
        return { ...t, remainingBalance: runningBalance };
    });
  }, [transactions, bankAccount.balance]);
  
  const filteredTransactionsForDisplay = useMemo(() => {
    return transactionsWithRunningBalance.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getUTCFullYear() === viewingYear && transactionDate.getUTCMonth() === viewingMonth;
    }).reverse();
  }, [transactionsWithRunningBalance, viewingMonth, viewingYear]);

  // Actions
  const handleLogout = async () => { await fetch("/api/auth/logout"); router.push("/login"); };
  const openModal = (type) => { setModalType(type); setIsModalOpen(true); };
  const handleMarkAsRead = async () => { if (unreadNotifications.length === 0) return; try { await fetch('/api/notification/mark-as-read', { method: 'POST' }); setNotifications(prev => prev.map(n => ({ ...n, isRead: true }))); } catch (err) { console.error(err); } };
  
  const handleDeleteTransaction = async (id) => {
    if(!confirm("Are you sure you want to delete this transaction? This will reverse the effect on the bank balance.")) return;
    try {
        const res = await fetch(`/api/finance/transactions?id=${id}`, { method: 'DELETE' });
        if(!res.ok) throw new Error("Failed to delete");
        toast.success("Transaction deleted.");
        refetchData();
    } catch (e) { toast.error(e.message); }
  };

  // ✅ NEW: Delete Handler for Dollar Spend
  const handleDeleteDollarSpend = async (id) => {
      if(!confirm("Delete this dollar record? Balance will update.")) return;
      try {
          const res = await fetch(`/api/finance/dollar-spend?id=${id}`, { method: 'DELETE' });
          if(!res.ok) throw new Error("Failed to delete");
          toast.success("Dollar record deleted."); refetchData();
      } catch (e) { toast.error(e.message); }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notificationContent.trim() || !targetUser) { toast.error('Please select a user and write a message.'); return; }
    setIsSending(true);
    try {
      const res = await fetch('/api/finance/send-notification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: notificationContent, targetUser }) });
      if (!res.ok) { const data = await res.json(); throw new Error(data.message); }
      toast.success('Notification sent successfully!');
      setNotificationContent(''); setTargetUser(allUsers[0]?._id || '');
    } catch (err) {
        toast.error(err.message);
    } finally {
        setIsSending(false);
    }
  };
  
  const handleDownloadStatement = async () => {
    const toastId = toast.loading('Generating your statement...');
    try {
        const res = await fetch(`/api/finance/statement?reportType=${reportType}&year=${reportYear}&month=${reportMonth}`);
        if (!res.ok) throw new Error('Failed to fetch statement data.');
        const statementData = await res.json();
        if (!statementData.success || statementData.data.length === 0) {
            toast.error('No transactions found for the selected period.', { id: toastId });
            return;
        }
        let totalIncome = 0, totalExpenses = 0;
        statementData.data.forEach(t => {
            if(t.type === 'Income' || t.type === 'Deposit') totalIncome += t.amount;
            else totalExpenses += t.amount;
        });
        const sanitizeField = (field) => `"${String(field || '').replace(/"/g, '""')}"`;
        const headers = ["Date", "Title", "Category", "Description", "Type", "Amount (NPR)"];
        const rows = statementData.data.map(t => [sanitizeField(formatDate(t.date)), sanitizeField(t.title), sanitizeField(t.category), sanitizeField(t.description), sanitizeField(t.type), t.amount].join(','));
        const summaryTitle = reportType === 'monthly' ? `${new Date(0, reportMonth).toLocaleString('default', { month: 'long' })} ${reportYear}` : `Year ${reportYear}`;
        const summaryRows = [ `\n\nSummary for ${summaryTitle}`, `Total Income:,"${formatCurrency(totalIncome)}"`, `Total Expenses:,"${formatCurrency(totalExpenses)}"`, `Net Profit/Loss:,"${formatCurrency(totalIncome - totalExpenses)}"`,`Final Bank Balance as of file generation:,"${formatCurrency(bankAccount.balance)}"` ];
        const csvContent = [headers.join(','), ...rows, ...summaryRows].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const downloadLink = document.createElement("a");
        const url = URL.createObjectURL(blob);
        downloadLink.setAttribute("href", url);
        downloadLink.setAttribute("download", `financial_statement_${reportYear}_${reportType === 'monthly' ? String(reportMonth + 1).padStart(2, '0') : ''}.csv`);
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        toast.success('Download complete!', { id: toastId });
    } catch (error) {
        toast.error(error.message, { id: toastId });
    }
  };

  const yearOptions = [...Array(5)].map((_, i) => new Date().getFullYear() - i);
  const monthOptions = Array.from({length: 12}, (_, i) => ({ value: i, label: new Date(0, i).toLocaleString('default', { month: 'long' })}));

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-600">Loading our financial dashboard...</div>;
  }

  return (
    <>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }}/>
      <AnimatePresence>
        {isModalOpen && <TransactionModal type={modalType} onClose={() => setIsModalOpen(false)} onSuccess={refetchData} />}
        {isDollarModalOpen && <AddDollarSpendModal onClose={() => setIsDollarModalOpen(false)} onSuccess={refetchData} />} 
        {isLoadFundsModalOpen && <LoadFundsModal onClose={() => setIsLoadFundsModalOpen(false)} onSuccess={refetchData} />}
        {viewingDollarTransaction && <DollarDetailModal transaction={viewingDollarTransaction} onClose={() => setViewingDollarTransaction(null)} />}
      </AnimatePresence>
      <TransactionDetailModal transaction={viewingTransaction} onClose={() => setViewingTransaction(null)} />
      
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
        <div className="w-full h-full absolute inset-0 bg-slate-50 overflow-hidden -z-0"><div className="absolute top-0 -left-48 w-[40rem] h-[40rem] bg-green-200/50 rounded-full filter blur-3xl opacity-40 animate-blob"></div><div className="absolute top-0 -right-48 w-[40rem] h-[40rem] bg-sky-200/50 rounded-full filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div><div className="absolute bottom-0 left-1/4 w-[40rem] h-[40rem] bg-rose-200/50 rounded-full filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div></div>
        <div className="relative z-10">
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 p-4 lg:px-10 flex justify-between items-center sticky top-0 z-40">
                <div className="flex items-center gap-3"><Image src="/geckoworks.png" alt="Logo" width={40} height={40} /><h1 className="text-xl font-bold text-slate-800 hidden sm:block">Finance Dashboard</h1></div>
                <div className="flex items-center gap-2">
                    <div ref={notificationDropdownRef} className="relative"><button onClick={() => { setIsNotificationOpen(prev => !prev); if (!isNotificationOpen) handleMarkAsRead(); }} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors" title="Notifications"><Bell size={20} />{unreadNotifications.length > 0 && (<span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>)}</button><AnimatePresence>{isNotificationOpen && (<motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl z-20"><div className="p-4 border-b flex justify-between items-center"><h3 className="text-lg font-semibold">Notifications</h3>{unreadNotifications.length > 0 && (<button onClick={handleMarkAsRead} className="text-xs text-indigo-600 font-semibold hover:underline">Mark all as read</button>)}</div><div className="max-h-96 overflow-y-auto">{notifications.length > 0 ? notifications.map(notif => (<Link key={notif._id} href={notif.link || '#'} passHref legacyBehavior><a className={`block p-4 hover:bg-slate-50 ${!notif.isRead ? 'bg-indigo-50' : ''}`}><p className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>{notif.content}</p><p className="text-xs text-gray-400 mt-1">{formatDate(notif.createdAt, true)}</p></a></Link>)) : (<p className="p-4 text-sm text-gray-500">No new notifications.</p>)}</div></motion.div>)}</AnimatePresence></div>
                    <div className="h-6 w-px bg-slate-200"></div>
                    <div ref={userDropdownRef} className="relative"><button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors"><Image src={user.avatar} width={36} height={36} className="rounded-full object-cover" alt="User Avatar"/><ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} /></button><AnimatePresence>{isDropdownOpen && (<motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="absolute top-full right-0 mt-2 w-56 rounded-xl shadow-2xl bg-white ring-1 ring-black ring-opacity-5 z-50"><div className="px-4 py-3 border-b"><p className="text-sm font-semibold">{user.name}</p><p className="text-xs text-slate-500">{user.role}</p></div><div className="p-1"><button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-3 rounded-md"><LogOut className="h-4 w-4"/>Sign Out</button></div></motion.div>)}</AnimatePresence></div>
                </div>
            </header>
            <main className="p-4 sm:p-6 lg:p-10">
                <motion.div initial="hidden" animate={isMounted ? "visible" : "hidden"} variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="max-w-7xl mx-auto space-y-8">
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                      <h1 className="text-3xl font-bold text-slate-800">Financial Overview</h1>
                      <p className="text-slate-500 mt-1">Summary for <span className="font-semibold text-indigo-600">{monthOptions.find(m => m.value === viewingMonth)?.label} {viewingYear}</span></p>
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <StatCard title="Income this month" value={formatCurrency(summary.totalIncome)} icon={<TrendingUp className="text-green-600"/>} iconBgColor="bg-green-100" />
                      <StatCard title="Expenses this month" value={formatCurrency(summary.totalExpenses)} icon={<TrendingDown className="text-red-600"/>} iconBgColor="bg-red-100" />
                      <StatCard title="Monthly Net" value={formatCurrency(summary.netProfit)} icon={<DollarSign className="text-indigo-600"/>} iconBgColor="bg-indigo-100" />
                      <StatCard title="Bank Balance" value={formatCurrency(bankAccount.balance)} icon={<CreditCard className="text-blue-600"/>} iconBgColor="bg-blue-100" />
                    </motion.div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left Column: Dollar Card, Actions, Notifications, Statement */}
                      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="lg:col-span-5 space-y-8">
                         {/* UPDATED: Pass onDelete */}
                         <DollarCardWidget 
                            dollarData={dollarData} 
                            dollarBalance={dollarBalance} 
                            onAddClick={() => setIsDollarModalOpen(true)} 
                            onLoadClick={() => setIsLoadFundsModalOpen(true)} 
                            onItemClick={(transaction) => setViewingDollarTransaction(transaction)}
                            onDelete={handleDeleteDollarSpend}
                         />
                         
                         <div className="grid grid-cols-1 gap-8">
                             <ActionCard onAction={openModal} />
                             
                             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
                               <h2 className="text-xl font-semibold text-slate-800 mb-4">Generate Statement</h2>
                               <div className="space-y-4">
                                 <div className="flex gap-4"><select value={reportType} onChange={e => setReportType(e.target.value)} className="w-full p-2 border rounded-lg bg-white"><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select><select value={reportYear} onChange={e => setReportYear(parseInt(e.target.value))} className="w-full p-2 border rounded-lg bg-white">{yearOptions.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
                                 {reportType === 'monthly' && (<div><label className="text-xs text-slate-500">Month</label><select value={reportMonth} onChange={e => setReportMonth(parseInt(e.target.value))} className="w-full p-2 border rounded-lg bg-white">{monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select></div>)}
                                 <button onClick={handleDownloadStatement} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"><Download size={18}/>Generate & Download CSV</button>
                               </div>
                             </div>
                             
                             <NotificationCard allUsers={allUsers} onSubmit={handleSendNotification} content={notificationContent} setContent={setNotificationContent} targetUser={targetUser} setTargetUser={setTargetUser} isSending={isSending} />
                         </div>
                      </motion.div>

                      {/* Right Column: Transactions List */}
                        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="lg:col-span-7 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80 h-fit">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                              <h2 className="text-xl font-semibold text-slate-800">Transactions</h2>
                              <div className="flex gap-2"><select value={viewingMonth} onChange={e => setViewingMonth(parseInt(e.target.value))} className="p-2 border rounded-lg bg-white">{monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select><select value={viewingYear} onChange={e => setViewingYear(parseInt(e.target.value))} className="p-2 border rounded-lg bg-white">{yearOptions.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
                            </div>
                            <div className="space-y-3">
                                <AnimatePresence>
                                {filteredTransactionsForDisplay.length > 0 ? (
                                    filteredTransactionsForDisplay.map((t, index) => (
                                      <TransactionRow 
                                        key={t._id} 
                                        transaction={t} 
                                        remainingBalance={t.remainingBalance} 
                                        index={index} 
                                        onRowClick={() => setViewingTransaction(t)} 
                                        onDelete={handleDeleteTransaction}
                                      />
                                    ))
                                ) : (
                                    <motion.p initial={{opacity:0}} animate={{opacity:1}} className="text-center py-10 text-slate-500">No transactions found for this period.</motion.p>
                                )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </main>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
    const jwt = require('jsonwebtoken');
    const dbConnect = require('../../../lib/dbConnect').default;
    const User = require('../../../models/User').default;
    
    await dbConnect();
    const { token } = context.req.cookies;
    if (!token) {
        return { redirect: { destination: "/login", permanent: false } };
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password").lean();
        
        if (!user || user.role !== "Finance") {
          context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
          return { redirect: { destination: "/login", permanent: false } };
        }
        
        return { 
            props: { 
                user: JSON.parse(JSON.stringify(user)) 
            } 
        };
    } catch (error) {
        console.error("Finance Dashboard getServerSideProps Error:", error);
        context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        return { redirect: { destination: "/login", permanent: false } };
    }
}
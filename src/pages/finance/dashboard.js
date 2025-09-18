import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from 'next/image';
import jwt from "jsonwebtoken";
import dbConnect from "../../../lib/dbConnect";
import User from "../../../models/User";
import Transaction from "../../../models/Transaction";
import BankAccount from "../../../models/BankAccount";
import Notification from '../../../models/Notification';
import { LogOut, ChevronDown, Plus, Minus, TrendingUp, TrendingDown, DollarSign, Send, CreditCard, Bell, ArrowUpRight, ArrowDownLeft, AlertTriangle, X as XIcon, CheckCircle, Download } from 'react-feather';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// --- Helper Functions ---
const formatCurrency = (amount) => `Rs. ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(amount || 0)}`;
const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
    if(includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.hour12 = true;
    }
    return date.toLocaleString('en-US', options);
};

// --- Sub-Components ---
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
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
            <button onClick={() => onAction('Income')} className="bg-green-50 text-green-700 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-green-100 transition-colors transform hover:scale-105"><Plus size={18}/> Income</button>
            <button onClick={() => onAction('Expense')} className="bg-red-50 text-red-700 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-red-100 transition-colors transform hover:scale-105"><Minus size={18}/> Expense</button>
            <button onClick={() => onAction('Deposit')} className="bg-blue-50 text-blue-700 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors transform hover:scale-105"><ArrowUpRight size={18}/> Deposit</button>
            <button onClick={() => onAction('Withdrawal')} className="bg-yellow-50 text-yellow-700 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-yellow-100 transition-colors transform hover:scale-105"><ArrowDownLeft size={18}/> Withdrawal</button>
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

const TransactionRow = ({ transaction, remainingBalance, onRowClick, index }) => {
    const isIncome = transaction.type === 'Income' || transaction.type === 'Deposit';
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05, ease: "easeOut" } }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            onClick={onRowClick}
            className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200/60 hover:shadow-md hover:border-indigo-300/50 transition-all duration-300 cursor-pointer"
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
export default function FinanceDashboard({ user, allUsers, initialTransactions, initialBankAccount, initialNotifications }) {
  const router = useRouter();
  const [transactions, setAllTransactions] = useState(initialTransactions);
  const [bankAccount, setBankAccount] = useState(initialBankAccount);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('Income');
  const [isMounted, setIsMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [viewingTransaction, setViewingTransaction] = useState(null);
  const [notifications, setNotifications] = useState(initialNotifications || []);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);
  const [notificationContent, setNotificationContent] = useState('');
  const [targetUser, setTargetUser] = useState(allUsers.find(u => u.role !== 'Admin')?._id || allUsers[0]?._id || '');
  const [isSending, setIsSending] = useState(false);
  const [viewingMonth, setViewingMonth] = useState(new Date().getMonth());
  const [viewingYear, setViewingYear] = useState(new Date().getFullYear());
  const [reportType, setReportType] = useState('monthly');
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(new Date().getMonth());
  const unreadNotifications = useMemo(() => notifications.filter(n => !n.isRead), [notifications]);

  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => { function handleClickOutside(event) { if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) setIsDropdownOpen(false); if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) setIsNotificationOpen(false); } document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, []);
  
  const { summary } = useMemo(() => {
    const filtered = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getUTCFullYear() === viewingYear && transactionDate.getUTCMonth() === viewingMonth;
    });
    let totalIncome = 0, totalExpenses = 0;
    filtered.forEach(t => {
        if (t.type === 'Income' || t.type === 'Deposit') {
            totalIncome += t.amount;
        } else if (t.type === 'Expense' || t.type === 'Withdrawal') {
            totalExpenses += t.amount;
        }
    });
    return { summary: { totalIncome, totalExpenses, netProfit: totalIncome - totalExpenses } };
  }, [transactions, viewingMonth, viewingYear]);

  const transactionsWithRunningBalance = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date) || new Date(a.createdAt) - new Date(b.createdAt));
    
    let balanceBeforeFirst = bankAccount.balance;
    for (let i = sorted.length - 1; i >= 0; i--) {
        const t = sorted[i];
        if (t.type === 'Income' || t.type === 'Deposit') {
            balanceBeforeFirst -= t.amount;
        } else {
            balanceBeforeFirst += t.amount;
        }
    }

    let runningBalance = balanceBeforeFirst;
    return sorted.map(t => {
        if (t.type === 'Income' || t.type === 'Deposit') {
            runningBalance += t.amount;
        } else {
            runningBalance -= t.amount;
        }
        return { ...t, remainingBalance: runningBalance };
    });
  }, [transactions, bankAccount.balance]);
  
  const handleLogout = async () => { await fetch("/api/auth/logout"); router.push("/login"); };
  const openModal = (type) => { setModalType(type); setIsModalOpen(true); };
  const closeModal = () => setIsModalOpen(false);
  const handleMarkAsRead = async () => { if (unreadNotifications.length === 0) return; try { await fetch('/api/notification/mark-as-read', { method: 'POST' }); setNotifications(prev => prev.map(n => ({ ...n, isRead: true }))); } catch (err) { console.error(err); } };
  
  const refetchData = useCallback(async () => {
    try {
        const res = await fetch('/api/finance/dashboard-data');
        if (!res.ok) throw new Error('Could not refetch dashboard data');
        const data = await res.json();
        setAllTransactions(data.transactions);
        setBankAccount(data.bankAccount);
        setNotifications(data.notifications);
        setAllUsers(data.allUsers);
    } catch (err) {
        toast.error(err.message);
    }
  }, []);

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
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `financial_statement_${reportYear}_${reportType === 'monthly' ? String(reportMonth + 1).padStart(2, '0') : ''}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Download complete!', { id: toastId });
    } catch (error) {
        toast.error(error.message, { id: toastId });
    }
  };

  const yearOptions = [...Array(5)].map((_, i) => new Date().getFullYear() - i);
  const monthOptions = Array.from({length: 12}, (_, i) => ({ value: i, label: new Date(0, i).toLocaleString('default', { month: 'long' })}));
  
  const filteredTransactionsForDisplay = useMemo(() => {
    return transactionsWithRunningBalance.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getUTCFullYear() === viewingYear && transactionDate.getUTCMonth() === viewingMonth;
    }).reverse(); // Reverse for display (newest first)
  }, [transactionsWithRunningBalance, viewingMonth, viewingYear]);

  return (
    <>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }}/>
      <AnimatePresence>
        {isModalOpen && <TransactionModal type={modalType} onClose={closeModal} onSuccess={refetchData} />}
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
                      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="lg:col-span-4 space-y-8">
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
                      </motion.div>
                        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="lg:col-span-8 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                              <h2 className="text-xl font-semibold text-slate-800">Transactions</h2>
                              <div className="flex gap-2"><select value={viewingMonth} onChange={e => setViewingMonth(parseInt(e.target.value))} className="p-2 border rounded-lg bg-white">{monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select><select value={viewingYear} onChange={e => setViewingYear(parseInt(e.target.value))} className="p-2 border rounded-lg bg-white">{yearOptions.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
                            </div>
                            <div className="space-y-3">
                                <AnimatePresence>
                                {filteredTransactionsForDisplay.length > 0 ? (
                                    filteredTransactionsForDisplay.map((t, index) => <TransactionRow key={t._id} transaction={t} remainingBalance={t.remainingBalance} index={index} onRowClick={() => setViewingTransaction(t)} />)
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
    await dbConnect();
    const { token } = context.req.cookies;
    if (!token) return { redirect: { destination: "/login", permanent: false } };
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password").lean();
        if (!user || user.role !== "Finance") { return { redirect: { destination: "/dashboard", permanent: false } }; }
        
        const [transactions, bankAccount, allUsers, notifications] = await Promise.all([
            Transaction.find({}).sort({ date: -1, createdAt: -1 }).lean(),
            BankAccount.findOne({ accountName: 'Main Account' }).lean(),
            User.find({ role: { $ne: 'Finance' } }).select('name role avatar').sort({ name: 1 }).lean(),
            Notification.find({ recipient: user._id }).sort({ createdAt: -1 }).limit(50).lean()
        ]);

        const initialBankAccount = bankAccount || await BankAccount.create({ accountName: 'Main Account', balance: 0 });
        
        return {
            props: {
                user: JSON.parse(JSON.stringify(user)),
                allUsers: JSON.parse(JSON.stringify(allUsers)),
                initialTransactions: JSON.parse(JSON.stringify(transactions)),
                initialBankAccount: JSON.parse(JSON.stringify(initialBankAccount)),
                initialNotifications: JSON.parse(JSON.stringify(notifications)),
            },
        };
    } catch (error) {
        console.error("Finance Dashboard getServerSideProps Error:", error);
        // Clear invalid token cookie and redirect
        context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        return { redirect: { destination: "/login", permanent: false } };
    }
}
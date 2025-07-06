"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from 'next/image';
import jwt from "jsonwebtoken";
import dbConnect from "../../../lib/dbConnect";
import User from "../../../models/User";
import Transaction from "../../../models/Transaction";
import BankAccount from "../../../models/BankAccount";
import { LogOut, ChevronDown, Plus, Minus, TrendingUp, TrendingDown, DollarSign, Send, CreditCard, Bell, ArrowUpRight, ArrowDownLeft, AlertTriangle } from 'react-feather';
import toast, { Toaster } from 'react-hot-toast';

// --- Helper Functions ---
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', minimumFractionDigits: 2 }).format(amount);
};
const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// --- Main Finance Dashboard Component ---
export default function FinanceDashboard({ user, allUsers, initialTransactions, initialBankAccount }) {
  const router = useRouter();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [bankAccount, setBankAccount] = useState(initialBankAccount);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('Income');
  const [isMounted, setIsMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);

  const [notificationContent, setNotificationContent] = useState('');
  const [targetUser, setTargetUser] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');


  useEffect(() => {
    setIsMounted(true);
  }, []);

  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    transactions.forEach(t => {
      if (t.type === 'Income') totalIncome += t.amount;
      else if (t.type === 'Expense') totalExpenses += t.amount;
    });
    const netProfit = totalIncome - totalExpenses;
    return { totalIncome, totalExpenses, netProfit };
  }, [transactions]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
          setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => { await fetch("/api/auth/logout"); router.push("/login"); };

  const openModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };
  
  const closeModal = () => setIsModalOpen(false);
  
  const refetchData = async () => {
    try {
        const updatedDataRes = await fetch('/api/finance/dashboard-data');
        if(!updatedDataRes.ok) throw new Error('Could not refetch dashboard data.');
        const updatedData = await updatedDataRes.json();
        setTransactions(updatedData.transactions);
        setBankAccount(updatedData.bankAccount);
    } catch (error) {
        console.error("Failed to refetch data:", error);
    }
  };
  
  const handleSendNotification = async (e) => {
    e.preventDefault();
    setError('');
    if (!notificationContent.trim() || !targetUser) { setError('Please select a user and write a message.'); return; }
    setIsSending(true);
    try {
      const res = await fetch('/api/finance/send-notification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: notificationContent, targetUser }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('Notification sent successfully!');
      setNotificationContent(''); setTargetUser('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }}/>
      {isModalOpen && (
        <TransactionModal 
            type={modalType} 
            onClose={closeModal}
            onSuccess={refetchData}
        />
      )}
      
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
        <div className="w-full h-full absolute inset-0 bg-slate-50 overflow-hidden">
            <div className="absolute top-0 -left-48 w-[40rem] h-[40rem] bg-green-200/50 rounded-full filter blur-3xl opacity-40 animate-blob"></div>
            <div className="absolute top-0 -right-48 w-[40rem] h-[40rem] bg-sky-200/50 rounded-full filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/4 w-[40rem] h-[40rem] bg-rose-200/50 rounded-full filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative z-10">
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 p-4 lg:px-10 flex justify-between items-center sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <Image src="/geckoworks.png" alt="Logo" width={40} height={40} />
                    <h1 className="text-xl font-bold text-slate-800 hidden sm:block">Finance Dashboard</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-500 hover:text-green-600 hover:bg-slate-100 rounded-full transition-colors" title="Notifications">
                        <Bell size={20} />
                    </button>
                    <div className="h-6 w-px bg-slate-200"></div>
                    <div ref={userDropdownRef} className="relative">
                        <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors">
                            <Image src={user.avatar} width={36} height={36} className="rounded-full object-cover" alt="User Avatar"/>
                            <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`absolute top-full right-0 mt-2 w-56 rounded-xl shadow-2xl bg-white ring-1 ring-black ring-opacity-5 z-50 origin-top-right transition-all duration-300 ease-out ${isDropdownOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                            <div className="px-4 py-3 border-b border-slate-200/80">
                                <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                                <p className="text-xs text-slate-500">{user.role}</p>
                            </div>
                            <div className="p-1"><button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-3 rounded-md"><LogOut className="h-4 w-4"/>Sign Out</button></div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="p-6 sm:p-8 lg:p-10">
                <div className={`max-w-7xl mx-auto space-y-8 transition-all duration-500 ease-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Financial Overview</h1>
                        <p className="text-slate-500 mt-1">A summary of your company's financial activities.</p>
                    </div>
                    {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2"><AlertTriangle size={18}/><span>{error}</span></div>}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="Total Income" value={formatCurrency(summary.totalIncome)} icon={<TrendingUp className="text-green-600"/>} color="green" delay={1} />
                        <StatCard title="Total Expenses" value={formatCurrency(summary.totalExpenses)} icon={<TrendingDown className="text-red-600"/>} color="red" delay={2} />
                        <StatCard title="Net Profit / Loss" value={formatCurrency(summary.netProfit)} icon={<DollarSign className="text-indigo-600"/>} color={summary.netProfit >= 0 ? 'green' : 'red'} delay={3} />
                        <StatCard title="Bank Balance" value={formatCurrency(bankAccount.balance)} icon={<CreditCard className="text-blue-600"/>} color="blue" delay={4} />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4 space-y-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                             <ActionCard onAction={openModal} />
                             <NotificationCard allUsers={allUsers} onSubmit={handleSendNotification} content={notificationContent} setContent={setNotificationContent} targetUser={targetUser} setTargetUser={setTargetUser} isSending={isSending} />
                        </div>

                        <div className="lg:col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                            <h2 className="text-xl font-semibold text-slate-800 mb-4">Recent Transactions</h2>
                            <div className="space-y-2">
                                {transactions.map((t, index) => <TransactionRow key={t._id} transaction={t} index={index} />)}
                                {transactions.length === 0 && <p className="text-center py-10 text-slate-500">No transactions yet.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
      </div>
    </>
  );
}


// --- Sub-Components ---
const StatCard = ({ title, value, icon, color, delay }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 transition-all duration-300 hover:shadow-lg hover:border-green-300/50 transform hover:-translate-y-1 animate-fade-in-up" style={{ animationDelay: `${delay * 100}ms` }}>
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full bg-${color}-100`}>{icon}</div>
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
            <button onClick={() => onAction('Deposit')} className="bg-blue-50 text-blue-700 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors transform hover:scale-105"><Plus size={18}/> Deposit</button>
            <button onClick={() => onAction('Withdrawal')} className="bg-yellow-50 text-yellow-700 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-yellow-100 transition-colors transform hover:scale-105"><Minus size={18}/> Withdrawal</button>
        </div>
    </div>
);

const NotificationCard = ({ allUsers, onSubmit, content, setContent, targetUser, setTargetUser, isSending }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Send Notification</h2>
        <form onSubmit={onSubmit} className="space-y-4">
            <div><label htmlFor="targetUser" className="block text-sm font-medium text-slate-600 mb-1">Select Employee</label><select id="targetUser" value={targetUser} onChange={(e) => setTargetUser(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"><option value="" disabled>-- Select --</option>{allUsers.map((u) => (<option key={u._id} value={u._id}>{u.name} ({u.role})</option>))}</select></div>
            <div><label htmlFor="notification-content" className="block text-sm font-medium text-slate-600 mb-1">Message</label><textarea id="notification-content" value={content} onChange={(e) => setContent(e.target.value)} rows="2" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required /></div>
            <div className="flex justify-end"><button type="submit" disabled={isSending} className="bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors"><Send size={16}/>{isSending ? 'Sending...':'Send'}</button></div>
        </form>
    </div>
);

const TransactionRow = ({ transaction, index }) => {
    const isIncome = transaction.type === 'Income' || transaction.type === 'Deposit';
    return (
        <div className="flex items-center p-3 hover:bg-slate-100/70 rounded-lg transition-colors animate-fade-in-up" style={{ animationDelay: `${index * 40}ms` }}>
            <div className={`p-2.5 rounded-full mr-4 ${isIncome ? 'bg-green-100' : 'bg-red-100'}`}>
                {isIncome ? <ArrowUpRight className="text-green-600" size={20} /> : <ArrowDownLeft className="text-red-600" size={20} />}
            </div>
            <div className="flex-1">
                <p className="font-semibold text-slate-800">{transaction.title}</p>
                <p className="text-xs text-slate-500">{transaction.category} on {formatDate(transaction.date)}</p>
            </div>
            <div className={`text-md font-bold text-right ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
            </div>
        </div>
    );
}

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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg animate-scale-in duration-300">
            <h3 className="text-2xl font-bold mb-6 text-slate-800">Add New {type}</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div><label htmlFor="title" className="block text-sm font-medium text-slate-600 mb-1">Title <span className="text-red-500">*</span></label><input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"/></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label htmlFor="amount" className="block text-sm font-medium text-slate-600 mb-1">Amount (NPR) <span className="text-red-500">*</span></label><input type="number" step="0.01" name="amount" id="amount" value={formData.amount} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"/></div>
                    <div><label htmlFor="date" className="block text-sm font-medium text-slate-600 mb-1">Date <span className="text-red-500">*</span></label><input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"/></div>
                </div>
                <div><label htmlFor="category" className="block text-sm font-medium text-slate-600 mb-1">Category</label><input type="text" name="category" id="category" value={formData.category} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"/></div>
                <div><label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-1">Description</label><textarea name="description" id="description" value={formData.description} onChange={handleChange} rows="3" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"/></div>
                {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2"><AlertTriangle size={18}/><span>{error}</span></div>}
                <div className="mt-8 pt-5 border-t border-slate-200 flex justify-end gap-4"><button type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors">Cancel</button><button type="submit" disabled={isSubmitting} className={`px-5 py-2.5 text-white font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors transform hover:scale-105 ${type.includes('Income') || type.includes('Deposit') ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>{isSubmitting ? 'Saving...' : `Save ${type}`}</button></div>
            </form>
          </div>
        </div>
    );
};


export async function getServerSideProps(context) {
    await dbConnect();
    const { token } = context.req.cookies;
    if (!token) return { redirect: { destination: "/login", permanent: false } };
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");
        if (!user || user.role !== "Finance") { return { redirect: { destination: "/dashboard", permanent: false } }; }
        
        const [transactions, bankAccount, allUsers] = await Promise.all([
            Transaction.find({}).sort({ date: -1 }).limit(200),
            BankAccount.findOne({ accountName: 'Main Account' }).lean(),
            User.find({ role: { $ne: 'Finance' } }).select('name role').sort({ name: 1 }),
        ]);

        const initialBankAccount = bankAccount || await BankAccount.create({ accountName: 'Main Account', balance: 0 });

        return {
            props: {
                user: JSON.parse(JSON.stringify(user)),
                allUsers: JSON.parse(JSON.stringify(allUsers)),
                initialTransactions: JSON.parse(JSON.stringify(transactions)),
                initialBankAccount: JSON.parse(JSON.stringify(initialBankAccount)),
            },
        };
    } catch (error) {
        console.error("Finance Dashboard getServerSideProps Error:", error);
        return { redirect: { destination: "/login", permanent: false } };
    }
}
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from 'next/image';
import jwt from "jsonwebtoken";
import dbConnect from "../../../lib/dbConnect";
import User from "../../../models/User";
import Transaction from "../../../models/Transaction";
import BankAccount from "../../../models/BankAccount";
import Notification from "../../../models/Notification";
import { LogOut, ChevronDown, Plus, Minus, TrendingUp, TrendingDown, DollarSign, Send, CreditCard, Bell } from 'react-feather';

// --- Helper Functions ---
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', minimumFractionDigits: 2 }).format(amount);
};
const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// --- Main Finance Dashboard Component ---
export default function FinanceDashboard({ user, allUsers, initialTransactions, initialBankAccount, initialNotifications }) {
  const router = useRouter();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [bankAccount, setBankAccount] = useState(initialBankAccount);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('Income');
  const [formData, setFormData] = useState({ title: '', amount: '', category: 'General', date: new Date().toISOString().split('T')[0], description: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);

  const [notificationContent, setNotificationContent] = useState('');
  const [targetUser, setTargetUser] = useState('');
  const [isSending, setIsSending] = useState(false);

  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    transactions.forEach(t => {
      if (t.type === 'Income') {
        totalIncome += t.amount;
      } else if (t.type === 'Expense') {
        totalExpenses += t.amount;
      }
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
    let defaultCategory = 'General';
    if (type === 'Income') defaultCategory = 'Client Payment';
    if (type === 'Expense') defaultCategory = 'Office Supplies';
    if (type === 'Deposit' || type === 'Withdrawal') defaultCategory = 'Bank Transfer';
    setFormData({ title: '', amount: '', category: defaultCategory, date: new Date().toISOString().split('T')[0], description: '' });
    setError(''); setMessage('');
    setIsModalOpen(true);
  };
  
  const closeModal = () => setIsModalOpen(false);
  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({...prev, [name]: value})); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); setError('');
    try {
        const res = await fetch('/api/finance/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, type: modalType }) });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Failed to submit transaction');
        
        const updatedDataRes = await fetch('/api/finance/dashboard-data');
        if(!updatedDataRes.ok) throw new Error('Could not refetch dashboard data.');
        const updatedData = await updatedDataRes.json();
        setTransactions(updatedData.transactions);
        setBankAccount(updatedData.bankAccount);

        setMessage('Transaction logged successfully!');
        setTimeout(() => closeModal(), 1000);
    } catch (err) {
        setError(err.message);
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notificationContent.trim() || !targetUser) { setError('Please select a user and write a message.'); return; }
    setIsSending(true); setMessage(''); setError('');
    try {
      const res = await fetch('/api/finance/send-notification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: notificationContent, targetUser }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage(data.message); setNotificationContent(''); setTargetUser('');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg animate-fade-in-up">
            <h3 className="text-xl font-semibold mb-4">Add New {modalType}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><label htmlFor="title" className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label><input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md"/></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (in Rs.) <span className="text-red-500">*</span></label><input type="number" step="0.01" name="amount" id="amount" value={formData.amount} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md"/></div>
                    <div><label htmlFor="date" className="block text-sm font-medium text-gray-700">Date <span className="text-red-500">*</span></label><input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md"/></div>
                </div>
                <div><label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label><input type="text" name="category" id="category" value={formData.category} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md"/></div>
                <div><label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label><textarea name="description" id="description" value={formData.description} onChange={handleChange} rows="3" className="w-full mt-1 p-2 border rounded-md"/></div>
                {message && <p className="text-green-600">{message}</p>}
                {error && <p className="text-red-600">{error}</p>}
                <div className="mt-6 flex justify-end gap-4"><button type="button" onClick={closeModal} disabled={isSubmitting} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button><button type="submit" disabled={isSubmitting} className={`px-4 py-2 text-white rounded-md flex items-center gap-2 disabled:opacity-50 ${modalType.includes('Income') || modalType.includes('Deposit') ? 'bg-green-600' : 'bg-red-600'}`}>{isSubmitting ? 'Saving...' : `Save ${modalType}`}</button></div>
            </form>
          </div>
        </div>
      )}
      
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div><h1 className="text-3xl font-bold text-gray-800">Finance Dashboard</h1><p className="text-gray-600 mt-1">Welcome, <span className="font-semibold text-green-600">{user.name}</span></p></div>
            <div ref={userDropdownRef} className="relative mt-4 md:mt-0"><button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border"><Image src={user.avatar} width={32} height={32} className="rounded-full object-cover" alt="User Avatar"/><span className="font-semibold text-sm">{user.name}</span><ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} /></button>{isDropdownOpen && (<div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20"><div className="px-4 py-3 border-b"><p className="text-sm font-medium">{user.name}</p><p className="text-xs text-gray-500">{user.role}</p></div><div className="py-1 border-t"><button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-3"><LogOut className="h-4 w-4"/>Sign Out</button></div></div>)}</div>
          </header>

          <main className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border"><div className="flex items-center gap-4"><div className="p-3 bg-green-100 rounded-full"><TrendingUp className="text-green-600"/></div><div><p className="text-sm text-gray-500">Total Income</p><p className="text-2xl font-bold text-gray-800">{formatCurrency(summary.totalIncome)}</p></div></div></div>
                <div className="bg-white p-6 rounded-xl shadow-sm border"><div className="flex items-center gap-4"><div className="p-3 bg-red-100 rounded-full"><TrendingDown className="text-red-600"/></div><div><p className="text-sm text-gray-500">Total Expenses</p><p className="text-2xl font-bold text-gray-800">{formatCurrency(summary.totalExpenses)}</p></div></div></div>
                <div className="bg-white p-6 rounded-xl shadow-sm border"><div className="flex items-center gap-4"><div className="p-3 bg-indigo-100 rounded-full"><DollarSign className="text-indigo-600"/></div><div><p className="text-sm text-gray-500">Net Profit / Loss</p><p className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(summary.netProfit)}</p></div></div></div>
                <div className="bg-white p-6 rounded-xl shadow-sm border"><div className="flex items-center gap-4"><div className="p-3 bg-blue-100 rounded-full"><CreditCard className="text-blue-600"/></div><div><p className="text-sm text-gray-500">Bank Balance</p><p className="text-2xl font-bold text-gray-800">{formatCurrency(bankAccount.balance)}</p></div></div></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Log a Transaction</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => openModal('Income')} className="bg-green-50 text-green-700 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-green-100 transition-colors"><Plus size={20}/> Income</button>
                        <button onClick={() => openModal('Expense')} className="bg-red-50 text-red-700 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"><Minus size={20}/> Expense</button>
                        <button onClick={() => openModal('Deposit')} className="bg-blue-50 text-blue-700 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"><Plus size={20}/> Bank Deposit</button>
                        <button onClick={() => openModal('Withdrawal')} className="bg-yellow-50 text-yellow-700 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-yellow-100 transition-colors"><Minus size={20}/> Bank Withdrawal</button>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Send a Notification</h2>
                    <form onSubmit={handleSendNotification} className="space-y-4">
                        <div><label htmlFor="targetUser" className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label><select id="targetUser" value={targetUser} onChange={(e) => setTargetUser(e.target.value)} required className="w-full px-3 py-2 border rounded-md"><option value="" disabled>-- Select an employee --</option>{allUsers.map((u) => (<option key={u._id} value={u._id}>{u.name} ({u.role})</option>))}</select></div>
                        <div><label htmlFor="notification-content" className="block text-sm font-medium text-gray-700 mb-1">Message</label><textarea id="notification-content" value={notificationContent} onChange={(e) => setNotificationContent(e.target.value)} rows="1" className="w-full px-3 py-2 border rounded-md" required /></div>
                        <div className="flex justify-end"><button type="submit" disabled={isSending} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"><Send size={16}/>{isSending ? 'Sending...':'Send'}</button></div>
                    </form>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">All Transactions</h2>
                <div className="overflow-x-auto"><table className="min-w-full">
                    <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium uppercase">Date</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">Title / Description</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">Category</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">Type</th><th className="px-6 py-3 text-right text-xs font-medium uppercase">Amount</th></tr></thead>
                    <tbody className="bg-white divide-y">{transactions.map(t => (<tr key={t._id}><td className="px-6 py-4 text-sm">{formatDate(t.date)}</td><td className="px-6 py-4"><p className="font-medium">{t.title}</p><p className="text-xs text-gray-500">{t.description}</p></td><td className="px-6 py-4 text-sm">{t.category}</td><td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${t.type === 'Income' || t.type === 'Deposit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{t.type}</span></td><td className={`px-6 py-4 text-right font-semibold ${t.type === 'Income' || t.type === 'Deposit' ? 'text-green-600' : 'text-red-600'}`}>{t.type.includes('Expense') || t.type.includes('Withdrawal') ? '-' : ''}{formatCurrency(t.amount)}</td></tr>))}{transactions.length === 0 && (<tr><td colSpan="5" className="text-center py-10">No transactions yet.</td></tr>)}</tbody>
                </table></div>
            </div>
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
        const user = await User.findById(decoded.userId).select("-password");
        if (!user || user.role !== "Finance") { return { redirect: { destination: "/dashboard", permanent: false } }; }
        
        const [transactions, bankAccount, allUsers, notifications] = await Promise.all([
            Transaction.find({}).sort({ date: -1 }).limit(200),
            BankAccount.findOne({ accountName: 'Main Account' }).lean(),
            User.find({ role: { $ne: 'Finance' } }).select('name role').sort({ name: 1 }),
            Notification.find({ recipient: user._id }).sort({ createdAt: -1 }).limit(50)
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
        return { redirect: { destination: "/login", permanent: false } };
    }
}
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Search, Globe, Download, Calendar } from 'react-feather';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';

const formatUSD = (amount) => `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(amount)}`;
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function DollarHistory({ user }) {
    const router = useRouter();
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/finance/dollar-spend');
                const data = await res.json();
                if (data.success) setHistory(data.data);
            } catch (error) {
                toast.error("Failed to load history.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredHistory = history.filter(item => 
        item.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        item.platform?.toLowerCase().includes(search.toLowerCase())
    );

    const handleDownload = () => {
        const headers = ["Date", "Type", "Company/Source", "Platform", "Campaign", "Amount ($)", "Rate", "Equivalent (NPR)"];
        const rows = filteredHistory.map(item => [
            `"${formatDate(item.date)}"`,
            item.type,
            `"${item.companyName}"`,
            item.platform,
            `"${item.campaignName || '-'}"`,
            item.amount,
            item.exchangeRate,
            item.nprEquivalent
        ].join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dollar_history_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Loading history...</div>;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            <Toaster position="top-center" />
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 p-4 sticky top-0 z-40">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <Link href="/finance/dashboard" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold">
                        <ArrowLeft size={20} /> Back to Dashboard
                    </Link>
                    <div className="flex items-center gap-3">
                         <div className="bg-indigo-50 text-indigo-600 p-2 rounded-full"><Globe size={20}/></div>
                         <h1 className="text-lg font-bold text-slate-800">Dollar Card History</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-6 sm:p-10">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input type="text" placeholder="Search client, platform..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
                            <Download size={18} /> Export CSV
                        </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Details</th>
                                    <th className="px-6 py-4">Campaign</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-right">Rate (NPR)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredHistory.map((item) => (
                                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={item._id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{formatDate(item.date)}</td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-800">{item.companyName}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${item.type === 'Load' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>{item.platform}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{item.campaignName || '-'}</td>
                                        <td className={`px-6 py-4 text-right font-bold ${item.type === 'Load' ? 'text-green-600' : 'text-slate-800'}`}>
                                            {item.type === 'Load' ? '+' : '-'}{formatUSD(item.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500">{item.exchangeRate}</td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredHistory.length === 0 && <div className="p-10 text-center text-slate-400">No records found.</div>}
                    </div>
                </div>
            </main>
        </div>
    );
}

// Reusing the same protected route logic
export async function getServerSideProps(context) {
    const jwt = require('jsonwebtoken');
    const dbConnect = require('../../../lib/dbConnect').default;
    const User = require('../../../models/User').default;
    await dbConnect();
    const { token } = context.req.cookies;
    if (!token) return { redirect: { destination: "/login", permanent: false } };
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).lean();
        if (!user || user.role !== "Finance") return { redirect: { destination: "/dashboard", permanent: false } };
        return { props: { user: JSON.parse(JSON.stringify(user)) } };
    } catch (error) { return { redirect: { destination: "/login", permanent: false } }; }
}
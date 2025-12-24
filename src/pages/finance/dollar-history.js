import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { 
    ArrowLeft, Search, Globe, Download, Calendar, Filter, 
    X, ChevronDown, DollarSign, Target, ArrowDownLeft, ArrowUpRight,
    Facebook, Instagram, Linkedin, Video, Layers, CheckCircle
} from 'react-feather';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// --- Helpers ---
const formatUSD = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
const formatNPR = (amount) => `Rs. ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(amount)}`;
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const formatTime = (dateString) => new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

// --- Components ---

const PlatformIcon = ({ platform }) => {
    const p = platform?.toLowerCase() || '';
    if (p.includes('facebook')) return <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Facebook size={16}/></div>;
    if (p.includes('instagram')) return <div className="p-2 bg-pink-50 text-pink-600 rounded-xl"><Instagram size={16}/></div>;
    if (p.includes('linkedin')) return <div className="p-2 bg-blue-50 text-blue-700 rounded-xl"><Linkedin size={16}/></div>;
    if (p.includes('tiktok')) return <div className="p-2 bg-slate-900 text-white rounded-xl"><Video size={16}/></div>;
    if (p.includes('google')) return <div className="p-2 bg-red-50 text-red-600 rounded-xl"><Globe size={16}/></div>;
    return <div className="p-2 bg-slate-50 text-slate-500 rounded-xl"><Layers size={16}/></div>;
};

const DetailModal = ({ item, onClose }) => {
    if (!item) return null;
    const isLoad = item.type === 'Load';

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.9, opacity: 0, y: 20 }} 
                className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/50 relative"
                onClick={e => e.stopPropagation()}
            >
                <div className={`h-32 ${isLoad ? 'bg-emerald-500' : 'bg-slate-900'} relative overflow-hidden flex items-center justify-center`}>
                    <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                    <div className="text-center relative z-10 text-white">
                        <p className="text-emerald-100/80 text-xs font-bold uppercase tracking-widest mb-1">{isLoad ? 'Funds Added' : 'Transaction Amount'}</p>
                        <h2 className="text-5xl font-black tracking-tight">{formatUSD(item.amount)}</h2>
                    </div>
                    <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors backdrop-blur-sm">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            {isLoad ? (
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><ArrowDownLeft size={24}/></div>
                            ) : (
                                <PlatformIcon platform={item.platform} />
                            )}
                            <div>
                                <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">{isLoad ? 'Source' : 'Platform'}</p>
                                <p className="text-lg font-bold text-slate-800">{isLoad ? 'Manual Load' : item.platform}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Date</p>
                            <p className="text-base font-bold text-slate-700">{formatDate(item.date)}</p>
                            <p className="text-xs text-slate-400 font-medium">{formatTime(item.createdAt || item.date)}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {!isLoad && (
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div className="flex justify-between mb-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Client / Source</span>
                                    <span className="text-sm font-bold text-slate-700">{item.companyName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Campaign</span>
                                    <span className="text-sm font-medium text-slate-600">{item.campaignName || '-'}</span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Exchange Rate</p>
                                <p className="text-lg font-bold text-slate-800">NPR {item.exchangeRate}</p>
                            </div>
                            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Equivalent</p>
                                <p className="text-lg font-black text-slate-800">{formatNPR(item.nprEquivalent || (item.amount * item.exchangeRate))}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function DollarHistory({ user }) {
    const router = useRouter();
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Filters
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('All'); // All, Load, Spend
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    
    // Modal
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/finance/dollar-spend');
                const data = await res.json();
                if (data.success) setHistory(data.data.sort((a,b) => new Date(b.date) - new Date(a.date)));
            } catch (error) {
                toast.error("Failed to load history.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredHistory = useMemo(() => {
        return history.filter(item => {
            const matchesSearch = 
                item.companyName?.toLowerCase().includes(search.toLowerCase()) ||
                item.platform?.toLowerCase().includes(search.toLowerCase()) ||
                item.campaignName?.toLowerCase().includes(search.toLowerCase());
            
            const matchesType = typeFilter === 'All' 
                ? true 
                : item.type === typeFilter;

            const itemDate = new Date(item.date);
            const matchesStart = dateRange.start ? itemDate >= new Date(dateRange.start) : true;
            const matchesEnd = dateRange.end ? itemDate <= new Date(dateRange.end) : true;

            return matchesSearch && matchesType && matchesStart && matchesEnd;
        });
    }, [history, search, typeFilter, dateRange]);

    const totals = useMemo(() => {
        let loaded = 0;
        let spent = 0;
        filteredHistory.forEach(i => {
            if(i.type === 'Load') loaded += i.amount;
            else spent += i.amount;
        });
        return { loaded, spent };
    }, [filteredHistory]);

    const handleDownload = () => {
        if (filteredHistory.length === 0) return toast.error("No data to export");
        
        const headers = ["Date", "Type", "Company/Source", "Platform", "Campaign", "Amount ($)", "Rate", "Equivalent (NPR)"];
        const rows = filteredHistory.map(item => [
            `"${formatDate(item.date)}"`,
            item.type,
            `"${item.companyName}"`,
            item.platform,
            `"${item.campaignName || '-'}"`,
            item.amount,
            item.exchangeRate,
            item.nprEquivalent || (item.amount * item.exchangeRate)
        ].join(','));
        
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dollar_history_${typeFilter}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("CSV Exported successfully");
    };

    if (isLoading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full"/>
            <p className="mt-4 text-slate-500 font-bold text-sm uppercase tracking-wider">Loading Data...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800">
            <Toaster position="top-center" toastOptions={{ style: { borderRadius: '12px', background: '#1e293b', color: '#fff' } }}/>
            
            {/* --- Header --- */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <Link href="/finance/dashboard" className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                Dollar History <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">{filteredHistory.length}</span>
                            </h1>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Transaction Log</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <button onClick={handleDownload} className="flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-slate-200 active:scale-95 w-full sm:w-auto">
                            <Download size={16} /> Export CSV
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">
                
                {/* --- Filters & Summary --- */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Summary Cards */}
                    <div className="lg:col-span-4 grid grid-cols-2 gap-4">
                        <div className="bg-emerald-500 p-5 rounded-[2rem] text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-20"><ArrowDownLeft size={40}/></div>
                            <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">Total Loaded</p>
                            <h3 className="text-2xl font-black">{formatUSD(totals.loaded)}</h3>
                        </div>
                        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-4 text-rose-500 opacity-10"><Target size={40}/></div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Spent</p>
                            <h3 className="text-2xl font-black text-slate-800">{formatUSD(totals.spent)}</h3>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="lg:col-span-8 bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input type="text" placeholder="Search by client, campaign..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-400" />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 px-2 sm:px-0">
                            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-5 py-4 bg-slate-50 hover:bg-slate-100 rounded-2xl text-sm font-bold text-slate-600 outline-none cursor-pointer appearance-none min-w-[120px]">
                                <option value="All">All Types</option>
                                <option value="Load">Loads Only</option>
                                <option value="Spend">Spends Only</option>
                            </select>
                            <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="px-4 py-4 bg-slate-50 hover:bg-slate-100 rounded-2xl text-sm font-bold text-slate-600 outline-none cursor-pointer" />
                        </div>
                    </div>
                </motion.div>

                {/* --- Data List --- */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-8">Date & Platform</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Client / Details</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell">Campaign</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-8">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <AnimatePresence>
                                {filteredHistory.length > 0 ? filteredHistory.map((item, index) => {
                                    const isLoad = item.type === 'Load';
                                    return (
                                        <motion.tr 
                                            key={item._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            onClick={() => setSelectedItem(item)}
                                            className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                                        >
                                            <td className="px-6 py-4 pl-8">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-2xl shadow-sm ${isLoad ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                        {isLoad ? <ArrowDownLeft size={20}/> : <PlatformIcon platform={item.platform} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{formatDate(item.date)}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{isLoad ? 'Wallet Load' : item.platform}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell">
                                                <p className="font-bold text-slate-700 text-sm truncate max-w-[200px]">{item.companyName}</p>
                                                <p className="text-xs text-slate-400">Rate: {item.exchangeRate}</p>
                                            </td>
                                            <td className="px-6 py-4 hidden lg:table-cell">
                                                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border ${!item.campaignName ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                    {item.campaignName || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className={`text-lg font-black ${isLoad ? 'text-emerald-600' : 'text-slate-800'}`}>
                                                    {isLoad ? '+' : '-'}{formatUSD(item.amount)}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">USD</p>
                                            </td>
                                            <td className="px-6 py-4 text-right pr-8">
                                                <div className="flex items-center justify-end gap-3">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${isLoad ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                        {isLoad ? 'Credit' : 'Debit'}
                                                    </span>
                                                    <ChevronDown size={16} className="text-slate-300 -rotate-90 md:rotate-0 transition-transform group-hover:text-emerald-500"/>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colspan="5" className="py-24 text-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4"><Search size={32} className="text-slate-300"/></div>
                                            <p className="text-slate-400 font-bold text-lg">No records found</p>
                                            <p className="text-slate-400 text-sm">Try adjusting your filters</p>
                                        </td>
                                    </tr>
                                )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </motion.div>

            </main>

            {/* Detail Popup */}
            <AnimatePresence>
                {selectedItem && <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
            </AnimatePresence>
        </div>
    );
}

// Protected Route
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
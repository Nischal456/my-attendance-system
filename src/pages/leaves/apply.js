import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Send, ArrowLeft, Activity, Home, Calendar, MessageSquare, AlertTriangle, CheckCircle } from 'react-feather';

// --- Custom Radio Card Component for Leave Type Selection ---
const LeaveTypeCard = ({ label, icon, value, selectedValue, onSelect }) => {
    const isSelected = value === selectedValue;
    return (
        <button
            type="button"
            onClick={() => onSelect(value)}
            className={`group w-full p-5 rounded-xl border-2 transition-all duration-200 ${
                isSelected 
                ? 'bg-green-50 border-green-500 shadow-md' 
                : 'bg-slate-50/80 border-slate-200 hover:border-green-400'
            }`}
        >
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full transition-all duration-200 ${
                    isSelected ? 'bg-green-500' : 'bg-slate-200 group-hover:bg-green-100'
                }`}>
                    {icon}
                </div>
                <span className={`font-bold text-md transition-colors duration-200 ${
                    isSelected ? 'text-green-800' : 'text-slate-700'
                }`}>
                    {label}
                </span>
            </div>
        </button>
    );
};

export default function ApplyLeavePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    leaveType: 'Sick Leave',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', content: '' });
    try {
        const res = await fetch('/api/leaves/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message);
        setMessage({ type: 'success', content: 'Success! Your leave request has been submitted.' });
        setTimeout(() => {
            router.push('/leaves');
        }, 2000);
    } catch (err) {
        setMessage({ type: 'error', content: err.message || 'An unexpected error occurred.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
        <header className="bg-white/80 backdrop-blur-xl shadow-sm sticky top-0 z-10">
            <div className="max-w-3xl mx-auto py-5 px-4 sm:px-6 lg:px-8">
                <Link href="/leaves" legacyBehavior>
                    <a className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 mb-2 transition-colors">
                        <ArrowLeft size={16} />
                        Back to Leave Portal
                    </a>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Apply for Leave</h1>
                <p className="text-slate-500 mt-1">Complete the form below to submit your request for approval.</p>
            </div>
        </header>

        <main className="py-10">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div>
                            <label className="block text-md font-semibold text-slate-800 mb-3">Leave Type</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <LeaveTypeCard 
                                    label="Sick Leave"
                                    icon={<Activity size={22} className={formData.leaveType === 'Sick Leave' ? 'text-white' : 'text-slate-500 group-hover:text-green-600'} />}
                                    value="Sick Leave"
                                    selectedValue={formData.leaveType}
                                    onSelect={(value) => setFormData({...formData, leaveType: value})}
                                />
                                <LeaveTypeCard 
                                    label="Home Leave"
                                    icon={<Home size={22} className={formData.leaveType === 'Home Leave' ? 'text-white' : 'text-slate-500 group-hover:text-green-600'} />}
                                    value="Home Leave"
                                    selectedValue={formData.leaveType}
                                    onSelect={(value) => setFormData({...formData, leaveType: value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-md font-semibold text-slate-800 mb-3">Leave Duration</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="relative">
                                    <label htmlFor="startDate" className="block text-xs font-medium text-slate-500 mb-1">From Date</label>
                                    <Calendar className="absolute left-3 top-9 text-slate-400" size={20} />
                                    <input type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} required className="w-full pl-11 pr-3 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/80 focus:border-transparent transition"/>
                                </div>
                                <div className="relative">
                                    <label htmlFor="endDate" className="block text-xs font-medium text-slate-500 mb-1">To Date</label>
                                    <Calendar className="absolute left-3 top-9 text-slate-400" size={20} />
                                    <input type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleChange} required className="w-full pl-11 pr-3 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/80 focus:border-transparent transition"/>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="reason" className="block text-md font-semibold text-slate-800 mb-3">Reason for Leave</label>
                            <div className="relative">
                                <MessageSquare className="absolute left-3 top-3.5 text-slate-400" size={20} />
                                <textarea id="reason" name="reason" value={formData.reason} onChange={handleChange} required rows="5" className="w-full pl-11 pr-3 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/80 focus:border-transparent transition" placeholder="Please provide a brief reason for your leave request..."/>
                            </div>
                        </div>
                        
                        {message.content && (
                            <div className={`flex items-center gap-3 text-sm p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                                <span>{message.content}</span>
                            </div>
                        )}

                        <div className="pt-4 flex justify-end">
                            <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto px-8 py-3 bg-green-600 text-white font-bold rounded-lg disabled:opacity-60 disabled:cursor-not-allowed hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-500/50 flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105">
                                <Send size={18} />
                                {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    </div>
  );
}
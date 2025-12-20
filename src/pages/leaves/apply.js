import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Send, ArrowLeft, Activity, Home, Calendar, MessageSquare, AlertTriangle, CheckCircle } from 'react-feather';
import { motion, AnimatePresence } from 'framer-motion';

// --- Custom Radio Card Component for Leave Type Selection ---
const LeaveTypeCard = ({ label, icon, value, selectedValue, onSelect }) => {
    const isSelected = value === selectedValue;
    return (
        <button
            type="button"
            onClick={() => onSelect(value)}
            className={`group w-full p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden text-left ${
                isSelected 
                ? 'bg-green-50 border-green-500 shadow-md ring-1 ring-green-500' 
                : 'bg-white border-slate-200 hover:border-green-400 hover:shadow-sm active:scale-[0.98]'
            }`}
        >
             {isSelected && (
                <motion.div 
                    layoutId="active-bg"
                    className="absolute inset-0 bg-green-50 -z-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            )}
            <div className="flex items-center gap-4 relative z-10">
                <div className={`p-3 rounded-full transition-all duration-300 flex-shrink-0 ${
                    isSelected ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-slate-100 text-slate-500 group-hover:bg-green-100 group-hover:text-green-600'
                }`}>
                    {icon}
                </div>
                <span className={`font-bold text-lg transition-colors duration-300 ${
                    isSelected ? 'text-green-800' : 'text-slate-600 group-hover:text-green-700'
                }`}>
                    {label}
                </span>
                {isSelected && (
                    <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        className="ml-auto text-green-600"
                    >
                        <CheckCircle size={20} />
                    </motion.div>
                )}
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
    
    // Simulate network delay for smoother UX feel before API call
    // await new Promise(r => setTimeout(r, 500)); 

    try {
        const res = await fetch('/api/leaves/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message);
        setMessage({ type: 'success', content: 'Success! Your leave request has been submitted.' });
        
        // Wait a moment so user sees the success message
        setTimeout(() => {
            router.push('/leaves');
        }, 1500);
    } catch (err) {
        setMessage({ type: 'error', content: err.message || 'An unexpected error occurred.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  // Animation variants
  const containerVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { 
          opacity: 1, 
          y: 0, 
          transition: { duration: 0.4, ease: "easeOut", staggerChildren: 0.1 } 
      }
  };

  const itemVariants = {
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-green-100 selection:text-green-800">
        
        {/* Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-green-100/30 rounded-full blur-[120px] opacity-60"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100/30 rounded-full blur-[120px] opacity-60"></div>
        </div>

        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40 transition-all">
            <div className="max-w-3xl mx-auto py-4 sm:py-5 px-4 sm:px-6 lg:px-8">
                <Link href="/leaves" legacyBehavior>
                    <a className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors bg-white px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 shadow-sm mb-3 group active:scale-95">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Leave Portal
                    </a>
                </Link>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Apply for Leave</h1>
                    <p className="text-slate-500 mt-1 font-medium text-sm sm:text-base">Complete the form below to submit your request.</p>
                </div>
            </div>
        </header>

        <main className="relative z-10 py-6 sm:py-10">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="bg-white/90 backdrop-blur-sm rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200/60 p-5 sm:p-10 relative overflow-hidden"
                >
                     {/* Decorative top gradient line */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500"></div>

                    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 relative z-10">
                        
                        {/* Section: Leave Type */}
                        <motion.div variants={itemVariants}>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Leave Type</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <LeaveTypeCard 
                                    label="Sick Leave"
                                    icon={<Activity size={20} />}
                                    value="Sick Leave"
                                    selectedValue={formData.leaveType}
                                    onSelect={(value) => setFormData({...formData, leaveType: value})}
                                />
                                <LeaveTypeCard 
                                    label="Home Leave"
                                    icon={<Home size={20} />}
                                    value="Home Leave"
                                    selectedValue={formData.leaveType}
                                    onSelect={(value) => setFormData({...formData, leaveType: value})}
                                />
                            </div>
                        </motion.div>

                        {/* Section: Duration */}
                        <motion.div variants={itemVariants}>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Duration</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <div className="group">
                                    <label htmlFor="startDate" className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1 group-focus-within:text-green-600 transition-colors">From Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-green-500 transition-colors pointer-events-none" size={18} />
                                        <input 
                                            type="date" 
                                            id="startDate" 
                                            name="startDate" 
                                            value={formData.startDate} 
                                            onChange={handleChange} 
                                            required 
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 focus:bg-white transition-all appearance-none"
                                        />
                                    </div>
                                </div>
                                <div className="group">
                                    <label htmlFor="endDate" className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1 group-focus-within:text-green-600 transition-colors">To Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-green-500 transition-colors pointer-events-none" size={18} />
                                        <input 
                                            type="date" 
                                            id="endDate" 
                                            name="endDate" 
                                            value={formData.endDate} 
                                            onChange={handleChange} 
                                            required 
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 focus:bg-white transition-all appearance-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        
                        {/* Section: Reason */}
                        <motion.div variants={itemVariants} className="group">
                            <label htmlFor="reason" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1 group-focus-within:text-green-600 transition-colors">Reason for Leave</label>
                            <div className="relative">
                                <MessageSquare className="absolute left-4 top-4 text-slate-400 group-focus-within:text-green-500 transition-colors pointer-events-none" size={18} />
                                <textarea 
                                    id="reason" 
                                    name="reason" 
                                    value={formData.reason} 
                                    onChange={handleChange} 
                                    required 
                                    rows="4" 
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 focus:bg-white transition-all resize-none" 
                                    placeholder="Please provide a brief reason for your leave request..."
                                />
                            </div>
                        </motion.div>
                        
                        {/* Feedback Message */}
                        <AnimatePresence>
                            {message.content && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                    className={`flex items-start gap-3 text-sm font-medium p-4 rounded-xl border overflow-hidden ${message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}
                                >
                                    <div className={`mt-0.5 p-1 rounded-full ${message.type === 'success' ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
                                        {message.type === 'success' ? <CheckCircle size={14} strokeWidth={3} /> : <AlertTriangle size={14} strokeWidth={3} />}
                                    </div>
                                    <span>{message.content}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit Button */}
                        <motion.div variants={itemVariants} className="pt-6 flex justify-end border-t border-slate-100">
                            <motion.button 
                                type="submit" 
                                disabled={isSubmitting} 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-green-500/40 focus:outline-none focus:ring-4 focus:ring-green-500/30 flex items-center justify-center gap-2.5 transition-all"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Submitting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} strokeWidth={2.5} />
                                        <span>Submit Request</span>
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    </form>
                </motion.div>
            </div>
        </main>
    </div>
  );
}
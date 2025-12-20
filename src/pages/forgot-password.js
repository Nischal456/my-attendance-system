import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, MessageCircle, AlertCircle, CheckCircle, ChevronLeft, HelpCircle } from 'react-feather';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');
        setError('');
        
        // Simulating a "thinking" phase for smoother UX if API is too fast
        // await new Promise(resolve => setTimeout(resolve, 800)); 

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setMessage(data.message);
        } catch (err) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { 
            opacity: 1, 
            scale: 1,
            transition: { 
                type: "spring", 
                duration: 0.5, 
                bounce: 0.3,
                staggerChildren: 0.1 
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans relative overflow-hidden selection:bg-green-100 selection:text-green-800">
            
            {/* --- Ambient Background Effects --- */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-green-100/40 rounded-full blur-[120px] opacity-60"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-100/40 rounded-full blur-[120px] opacity-60"></div>
            </div>

            <motion.div 
                className="w-full max-w-md px-6 relative z-10"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white/60 p-8 sm:p-10 relative overflow-hidden">
                    
                    {/* Top Decorative Line */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500"></div>

                    {/* Logo & Header */}
                    <motion.div variants={itemVariants} className="text-center mb-8">
                        <Link href="/login" className="inline-block group">
                            <div className="relative w-24 h-24 mx-auto mb-6 transition-transform transform group-hover:scale-105 duration-300">
                                <div className="absolute inset-0 bg-green-200 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                                <Image 
                                    className="relative z-10 object-contain drop-shadow-sm" 
                                    src="/logo.png" // Updated to match your dashboard logo
                                    alt="Company Logo" 
                                    fill
                                />
                            </div>
                        </Link>
                        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Forgot Password?</h2>
                        <p className="mt-2 text-slate-500 text-sm font-medium">Don't worry! It happens. Please enter the email associated with your account.</p>
                    </motion.div>

                    {/* Form */}
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <motion.div variants={itemVariants}>
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-green-500 transition-colors" />
                                </div>
                                <input 
                                    id="email-address" 
                                    name="email" 
                                    type="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    required 
                                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium" 
                                    placeholder="Enter your email address" 
                                />
                            </div>
                        </motion.div>

                        {/* Messages */}
                        <AnimatePresence>
                            {message && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-3 p-4 rounded-2xl bg-green-50 border border-green-100 text-green-700 text-sm font-semibold"
                                >
                                    <CheckCircle size={18} className="flex-shrink-0" />
                                    {message}
                                </motion.div>
                            )}
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold"
                                >
                                    <AlertCircle size={18} className="flex-shrink-0" />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.div variants={itemVariants}>
                            <button 
                                type="submit" 
                                disabled={isSubmitting || !!message} 
                                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-500/30 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-green-500/30 transition-all active:scale-[0.98]"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Sending Instructions...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Send Reset Link <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                                    </span>
                                )}
                            </button>
                        </motion.div>
                    </form>

                    {/* Footer Links */}
                    <motion.div variants={itemVariants} className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors group">
                            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform"/>
                            Back to Login
                        </Link>
                    </motion.div>
                </div>

                {/* --- Support Section (V2.0 Addition) --- */}
                <motion.div 
                    variants={itemVariants} 
                    className="mt-8 bg-white/60 backdrop-blur-xl border border-white/40 p-5 rounded-3xl shadow-sm text-center"
                >
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Still having trouble?</p>
                    <a 
                        href="https://wa.me/9765009755" // Replace with actual number
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 p-3 rounded-2xl bg-white border border-slate-100 hover:border-green-300 hover:shadow-md transition-all group cursor-pointer"
                    >
                        <div className="bg-green-100 p-2 rounded-full text-green-600 group-hover:bg-green-500 group-hover:text-white transition-colors">
                            <MessageCircle size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-slate-700 group-hover:text-green-700 transition-colors">Chat with Support</p>
                            <p className="text-[10px] text-slate-400 font-medium">Available 9am - 6pm</p>
                        </div>
                    </a>
                </motion.div>

            </motion.div>
        </div>
    );
}
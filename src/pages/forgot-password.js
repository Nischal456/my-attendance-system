"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2, Mail, ArrowRight, CheckCircle2, ShieldCheck, ChevronLeft, Sparkles, KeyRound
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa";

// --- HOOK: MOUSE SPOTLIGHT EFFECT ---
function useMousePosition() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const updateMousePosition = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);
  return mousePosition;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  // Mouse Spotlight Logic
  const { x, y } = useMousePosition();
  const cardRef = useRef(null);

  const showSuccessToast = (msg) => {
    toast.dismiss();
    toast.custom((t) => (
      <motion.div
        layoutId="toast-success"
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="flex items-center gap-4 rounded-[24px] border border-emerald-500/20 bg-white/95 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl z-50"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/30 flex-shrink-0">
          <CheckCircle2 size={20} strokeWidth={3} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Reset Instructions Sent</h3>
          <p className="text-[11px] font-medium text-slate-500">{msg || "Check your email inbox for the reset link."}</p>
        </div>
      </motion.div>
    ), { id: 'forgot-success', duration: 4000, position: "top-center" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
        showSuccessToast(data.message);
      } else {
        toast.error(data.message || "Failed to process request", {
          id: 'forgot-error',
          style: { borderRadius: '16px', fontWeight: 'bold' }
        });
      }
    } catch (err) {
      toast.error("Network connection failed. Please try again.", { id: 'network-error' });
    } finally {
      setLoading(false);
    }
  };

  const bgVariants = { normal: { scale: 1, opacity: 1 } };
  const contentVariants = { visible: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.3 } } };
  const brandName = "Account Recovery".split("");

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#F8FAFC] font-sans flex items-center justify-center lg:justify-start">
      <Toaster position="top-center" />

      {/* --- BACKGROUND LAYER (GPU OPTIMIZED) --- */}
      <motion.div variants={bgVariants} initial="normal" animate="normal" className="fixed inset-0 z-0 pointer-events-none will-change-transform">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-multiply"></div>
        {/* Floating Particles */}
        <motion.div animate={{ y: [0, -20, 0], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[10%] left-[20%] w-64 h-64 bg-emerald-200/40 rounded-full blur-[80px]" />
        <motion.div animate={{ y: [0, 20, 0], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[10%] right-[20%] w-80 h-80 bg-blue-200/40 rounded-full blur-[80px]" />
      </motion.div>

      {/* --- NAVIGATION --- */}
      <div className="fixed top-6 left-6 z-50">
        <Link href="/login" className="group flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/60 px-5 py-2.5 backdrop-blur-md transition-all hover:bg-white/90 hover:shadow-lg hover:shadow-emerald-500/10">
          <ChevronLeft size={16} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-800">Back to Login</span>
        </Link>
      </div>

      {/* Premium WhatsApp Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed bottom-6 left-6 z-50 hidden sm:block"
      >
        <a
          href="https://wa.me/9765009755"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center gap-4 rounded-[26px] border border-white/40 bg-white/60 px-3 py-2 pr-6 backdrop-blur-xl transition-all duration-500 hover:bg-white hover:shadow-2xl hover:shadow-emerald-500/25 hover:-translate-y-1"
        >
          <div className="absolute inset-0 rounded-[26px] bg-gradient-to-r from-emerald-500/20 via-green-400/20 to-lime-400/20 opacity-0 blur-xl group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 via-green-500 to-lime-500 text-white shadow-xl shadow-emerald-500/40 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
            <FaWhatsapp className="text-[22px]" />
          </div>
          <div className="relative flex flex-col leading-tight">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-colors group-hover:text-emerald-500">
              WhatsApp Support
            </span>
            <span className="text-sm font-extrabold text-slate-900">
              Need assistance?
            </span>
          </div>
        </a>
      </motion.div>

      {/* --- LEFT SIDE: BRANDING --- */}
      <div className="hidden lg:flex w-1/2 h-full fixed left-0 top-0 flex-col items-center justify-center p-12 z-20 border-r border-white/40 bg-white/30 backdrop-blur-sm">
        <div className="max-w-md text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mx-auto mb-10 h-36 w-36 rounded-[2.5rem] bg-white flex items-center justify-center shadow-[0_24px_48px_-14px_rgba(16,185,129,0.15)] ring-1 ring-emerald-50 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative h-28 w-28"><Image src="/logo.png" alt="OMS Portal" fill className="object-contain drop-shadow-md" priority unoptimized /></div>
          </motion.div>

          <h1 className="text-3xl xl:text-4xl font-black tracking-tight leading-normal mb-6 flex justify-center items-center whitespace-nowrap px-2 py-1 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-emerald-800 to-slate-900 animate-text-shimmer bg-[length:200%_auto]">
            {brandName.map((letter, i) => (
              <motion.span key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={letter === " " ? "w-2.5 inline-block" : "inline-block"}>
                {letter}
              </motion.span>
            ))}
          </h1>

          <p className="text-xl text-slate-500 font-medium leading-relaxed mb-10 max-w-sm mx-auto">
            Reset your password quickly and regain access to your  workspace.
          </p>

          <div className="flex justify-center gap-2">
            {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-slate-300"></div>)}
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: FORGOT PASSWORD FORM --- */}
      <div className="w-full lg:w-1/2 lg:ml-auto min-h-screen flex items-center justify-center p-4 relative z-30">
        <motion.div
          ref={cardRef}
          variants={contentVariants}
          initial="visible"
          animate="visible"
          className="w-full max-w-[440px]"
        >
          {/* Spotlight Card */}
          <div
            className="relative overflow-hidden rounded-[3rem] border border-white/60 bg-white/80 p-8 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] backdrop-blur-3xl sm:p-12 will-change-transform group"
            style={{
              background: `radial-gradient(600px circle at ${x}px ${y}px, rgba(255,255,255,0.8), rgba(255,255,255,0.4))`,
            }}
          >
            {/* Header */}
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="relative h-20 w-20 mb-5 flex items-center justify-center rounded-[1.5rem] bg-emerald-50 border border-emerald-100 shadow-xl shadow-emerald-100">
                <KeyRound size={36} className="text-emerald-600" />
              </div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Forgot Password?</h2>
                <p className="text-slate-500 text-xs font-medium max-w-xs mx-auto">
                  No worries! Enter your registered email address and we'll send you reset instructions.
                </p>
              </motion.div>
            </div>

            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 text-center">
                <div className="p-6 rounded-[2rem] bg-emerald-50/80 border border-emerald-100 text-emerald-900 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 size={24} strokeWidth={2.5} />
                  </div>
                  <h3 className="font-extrabold text-base">Check Your Inbox</h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    If an account with <span className="font-bold text-slate-800">{email}</span> exists, a password reset link has been dispatched.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors uppercase tracking-widest"
                >
                  Try another email address
                </button>

                <div className="pt-2">
                  <Link
                    href="/login"
                    className="group relative w-full flex items-center justify-center gap-2 rounded-[1.5rem] bg-slate-900 p-4 font-bold text-white shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <span>Return to Login</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2 group/input">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-4 group-focus-within/input:text-emerald-600 transition-colors">Registered Email</label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors"><Mail size={20} /></div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@geckoworksnepal.com"
                      required
                      className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-[1.5rem] py-4 pl-14 pr-4 text-slate-800 font-bold focus:outline-none focus:border-emerald-400 focus:bg-white focus:shadow-lg focus:shadow-emerald-100 transition-all placeholder:text-slate-300 text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-[1.5rem] bg-slate-900 p-5 font-bold text-white shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative flex items-center justify-center gap-3">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <><span>Send Reset Link</span><ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>}
                  </div>
                </button>
              </form>
            )}

            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-50 text-slate-400 border border-slate-100">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest">256-bit SSL Encrypted</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="fixed bottom-4 w-full text-center pointer-events-none z-40 lg:w-1/2 lg:right-0">
        <p className="text-[10px] font-medium text-slate-400/80">&copy; 2025 GeckoOms . All Rights Reserved.</p>
      </div>
    </div>
  );
}
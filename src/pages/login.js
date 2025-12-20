"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2, Mail, Lock, Eye, EyeOff, ArrowRight,
  CheckCircle2, ShieldCheck, ChevronLeft, MessageCircle, Sparkles
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa"

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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [greeting, setGreeting] = useState("Welcome");
  const [isWarping, setIsWarping] = useState(false);
  const router = useRouter();

  // Mouse Spotlight Logic
  const { x, y } = useMousePosition();
  const cardRef = useRef(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  const showSuccessToast = () => {
    toast.dismiss();
    toast.custom((t) => (
      <motion.div
        layoutId="toast-success" 
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="flex items-center gap-4 rounded-[24px] border border-emerald-500/20 bg-white/95 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
          <CheckCircle2 size={20} strokeWidth={3} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Authentication Verified</h3>
          <p className="text-[11px] font-medium text-slate-500">Accessing secure dashboard...</p>
        </div>
      </motion.div>
    ), { id: 'auth-success', duration: 2000, position: "top-center" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        showSuccessToast();
        setTimeout(() => setIsWarping(true), 150);
        setTimeout(() => {
          if (data.role === "HR") router.push("/hr/dashboard");
          else if (data.role === "Project Manager") router.push("/pm/dashboard");
          else router.push("/dashboard");
        }, 1200);
      } else {
        toast.error(data.message || "Invalid Credentials", {
          id: 'login-error',
          style: { borderRadius: '16px', fontWeight: 'bold' }
        });
        setLoading(false);
      }
    } catch (err) {
      toast.error("Network connection failed", { id: 'network-error' });
      setLoading(false);
    }
  };

  const bgVariants = { normal: { scale: 1, opacity: 1 }, warp: { scale: 1.5, opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } } };
  const contentVariants = { visible: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.4, ease: "backIn" } } };
  const brandName = "OMS Portal".split("");

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#F8FAFC] font-sans flex items-center justify-center lg:justify-start">

      {/* --- BACKGROUND LAYER (GPU OPTIMIZED) --- */}
      <motion.div variants={bgVariants} initial="normal" animate={isWarping ? "warp" : "normal"} className="fixed inset-0 z-0 pointer-events-none will-change-transform">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-multiply"></div>
        {/* Floating Particles */}
        <motion.div animate={{ y: [0, -20, 0], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[10%] left-[20%] w-64 h-64 bg-emerald-200/40 rounded-full blur-[80px]" />
        <motion.div animate={{ y: [0, 20, 0], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[10%] right-[20%] w-80 h-80 bg-blue-200/40 rounded-full blur-[80px]" />
      </motion.div>

      {/* --- NAVIGATION --- */}
      <AnimatePresence>
        {!isWarping && (
          <>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="fixed top-6 left-6 z-50">
                <Link href="/" className="group flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/60 px-5 py-2.5 backdrop-blur-md transition-all hover:bg-white/90 hover:shadow-lg hover:shadow-emerald-500/10">
                <ChevronLeft size={16} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-800">Home</span>
                </Link>
            </motion.div>

            {/* Premium WhatsApp Button */}
            <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed bottom-6 left-6 z-50"
    >
      <a
        href="https://wa.me/9765009755"
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center gap-4 rounded-[26px] border border-white/40 bg-white/60 px-3 py-2 pr-6 backdrop-blur-xl transition-all duration-500 hover:bg-white hover:shadow-2xl hover:shadow-emerald-500/25 hover:-translate-y-1"
      >
        {/* Glow layer */}
        <div className="absolute inset-0 rounded-[26px] bg-gradient-to-r from-emerald-500/20 via-green-400/20 to-lime-400/20 opacity-0 blur-xl group-hover:opacity-100 transition-opacity duration-500" />

        {/* Icon */}
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 via-green-500 to-lime-500 text-white shadow-xl shadow-emerald-500/40 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
          <FaWhatsapp className="text-[22px]" />
        </div>

        {/* Text */}
        <div className="relative flex flex-col leading-tight">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-colors group-hover:text-emerald-500">
            WhatsApp Support
          </span>
          <span className="text-sm font-extrabold text-slate-900">
            Chat with us
          </span>
        </div>
      </a>
    </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- LEFT SIDE: BRANDING --- */}
      <AnimatePresence>
        {!isWarping && (
          <motion.div initial={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0, transition: { duration: 0.5 } }} className="hidden lg:flex w-1/2 h-full fixed left-0 top-0 flex-col items-center justify-center p-12 z-20 border-r border-white/40 bg-white/30 backdrop-blur-sm">
            <div className="max-w-md text-center">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                transition={{ duration: 0.6, ease: "easeOut" }} 
                className="mx-auto mb-10 h-36 w-36 rounded-[2.5rem] bg-white flex items-center justify-center shadow-[0_24px_48px_-14px_rgba(16,185,129,0.15)] ring-1 ring-emerald-50 relative overflow-hidden group"
              >
                 <div className="absolute inset-0 bg-gradient-to-tr from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative h-28 w-28"><Image src="/logo.png" alt="Gecko Works" fill className="object-contain drop-shadow-md" priority /></div>
              </motion.div>
              
              {/* Animated Gradient Text */}
              <h1 className="text-7xl font-black tracking-tighter leading-[1.1] mb-6 flex justify-center gap-1 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-emerald-800 to-slate-900 animate-text-shimmer bg-[length:200%_auto]">
                {brandName.map((letter, i) => (<motion.span key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={letter === " " ? "w-5" : ""}>{letter}</motion.span>))}
              </h1>
              
              <p className="text-xl text-slate-500 font-medium leading-relaxed mb-10 max-w-sm mx-auto">
                The intelligent operating system for modern workforce management.
              </p>

              <div className="flex justify-center gap-2">
                 {[1,2,3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-slate-300"></div>)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- RIGHT SIDE: LOGIN FORM --- */}
      <div className="w-full lg:w-1/2 lg:ml-auto min-h-screen flex items-center justify-center p-4 relative z-30">
        <AnimatePresence mode="wait">
          {!isWarping && (
            <motion.div 
                ref={cardRef}
                variants={contentVariants} 
                initial="visible" 
                animate="visible" 
                exit="exit" 
                className="w-full max-w-[440px]"
            >
              {/* The "Spotlight" Card */}
              <div 
                className="relative overflow-hidden rounded-[3rem] border border-white/60 bg-white/80 p-8 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] backdrop-blur-3xl sm:p-12 will-change-transform group"
                style={{
                     background: `radial-gradient(600px circle at ${x}px ${y}px, rgba(255,255,255,0.8), rgba(255,255,255,0.4))`,
                }}
              >
                
                {/* Header */}
                <div className="flex flex-col items-center justify-center mb-10">
                  <div className="lg:hidden relative h-20 w-20 mb-5 flex items-center justify-center rounded-[1.5rem] bg-white shadow-xl shadow-emerald-100">
                    <Image src="/logo.png" alt="Logo" width={50} height={50} className="w-auto h-auto object-contain" />
                  </div>
                  <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.2}} className="text-center">
                      <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-2">{greeting}</h2>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <p className="text-emerald-700 text-[10px] font-bold uppercase tracking-widest">Secure Gateway v2.0</p>
                      </div>
                  </motion.div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2 group/input">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-4 group-focus-within/input:text-emerald-600 transition-colors">Email ID</label>
                    <div className="relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors"><Mail size={20} /></div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@geckoworks.com"
                        required
                        className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-[1.5rem] py-4 pl-14 pr-4 text-slate-800 font-bold focus:outline-none focus:border-emerald-400 focus:bg-white focus:shadow-lg focus:shadow-emerald-100 transition-all placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 group/input">
                    <div className="flex justify-between ml-4 mr-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-focus-within/input:text-emerald-600 transition-colors">Password</label>
                      <Link href="/forgot-password" className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-all">Forgot?</Link>
                    </div>
                    <div className="relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors"><Lock size={20} /></div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-[1.5rem] py-4 pl-14 pr-12 text-slate-800 font-bold focus:outline-none focus:border-emerald-400 focus:bg-white focus:shadow-lg focus:shadow-emerald-100 transition-all placeholder:text-slate-300"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 p-1 hover:text-emerald-600 transition-colors">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full overflow-hidden rounded-[1.5rem] bg-slate-900 p-5 font-bold text-white shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:hover:scale-100"
                  >
                     <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                     <div className="relative flex items-center justify-center gap-3">
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <><span>Log In</span><ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>}
                     </div>
                  </button>
                </form>

                <div className="mt-10 text-center">
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-50 text-slate-400 border border-slate-100">
                    <ShieldCheck size={14} className="text-emerald-500"/> 
                    <span className="text-[10px] font-bold uppercase tracking-widest">256-bit SSL Encrypted</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-4 w-full text-center pointer-events-none z-40 lg:w-1/2 lg:right-0">
        <p className="text-[10px] font-medium text-slate-400/80">&copy; 2025 Gecko Works. All Rights Reserved.</p>
      </div>
    </div>
  );
} 
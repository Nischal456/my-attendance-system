"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2, Mail, Lock, Eye, EyeOff, ArrowRight,
  CheckCircle2, Smartphone, ShieldCheck, ChevronLeft
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [greeting, setGreeting] = useState("Welcome");
  const [isWarping, setIsWarping] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  // --- OPTIMIZED TOAST (Lightweight & Instant) ---
  const showSuccessToast = () => {
    toast.dismiss();

    toast.custom((t) => (
      <motion.div
        layoutId="toast-success" // framer magic for smoothness
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }} // Apple-style easing
        className="flex items-center gap-4 rounded-[24px] border border-emerald-500/20 bg-white/95 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
          <CheckCircle2 size={20} strokeWidth={3} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Authentication Verified</h3>
          <p className="text-[11px] font-medium text-slate-500">Signing you in...</p>
        </div>
      </motion.div>
    ), {
      id: 'auth-success',
      duration: 2000,
      position: "top-center"
    });
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
        // STEP 1: Show Toast (Instant)
        showSuccessToast();

        // STEP 2: Micro-delay to let the toast render smoothly BEFORE starting heavy warp
        setTimeout(() => {
          setIsWarping(true); // Trigger Exit Animation
        }, 150);

        // STEP 3: Redirect
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

  // Optimized Background Variants (No heavy filters)
  const bgVariants = {
    normal: { scale: 1, opacity: 1 },
    warp: {
      scale: 1.5,
      opacity: 0,
      transition: { duration: 0.8, ease: "easeInOut" }
    }
  };

  // Optimized Form Exit (Simple Fade/Slide)
  const contentVariants = {
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: {
      opacity: 0,
      y: 20,
      scale: 0.95,
      transition: { duration: 0.4, ease: "backIn" }
    }
  };

  const brandName = "OMS Portal".split("");

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#F8FAFC] font-sans flex items-center justify-center lg:justify-start">

      {/* --- BACKGROUND LAYER (GPU OPTIMIZED) --- */}
      <motion.div
        variants={bgVariants}
        initial="normal"
        animate={isWarping ? "warp" : "normal"}
        className="fixed inset-0 z-0 pointer-events-none will-change-transform"
      >
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        {/* Static Orbs (Animating position is cheaper than animating filter) */}
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-emerald-100/50 rounded-full blur-[100px] mix-blend-multiply animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-teal-100/50 rounded-full blur-[80px] mix-blend-multiply animate-pulse" />
      </motion.div>

      {/* --- BACK BUTTON --- */}
      <AnimatePresence>
        {!isWarping && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-6 left-6 z-50"
          >
            <Link href="/" className="group flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/40 px-5 py-2.5 backdrop-blur-md transition-all hover:bg-white/80 hover:shadow-sm">
              <ChevronLeft size={16} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-800">Home</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- LEFT SIDE: DESKTOP BRANDING --- */}
      <AnimatePresence>
        {!isWarping && (
          <motion.div
            initial={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0, transition: { duration: 0.5 } }}
            className="hidden lg:flex w-1/2 h-full fixed left-0 top-0 flex-col items-center justify-center p-12 z-20 border-r border-white/50 bg-white/30 backdrop-blur-sm"
          >
            <div className="max-w-md text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="
    mx-auto mb-10 
    h-32 w-32 
    rounded-[2.5rem] 
    bg-white 
    flex items-center justify-center
    shadow-[0_24px_48px_-14px_rgba(0,0,0,0.2)]
    ring-1 ring-black/5
  "
              >
                <div className="relative h-24 w-24">
                  <Image
                    src="/logo.png"
                    alt="Gecko Works"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </motion.div>


              <h1 className="text-6xl font-black tracking-tighter text-slate-900 leading-[1.1] mb-6 flex justify-center gap-1">
                {brandName.map((letter, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={letter === " " ? "w-4" : ""}
                  >
                    {letter}
                  </motion.span>
                ))}
              </h1>

              <p className="text-xl text-slate-500 font-medium leading-relaxed mb-10">
                Welcome to the Gecko Works OMS Portal.The intelligent operating system for modern workforce management.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- RIGHT SIDE / LOGIN FORM --- */}
      <div className="w-full lg:w-1/2 lg:ml-auto min-h-screen flex items-center justify-center p-4 relative z-30">
        <AnimatePresence mode="wait">
          {!isWarping && (
            <motion.div
              variants={contentVariants}
              initial="visible"
              animate="visible"
              exit="exit"
              className="w-full max-w-[420px]"
            >
              <div className="relative overflow-hidden rounded-[2.5rem] border border-white/80 bg-white/80 p-8 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] backdrop-blur-3xl sm:p-10 will-change-transform">

                {/* Header */}
                <div className="flex flex-col items-center justify-center mb-8">
                  <div className="lg:hidden relative h-20 w-20 mb-5 flex items-center justify-center rounded-[1.5rem] bg-white shadow-xl">
                    <Image src="/logo.png" alt="Logo" width={58} height={58} className="w-auto h-auto object-contain" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">{greeting}</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                    <ShieldCheck size={12} className="text-emerald-500" /> Secure Connection
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-4">Email ID</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Mail size={20} /></div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@geckoworks.com"
                        required
                        className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-[1.5rem] py-4 pl-12 pr-4 text-slate-800 font-bold focus:outline-none focus:border-emerald-400 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between ml-4">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Password</label>
                      <Link href="/forgot-password" className="text-[10px] font-bold text-emerald-600">Forgot?</Link>
                    </div>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={20} /></div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-[1.5rem] py-4 pl-12 pr-12 text-slate-800 font-bold focus:outline-none focus:border-emerald-400 focus:bg-white transition-all"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 p-2">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-[1.5rem] bg-emerald-500 p-5 font-bold text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <><span>Secure Login</span><ArrowRight size={20} /></>}
                  </button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-slate-100/50">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 text-slate-400">
                    <Lock size={14} /> <span className="text-[10px] font-bold uppercase tracking-widest">Encrypted Connection</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-4 w-full text-center pointer-events-none z-40">
        <p className="text-[10px] font-medium text-slate-400">&copy; 2025 Gecko Works. All Rights Reserved.</p>
      </div>
    </div>
  );
}
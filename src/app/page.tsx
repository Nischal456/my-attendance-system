"use client";
import Link from 'next/link';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import { 
  User, Shield, CheckCircle, Users, Zap, Layout, 
  BarChart2, Lock, ChevronRight, Activity, Layers, Database, 
  Globe, Server, Cpu, PieChart, Command ,LogIn,UserCheck
} from 'react-feather';

export default function HomePage() {
  const features = [
    { label: "Smart Attendance", icon: <CheckCircle size={14} /> },
    { label: "Task Command", icon: <Layout size={14} /> },
    { label: "Leave Management", icon: <Zap size={14} /> },
    { label: "Deep Analytics", icon: <BarChart2 size={14} /> },
  ];

  // --- ULTRA FAST VARIANTS ---
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05, // Very fast stagger (machine gun effect)
        delayChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0, 
      // High stiffness = Snappy, 120fps feel
      transition: { type: "spring", stiffness: 260, damping: 20 } 
    }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, x: 20, rotateY: 5 },
    visible: { 
      opacity: 1, 
      x: 0, 
      rotateY: 0,
      transition: { 
        type: "spring", 
        stiffness: 220, // Snaps in quickly
        damping: 25, 
        delay: 0.2 
      } 
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50 font-sans selection:bg-emerald-500/30 selection:text-emerald-900">

      {/* --- HIGH PERFORMANCE BACKGROUND ENGINE --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transform-gpu">
        
        {/* Moving Grid - Speed: Fast */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)] animate-pan-grid will-change-transform"></div>

        {/* Aurora Mesh - Speed: Turbo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-[1400px] opacity-60">
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-gradient-to-r from-emerald-300/30 to-teal-300/30 rounded-full blur-[100px] mix-blend-multiply animate-aurora-1 will-change-transform"></div>
          <div className="absolute top-[10%] right-[-20%] w-[50vw] h-[50vw] bg-gradient-to-bl from-cyan-200/40 to-emerald-100/40 rounded-full blur-[90px] mix-blend-multiply animate-aurora-2 animation-delay-1000 will-change-transform"></div>
        </div>

        {/* Floating Icons - Speed: Rapid */}
        <div className="absolute inset-0 overflow-hidden">
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="absolute top-[15%] left-[10%] text-emerald-900/5 animate-float-slow"><Activity size={56} strokeWidth={1} /></motion.div>
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.2 }} className="absolute bottom-[20%] right-[10%] text-teal-900/5 animate-float-medium"><Database size={100} strokeWidth={0.5} /></motion.div>
           <div className="absolute top-[40%] left-[5%] text-emerald-800/5 animate-float-fast blur-[2px]"><Layers size={40} strokeWidth={1.5} /></div>
           <div className="absolute top-[10%] right-[20%] text-cyan-900/5 animate-float-slow"><Globe size={48} strokeWidth={1} /></div>
           <div className="absolute bottom-[10%] left-[20%] text-emerald-700/5 animate-float-medium blur-[1px]"><Cpu size={64} strokeWidth={1} /></div>
           <div className="absolute top-[25%] right-[35%] text-slate-400/10 animate-float-v-slow blur-[4px]"><Server size={80} strokeWidth={0.5} /></div>
        </div>

        {/* Noise Grain */}
        <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      </div>

      {/* --- MAIN LAYOUT --- */}
      <main className="relative z-10 flex min-h-screen flex-col lg:flex-row items-center justify-center p-6 gap-12 lg:gap-20 max-w-7xl mx-auto">

        {/* LEFT SIDE: Brand Narrative */}
        <motion.div 
          className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >

          {/* Version Pill */}
          <motion.div variants={itemVariants} className="mb-8 group relative overflow-hidden inline-flex items-center gap-2 rounded-full border border-emerald-200/40 bg-white/60 px-4 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all duration-200 hover:bg-white/80 hover:shadow-emerald-200/40 hover:scale-105 hover:-translate-y-0.5 cursor-default transform-gpu">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-800/90">OMS 2.0 Version is here</span>
          </motion.div>

          {/* Logo Area */}
          <motion.div variants={itemVariants} className="mb-6 relative group cursor-pointer">
            <div className="absolute -inset-10 bg-gradient-to-r from-emerald-100/0 via-emerald-100/40 to-emerald-100/0 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Image
              src="/logo.png"
              alt="Gecko Works Logo"
              width={190}
              height={95}
              className="relative h-auto w-auto drop-shadow-sm transition-transform duration-300 group-hover:scale-[1.02]"
              priority
            />
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={itemVariants} className="max-w-2xl text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-[4.5rem] leading-[1.1]">
            Unlock Your Team’s{" "}
            <span className="relative inline-block whitespace-nowrap mt-2 lg:mt-0">
              <span className="absolute -inset-1 bg-emerald-200/30 blur-lg rounded-lg transform skew-x-3"></span>
              <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 animate-gradient-x bg-[length:200%_auto]">
                Potential
              </span>
              <motion.span 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 10 }}
                className="absolute -top-6 -right-6 text-emerald-400/40 hidden lg:block"
              >
                 <Zap size={32} fill="currentColor" />
              </motion.span>
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="mt-8 max-w-lg text-lg font-medium leading-relaxed text-slate-500/90">
            Welcome to <span className="font-bold text-slate-800">Gecko Works</span>. The ultra-fast, secure ecosystem for managing personnel, tasks, and analytics in one fluid interface.
          </motion.p>

          {/* Feature Chips - Faster Hover */}
          <motion.div variants={itemVariants} className="mt-10 flex flex-wrap justify-center lg:justify-start gap-3">
            {features.map((item, idx) => (
              <div key={idx} className="group relative flex items-center gap-2 rounded-xl border border-white/60 bg-white/40 px-5 py-2.5 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)] hover:border-emerald-200 transform-gpu">
                <div className="text-emerald-500/70 group-hover:text-emerald-600 group-hover:scale-110 transition-all duration-200">{item.icon}</div>
                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{item.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT SIDE: The Ultra Premium Login Card */}
        <motion.div 
          className="w-full lg:w-[420px] perspective-1000 z-50"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="relative group transition-all duration-300 hover:rotate-y-1 hover:rotate-x-1 transform-gpu">

            {/* Aurora Glow Behind Card */}
            <div className="absolute -inset-[3px] rounded-[2.5rem] bg-gradient-to-b from-white via-emerald-200/60 to-transparent opacity-0 blur-xl transition duration-500 group-hover:opacity-100 group-hover:blur-2xl"></div>

            {/* CARD CONTAINER */}
            <div className="relative overflow-hidden rounded-[2.2rem] border border-white/60 bg-white/60 p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:p-9 transition-all duration-200 hover:shadow-[0_50px_100px_-20px_rgba(16,185,129,0.2)] hover:bg-white/70 transform-gpu">
              
              {/* Internal Glass Shine */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/60 to-transparent opacity-50 pointer-events-none"></div>

              {/* Card Header */}
              <div className="relative mb-8 text-center z-10">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-white shadow-inner border border-emerald-100">
                    <UserCheck className="text-emerald-600" size={28} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Access Portal</h2>
                <p className="text-sm font-medium text-slate-400 mt-1">Secure gateway for personnel</p>
              </div>

              {/* BUTTONS STACK */}
              <div className="space-y-4 relative z-10">

                {/* 1. Employee Login - 200ms transitions */}
                <Link href="/login" className="group/btn relative flex w-full items-center gap-4 overflow-hidden rounded-2xl bg-white border border-emerald-100/80 p-2 pr-4 transition-all duration-200 hover:border-emerald-300 hover:shadow-[0_10px_40px_-10px_rgba(16,185,129,0.25)] hover:-translate-y-1 active:scale-[0.98] transform-gpu">
                  
                  {/* Icon Box */}
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200/50 transition-transform duration-200 group-hover/btn:scale-110 group-hover/btn:rotate-3">
                    <User size={22} strokeWidth={2.5} />
                    <div className="absolute inset-0 rounded-xl border border-white/20"></div>
                  </div>

                  {/* Text */}
                  <div className="relative flex-1 text-left">
                    <p className="text-[15px] font-bold text-slate-800 group-hover/btn:text-emerald-950 transition-colors">Employee Login</p>
                    <p className="text-xs font-medium text-slate-400 group-hover/btn:text-emerald-600/70">Operations & Tasks</p>
                  </div>

                  {/* Arrow */}
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-300 transition-all duration-200 group-hover/btn:bg-emerald-50 group-hover/btn:text-emerald-600 group-hover/btn:translate-x-1">
                    <ChevronRight size={18} />
                  </div>
                </Link>

                {/* 2. Client Login */}
                <Link href="/client/login" className="group/btn relative flex w-full items-center gap-4 overflow-hidden rounded-2xl bg-slate-50/50 border border-transparent p-2 pr-4 transition-all duration-200 hover:bg-white hover:border-blue-100 hover:shadow-[0_10px_40px_-10px_rgba(59,130,246,0.15)] hover:-translate-y-1 active:scale-[0.98] transform-gpu">

                  <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-white text-blue-500 shadow-sm transition-transform duration-200 group-hover/btn:scale-110 group-hover/btn:-rotate-3 group-hover/btn:text-blue-600">
                    <Users size={22} strokeWidth={2.5} />
                  </div>

                  <div className="relative flex-1 text-left">
                    <p className="text-[15px] font-bold text-slate-700 group-hover/btn:text-blue-900 transition-colors">Client Portal</p>
                    <p className="text-xs font-medium text-slate-400 group-hover/btn:text-blue-500/80">Project Tracking</p>
                  </div>

                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-slate-300 transition-all duration-200 group-hover/btn:text-blue-400 group-hover/btn:translate-x-1">
                    <ChevronRight size={18} />
                  </div>
                </Link>

                {/* 3. Admin Login */}
                <Link href="/login" className="relative mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold uppercase tracking-wider text-slate-400/80 transition-all duration-200 hover:bg-slate-100/50 hover:text-slate-600 hover:tracking-widest">
                  <Shield size={14} /> Admin Access
                </Link>
              </div>

              {/* Secure Footer */}
              <div className="mt-8 border-t border-slate-100/80 pt-5 text-center">
                <p className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-900/20">
                  <Lock size={10} className="opacity-70" />
                  Encrypted Connection
                </p>
              </div>

            </div>
          </div>
        </motion.div>

      </main>

      {/* --- CSS ENGINE (ACCELERATED) --- */}
      <style jsx global>{`
        /* 1. Aurora Flow (Sped Up significantly) */
        @keyframes aurora-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -40px) scale(1.1); }
        }
        @keyframes aurora-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, 30px) scale(0.95); }
        }
        .animate-aurora-1 { animation: aurora-1 6s ease-in-out infinite; }
        .animate-aurora-2 { animation: aurora-2 8s ease-in-out infinite; }
        
        /* 2. Floating Icons Logic (Rapid) */
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(-5deg); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.05); }
        }
        @keyframes float-v-slow {
          0%, 100% { transform: translate(0,0) rotate(0deg); }
          50% { transform: translate(10px, -10px) rotate(2deg); }
        }

        .animate-float-slow { animation: float-slow 4s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 3s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 2s ease-in-out infinite; }
        .animate-float-v-slow { animation: float-v-slow 6s ease-in-out infinite; }

        /* 3. Text Gradient Flow (Fast) */
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x { animation: gradient-x 3s ease infinite; }

        /* 4. Grid Pan (Rushing) */
        @keyframes pan-grid {
          0% { transform: translateY(0); }
          100% { transform: translateY(40px); }
        }
        .animate-pan-grid { animation: pan-grid 5s linear infinite; }
        
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer { animation: shimmer 1s infinite; }

        /* Utilities */
        .perspective-1000 { perspective: 1000px; }
        .rotate-y-1 { transform: rotateY(1deg); }
        .rotate-x-1 { transform: rotateX(1deg); }
      `}</style>
    </div>
  );
}
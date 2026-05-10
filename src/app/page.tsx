"use client";
import Link from 'next/link';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import { 
  User, Shield, CheckCircle, Users, Zap, Layout, 
  BarChart2, Lock, ChevronRight, Activity, Layers, Database, 
  Globe, Server, Cpu, LogIn, UserCheck, ArrowRight
} from 'react-feather';

export default function HomePage() {
  const features = [
    { label: "Smart Attendance", icon: <CheckCircle size={14} /> },
    { label: "Task Command", icon: <Layout size={14} /> },
    { label: "Leave Management", icon: <Zap size={14} /> },
    { label: "Deep Analytics", icon: <BarChart2 size={14} /> },
  ];

  // --- ULTRA PREMIUM VARIANTS ---
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1, 
        delayChildren: 0.2,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)',
      transition: { 
        type: "spring", 
        stiffness: 200, 
        damping: 20,
        mass: 0.8
      } 
    }
  };

  const cardContainerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 30, rotateX: 10 },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0, 
      rotateX: 0,
      transition: { 
        type: "spring", 
        stiffness: 150, 
        damping: 25, 
        delay: 0.4,
        mass: 1.2
      } 
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#FAFCFF] font-sans selection:bg-emerald-500/20 selection:text-emerald-900 flex items-center justify-center">

      {/* --- HYPER-REALISTIC BACKGROUND ENGINE --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        
        {/* Subtle Ambient Base */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-[#F0FDF4] opacity-80"></div>

        {/* Micro-Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: `linear-gradient(to right, #10B98108 1px, transparent 1px), linear-gradient(to bottom, #10B98108 1px, transparent 1px)`,
            backgroundSize: `32px 32px`,
            maskImage: `radial-gradient(ellipse 80% 80% at 50% 30%, black 20%, transparent 80%)`,
            WebkitMaskImage: `radial-gradient(ellipse 80% 80% at 50% 30%, black 20%, transparent 80%)`,
          }}
        ></div>

        {/* Cinematic Aurora Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-full opacity-70 mix-blend-multiply">
          <motion.div 
            animate={{ 
              x: ['-10%', '10%', '-10%'], 
              y: ['-10%', '5%', '-10%'],
              scale: [1, 1.1, 1] 
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-emerald-300/30 rounded-full blur-[120px] will-change-transform"
          />
          <motion.div 
            animate={{ 
              x: ['10%', '-10%', '10%'], 
              y: ['10%', '-5%', '10%'],
              scale: [1, 1.2, 1] 
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] bg-teal-200/40 rounded-full blur-[100px] will-change-transform"
          />
          <motion.div 
            animate={{ 
              y: ['10%', '-10%', '10%'],
              scale: [1, 1.1, 1] 
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            className="absolute bottom-[-10%] left-[20%] w-[40vw] h-[40vw] bg-cyan-200/20 rounded-full blur-[90px] will-change-transform"
          />
        </div>

        {/* Optical Noise for Premium Texture */}
        <div className="absolute inset-0 opacity-[0.025] mix-blend-overlay pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      </div>

      {/* --- MAIN LAYOUT --- */}
      <main className="relative z-10 flex flex-col lg:flex-row items-center justify-between w-full max-w-[1300px] px-6 sm:px-12 py-12 lg:py-20 gap-16 lg:gap-20">

        {/* LEFT SIDE: Brand Narrative */}
        <motion.div 
          className="w-full lg:w-[55%] flex flex-col items-center lg:items-start text-center lg:text-left pt-8 lg:pt-0"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Version Pill */}
          <motion.div variants={itemVariants} className="mb-8 group relative overflow-hidden inline-flex items-center gap-2.5 rounded-full border border-emerald-500/15 bg-white/80 px-4 py-1.5 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-emerald-500/10 hover:border-emerald-500/30 hover:bg-white cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-800">Gecko OMS v2.0</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
          </motion.div>

          {/* Logo */}
          <motion.div variants={itemVariants} className="mb-6 relative group">
            <div className="absolute -inset-8 bg-emerald-500/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <Image
              src="/logo.png"
              alt="Gecko Works Logo"
              width={160}
              height={80}
              className="relative h-auto w-auto object-contain transition-transform duration-500 group-hover:scale-[1.02]"
              priority
            />
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={itemVariants} className="max-w-2xl text-[2.75rem] sm:text-6xl lg:text-[4.2rem] font-extrabold tracking-tight text-slate-900 leading-[1.05] drop-shadow-sm">
            Unlock Your Team's <br className="hidden sm:block lg:hidden" />
            <span className="relative inline-block whitespace-nowrap mt-2">
              <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 animate-gradient-x bg-[length:200%_auto] z-10">
                Potential
              </span>
              {/* Subtle underline glow */}
              <span className="absolute bottom-1 left-0 w-full h-[30%] bg-emerald-300/30 blur-md -z-0"></span>
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="mt-6 max-w-[480px] text-base sm:text-lg font-medium leading-relaxed text-slate-500">
            Welcome to <span className="font-bold text-slate-800">Gecko Works</span>. The ultra-fast, secure ecosystem for managing personnel, tasks, and analytics in one fluid interface.
          </motion.p>

          {/* Feature Chips */}
          <motion.div variants={itemVariants} className="mt-10 flex flex-wrap justify-center lg:justify-start gap-3">
            {features.map((item, idx) => (
              <div key={idx} className="group flex items-center gap-2 rounded-xl border border-slate-200/50 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-md hover:shadow-emerald-500/5 hover:border-emerald-200">
                <div className="text-emerald-500 group-hover:text-emerald-600 transition-colors duration-300">
                  {item.icon}
                </div>
                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                  {item.label}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT SIDE: The Ultra Premium Login Card */}
        <motion.div 
          className="w-full max-w-[400px] lg:w-[45%] perspective-1000 z-50 relative"
          variants={cardContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Card Ambient Glow */}
          <div className="absolute -inset-[2px] rounded-[2.5rem] bg-gradient-to-b from-white via-emerald-100 to-white/50 opacity-100 blur-sm transition duration-500"></div>
          <div className="absolute -inset-4 rounded-[3rem] bg-emerald-500/10 blur-2xl opacity-50"></div>

          {/* CARD CONTAINER */}
          <div className="relative overflow-hidden rounded-[2.2rem] border border-white bg-white/80 p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05),0_0_0_1px_rgba(255,255,255,0.5)_inset] backdrop-blur-2xl transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(16,185,129,0.15)] transform-gpu">
            
            {/* Internal Glass Shine */}
            <div className="absolute top-0 left-0 w-full h-[40%] bg-gradient-to-b from-white/80 to-transparent pointer-events-none"></div>

            {/* Card Header */}
            <div className="relative mb-8 text-center z-10 flex flex-col items-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-white shadow-[0_4px_20px_rgba(16,185,129,0.15),inset_0_2px_0_rgba(255,255,255,1)] border border-emerald-100">
                  <UserCheck className="text-emerald-600" size={26} strokeWidth={2.5} />
              </div>
              <h2 className="text-[1.35rem] font-extrabold text-slate-800 tracking-tight">Access Portal</h2>
              <p className="text-xs font-medium text-slate-400 mt-1.5 tracking-wide">Secure gateway for personnel</p>
            </div>

            {/* BUTTONS STACK */}
            <div className="space-y-3.5 relative z-10">

              {/* 1. Employee Login */}
              <Link href="/login" className="group/btn relative flex w-full items-center gap-4 overflow-hidden rounded-[1.25rem] bg-white border border-slate-100 p-2.5 pr-5 transition-all duration-300 hover:border-emerald-300/50 hover:shadow-[0_8px_25px_-5px_rgba(16,185,129,0.15)] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0">
                
                <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 transition-transform duration-300 group-hover/btn:scale-[1.08] group-hover/btn:-rotate-2">
                  <User size={20} strokeWidth={2.5} />
                  <div className="absolute inset-0 rounded-xl border border-white/20"></div>
                </div>

                <div className="relative flex-1 text-left min-w-0">
                  <p className="text-[14px] font-bold text-slate-800 group-hover/btn:text-emerald-700 transition-colors truncate">Employee Login</p>
                  <p className="text-[11px] font-medium text-slate-400 group-hover/btn:text-emerald-600/70 truncate mt-0.5">Operations & Tasks</p>
                </div>

                <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-300 transition-all duration-300 group-hover/btn:bg-emerald-50 group-hover/btn:text-emerald-600 group-hover/btn:translate-x-1">
                  <ArrowRight size={16} strokeWidth={2.5} />
                </div>
              </Link>

              {/* 2. Client Login */}
              <Link href="/client/login" className="group/btn relative flex w-full items-center gap-4 overflow-hidden rounded-[1.25rem] bg-slate-50/50 border border-transparent p-2.5 pr-5 transition-all duration-300 hover:bg-white hover:border-blue-200/50 hover:shadow-[0_8px_25px_-5px_rgba(59,130,246,0.12)] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0">

                <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white text-blue-500 shadow-sm border border-slate-100 transition-transform duration-300 group-hover/btn:scale-[1.08] group-hover/btn:rotate-2 group-hover/btn:text-blue-600 group-hover/btn:border-blue-100">
                  <Users size={20} strokeWidth={2.5} />
                </div>

                <div className="relative flex-1 text-left min-w-0">
                  <p className="text-[14px] font-bold text-slate-700 group-hover/btn:text-blue-800 transition-colors truncate">Client Portal</p>
                  <p className="text-[11px] font-medium text-slate-400 group-hover/btn:text-blue-500/80 truncate mt-0.5">Project Tracking</p>
                </div>

                <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-transparent text-slate-300 transition-all duration-300 group-hover/btn:text-blue-500 group-hover/btn:translate-x-1 group-hover/btn:bg-blue-50">
                  <ArrowRight size={16} strokeWidth={2.5} />
                </div>
              </Link>

              {/* 3. Admin Login */}
              <Link href="/login" className="relative mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 transition-all duration-300 hover:bg-slate-50 hover:text-slate-700">
                <Shield size={14} /> Admin Access
              </Link>
            </div>

            {/* Secure Footer */}
            <div className="mt-6 border-t border-slate-100/60 pt-5 text-center">
              <p className="flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400/60">
                <Lock size={10} />
                Encrypted Connection
              </p>
            </div>

          </div>
        </motion.div>

      </main>

      {/* --- CSS ENGINE (SMOOTH & ELEGANT) --- */}
      <style jsx global>{`
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x { animation: gradient-x 4s ease-in-out infinite; }
        
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer { animation: shimmer 2s infinite linear; }

        .perspective-1000 { perspective: 1000px; }
      `}</style>
    </div>
  );
}
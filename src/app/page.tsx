"use client";
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, User, Shield, CheckCircle, Users } from 'react-feather';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const features = ["Attendance Tracking", "Task Management", "Leave Requests", "Reporting & Analytics"];

  return (
    <div className="min-h-screen font-sans antialiased">
      {/* Abstract background shapes - they will adapt gracefully */}
      <div className="w-full h-full absolute inset-0 bg-slate-50 overflow-hidden">
        <div className="absolute top-0 -left-48 w-[40rem] h-[40rem] bg-green-200/50 rounded-full filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute top-0 -right-48 w-[40rem] h-[40rem] bg-sky-200/50 rounded-full filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/4 w-[40rem] h-[40rem] bg-rose-200/50 rounded-full filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main content container with responsive layout */}
      <main className="min-h-screen flex flex-col lg:flex-row items-center justify-center relative z-10 p-4">

        {/* Left Side: Brand Info - with enhanced content and animations */}
        <div className={`w-full lg:w-1/2 flex flex-col justify-center text-center lg:text-left p-6 lg:p-8 lg:pl-20 transition-all duration-700 ease-out ${isMounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
          <div className={`mb-6 p-6`}>
            <Image
              src="/logo.png" // Using your new WIDE logo
              alt="Company Logo"
              width={180} // Adjusted width for the wide logo
              height={100}  // Adjusted height
              className="w-auto h-auto mx-auto"
              priority
            />
          </div>
          <h1 className={`text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tighter transition-all duration-700 delay-200 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            Unlock Your Team's Potential.
          </h1>
          <p className={`text-slate-600 text-lg max-w-md lg:max-w-lg mb-8 transition-all duration-700 delay-300 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            Welcome to <span className="font-semibold text-green-600">Gecko Works</span>, the all-in-one platform for smart, simple, and seamless team management.
          </p>
          <div className={`space-y-3 transition-all duration-700 delay-500 ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
            {features.map((feature) => (
              <div key={feature} className="flex items-center justify-center lg:justify-start gap-3">
                <CheckCircle className="text-green-500" size={20} />
                <span className="text-slate-700 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Login Card - with enhanced animations */}
        <div className={`w-full lg:w-1/2 flex justify-center p-6 lg:p-10 transition-all duration-700 ease-out delay-200 ${isMounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
  <div className="w-full max-w-md bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-white/40 p-10 transition-transform duration-300 hover:scale-105">
    <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-400 text-center mb-10 tracking-tight">
      Select Your Portal
    </h2>

    <div className="space-y-5">
      {/* Employee Login */}
      <Link
        href="/login"
        className="group flex items-center justify-between px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-400/30 hover:shadow-emerald-600/40 transition-all duration-300 transform hover:-translate-y-1"
      >
        <div className="flex items-center gap-3">
          <User size={20} className="transition-transform group-hover:rotate-[-6deg] group-hover:scale-110" />
          <span>Employee Login</span>
        </div>
        <ArrowRight className="transition-all transform opacity-0 group-hover:opacity-100 group-hover:translate-x-2" size={20} />
      </Link>

      {/* Admin Login */}
      <Link
        href="/login"
        className="group flex items-center justify-between px-6 py-4 bg-white hover:bg-slate-100 border border-slate-300 hover:border-green-500 text-slate-800 hover:text-green-600 font-semibold rounded-xl transition-all duration-300 transform hover:-translate-y-1 shadow-md"
      >
        <div className="flex items-center gap-3">
          <Shield size={20} className="transition-transform group-hover:-rotate-6 group-hover:scale-110 text-slate-500 group-hover:text-green-600" />
          <span>Admin Login</span>
        </div>
        <ArrowRight className="transition-all transform opacity-0 group-hover:opacity-100 group-hover:translate-x-2" size={20} />
      </Link>

      {/* Client Login */}
      <Link
        href="/client/login"
        className="group flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white font-semibold rounded-xl shadow-lg shadow-sky-400/30 hover:shadow-sky-600/40 transition-all duration-300 transform hover:-translate-y-1"
      >
        <div className="flex items-center gap-3">
          <Users size={20} className="transition-transform group-hover:rotate-6 group-hover:scale-110" />
          <span>Client Login</span>
        </div>
        <ArrowRight className="transition-all transform opacity-0 group-hover:opacity-100 group-hover:translate-x-2" size={20} />
      </Link>
    </div>

    {/* Footer */}
    <div className="mt-10 pt-6 border-t border-slate-200 text-center">
      <p className="text-xs text-slate-500 tracking-wider font-medium uppercase">
        Secure • Reliable • Efficient
      </p>
    </div>
  </div>
</div>

      </main>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, AlertTriangle, Eye, EyeOff, Mail, Lock } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Trigger animations after the component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Login successful! Redirecting...", {
          duration: 2000,
          position: "top-center",
          style: {
            background: "#F0FFF4",
            color: "#2F855A",
            border: '1px solid #9AE6B4',
            boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.1)',
          },
          iconTheme: {
            primary: '#2F855A',
            secondary: '#F0FFF4',
          },
        });

        setTimeout(() => {
          if (data.role === 'HR') {
            router.push('/hr/dashboard');
          } else if (data.role === 'Project Manager') {
            router.push('/pm/dashboard');
          } else {
            router.push("/dashboard");
          }
        }, 1500);

      } else {
        setError(data.message || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Define styles for animations
  const leftSideStyle = `relative hidden lg:flex flex-col items-center justify-center bg-green-600 text-white p-12 transition-all duration-700 ease-out transform ${isMounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`;
  const rightSideStyle = `flex items-center justify-center bg-slate-50 p-6 sm:p-8 lg:p-12 transition-all duration-700 ease-out transform ${isMounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`;
  const logoContainerStyle = `relative rounded-xl bg-white shadow-lg px-6 py-4 mb-6 transition-transform duration-300 hover:scale-105`;

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2 font-sans antialiased overflow-hidden">
      <Toaster />

      {/* --- Left Side: Visual Branding with Animation --- */}
      <div className={leftSideStyle}>
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{backgroundImage: "url('https://www.toptal.com/designers/subtlepatterns/uploads/double-bubble-outline.png')"}}></div>
        <div className="relative z-10 text-center">
          <Link href="/" className="block mb-8">
            <div className={logoContainerStyle}>
              <Image
                src="/geckoworks.png" // Using your new WIDE logo
                alt="Company Logo"
                width={180} // Adjusted width for the wide logo
                height={100}  // Adjusted height
                className="w-auto h-auto mx-auto"
                priority
              />
            </div>
          </Link>
          <h1 className={`text-4xl font-bold tracking-tight text-white transition-all duration-700 delay-300 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            Office Management System
          </h1>
          <p className={`mt-4 text-lg text-green-100 max-w-sm mx-auto transition-all duration-700 delay-500 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            Welcome to the Gecko Works OMS Portal 🙏🏻
          </p>
        </div>
        <div className="absolute bottom-6 text-sm text-green-200/80">
          © {new Date().getFullYear()} Gecko Works. All Rights Reserved.
        </div>
      </div>

     <div className={`flex items-center justify-center bg-slate-50 p-6 sm:p-8 lg:p-12 transition-opacity duration-1000 delay-200 ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-full max-w-md">
          <div className={`text-left mb-10`}>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Sign In
            </h1>
            <p className="mt-2 text-slate-600">
              Welcome back! Please enter your credentials.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 shadow-sm transition-colors duration-200 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-green-600 hover:text-green-500 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-12 text-slate-900 placeholder-slate-400 shadow-sm transition-colors duration-200 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 hover:text-slate-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-x-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-lg bg-green-600 px-4 py-3 text-base font-bold text-white shadow-lg shadow-green-500/20 transition-all duration-300 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 transform hover:-translate-y-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
            
            {/* Divider */}
            <div className="flex items-center gap-4 py-2">
                <div className="h-px w-full bg-slate-200"></div>
                <div className="h-px w-full bg-slate-200"></div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Users,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

export default function ClientLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    const res = await fetch("/api/auth/client-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      toast.success("Client login successful! Redirecting...", {
        duration: 2000,
        position: "top-center",
        style: {
          background: "#F0FFF4",
          color: "#2F855A",
          border: "1px solid #9AE6B4",
          boxShadow: "0 4px 14px 0 rgba(0, 0, 0, 0.1)",
        },
      });

      setTimeout(() => {
        router.push("/client/dashboard");
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


  return (
    <div className="min-h-screen flex flex-col lg:grid lg:grid-cols-2 font-sans antialiased bg-white">
      <Toaster />

      {/* Left Side */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isMounted ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="flex flex-col items-center justify-center bg-green-600 text-white p-8 sm:p-12 relative"
      >
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('https://www.toptal.com/designers/subtlepatterns/uploads/double-bubble-outline.png')" }}></div>

        <div className="relative z-10 text-center">
          <Link href="/" className="block mb-6">
            <div className="bg-white shadow-lg rounded-xl px-4 py-3 inline-block hover:scale-105 transition-transform">
              <Image
                src="/geckoworks.png"
                alt="Company Logo"
                width={160}
                height={80}
                className="w-auto h-auto"
                priority
              />
            </div>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Client Portal</h1>
          <p className="mt-4 text-base sm:text-lg text-blue-100 max-w-sm mx-auto">
            Welcome back to Gecko Works Client Access 💼
          </p>
        </div>
        <div className="absolute bottom-4 text-xs sm:text-sm text-blue-200/80">
          © {new Date().getFullYear()} Gecko Works. All Rights Reserved.
        </div>
      </motion.div>

      {/* Right Side */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isMounted ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="flex items-center justify-center bg-slate-50 px-6 py-12 sm:px-8 md:px-12 w-full"
      >
        <div className="w-full max-w-md">
          <div className="text-left mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="text-green-600" />
              Client Login
            </h1>
            <p className="mt-2 text-slate-600">Access your dashboard with your credentials.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@example.com"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-12 text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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
              className="flex w-full items-center justify-center rounded-lg bg-green-600 px-4 py-3 text-base font-bold text-white shadow-lg transition-all hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Login as Client"
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
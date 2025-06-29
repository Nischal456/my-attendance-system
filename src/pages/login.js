"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link"; // The Link component is needed
import { Loader2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

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
        toast.success("Login successful!", {
          style: {
            borderRadius: "10px",
            background: "#d4edda",
            color: "#155724",
          },
        });
        
        // Redirect based on role
        if (data.role === 'HR') {
            router.push('/hr/dashboard');
        } else if (data.role === 'Project Manager') {
            router.push('/pm/dashboard');
        } else {
            router.push("/dashboard");
        }
      } else {
        setError(
          data.message || "Login failed. Please check your credentials."
        );
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Toaster/>  
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="h-2 bg-[#2ac759] w-full"></div>

          <div className="p-8">
            <div className="text-center mb-8">
              <div className="mx-auto mb-6 flex justify-center">
                <div className="p-2 border-2 border-[#2ac759]/20 rounded-full">
                  <Image
                    src="/logo.png"
                    alt="Attendance System Logo"
                    width={120}
                    height={120}
                    className="w-20 h-20 object-contain"
                    priority
                  />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                Attendance Portal
              </h1>
              <p className="text-gray-600 mt-2">
                Secure access to your records
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-5">
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="peer w-full px-4 pt-5 pb-2 text-gray-800 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2ac759] focus:border-[#2ac759] transition-all"
                  />
                  <label
                    htmlFor="email"
                    className="absolute left-4 top-3 text-xs text-gray-500 peer-focus:text-[#2ac759] transition-all pointer-events-none"
                  >
                    Email address
                  </label>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="peer w-full px-4 pt-5 pb-2 text-gray-800 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2ac759] focus:border-[#2ac759] transition-all pr-10"
                  />
                  <label
                    htmlFor="password"
                    className="absolute left-4 top-3 text-xs text-gray-500 peer-focus:text-[#2ac759] transition-all pointer-events-none"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-label="Hide password" />
                    ) : (
                      <Eye className="h-5 w-5" aria-label="Show password" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center justify-center gap-2 text-red-500 text-sm bg-red-50 border border-red-100 p-3 rounded-lg">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2ac759] hover:bg-[#25b04f] text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#2ac759]/50 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* --- UPDATED SECTION --- */}
            <div className="mt-6 text-center">
              <Link href="/forgot-password" legacyBehavior>
                <a className="text-sm text-gray-600 hover:text-[#2ac759] transition duration-150 hover:underline underline-offset-2 focus:outline-none">
                  Forgot your password?
                </a>
              </Link>
            </div>
            {/* --- END OF UPDATED SECTION --- */}
            
          </div>
        </div>
      </div>
    </div>
  );
}
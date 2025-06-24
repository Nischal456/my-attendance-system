'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, AlertTriangle, Github, Chrome } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[200px] opacity-20 -top-40 -left-60"></div>
      <div className="absolute w-[500px] h-[500px] bg-sky-500 rounded-full blur-[200px] opacity-20 -bottom-40 -right-60"></div>

      {/* Centered Wrapper */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="text-center mb-8">
            <Image
              src="/geckoworks.png"
              alt="GeckoWorks Logo"
              width={250}
              height={80}
              className="mx-auto mb-4"
              priority
            />
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">Welcome Back</h1>
            <p className="text-white/70 text-md mt-1">Sign in to access the Attendance Portal.</p>
          </div>

          <div className="backdrop-blur-xl bg-black/20 border border-white/10 shadow-2xl rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Email address"
                  className="peer w-full px-4 pt-6 pb-2 text-white bg-transparent border-b-2 border-white/20 focus:outline-none focus:border-sky-400 placeholder-transparent transition"
                />
                <label
                  htmlFor="email"
                  className="absolute left-4 top-4 text-white/60 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-sky-400 transition-all"
                >
                  Email address
                </label>
              </div>

              <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Password"
                  className="peer w-full px-4 pt-6 pb-2 text-white bg-transparent border-b-2 border-white/20 focus:outline-none focus:border-sky-400 placeholder-transparent transition"
                />
                <label
                  htmlFor="password"
                  className="absolute left-4 top-4 text-white/60 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-sky-400 transition-all"
                >
                  Password
                </label>
              </div>

              {error && (
                <div className="flex items-center justify-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-2 rounded-lg">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out flex items-center justify-center hover:shadow-lg hover:shadow-sky-500/30 hover:scale-105 active:scale-100 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign In'}
              </button>

              <div className="flex items-center my-6">
                <hr className="w-full border-t border-white/10" />
                <span className="px-4 text-white/40 text-sm">OR</span>
                <hr className="w-full border-t border-white/10" />
              </div>

              <div className="space-y-4">
                <button type="button" className="w-full flex items-center justify-center gap-3 bg-white/90 text-gray-800 font-medium py-2.5 px-4 rounded-lg hover:bg-white transition-transform hover:scale-105">
                  <Chrome className="h-5 w-5" /> Continue with Google
                </button>
                <button type="button" className="w-full flex items-center justify-center gap-3 bg-gray-800 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-gray-700 transition-transform hover:scale-105">
                  <Github className="h-5 w-5" /> Continue with GitHub
                </button>
              </div>
            </form>
          </div>

          <div className="text-center text-sm text-white/60 mt-8">
            <a href="#" className="hover:text-white transition duration-150 underline underline-offset-2">
              Forgot your password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

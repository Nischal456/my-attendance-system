"use client";
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <main className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          {/* Header with brand color accent */}
          <div className="h-2 bg-[#2ac759] w-full"></div>
          
          <div className="p-8 md:p-10 flex flex-col items-center text-center">
            <div className="mb-6 p-1 rounded-full border-2 border-[#2ac759]/20">
              <Image
                src="/logo.png"
                alt="GeckoWorks Logo"
                width={120}
                height={120}
                className="w-24 h-24 object-contain"
                priority
              />
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Gecko Works Nepal
            </h1>
            <p className="text-gray-600 mb-8 max-w-xs">
              Smart, Simple, and Seamless Tracking for Your Entire Team
            </p>

            <div className="w-full space-y-4">
              <Link href="/login" passHref className="block">
                <button className="w-full py-3 px-6 bg-[#2ac759] hover:bg-[#25b04f] text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md">
                  Employee Login
                </button>
              </Link>
              <Link href="/login" passHref className="block">
                <button className="w-full py-3 px-6 bg-white border border-gray-300 hover:border-[#2ac759] text-gray-700 hover:text-[#2ac759] font-medium rounded-lg transition-all duration-200">
                  Admin Login
                </button>
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 w-full">
              <p className="text-xs text-gray-500">
                Secure • Reliable • Efficient
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
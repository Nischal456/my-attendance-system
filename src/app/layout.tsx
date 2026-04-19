import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'WorkOS Enterprise',
  description: 'Smart Office Management Platform',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico?v=4',
    shortcut: '/favicon.ico?v=4',
    apple: '/favicon.ico?v=4',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'WorkOS',
  },
  applicationName: 'WorkOS',
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        {/* Global Toaster Configuration */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '16px',
              background: '#1e293b', // Slate-800
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)',
              fontSize: '14px',
              fontWeight: 500,
              zIndex: 99999, // Ensure it's above all modals
            },
            success: {
              iconTheme: {
                primary: '#10b981', // Emerald-500
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444', // Red-500
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
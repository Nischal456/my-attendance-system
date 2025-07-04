import { Inter } from 'next/font/google';
import './globals.css'; // Make sure your global css is imported
import { Toaster } from 'react-hot-toast';
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'GeckoWorks OMS',
  description: 'Smart Office Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* The font class is applied to the body tag */}
      <body className={inter.className}>{children}
        <Toaster />
      </body>
    </html>
  );
}

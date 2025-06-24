import { Inter } from 'next/font/google';
import './globals.css'; // Make sure your global css is imported

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'GeckoWorks Attendance',
  description: 'Smart Attendance Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* The font class is applied to the body tag */}
      <body className={inter.className}>{children}</body>
    </html>
  );
}

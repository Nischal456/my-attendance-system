"use client"; 

import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <>
      <main className="container">
        <div className="content-box">
          
          {/* --- LOGO --- 
              Make sure 'geckoworks.png' is in the '/public' folder.
          */}
          <Image
            src="/geckoworks.png"
            alt="GeckoWorks Logo"
            width={250}
            height={80}
            className="logo"
            priority
          />

          <h1 className="headline">
            Gecko Attendance System
          </h1>
          <p className="sub-headline">
            Smart, Simple, and Seamless Tracking for Your Entire Team.
          </p>

          <div className="button-group">
            <Link href="/login" passHref>
              <button className="btn btn-primary">Employee Login</button>
            </Link>
            <Link href="/login" passHref>
              <button className="btn btn-secondary">HR Admin Login</button>
            </Link>
          </div>
        </div>
      </main>

      {/* Since this is now a Client Component, styled-jsx will work perfectly. */}
      <style jsx>{`
        .container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
          text-align: center;
          color: white;
        }
        .content-box {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 3rem 4rem;
          max-width: 650px;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }
        .logo {
          margin-bottom: 1.5rem;
        }
        .headline {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0;
          letter-spacing: -1px;
        }
        .sub-headline {
          font-size: 1.2rem;
          font-weight: 300;
          color: #d1d5db; /* Light gray for subtitle */
          margin: 1rem 0 2.5rem 0;
        }
        .button-group {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .btn {
          padding: 0.75rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn-primary {
          background-color: #4f46e5;
          color: white;
        }
        .btn-secondary {
          background-color: transparent;
          color: white;
          border: 2px solid #4f46e5;
        }
        .btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        }
        .btn-primary:hover {
            background-color: #6366f1;
        }
        .btn-secondary:hover {
            background-color: #4f46e5;
        }
      `}</style>
    </>
  );
}

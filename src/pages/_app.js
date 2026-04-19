import '../app/globals.css'; // Your global styles
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>WorkOS Enterprise</title>
        <meta name="description" content="WorkOS Enterprise platform" />
        <link rel="icon" href="/favicon.ico?v=4" />
        <link rel="apple-touch-icon" href="/favicon.ico?v=4" />
      </Head>
      <Component {...pageProps} />
      
      {/* Global Premium Toaster Configuration */}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '16px',
            background: '#1e293b', // Slate-800 Dark
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)', // Subtle glass border
            backdropFilter: 'blur(12px)', // Glass effect
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
            fontSize: '14px',
            fontWeight: 600,
            zIndex: 99999, // Always on top
          },
          success: {
            iconTheme: {
              primary: '#10b981', // Emerald Green
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444', // Red
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

export default MyApp;
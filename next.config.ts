import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // --- ADD THIS 'images' CONFIGURATION ---
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**', // This allows any image path from the Cloudinary domain
      },
    ],
  },
};

export default nextConfig;
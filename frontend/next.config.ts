import type { NextConfig } from "next";
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load env vars from root .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_USE_MOCK: process.env.NEXT_PUBLIC_USE_MOCK || 'false',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3838',
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4094',
  },
  
  // Enable React strict mode
  reactStrictMode: true,
  
  // TypeScript configuration
  typescript: {
    // TODO: Set to false in production after fixing all type errors
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;

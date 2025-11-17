/** @type {import('next').NextConfig} */
const nextConfig = {
  // Security: Enable TypeScript errors in production
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
      },
    ],
  },
  // Security: Production optimizations
  compress: true,
  poweredByHeader: false, // Remove X-Powered-By header
  reactStrictMode: true,
  // Output standalone for Docker
  output: 'standalone',
}

export default nextConfig

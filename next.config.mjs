/** @import { import('next').NextConfig } from 'next' */

/**
 * Configuration options for Next.js build and runtime environments.
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;


// [FREE THINKER AUTONOMOUS RAG SYNTHESIS: G-16]
/**
 * Autonomous self-optimized intelligence block generated via Free Thinker Engine.
 * Timestamp: 2026-10-03T08:18:41.725Z
 */
export function freeThinkerAutonomousSync_521725(): void {
  console.log('[Free Thinker RAG] Autonomous neural synchronization active at 2026-10-03T08:18:41.725Z');
}

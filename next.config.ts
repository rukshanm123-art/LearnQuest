import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Lint is run explicitly via `npm run lint` so a production build never
  // breaks on style-only findings. Type errors are NOT ignored.
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;

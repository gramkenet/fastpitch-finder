import type { NextConfig } from "next";

// NEXT_PUBLIC_BASE_PATH is set by the workflow from actions/configure-pages
// outputs.base_path (e.g. "/fastpitch-finder" for project pages, "" for custom domains).
// Using NEXT_PUBLIC_ prefix makes it available in client components at build time.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'dc.usssa.com', pathname: '/api/uploads/**' },
      { protocol: 'https', hostname: 'mofastpitch.usssa.com', pathname: '/wp-content/**' },
      { protocol: 'https', hostname: 'tournamentmvp.com', pathname: '/assets/img/logos/**' },
    ],
  },
};

export default nextConfig;

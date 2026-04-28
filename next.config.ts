import type { NextConfig } from "next";

// Set by the workflow from actions/configure-pages outputs.base_path.
// Empty string (default) = custom domain or local dev — no prefix needed.
const basePath = process.env.BASE_PATH ?? ''

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

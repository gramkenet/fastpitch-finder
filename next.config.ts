import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'dc.usssa.com', pathname: '/api/uploads/**' },
      { protocol: 'https', hostname: 'mofastpitch.usssa.com', pathname: '/wp-content/**' },
      { protocol: 'https', hostname: 'tournamentmvp.com', pathname: '/assets/img/logos/**' },
    ],
  },
};

export default nextConfig;

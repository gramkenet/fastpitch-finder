import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  // basePath / assetPrefix are injected at CI time by actions/configure-pages
  images: {
    unoptimized: true, // required for static export; also injected by configure-pages
    remotePatterns: [
      { protocol: 'https', hostname: 'dc.usssa.com', pathname: '/api/uploads/**' },
      { protocol: 'https', hostname: 'mofastpitch.usssa.com', pathname: '/wp-content/**' },
      { protocol: 'https', hostname: 'tournamentmvp.com', pathname: '/assets/img/logos/**' },
    ],
  },
};

export default nextConfig;

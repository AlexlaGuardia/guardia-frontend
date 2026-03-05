import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_BUILD_DIR || '.next',
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.guardiacontent.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/demo/:slug',
        destination: '/demo/:slug/index.html',
      },
      {
        source: '/demo/:slug/',
        destination: '/demo/:slug/index.html',
      },
      {
        source: '/pitch/:slug',
        destination: '/pitch/:slug/index.html',
      },
      {
        source: '/pitch/:slug/',
        destination: '/pitch/:slug/index.html',
      },
    ];
  },
};

export default nextConfig;

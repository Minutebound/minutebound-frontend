import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['react-datepicker'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.kiwi.com',
        port: '',
        pathname: '/airlines/**',
      },
    ],
  },
};

export default nextConfig;
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@tsc/types'],
};

export default nextConfig;

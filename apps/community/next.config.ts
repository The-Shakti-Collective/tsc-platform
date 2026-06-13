import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@tsc/community-sdk', '@tsc/types', '@tsc/contracts'],
};

export default nextConfig;

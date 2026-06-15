import type { NextConfig } from 'next';

/** Path deploy on apex (theshakticollective.in/community). Local dev: unset. */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, '') ?? '';

const nextConfig: NextConfig = {
  basePath: basePath || undefined,
  transpilePackages: ['@tsc/community-sdk', '@tsc/types', '@tsc/contracts'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'images.clerk.dev' },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from 'next';

const artistPathUrl = process.env.NEXT_PUBLIC_ARTIST_PATH_URL ?? 'https://theartistpath.in';

const nextConfig: NextConfig = {
  transpilePackages: ['@tsc/types'],
  async redirects() {
    return [
      {
        source: '/programs/artist-path',
        destination: artistPathUrl,
        permanent: false,
      },
      {
        source: '/artist-path',
        destination: artistPathUrl,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

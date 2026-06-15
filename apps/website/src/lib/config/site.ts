export const siteConfig = {
  name: 'The Shakti Collective',
  shortName: 'TSC',
  tagline: 'Artist-and-community operating system for India’s independent music scene.',
  description:
    'The Shakti Collective connects artists, fans, curators, and communities through identity, events, opportunities, and intelligence — one ecosystem, many journeys.',
  url: process.env.NEXT_PUBLIC_WEBSITE_URL ?? 'http://localhost:3002',
  communityUrl: process.env.NEXT_PUBLIC_COMMUNITY_URL ?? 'http://localhost:3000',
  artistPathUrl: process.env.NEXT_PUBLIC_ARTIST_PATH_URL ?? 'https://theartistpath.in',
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api',
  locale: 'en_IN',
  twitterHandle: '@theshakticollective',
  keywords: [
    'independent music India',
    'artist community platform',
    'music events',
    'The Shakti Collective',
    'theshakticollective',
  ],
} as const;

export const programs = [
  {
    slug: 'artist-path',
    title: 'Artist Path',
    summary:
      'A 9-month accelerator for independent artists ready to move from skill to career — identity, craft, audience, industry, and opportunity.',
    highlights: ['9-month accelerator', '30 artists selected', 'Hybrid format'],
    externalUrl: process.env.NEXT_PUBLIC_ARTIST_PATH_URL ?? 'https://theartistpath.in',
  },
  {
    slug: 'community-leaders',
    title: 'Community Leaders',
    summary:
      'Launch and grow scenes with membership tools, curated programming, and audience insights tailored to your city.',
    highlights: ['Membership tiers', 'Community analytics', 'Programming support'],
  },
  {
    slug: 'live-experiences',
    title: 'Live Experiences',
    summary:
      'Discover gigs, workshops, and gatherings — with transparent capacity signals and supporter visibility.',
    highlights: ['Event discovery', 'Venue partnerships', 'Fan support layers'],
  },
] as const;

export const siteConfig = {
  name: 'The Artist Path',
  tagline: 'Build Your Music Career. Not Just Your Next Song.',
  description:
    'A 9-month accelerator for independent artists ready to move from skill to career. Applications open — 30 artists selected.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://theartistpath.in',
  applyUrl: process.env.NEXT_PUBLIC_APPLY_URL?.trim() || 'https://theshakticollective.in/artist-path',
  tscWebsiteUrl: process.env.NEXT_PUBLIC_TSC_WEBSITE_URL ?? 'https://theshakticollective.in',
  program: {
    duration: '9 Months',
    startDate: '7 July',
    format: 'Hybrid',
    artistsSelected: 30,
    scholarshipSeats: '5 (50%)',
    developmentGrant: '₹1,00,000',
  },
} as const;

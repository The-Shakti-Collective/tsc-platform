export const siteConfig = {
  name: 'The Artist Path',
  tagline: 'Build Your Music Career. Not Just Your Next Song.',
  description:
    'A 9-month accelerator for independent artists ready to move from skill to career. Registrations open till 7th July — program starts 7th August.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://theartistpath.in',
  applyUrl: process.env.NEXT_PUBLIC_APPLY_URL?.trim() || 'https://theshakticollective.in/artist-path',
  tscWebsiteUrl: process.env.NEXT_PUBLIC_TSC_WEBSITE_URL ?? 'https://theshakticollective.in',
  applyButtonLabel: 'Apply Till 7th July',
  registrationOpenLabel: 'Registrations open till 7th July',
  program: {
    duration: '9 Months',
    startDate: '7th August',
    registrationDeadline: '7th July',
    /** End of registration day, IST */
    registrationDeadlineIso: '2026-07-07T23:59:59+05:30',
    format: 'Hybrid',
    artistsSelected: 30,
    scholarshipSeats: '5 (50%)',
    programFees: '₹1,00,000',
  },
} as const;

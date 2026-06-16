import { siteConfig } from '@/lib/config';

export const programHighlightRows = [
  { label: 'Duration', value: siteConfig.program.duration },
  { label: 'Start Date', value: siteConfig.program.startDate },
  { label: 'Apply By', value: siteConfig.program.registrationDeadline },
  { label: 'Format', value: siteConfig.program.format },
  { label: 'Artists Selected', value: String(siteConfig.program.artistsSelected) },
  { label: 'Scholarship Seats', value: siteConfig.program.scholarshipSeats },
  { label: 'Program Fees', value: siteConfig.program.programFees },
] as const;

import { siteConfig } from '@/lib/config';

export type RegistrationCountdown = {
  expired: boolean;
  label: string;
};

/** Time remaining until registration closes (IST end-of-day on deadline). */
export function getRegistrationCountdown(now = new Date()): RegistrationCountdown {
  const end = new Date(siteConfig.program.registrationDeadlineIso);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) {
    return { expired: true, label: 'Registrations closed' };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return { expired: false, label: `${days}d ${hours}h left` };
  }
  if (hours > 0) {
    return { expired: false, label: `${hours}h ${minutes}m left` };
  }
  return { expired: false, label: `${minutes}m left` };
}

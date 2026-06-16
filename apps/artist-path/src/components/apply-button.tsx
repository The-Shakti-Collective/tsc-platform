'use client';

import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { siteConfig } from '@/lib/config';
import { getRegistrationCountdown } from '@/lib/registration-countdown';
import { cn } from '@/lib/utils';

type ApplyButtonProps = {
  className?: string;
  size?: 'default' | 'lg';
  variant?: 'primary' | 'light';
  showCountdown?: boolean;
};

export function ApplyButton({
  className,
  size = 'default',
  variant = 'primary',
  showCountdown = false,
}: ApplyButtonProps) {
  const href = siteConfig.applyUrl;
  const [countdown, setCountdown] = useState(() => getRegistrationCountdown());

  useEffect(() => {
    if (!showCountdown) return;

    const tick = () => setCountdown(getRegistrationCountdown());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [showCountdown]);

  const classes = cn(
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    showCountdown && 'flex-col gap-1 py-3',
    variant === 'primary' &&
      'bg-brand-peacock text-brand-cream hover:bg-brand-green focus-visible:ring-brand-peacock focus-visible:ring-offset-brand-red-oxide shadow-lg shadow-black/25',
    variant === 'light' &&
      'bg-brand-cream text-brand-peacock hover:bg-brand-cream/90 focus-visible:ring-brand-cream focus-visible:ring-offset-brand-red-oxide shadow-lg shadow-black/20',
    !showCountdown && (size === 'lg' ? 'h-12 px-8 text-base' : 'h-11 px-6 text-sm'),
    showCountdown && 'h-auto min-h-12 px-8 text-base',
    className,
  );

  return (
    <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
      <span className="inline-flex items-center gap-2">
        {siteConfig.applyButtonLabel}
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
      </span>
      {showCountdown ? (
        <span className="text-xs font-medium opacity-90">{countdown.label}</span>
      ) : null}
    </a>
  );
}

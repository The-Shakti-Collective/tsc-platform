import { ArrowRight } from 'lucide-react';
import { siteConfig } from '@/lib/config';
import { cn } from '@/lib/utils';

type ApplyButtonProps = {
  className?: string;
  size?: 'default' | 'lg';
  variant?: 'primary' | 'light';
};

export function ApplyButton({ className, size = 'default', variant = 'primary' }: ApplyButtonProps) {
  const href = siteConfig.applyUrl;

  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    variant === 'primary' &&
      'bg-brand-pumpkin text-white hover:bg-[#ad6517] focus-visible:ring-brand-pumpkin focus-visible:ring-offset-brand-teal-deep shadow-lg shadow-black/20',
    variant === 'light' &&
      'bg-white text-brand-teal-deep hover:bg-brand-cream focus-visible:ring-white focus-visible:ring-offset-brand-teal-deep shadow-lg shadow-black/15',
    size === 'lg' ? 'h-12 px-8 text-base' : 'h-11 px-6 text-sm',
    className,
  );

  return (
    <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
      Apply now
      <ArrowRight className="h-4 w-4" />
    </a>
  );
}

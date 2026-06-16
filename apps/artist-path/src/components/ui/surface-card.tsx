import { cn } from '@/lib/utils';

type SurfaceCardProps = {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  variant?: 'default' | 'muted' | 'accent' | 'glass-dark';
};

export function SurfaceCard({
  children,
  className,
  hover = false,
  variant = 'default',
}: SurfaceCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border transition-all duration-200',
        variant === 'default' &&
          'border-brand-peacock/15 bg-white shadow-[0_4px_24px_-8px_rgba(8,82,95,0.12)]',
        variant === 'muted' && 'border-brand-peacock/15 bg-brand-cream-muted/80',
        variant === 'accent' &&
          'border-brand-peacock/20 bg-gradient-to-br from-brand-peacock-soft to-white shadow-sm',
        variant === 'glass-dark' &&
          'border-brand-cream/15 bg-black/20 text-brand-cream backdrop-blur-md shadow-[0_8px_32px_-12px_rgba(0,0,0,0.3)]',
        hover &&
          'hover:-translate-y-0.5 hover:border-brand-peacock/25 hover:shadow-[0_12px_40px_-12px_rgba(8,82,95,0.18)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

import { cn } from '@/lib/utils';

type SectionEyebrowProps = {
  children: string;
  className?: string;
  light?: boolean;
};

export function SectionEyebrow({ children, className, light }: SectionEyebrowProps) {
  return (
    <p
      className={cn(
        'text-xs font-bold uppercase tracking-[0.2em]',
        light ? 'text-brand-cream/70' : 'text-brand-pumpkin',
        className,
      )}
    >
      {children}
    </p>
  );
}

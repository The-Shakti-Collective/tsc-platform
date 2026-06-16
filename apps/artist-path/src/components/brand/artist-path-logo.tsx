import Image from 'next/image';
import { brandAssets } from '@/lib/brand-assets';
import { cn } from '@/lib/utils';

type ArtistPathLogoProps = {
  variant?: 'mark' | 'lockup';
  className?: string;
  priority?: boolean;
};

const sizes = {
  mark: { width: 97, height: 152, alt: 'The Artist Path mark' },
  lockup: { width: 793, height: 453, alt: 'The Artist Path' },
} as const;

export function ArtistPathLogo({
  variant = 'lockup',
  className,
  priority = false,
}: ArtistPathLogoProps) {
  const src = variant === 'mark' ? brandAssets.mark : brandAssets.lockup;
  const { width, height, alt } = sizes[variant];

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      unoptimized
      className={cn('h-auto w-auto object-contain', className)}
    />
  );
}

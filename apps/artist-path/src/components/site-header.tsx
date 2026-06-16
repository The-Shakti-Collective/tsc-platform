import Link from 'next/link';
import { ApplyButton } from '@/components/apply-button';
import { ArtistPathLogo } from '@/components/brand/artist-path-logo';
import { siteConfig } from '@/lib/config';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl border border-brand-peacock/10 bg-white/85 px-4 shadow-[0_8px_32px_-12px_rgba(8,82,95,0.18)] backdrop-blur-md md:h-16 md:px-5">
        <Link href="/" className="rounded-lg transition-opacity duration-200 hover:opacity-90">
          <ArtistPathLogo variant="mark" className="h-9 w-auto md:h-10" priority />
          <span className="sr-only">{siteConfig.name}</span>
        </Link>
        <ApplyButton size="default" />
      </div>
    </header>
  );
}

import Link from 'next/link';
import { siteConfig } from '@/lib/config/site';

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div className="space-y-2">
          <p className="font-semibold">{siteConfig.name}</p>
          <p className="text-sm text-muted-foreground">{siteConfig.tagline}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-medium">Explore</p>
          <div className="flex flex-col gap-1 text-muted-foreground">
            <Link href="/programs">Programs</Link>
            <a href={siteConfig.artistPathUrl}>Artist Path</a>
            <Link href="/discover">Discover</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/about">About</Link>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-medium">Platform</p>
          <div className="flex flex-col gap-1 text-muted-foreground">
            <a href={siteConfig.communityUrl}>Community app</a>
            <Link href="/contact">Contact & updates</Link>
          </div>
        </div>
      </div>
      <div className="border-t px-4 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {siteConfig.name}
      </div>
    </footer>
  );
}

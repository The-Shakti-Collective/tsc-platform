import Link from 'next/link';
import { BrandPattern } from '@/components/brand/brand-pattern';
import { getWebsiteUrl } from '@/lib/app-urls';

const exploreLinks = [
  { href: '/opportunities', label: 'Opportunities' },
  { href: '/events', label: 'Events' },
  { href: '/directory', label: 'Directory' },
  { href: '/about', label: 'About' },
];

const memberLinks = [
  { href: '/sign-up', label: 'Join' },
  { href: '/sign-in', label: 'Sign in' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/learning-hub', label: 'Learning Hub' },
];

export function SiteFooter() {
  const websiteUrl = getWebsiteUrl();

  return (
    <footer className="relative mt-auto border-t border-brand-teal-deep/10 bg-brand-teal-deep text-brand-cream-wash">
      <BrandPattern variant="footer" className="pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="font-display text-xl font-medium">The Shakti Collective</p>
            <p className="mt-3 max-w-xs text-sm text-brand-cream-wash/75">
              India&apos;s creative career network — artists, musicians, filmmakers and industry
              professionals building sustainable careers together.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-cream/80">
              Explore
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-brand-cream-wash/80 hover:text-brand-cream">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-cream/80">
              Members
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {memberLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-brand-cream-wash/80 hover:text-brand-cream">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={websiteUrl}
                  className="text-brand-cream-wash/80 hover:text-brand-cream"
                  rel="noopener noreferrer"
                >
                  Main website
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-brand-cream-wash/10 pt-8 text-xs text-brand-cream-wash/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} The Shakti Collective. All rights reserved.</p>
          <p>Built for creators. Backed by industry experience.</p>
        </div>
      </div>
    </footer>
  );
}

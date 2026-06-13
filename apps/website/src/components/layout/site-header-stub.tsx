'use client';

import Link from 'next/link';
import { ButtonLink } from '@/components/ui/button';
import { siteConfig } from '@/lib/config/site';

const navItems = [
  { href: '/programs', label: 'Programs' },
  { href: '/discover', label: 'Discover' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function SiteHeaderStub() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight">
          {siteConfig.shortName}
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-muted-foreground hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-100">
            Dev stub auth
          </span>
          <Link href="/sign-in" className="text-sm text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
          <ButtonLink href={siteConfig.communityUrl} size="sm">
            Join community
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}

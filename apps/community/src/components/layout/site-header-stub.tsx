'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

const navLinks = [
  { href: '/opportunities', label: 'Opportunities' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/directory', label: 'Directory' },
  { href: '/events', label: 'Events' },
  { href: '/about', label: 'About' },
];

export function SiteHeaderStub() {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-teal-deep/10 bg-brand-cream-wash/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-display text-lg font-medium tracking-tight text-brand-teal-deep">
          Shakti Collective
        </Link>
        <nav className="hidden items-center gap-4 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-brand-teal-deep/70 hover:text-brand-green"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-brand-pumpkin-soft px-2 py-1 text-xs font-medium text-brand-espresso">
            Dev stub auth
          </span>
          <Button asChild variant="ghost" size="sm" className="text-brand-teal-deep">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="bg-brand-green hover:bg-brand-teal-mid">
            <Link href="/sign-up">Join</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

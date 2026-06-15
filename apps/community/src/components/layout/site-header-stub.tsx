'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MobileNav } from './mobile-nav';

const navLinks = [
  { href: '/opportunities', label: 'Opportunities' },
  { href: '/about', label: 'About' },
];

type SiteHeaderStubProps = {
  hideDevBadge?: boolean;
};

export function SiteHeaderStub({ hideDevBadge = false }: SiteHeaderStubProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-teal-deep/10 bg-brand-cream-wash/90 backdrop-blur">
      <div className="relative mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/brand/tsc-logo.svg" alt="" width={88} height={28} className="h-7 w-auto" />
          <span className="sr-only">The Shakti Collective</span>
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
        <div className="hidden items-center gap-2 md:flex">
          {!hideDevBadge ? (
            <span className="rounded-md bg-brand-pumpkin-soft px-2 py-1 text-xs font-medium text-brand-espresso">
              Dev stub auth
            </span>
          ) : null}
          <Button asChild variant="ghost" size="sm" className="text-brand-teal-deep">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="cursor-pointer bg-brand-pumpkin hover:bg-brand-amber">
            <Link href="/sign-up">Create Passport</Link>
          </Button>
        </div>
        <MobileNav
          links={navLinks}
          authSlot={
            <>
              <Button asChild variant="ghost" size="sm" className="text-brand-teal-deep">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="bg-brand-green hover:bg-brand-teal-mid">
                <Link href="/sign-up">Join</Link>
              </Button>
            </>
          }
        />
      </div>
    </header>
  );
}

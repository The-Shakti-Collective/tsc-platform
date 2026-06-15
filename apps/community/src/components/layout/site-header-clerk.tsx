'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { MobileNav } from './mobile-nav';

const navLinks = [
  { href: '/opportunities', label: 'Opportunities' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/directory', label: 'Directory' },
  { href: '/events', label: 'Events' },
  { href: '/about', label: 'About' },
];

const signedInLinks = [{ href: '/feed', label: 'Feed' }];

export function SiteHeaderClerk() {
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
          <SignedIn>
            {signedInLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-brand-teal-deep/70 hover:text-brand-green"
              >
                {link.label}
              </Link>
            ))}
          </SignedIn>
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <SignedOut>
            <Button asChild variant="ghost" size="sm" className="text-brand-teal-deep">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="bg-brand-green hover:bg-brand-teal-mid">
              <Link href="/sign-up">Join</Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <Button asChild variant="ghost" size="sm" className="text-brand-teal-deep">
              <Link href="/profile">Profile</Link>
            </Button>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
        <MobileNav
          links={navLinks}
          signedInExtras={signedInLinks}
          authSlot={
            <>
              <SignedOut>
                <Button asChild variant="ghost" size="sm" className="text-brand-teal-deep">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="bg-brand-green hover:bg-brand-teal-mid">
                  <Link href="/sign-up">Join</Link>
                </Button>
              </SignedOut>
              <SignedIn>
                <Button asChild variant="ghost" size="sm" className="text-brand-teal-deep">
                  <Link href="/profile">Profile</Link>
                </Button>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </>
          }
        />
      </div>
    </header>
  );
}

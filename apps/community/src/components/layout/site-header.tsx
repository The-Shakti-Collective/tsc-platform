'use client';

import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { isClientAuthStubEnabled } from '@/lib/clerk-env';

const navLinks = [
  { href: '/communities', label: 'Communities' },
  { href: '/events', label: 'Events' },
  { href: '/artists', label: 'Artists' },
  { href: '/search', label: 'Search' },
];

export function SiteHeader() {
  const stubEnabled = isClientAuthStubEnabled();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight">
          TSC Community
        </Link>
        <nav className="hidden items-center gap-4 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
          {!stubEnabled ? (
            <SignedIn>
              <Link href="/feed" className="text-sm text-muted-foreground hover:text-foreground">
                Feed
              </Link>
            </SignedIn>
          ) : (
            <Link href="/feed" className="text-sm text-muted-foreground hover:text-foreground">
              Feed
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {stubEnabled ? (
            <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-100">
              Dev stub auth
            </span>
          ) : (
            <>
              <SignedOut>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/sign-up">Join</Link>
                </Button>
              </SignedOut>
              <SignedIn>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/profile">Profile</Link>
                </Button>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

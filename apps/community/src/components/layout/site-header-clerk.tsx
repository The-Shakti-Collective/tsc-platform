'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { BRAND_LOGO_URL } from '@/lib/brand-assets';
import { Button } from '@/components/ui/button';
import { ClientOnly } from './client-only';
import { MobileNav } from './mobile-nav';

const navLinks = [
  { href: '/opportunities', label: 'Opportunities' },
  { href: '/about', label: 'About' },
];

const signedInLinks = [{ href: '/feed', label: 'Feed' }];

function MarketingAuthFallback() {
  return (
    <>
      <Button asChild variant="ghost" size="sm" className="text-brand-teal-deep">
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild size="sm" className="cursor-pointer bg-brand-pumpkin hover:bg-brand-amber">
        <Link href="/sign-up">Create Passport</Link>
      </Button>
    </>
  );
}

function DesktopAuth() {
  return (
    <ClientOnly fallback={<MarketingAuthFallback />}>
      <>
        <SignedOut>
          <MarketingAuthFallback />
        </SignedOut>
        <SignedIn>
          <Button asChild variant="ghost" size="sm" className="text-brand-teal-deep">
            <Link href="/profile">Profile</Link>
          </Button>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </>
    </ClientOnly>
  );
}

function MobileAuth() {
  return (
    <ClientOnly fallback={<MarketingAuthFallback />}>
      <>
        <SignedOut>
          <MarketingAuthFallback />
        </SignedOut>
        <SignedIn>
          <Button asChild variant="ghost" size="sm" className="text-brand-teal-deep">
            <Link href="/profile">Profile</Link>
          </Button>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </>
    </ClientOnly>
  );
}

function SignedInNavLinks() {
  return (
    <ClientOnly fallback={null}>
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
    </ClientOnly>
  );
}

export function SiteHeaderClerk() {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-teal-deep/10 bg-brand-cream-wash/90 backdrop-blur">
      <div className="relative mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src={BRAND_LOGO_URL} alt="" width={88} height={28} unoptimized className="h-7 w-auto" />
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
          <SignedInNavLinks />
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <DesktopAuth />
        </div>
        <MobileNav links={navLinks} signedInExtras={signedInLinks} authSlot={<MobileAuth />} />
      </div>
    </header>
  );
}

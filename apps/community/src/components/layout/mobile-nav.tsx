'use client';

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

type NavLink = { href: string; label: string };

type MobileNavProps = {
  links: NavLink[];
  signedInExtras?: NavLink[];
  authSlot: React.ReactNode;
};

export function MobileNav({ links, signedInExtras, authSlot }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-brand-teal-deep"
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      {open ? (
        <div className="absolute left-0 right-0 top-14 z-50 border-b border-brand-teal-deep/10 bg-brand-cream-wash px-4 py-4 shadow-lg">
          <nav className="flex flex-col gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-brand-teal-deep/80"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {signedInExtras?.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-brand-teal-deep/80"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-brand-teal-deep/10 pt-4">
            {authSlot}
          </div>
        </div>
      ) : null}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Home, IdCard, MessageSquare, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const mobileLinks = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/directory', label: 'Explore', icon: Compass },
  { href: '/collaborations', label: 'Create', icon: Plus },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/profile', label: 'Passport', icon: IdCard },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-brand-teal-deep/10 bg-brand-cream-wash/95 backdrop-blur lg:hidden"
      aria-label="Mobile navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {mobileLinks.map(({ href, label, icon: Icon }) => {
          const active =
            pathname != null && (pathname === href || pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-0.5 px-1 py-2.5 text-[10px] font-medium transition-colors duration-200',
                active ? 'text-brand-green' : 'text-brand-teal-deep/60',
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

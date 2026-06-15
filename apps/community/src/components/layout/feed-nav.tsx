'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const feedLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/feed', label: 'Feed' },
  { href: '/discover', label: 'Discover' },
  { href: '/opportunities', label: 'Opportunities' },
  { href: '/messages', label: 'Messages' },
  { href: '/notifications', label: 'Notifications' },
  { href: '/bookmarks', label: 'Bookmarks' },
];

export function FeedNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border-b pb-4">
      {feedLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm transition-colors',
            pathname === link.href
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

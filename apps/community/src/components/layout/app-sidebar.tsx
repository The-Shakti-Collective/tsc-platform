'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Bot,
  Briefcase,
  Calendar,
  Compass,
  FolderKanban,
  Handshake,
  Home,
  IdCard,
  MessageSquare,
  Settings,
  Sparkles,
  Store,
  Trophy,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRAND_LOGO_PATH } from '@/lib/brand-assets';

const sidebarLinks = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/directory', label: 'Explore', icon: Compass },
  { href: '/collaborations', label: 'Collaborations', icon: Handshake },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/opportunities', label: 'Opportunities', icon: Briefcase },
  { href: '/marketplace', label: 'Marketplace', icon: Store },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/learning-hub', label: 'Learning Hub', icon: BookOpen },
  { href: '/artists', label: 'Members', icon: Users },
  { href: '/profile', label: 'Passport', icon: IdCard },
  { href: '/reputation', label: 'Reputation', icon: Trophy },
  { href: '/ai-agents', label: 'AI Agents', icon: Bot },
  { href: '/creator-crm', label: 'Creator CRM', icon: Sparkles },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-brand-teal-deep/10 bg-brand-cream-wash/80 lg:block">
      <div className="sticky top-0 flex h-screen flex-col px-3 py-5">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-2">
          <Image src={BRAND_LOGO_PATH} alt="" width={88} height={28} className="h-7 w-auto" />
          <span className="sr-only">The Shakti Collective</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
          {sidebarLinks.map(({ href, label, icon: Icon }) => {
            const active =
              pathname != null && (pathname === href || pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
                  active
                    ? 'bg-brand-green text-brand-cream-wash'
                    : 'text-brand-teal-deep/75 hover:bg-brand-green-soft/60 hover:text-brand-teal-deep',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

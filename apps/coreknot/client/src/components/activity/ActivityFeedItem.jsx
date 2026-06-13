import React from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Calendar,
  Gift,
  LogIn,
  LogOut,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';

const ACTION_ICONS = {
  joined_community: Users,
  left_community: LogOut,
  registered_event: Calendar,
  checked_in_event: LogIn,
  applied_opportunity: Award,
  won_opportunity: Award,
  launched_opportunity: Award,
  followed_person: UserPlus,
  unfollowed_person: UserPlus,
  updated_profile: UserCheck,
  posted_collaboration: Users,
  applied_collaboration: Users,
  redeemed_reward: Gift,
};

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function ActivityFeedItem({ item }) {
  const Icon = ACTION_ICONS[item.action] ?? Users;

  return (
    <article className="flex gap-3 py-4 border-b border-[var(--color-bg-border)] last:border-0">
      <div className="shrink-0 h-9 w-9 rounded-full bg-[var(--token-surface-2)] border border-[var(--color-bg-border)] flex items-center justify-center">
        <Icon size={16} className="text-[var(--color-brand-primary)]" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm text-[var(--color-text-primary)] leading-snug">
          {item.actorSlug ? (
            <>
              <Link
                to={`/profile/${item.actorSlug}`}
                className="font-medium text-[var(--color-brand-primary)] hover:underline"
              >
                {item.actorName}
              </Link>
              {' '}
              {item.message.replace(item.actorName, '').trim()}
            </>
          ) : (
            item.message
          )}
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">{relativeTime(item.timestamp)}</p>
      </div>
    </article>
  );
}

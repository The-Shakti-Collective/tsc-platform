import React from 'react';
import { UserMinus, UserPlus } from 'lucide-react';
import { useFollowPerson, useFollowStatus, useUnfollowPerson } from '../../hooks/queries/profile';

export function FollowButton({ personId, className = '' }) {
  const status = useFollowStatus(personId);
  const follow = useFollowPerson(personId);
  const unfollow = useUnfollowPerson(personId);

  const isFollowing = status.data?.isFollowing;
  const pending = follow.isPending || unfollow.isPending || status.isLoading;

  const handleClick = () => {
    if (pending || !personId) return;
    if (isFollowing) {
      unfollow.mutate();
      return;
    }
    follow.mutate();
  };

  if (!personId) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={
        className ||
        'inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-[var(--color-bg-border)] hover:bg-[var(--token-surface-2)] disabled:opacity-60'
      }
    >
      {isFollowing ? <UserMinus size={15} /> : <UserPlus size={15} />}
      {pending ? 'Updating…' : isFollowing ? 'Unfollow' : 'Follow'}
      {status.data?._source === 'mock' && (
        <span className="text-[10px] text-amber-600 dark:text-amber-400">(mock)</span>
      )}
    </button>
  );
}

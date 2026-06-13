import React from 'react';
import { UserMinus, UserPlus } from 'lucide-react';
import { useCommunityJoin, useCommunityLeave, useCommunityMembership } from '../../hooks/queries/community';

export function CommunityJoinButton({ communityId, className = '' }) {
  const membership = useCommunityMembership(communityId);
  const join = useCommunityJoin(communityId);
  const leave = useCommunityLeave(communityId);

  const isMember = membership.data?.status === 'active';
  const pending = join.isPending || leave.isPending || membership.isLoading;

  const handleClick = () => {
    if (pending) return;
    if (isMember) {
      leave.mutate();
      return;
    }
    join.mutate();
  };

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
      {isMember ? <UserMinus size={15} /> : <UserPlus size={15} />}
      {pending ? 'Updating…' : isMember ? 'Leave community' : 'Join community'}
      {membership.data?._source === 'mock' && (
        <span className="text-[10px] text-amber-600 dark:text-amber-400">(mock)</span>
      )}
    </button>
  );
}

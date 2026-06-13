import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Crown, Loader2 } from 'lucide-react';
import { fetchCommunityMemberships, fetchMyMemberships } from '../../lib/membershipApi';
import { MembershipSubscribeCard } from './MembershipSubscribeCard';

export function CommunityMembershipPrograms({ communityId }) {
  const programsQuery = useQuery({
    queryKey: ['community-memberships', communityId],
    queryFn: () => fetchCommunityMemberships(communityId),
    enabled: Boolean(communityId),
  });

  const mySubsQuery = useQuery({
    queryKey: ['my-memberships'],
    queryFn: fetchMyMemberships,
  });

  const subscribedIds = new Set(
    (mySubsQuery.data?.items ?? [])
      .filter((s) => s.status === 'active')
      .map((s) => s.membershipId),
  );

  const programs = programsQuery.data?.items ?? [];
  const isMock = programsQuery.data?._source === 'mock';

  if (programsQuery.isLoading) {
    return (
      <section className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-5 flex items-center justify-center py-10">
        <Loader2 size={20} className="animate-spin text-[var(--color-text-muted)]" />
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Crown size={16} className="text-[var(--color-brand-primary)]" />
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Membership programs
            </h2>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            Paid tiers for superfans — track-only until Razorpay (Phase 10.3).
          </p>
        </div>
        {isMock && (
          <span className="text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-400 shrink-0">
            Sample
          </span>
        )}
      </div>

      {programs.length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)]">
          No membership programs yet. Community leaders can create one from the leader portal.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <MembershipSubscribeCard
              key={program.id}
              program={program}
              subscribed={subscribedIds.has(program.id)}
              onSubscribe={() => {
                mySubsQuery.refetch();
              }}
              onCancel={() => {
                mySubsQuery.refetch();
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default CommunityMembershipPrograms;

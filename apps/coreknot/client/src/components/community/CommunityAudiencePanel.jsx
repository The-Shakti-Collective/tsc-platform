import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, IndianRupee, TrendingUp, Users } from 'lucide-react';
import { fetchCommunityAudience } from '../../lib/audienceApi';
import { Spinner } from '../ui/Spinner';

function StatRow({ label, value, suffix = undefined }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-[var(--color-bg-border)] last:border-0">
      <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
      <span className="text-sm font-medium text-[var(--color-text-primary)]">
        {value?.toLocaleString?.() ?? value}
        {suffix && <span className="text-xs text-[var(--color-text-muted)] ml-1">{suffix}</span>}
      </span>
    </div>
  );
}

/**
 * Community audience snapshot panel — Phase 8 Step 5.
 */
export default function CommunityAudiencePanel({ communityId }) {
  const query = useQuery({
    queryKey: ['audience', 'community', communityId],
    queryFn: () => fetchCommunityAudience(communityId),
    enabled: !!communityId,
  });

  if (query.isLoading) {
    return (
      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 flex justify-center py-8">
        <Spinner size={24} />
      </section>
    );
  }

  const data = query.data;
  const isMock = data?._source === 'mock';

  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <Users size={16} />
            Audience intelligence
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Member growth, active fans, membership revenue stub, event conversion.
          </p>
        </div>
        {isMock && (
          <span className="text-xs text-amber-600 dark:text-amber-400">Sample data</span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--color-bg-border)] p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <TrendingUp size={14} />
            Growth & activity
          </div>
          <StatRow label="Member growth (30d)" value={data?.memberGrowth} suffix="%" />
          <StatRow label="Active members" value={data?.activeMembers} />
          <StatRow label="Fan growth" value={data?.fanGrowth} suffix="%" />
        </div>

        <div className="rounded-lg border border-[var(--color-bg-border)] p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <IndianRupee size={14} />
            Revenue & events
          </div>
          <StatRow
            label="Membership revenue stub"
            value={data?.membershipRevenueStub}
            suffix="INR"
          />
          <StatRow label="Event conversion" value={data?.eventConversion} suffix="%" />
          <StatRow
            label="Snapshot"
            value={
              data?.snapshotDate
                ? new Date(data.snapshotDate).toLocaleDateString()
                : '—'
            }
          />
        </div>
      </div>

      {data?.metrics?.totalMembers != null && (
        <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
          <CalendarCheck size={12} />
          {data.metrics.totalMembers.toLocaleString()} total members · rule-based aggregates
        </p>
      )}
    </section>
  );
}

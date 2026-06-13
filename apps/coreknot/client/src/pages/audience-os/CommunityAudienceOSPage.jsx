import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, Globe2, TrendingUp, Users, Wallet } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import { TSC_UNDERGROUND_ID } from '../../lib/communityApi';
import { fetchCommunityAudienceOsDashboard, formatCurrency } from '../../lib/audienceOsApi';

function MetricCard({ label, value, suffix = undefined, icon: Icon, accent }) {
  return (
    <div className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 space-y-2">
      <div className="flex items-center gap-2">
        {Icon && (
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
            style={{ backgroundColor: accent }}
          >
            <Icon size={15} />
          </div>
        )}
        <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-[var(--color-text-primary)]">
        {value?.toLocaleString?.() ?? value}
        {suffix && <span className="text-sm font-normal text-[var(--color-text-muted)] ml-1">{suffix}</span>}
      </p>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-5 space-y-3">
      <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h2>
      {children}
    </section>
  );
}

function ListRow({ primary, secondary, metric }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[var(--color-bg-border)] last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{primary}</p>
        {secondary && <p className="text-xs text-[var(--color-text-muted)] truncate">{secondary}</p>}
      </div>
      {metric && <span className="text-xs font-mono text-[var(--color-text-muted)] shrink-0">{metric}</span>}
    </div>
  );
}

export default function CommunityAudienceOSPage({ communityId: communityIdProp = undefined } = {}) {
  const { communityId: routeCommunityId } = useParams();
  const communityId = routeCommunityId ?? communityIdProp ?? TSC_UNDERGROUND_ID;

  const query = useQuery({
    queryKey: ['audience-os', 'community', communityId],
    queryFn: () => fetchCommunityAudienceOsDashboard(communityId),
    enabled: !!communityId,
  });

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={32} />
      </div>
    );
  }

  const data = query.data;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <Link
          to={`/operating/communities/${communityId}`}
          className="text-xs text-[var(--color-text-muted)] hover:underline"
        >
          ← Community dashboard
        </Link>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <Globe2 size={22} />
          Audience OS — {data?.name}
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
          Community leader view — members, growth, event conversion, contributors, and membership programs.
        </p>
        {data?._source === 'mock' && (
          <p className="text-xs text-amber-600 dark:text-amber-400">Sample TSC Underground audience data</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Active members"
          value={data?.activeMembers}
          icon={Users}
          accent="rgba(96, 165, 250, 0.16)"
        />
        <MetricCard
          label="Member growth"
          value={data?.memberGrowth}
          suffix="%"
          icon={TrendingUp}
          accent="rgba(52, 211, 153, 0.16)"
        />
        <MetricCard
          label="Membership revenue"
          value={formatCurrency(data?.membershipRevenueStub, 'INR')}
          icon={Wallet}
          accent="rgba(251, 191, 36, 0.16)"
        />
        <MetricCard
          label="Event conversion"
          value={data?.eventConversion}
          suffix="%"
          icon={CalendarCheck}
          accent="rgba(244, 114, 182, 0.16)"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Top contributors (30d)">
          {(data?.topContributors ?? []).length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)]">No contributor activity yet.</p>
          ) : (
            data.topContributors.map((row) => (
              <ListRow
                key={row.personId}
                primary={row.name}
                secondary={
                  row.lastActiveAt
                    ? `Last active ${new Date(row.lastActiveAt).toLocaleDateString()}`
                    : null
                }
                metric={`${row.activityCount30d} posts`}
              />
            ))
          )}
        </SectionCard>

        <SectionCard title="Membership programs">
          {(data?.membershipPrograms ?? []).length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)]">No membership programs configured.</p>
          ) : (
            data.membershipPrograms.map((program) => (
              <ListRow
                key={program.programId}
                primary={program.name}
                secondary={`${program.tier} · ${formatCurrency(program.price, program.currency)}/mo`}
                metric={`${program.activeSubscriptions} subs · ${formatCurrency(program.revenueStub, program.currency)}`}
              />
            ))
          )}
        </SectionCard>
      </div>

      <SectionCard title="Fan growth">
        <p className="text-sm text-[var(--color-text-muted)]">
          Fan growth rate: <strong>{data?.fanGrowth ?? '—'}%</strong> — from CommunityAudienceSnapshot (
          {data?.snapshotDate ? new Date(data.snapshotDate).toLocaleDateString() : 'latest'}).
        </p>
      </SectionCard>
    </div>
  );
}

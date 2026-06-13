import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Download,
  Globe2,
  Heart,
  MapPin,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import {
  downloadJsonExport,
  exportArtistAudienceOs,
  fetchArtistAudienceOsDashboard,
  formatCurrency,
} from '../../lib/audienceOsApi';

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

function SectionCard({ title, children, action = undefined }) {
  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h2>
        {action}
      </div>
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

export default function ArtistAudienceOSPage() {
  const { artistId } = useParams();

  const query = useQuery({
    queryKey: ['audience-os', 'artist', artistId],
    queryFn: () => fetchArtistAudienceOsDashboard(artistId),
    enabled: !!artistId,
  });

  const handleExport = async () => {
    const payload = await exportArtistAudienceOs(artistId);
    downloadJsonExport(payload, `audience-os-${artistId}-${Date.now()}.json`);
  };

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={32} />
      </div>
    );
  }

  const data = query.data;
  const currency = data?.revenue?.currency ?? 'INR';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <Link
          to={`/operating/artists/${artistId}/workspace`}
          className="text-xs text-[var(--color-text-muted)] hover:underline"
        >
          ← Artist workspace
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <Globe2 size={22} />
              Audience OS — {data?.name}
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] max-w-2xl mt-1">
              Unified fan insights: geography, superfans, revenue, retention, memberships, and commerce.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-md border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)]"
          >
            <Download size={14} />
            Export JSON
          </button>
        </div>
        {data?._source === 'mock' && (
          <p className="text-xs text-amber-600 dark:text-amber-400">Sample Ritviz audience data</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Audience growth"
          value={data?.growth?.audienceGrowth}
          suffix="%"
          icon={TrendingUp}
          accent="rgba(52, 211, 153, 0.16)"
        />
        <MetricCard
          label="Fan retention"
          value={data?.retention?.fanRetention}
          suffix="%"
          icon={Heart}
          accent="rgba(244, 114, 182, 0.16)"
        />
        <MetricCard
          label="Combined revenue"
          value={formatCurrency(data?.revenue?.combinedTotal, currency)}
          icon={Wallet}
          accent="rgba(251, 191, 36, 0.16)"
        />
        <MetricCard
          label="Membership MRR"
          value={formatCurrency(data?.membership?.mrrStub, data?.membership?.currency)}
          icon={Users}
          accent="rgba(96, 165, 250, 0.16)"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Audience map — top cities">
          {(data?.audienceMap ?? []).length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)]">No city data from fan profiles or events yet.</p>
          ) : (
            data.audienceMap.map((row) => (
              <ListRow
                key={row.city}
                primary={row.city}
                secondary={`${row.fanCount} fans · ${row.eventParticipationCount} event participations`}
                metric={row.densityScore.toFixed(1)}
              />
            ))
          )}
        </SectionCard>

        <SectionCard title="Top fans">
          {(data?.topFans ?? []).length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)]">No superfans or supporters yet.</p>
          ) : (
            data.topFans.map((fan) => (
              <ListRow
                key={fan.personId}
                primary={fan.displayName}
                secondary={[
                  fan.tier && `${fan.tier} tier`,
                  fan.source,
                  fan.totalSpent != null && formatCurrency(fan.totalSpent, currency),
                ]
                  .filter(Boolean)
                  .join(' · ')}
                metric={fan.score.toFixed(1)}
              />
            ))
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Revenue breakdown">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Support"
              value={formatCurrency(data?.revenue?.breakdown?.support, currency)}
              icon={Heart}
              accent="rgba(244, 114, 182, 0.12)"
            />
            <MetricCard
              label="Purchases"
              value={formatCurrency(data?.revenue?.breakdown?.purchases, currency)}
              icon={ShoppingBag}
              accent="rgba(52, 211, 153, 0.12)"
            />
            <MetricCard
              label="Deals"
              value={formatCurrency(data?.revenue?.breakdown?.deals, currency)}
              icon={BarChart3}
              accent="rgba(96, 165, 250, 0.12)"
            />
          </div>
        </SectionCard>

        <SectionCard title="Commerce breakdown">
          <ListRow
            primary="Tickets"
            secondary={`${data?.commerce?.tickets?.count ?? 0} purchases`}
            metric={formatCurrency(data?.commerce?.tickets?.revenue, data?.commerce?.currency)}
          />
          <ListRow
            primary="Merch"
            secondary={`${data?.commerce?.merch?.count ?? 0} purchases`}
            metric={formatCurrency(data?.commerce?.merch?.revenue, data?.commerce?.currency)}
          />
          <ListRow
            primary="Experiences"
            secondary={`${data?.commerce?.experiences?.count ?? 0} bookings`}
            metric={formatCurrency(data?.commerce?.experiences?.revenue, data?.commerce?.currency)}
          />
        </SectionCard>
      </div>

      <SectionCard title="Retention & conversion">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Churn" value={data?.retention?.audienceChurn} suffix="%" icon={MapPin} accent="rgba(239, 68, 68, 0.12)" />
          <MetricCard label="Conversion" value={data?.retention?.fanConversion} suffix="%" icon={TrendingUp} accent="rgba(52, 211, 153, 0.12)" />
          <MetricCard label="LTV stub" value={formatCurrency(data?.retention?.lifetimeValueStub, currency)} icon={Wallet} accent="rgba(251, 191, 36, 0.12)" />
          <MetricCard label="Active subs" value={data?.membership?.activeSubscriptions} icon={Users} accent="rgba(96, 165, 250, 0.12)" />
        </div>
      </SectionCard>
    </div>
  );
}

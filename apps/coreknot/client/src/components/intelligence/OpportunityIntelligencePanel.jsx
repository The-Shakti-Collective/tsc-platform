import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, Sparkles, Snowflake } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import { useOpportunityIntelligence } from '../../hooks/queries/intelligence';
import ArtistRecommendedOpportunitiesPanel from './ArtistRecommendedOpportunitiesPanel';

function formatCurrency(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function BucketSection({ title, icon: Icon, accent, iconColor, items, emptyLabel }) {
  return (
    <div className="rounded-lg border border-[var(--color-bg-border)] p-3 space-y-2 min-h-[100px]">
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center w-7 h-7 rounded-md shrink-0"
          style={{ backgroundColor: accent, color: iconColor }}
        >
          <Icon size={14} />
        </div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{title}</h3>
      </div>
      {(items ?? []).length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)]">{emptyLabel}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-2 text-xs">
              <span className="truncate text-[var(--color-text-primary)]">{item.title}</span>
              <span className="font-mono text-[var(--color-text-muted)] shrink-0">{formatCurrency(item.value)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function OpportunityIntelligencePanel({ compact = false, artistId = null }) {
  const { data, isLoading, isError } = useOpportunityIntelligence();

  if (isLoading) {
    return (
      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 flex justify-center py-8">
        <Spinner size={24} />
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-2">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Opportunity intelligence</h2>
        <p className="text-sm text-[var(--color-text-muted)]">Opportunity signals unavailable.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Opportunity intelligence</h2>
          {!compact && (
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Suggested matches and lead temperature buckets.</p>
          )}
        </div>
        <Link
          to="/operating/opportunities/marketplace"
          className="text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)]"
        >
          Marketplace →
        </Link>
      </div>

      {data._source === 'mock' && (
        <p className="text-xs text-amber-600 dark:text-amber-400">Sample opportunity intelligence.</p>
      )}

      {!compact && (data.suggested ?? []).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Suggested</h3>
          <ul className="divide-y divide-[var(--color-bg-border)] rounded-lg border border-[var(--color-bg-border)]">
            {data.suggested.map((opp) => (
              <li key={opp.id} className="px-4 py-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{opp.title}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{opp.artistName} · match {opp.matchScore}%</p>
                </div>
                <span className="text-xs font-mono text-[var(--color-text-muted)] shrink-0">{formatCurrency(opp.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <BucketSection
          title="Hot"
          icon={Flame}
          accent="rgba(244, 63, 94, 0.16)"
          iconColor="#fb7185"
          items={data.buckets?.hot}
          emptyLabel="No hot leads"
        />
        <BucketSection
          title="Warm"
          icon={Sparkles}
          accent="rgba(234, 179, 8, 0.16)"
          iconColor="#facc15"
          items={data.buckets?.warm}
          emptyLabel="No warm leads"
        />
        <BucketSection
          title="Cold"
          icon={Snowflake}
          accent="rgba(59, 130, 246, 0.18)"
          iconColor="#60a5fa"
          items={data.buckets?.cold}
          emptyLabel="No cold leads"
        />
      </div>

      {artistId && !compact && (
        <ArtistRecommendedOpportunitiesPanel artistId={artistId} compact />
      )}
    </section>
  );
}

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, IndianRupee } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import {
  DEAL_STATUS_LABELS,
  DEAL_STATUS_ORDER,
  groupDealsByStatus,
} from '../../lib/dealApi';
import { useDeals } from '../../hooks/queries/deal';

function formatCurrency(value, currency = 'INR') {
  if (value == null) return '—';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value}`;
  }
}

function DealCard({ deal }) {
  return (
    <Link
      to={`/deals/${deal.id}`}
      className="block rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-3 space-y-2 hover:border-[var(--color-brand-primary)]/50 transition-colors"
    >
      <p className="text-sm font-medium text-[var(--color-text-primary)] line-clamp-2">
        {deal.opportunityTitle}
      </p>
      <p className="text-xs text-[var(--color-text-muted)]">
        {deal.artistName ?? deal.artistId}
        {deal.brandName ? ` · ${deal.brandName}` : ''}
      </p>
      <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <span className="inline-flex items-center gap-1">
          <IndianRupee size={12} />
          {formatCurrency(deal.value, deal.currency)}
        </span>
        {deal.revenueCount > 0 && (
          <span>{deal.revenueCount} revenue entr{deal.revenueCount === 1 ? 'y' : 'ies'}</span>
        )}
      </div>
    </Link>
  );
}

export default function DealPipelinePage() {
  const { data, isLoading, isError, refetch } = useDeals();

  const stages = useMemo(
    () => groupDealsByStatus(data?.items ?? []),
    [data?.items],
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-sm text-[var(--color-text-muted)]">Could not load deal pipeline.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)]"
        >
          Retry
        </button>
      </div>
    );
  }

  const source = data?._source === 'mock' ? 'mock data' : 'live API';

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1400px] mx-auto">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Briefcase size={20} className="text-[var(--color-brand-primary)]" />
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Deal Pipeline</h1>
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          Application → Discussion → Negotiation → Agreement → Completed → Paid · {source}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        {stages.map((stage) => (
          <section
            key={stage.status}
            className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--token-surface-1)]/50 min-h-[200px]"
          >
            <div className="px-3 py-2 border-b border-[var(--color-bg-border)] flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                {DEAL_STATUS_LABELS[stage.status] ?? stage.status}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--token-surface-2)]">
                {stage.count}
              </span>
            </div>
            <div className="p-2 space-y-2 max-h-[420px] overflow-y-auto">
              {stage.items.length === 0 ? (
                <p className="text-[10px] text-center text-[var(--color-text-muted)] py-6">
                  No deals
                </p>
              ) : (
                stage.items.map((deal) => <DealCard key={deal.id} deal={deal} />)
              )}
            </div>
          </section>
        ))}
      </div>

      <p className="text-[10px] text-[var(--color-text-muted)]">
        Stages: {DEAL_STATUS_ORDER.map((s) => DEAL_STATUS_LABELS[s]).join(' → ')}
      </p>
    </div>
  );
}

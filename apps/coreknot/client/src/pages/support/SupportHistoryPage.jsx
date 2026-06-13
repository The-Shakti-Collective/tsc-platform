import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Heart } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import {
  fetchMySupportHistory,
  formatSupportAction,
} from '../../lib/supportApi';

function formatAmount(amount, currency = 'INR') {
  if (amount == null) return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function targetLabel(item) {
  const meta = item.metadata ?? {};
  if (item.targetType === 'Artist') {
    return meta.artistName ?? `Artist ${item.targetId}`;
  }
  if (item.targetType === 'Community') {
    return meta.communityName ?? meta.membershipName ?? `Community ${item.targetId}`;
  }
  return meta.eventTitle ?? `Event ${item.targetId}`;
}

/**
 * Fan support history — Phase 8 Step 6.
 * Route: /support/history (see INTEGRATION.patch.md)
 */
export default function SupportHistoryPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['support', 'history'],
    queryFn: () => fetchMySupportHistory(50),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  const items = data?.items ?? [];
  const isMock = data?._source === 'mock';

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4 md:p-6">
      <header className="flex items-center gap-3">
        <Link
          to="/passport"
          className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft size={14} />
          Back
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Heart size={20} className="text-[var(--color-brand-primary)]" />
            Support history
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Track-only support actions — no payment gateway (Phase 10.3)
          </p>
        </div>
        {isMock && (
          <span className="text-[10px] text-amber-600 dark:text-amber-400">Sample data</span>
        )}
      </header>

      {isError && !data && (
        <p className="text-sm text-red-400">Could not load support history.</p>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-bg-border)] p-8 text-center text-sm text-[var(--color-text-muted)]">
          No support actions recorded yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 flex items-start justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                  {targetLabel(item)}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {formatSupportAction(item.actionType)} · {item.targetType}
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)]">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {formatAmount(item.amount, item.currency ?? 'INR')}
                </p>
                <span
                  className={`text-[10px] capitalize px-2 py-0.5 rounded-full border ${
                    item.status === 'recorded'
                      ? 'border-emerald-500/30 text-emerald-500'
                      : 'border-amber-500/30 text-amber-500'
                  }`}
                >
                  {item.status.replace('_', ' ')}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[10px] text-center text-[var(--color-text-muted)]">
        {data?.total ?? items.length} total actions
      </p>
    </div>
  );
}

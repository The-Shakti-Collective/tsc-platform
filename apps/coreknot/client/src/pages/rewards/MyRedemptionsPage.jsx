import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, Gift, XCircle } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import {
  CATEGORY_LABELS,
  fetchMyRedemptions,
  formatCreditCost,
  STATUS_LABELS,
} from '../../lib/rewardsApi';

const STATUS_ICONS = {
  pending: Clock,
  fulfilled: CheckCircle,
  cancelled: XCircle,
};

const STATUS_COLORS = {
  pending: '#facc15',
  fulfilled: '#34d399',
  cancelled: '#94a3b8',
};

function RedemptionRow({ item }) {
  const Icon = STATUS_ICONS[item.status] ?? Clock;
  const color = STATUS_COLORS[item.status] ?? '#94a3b8';

  return (
    <article className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs text-[var(--color-text-muted)]">
            {CATEGORY_LABELS[item.reward?.category] ?? 'Reward'}
          </p>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            {item.reward?.name ?? item.rewardId}
          </h3>
        </div>
        <span
          className="inline-flex items-center gap-1 text-xs font-medium capitalize px-2 py-1 rounded-full border"
          style={{ borderColor: color, color }}
        >
          <Icon size={12} />
          {STATUS_LABELS[item.status] ?? item.status}
        </span>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-[var(--color-text-muted)]">
        <span>{formatCreditCost(item.creditCost)}</span>
        <span>Redeemed {new Date(item.redeemedAt).toLocaleDateString()}</span>
        {item.fulfilledAt && (
          <span>Fulfilled {new Date(item.fulfilledAt).toLocaleDateString()}</span>
        )}
      </div>

      {item.notes && (
        <p className="text-xs text-[var(--color-text-muted)] border-t border-[var(--color-bg-border)] pt-2">
          {item.notes}
        </p>
      )}
    </article>
  );
}

/**
 * My reward redemptions history.
 * Route: /rewards/redemptions (see INTEGRATION.patch.md)
 */
export default function MyRedemptionsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyRedemptions()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <header className="space-y-3">
        <Link
          to="/rewards"
          className="inline-flex items-center gap-1 text-xs text-[var(--color-brand-primary)]"
        >
          <ArrowLeft size={14} />
          Back to catalog
        </Link>
        <div className="flex items-center gap-2">
          <Gift size={20} className="text-[var(--color-brand-primary)]" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            My Redemptions
          </h1>
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">
          Track pending and fulfilled reward redemptions. Admin marks fulfilled via stub endpoint.
        </p>
      </header>

      {!data?.items?.length ? (
        <div className="rounded-xl border border-dashed border-[var(--color-bg-border)] p-12 text-center space-y-3">
          <p className="text-sm text-[var(--color-text-muted)]">No redemptions yet</p>
          <Link
            to="/rewards"
            className="inline-block text-sm text-[var(--color-brand-primary)]"
          >
            Browse rewards catalog
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {data.items.map((item) => (
            <RedemptionRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {data?._source === 'mock' && (
        <p className="text-xs text-[var(--color-text-muted)] text-center">
          Showing mock redemptions — connect API for live history
        </p>
      )}
    </div>
  );
}

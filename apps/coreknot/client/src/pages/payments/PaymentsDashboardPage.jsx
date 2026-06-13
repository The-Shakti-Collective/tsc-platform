import React from 'react';
import { IndianRupee, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import {
  fetchArtistPayouts,
  fetchPaymentsDashboard,
  fetchSettlements,
  INVOICE_STATUS_LABELS,
} from '../../lib/paymentsApi';
import { useQuery } from '@tanstack/react-query';

function formatCurrency(amount, currency = 'INR') {
  if (amount == null) return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

function MetricCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">{label}</p>
        {Icon && (
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ backgroundColor: accent, color: 'var(--color-brand-primary)' }}
          >
            <Icon size={16} />
          </div>
        )}
      </div>
      <p className="text-xl font-semibold text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}

export default function PaymentsDashboardPage() {
  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['payments', 'dashboard'],
    queryFn: fetchPaymentsDashboard,
  });

  const { data: settlements, isLoading: settleLoading } = useQuery({
    queryKey: ['payments', 'settlements'],
    queryFn: () => fetchSettlements(),
  });

  const { data: payouts } = useQuery({
    queryKey: ['payments', 'payouts', 'demo-artist'],
    queryFn: () => fetchArtistPayouts('demo-artist'),
  });

  if (dashLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const currency = dashboard?.currency ?? 'INR';

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <Wallet size={20} />
          Payments Dashboard
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Revenue rail — expected, received, pending (Phase 7 + 10.3 stub)
          {dashboard?._source === 'mock' && (
            <span className="ml-2 text-[10px] uppercase text-amber-600">Mock data</span>
          )}
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Expected"
          value={formatCurrency(dashboard?.expected, currency)}
          icon={TrendingUp}
          accent="rgba(34,197,94,0.12)"
        />
        <MetricCard
          label="Received"
          value={formatCurrency(dashboard?.received, currency)}
          icon={IndianRupee}
          accent="rgba(59,130,246,0.12)"
        />
        <MetricCard
          label="Pending"
          value={formatCurrency(dashboard?.pending, currency)}
          icon={TrendingDown}
          accent="rgba(234,179,8,0.12)"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 space-y-3">
          <h2 className="text-sm font-semibold">Invoice pipeline</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(dashboard?.invoiceCounts ?? {}).map(([key, count]) => (
              <div
                key={key}
                className="flex justify-between py-1 border-b border-[var(--color-bg-border)] last:border-0"
              >
                <span className="text-[var(--color-text-muted)]">
                  {INVOICE_STATUS_LABELS[key] ?? key}
                </span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 space-y-3">
          <h2 className="text-sm font-semibold">Escrow & payouts</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Escrow holding</span>
              <span className="font-medium">
                {formatCurrency(dashboard?.escrowHolding, currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Payouts scheduled</span>
              <span className="font-medium">
                {formatCurrency(dashboard?.payoutsScheduled, currency)}
              </span>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 space-y-3">
        <h2 className="text-sm font-semibold">Settlements (admin rollup)</h2>
        {settleLoading ? (
          <Spinner size={16} />
        ) : (
          <div className="space-y-2">
            {(settlements?.items ?? []).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between py-2 border-b border-[var(--color-bg-border)] last:border-0 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {new Date(s.periodStart).toLocaleDateString('en-IN')} –{' '}
                    {new Date(s.periodEnd).toLocaleDateString('en-IN')}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {s.payoutIds.length} payouts · {s.status}
                  </p>
                </div>
                <span className="font-medium">{formatCurrency(s.totalAmount, s.currency)}</span>
              </div>
            ))}
            {(settlements?.items ?? []).length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)]">No settlements yet.</p>
            )}
          </div>
        )}
      </section>

      {payouts?.items?.length > 0 && (
        <section className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 space-y-3">
          <h2 className="text-sm font-semibold">Recent artist payouts</h2>
          {payouts.items.map((p) => (
            <div
              key={p.id}
              className="flex justify-between text-sm py-1 border-b border-[var(--color-bg-border)] last:border-0"
            >
              <span className="text-[var(--color-text-muted)]">{p.status}</span>
              <span className="font-medium">{formatCurrency(p.amount, p.currency)}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

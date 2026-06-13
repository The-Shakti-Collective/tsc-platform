import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, IndianRupee } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import {
  DEAL_STATUS_LABELS,
  DEAL_STATUS_ORDER,
  REVENUE_TYPE_LABELS,
} from '../../lib/dealApi';
import {
  useAdvanceDealStatus,
  useDeal,
  useDealRevenue,
  useRecordDealRevenue,
  useUpdateDeal,
} from '../../hooks/queries/deal';

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

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function DealDetailPage() {
  const { dealId } = useParams();
  const { data: deal, isLoading, isError } = useDeal(dealId);
  const { data: revenue } = useDealRevenue(dealId);
  const advance = useAdvanceDealStatus(dealId);
  const updateDeal = useUpdateDeal(dealId);
  const recordRevenue = useRecordDealRevenue(dealId);

  const [notes, setNotes] = useState('');
  const [revAmount, setRevAmount] = useState('');
  const [revType, setRevType] = useState('expected');
  const [revNotes, setRevNotes] = useState('');

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (isError || !deal) {
    return (
      <div className="p-6 text-center text-sm text-[var(--color-text-muted)]">
        Deal not found.{' '}
        <Link to="/deals" className="text-[var(--color-brand-primary)]">
          Back to pipeline
        </Link>
      </div>
    );
  }

  const statusIndex = DEAL_STATUS_ORDER.indexOf(deal.status);
  const nextStatus = DEAL_STATUS_ORDER[statusIndex + 1];
  const isTerminal = deal.status === 'paid';

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-3xl mx-auto">
      <Link
        to="/deals"
        className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-brand-primary)]"
      >
        <ArrowLeft size={14} />
        Deal pipeline
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)]">
            {DEAL_STATUS_LABELS[deal.status] ?? deal.status}
          </span>
          {deal._source === 'mock' && (
            <span className="text-[10px] text-[var(--color-text-muted)]">mock</span>
          )}
        </div>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
          {deal.opportunityTitle}
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          {deal.artistName} · {deal.brandName ?? 'No brand'}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-[var(--color-bg-border)] p-3">
          <p className="text-[10px] uppercase text-[var(--color-text-muted)]">Value</p>
          <p className="font-medium inline-flex items-center gap-1">
            <IndianRupee size={14} />
            {formatCurrency(deal.value, deal.currency)}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--color-bg-border)] p-3">
          <p className="text-[10px] uppercase text-[var(--color-text-muted)]">Timeline</p>
          <p className="text-xs">
            {formatDate(deal.startDate)} → {formatDate(deal.endDate)}
          </p>
        </div>
      </section>

      {!isTerminal && (
        <section className="rounded-xl border border-[var(--color-bg-border)] p-4 space-y-3">
          <h2 className="text-sm font-semibold">Advance stage</h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            Current: <strong>{DEAL_STATUS_LABELS[deal.status]}</strong>
            {nextStatus && (
              <>
                {' '}
                → Next: <strong>{DEAL_STATUS_LABELS[nextStatus]}</strong>
              </>
            )}
          </p>
          <button
            type="button"
            disabled={advance.isPending || !nextStatus}
            onClick={() => advance.mutate()}
            className="inline-flex items-center gap-1 text-xs px-3 py-2 rounded-md bg-[var(--color-brand-primary)] text-white disabled:opacity-50"
          >
            Advance to {nextStatus ? DEAL_STATUS_LABELS[nextStatus] : '—'}
            <ChevronRight size={14} />
          </button>
        </section>
      )}

      <section className="rounded-xl border border-[var(--color-bg-border)] p-4 space-y-3">
        <h2 className="text-sm font-semibold">Negotiation notes</h2>
        <textarea
          className="w-full text-sm rounded-md border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-2 min-h-[80px]"
          value={notes || deal.negotiationNotes || ''}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Terms, deliverables, contacts…"
        />
        <button
          type="button"
          disabled={updateDeal.isPending}
          onClick={() => updateDeal.mutate({ negotiationNotes: notes || deal.negotiationNotes })}
          className="text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)]"
        >
          Save notes
        </button>
      </section>

      <section className="rounded-xl border border-[var(--color-bg-border)] p-4 space-y-4">
        <h2 className="text-sm font-semibold">Revenue tracking</h2>
        <p className="text-[10px] text-[var(--color-text-muted)]">
          Track only — no payment gateway (Month 4+)
        </p>

        {revenue?.totals && (
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {(['expected', 'received', 'pending']).map((type) => (
              <div key={type} className="rounded-lg bg-[var(--token-surface-2)] p-2">
                <p className="text-[10px] uppercase text-[var(--color-text-muted)]">
                  {REVENUE_TYPE_LABELS[type]}
                </p>
                <p className="font-medium">{formatCurrency(revenue.totals[type])}</p>
              </div>
            ))}
          </div>
        )}

        <ul className="space-y-2">
          {(revenue?.items ?? []).map((row) => (
            <li
              key={row.id}
              className="flex justify-between text-xs border-b border-[var(--color-bg-border)] pb-2"
            >
              <span>
                {REVENUE_TYPE_LABELS[row.type]} · {formatDate(row.recordedAt)}
                {row.notes ? ` — ${row.notes}` : ''}
              </span>
              <span className="font-medium">{formatCurrency(row.amount)}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-2 items-end">
          <label className="text-xs space-y-1">
            Amount
            <input
              type="number"
              min="1"
              value={revAmount}
              onChange={(e) => setRevAmount(e.target.value)}
              className="block w-28 rounded-md border border-[var(--color-bg-border)] px-2 py-1 text-sm"
            />
          </label>
          <label className="text-xs space-y-1">
            Type
            <select
              value={revType}
              onChange={(e) => setRevType(e.target.value)}
              className="block rounded-md border border-[var(--color-bg-border)] px-2 py-1 text-sm"
            >
              <option value="expected">Expected</option>
              <option value="received">Received</option>
              <option value="pending">Pending</option>
            </select>
          </label>
          <label className="text-xs space-y-1 flex-1 min-w-[140px]">
            Notes
            <input
              value={revNotes}
              onChange={(e) => setRevNotes(e.target.value)}
              className="block w-full rounded-md border border-[var(--color-bg-border)] px-2 py-1 text-sm"
            />
          </label>
          <button
            type="button"
            disabled={recordRevenue.isPending || !revAmount}
            onClick={() =>
              recordRevenue.mutate({
                amount: Number(revAmount),
                type: revType,
                notes: revNotes || undefined,
              })
            }
            className="text-xs px-3 py-2 rounded-md bg-[var(--color-brand-primary)] text-white disabled:opacity-50"
          >
            Record
          </button>
        </div>
      </section>

      {deal.paidAt && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">
          Paid {formatDate(deal.paidAt)}
        </p>
      )}
    </div>
  );
}

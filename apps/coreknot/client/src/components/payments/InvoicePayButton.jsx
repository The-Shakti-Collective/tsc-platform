import React, { useState } from 'react';
import { CreditCard, CheckCircle2 } from 'lucide-react';
import {
  collectInvoice,
  INVOICE_STATUS_LABELS,
  markInvoicePaid,
} from '../../lib/paymentsApi';

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

/**
 * Stub pay button for contract/deal detail views.
 * Props: invoiceId (required), amount, currency, status, dealId, onPaid
 */
export default function InvoicePayButton({
  invoiceId,
  amount,
  currency = 'INR',
  status = 'draft',
  dealId,
  onPaid = undefined,
  compact = false,
}) {
  const [loading, setLoading] = useState(null);
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [localStatus, setLocalStatus] = useState(status);

  if (!invoiceId) return null;

  if (localStatus === 'paid') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600">
        <CheckCircle2 size={14} />
        Paid
      </span>
    );
  }

  if (localStatus === 'cancelled') {
    return (
      <span className="text-xs text-[var(--color-text-muted)]">
        {INVOICE_STATUS_LABELS.cancelled}
      </span>
    );
  }

  async function handleCollect() {
    setLoading('collect');
    try {
      const result = await collectInvoice(invoiceId, { provider: 'razorpay', amount });
      setCheckoutUrl(result.checkoutUrl);
      setLocalStatus('sent');
    } finally {
      setLoading(null);
    }
  }

  async function handleMarkPaid() {
    setLoading('paid');
    try {
      const result = await markInvoicePaid(invoiceId, { provider: 'manual', dealId });
      setLocalStatus('paid');
      onPaid?.(result);
    } finally {
      setLoading(null);
    }
  }

  const btnClass = compact
    ? 'text-[10px] px-2 py-1 rounded'
    : 'text-xs px-3 py-1.5 rounded-md';

  return (
    <div className="flex flex-col gap-1.5">
      {amount != null && (
        <p className="text-xs text-[var(--color-text-muted)]">
          Invoice: {formatCurrency(amount, currency)}
          {' · '}
          {INVOICE_STATUS_LABELS[localStatus] ?? localStatus}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!!loading}
          onClick={handleCollect}
          className={`inline-flex items-center gap-1 ${btnClass} bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] disabled:opacity-50`}
        >
          <CreditCard size={compact ? 12 : 14} />
          {loading === 'collect' ? 'Starting…' : 'Pay (stub)'}
        </button>
        <button
          type="button"
          disabled={!!loading}
          onClick={handleMarkPaid}
          className={`inline-flex items-center gap-1 ${btnClass} border border-[var(--color-bg-border)] text-[var(--color-text-muted)] disabled:opacity-50`}
        >
          {loading === 'paid' ? 'Recording…' : 'Mark paid'}
        </button>
      </div>
      {checkoutUrl && (
        <a
          href={checkoutUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-[var(--color-brand-primary)] underline"
        >
          Open checkout stub
        </a>
      )}
    </div>
  );
}

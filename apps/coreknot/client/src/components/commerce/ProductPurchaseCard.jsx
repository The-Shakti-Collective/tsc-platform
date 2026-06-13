import React, { useState } from 'react';
import { Check, Loader2, Sparkles, Ticket } from 'lucide-react';
import { formatPrice, PRODUCT_TYPE_LABELS } from '../../lib/commerceApi';

export function ProductPurchaseCard({
  product,
  productKind = 'ticket',
  onPurchase = undefined,
  purchaseFn,
  compact = false,
}) {
  const [loading, setLoading] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [creditsEarned, setCreditsEarned] = useState(null);
  const [error, setError] = useState(null);

  const typeLabel =
    PRODUCT_TYPE_LABELS[product.type] ??
    PRODUCT_TYPE_LABELS[productKind] ??
    productKind;
  const available =
    product.available ??
    (product.quantity != null
      ? product.quantity - (product.soldCount ?? 0)
      : product.slots != null
        ? product.slots - (product.bookedCount ?? 0)
        : null);
  const outOfStock = available != null && available <= 0;
  const unavailable = product.status !== 'active' || outOfStock;

  async function handlePurchase() {
    setLoading(true);
    setError(null);
    try {
      const result = purchaseFn
        ? await purchaseFn(product.id)
        : await onPurchase?.(product);
      setPurchased(true);
      if (result?.creditsEarned) setCreditsEarned(result.creditsEarned);
    } catch (err) {
      const msg =
        err?.response?.data?.message ?? err?.message ?? 'Purchase failed';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <article
      className={`rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] ${
        compact ? 'p-4 space-y-3' : 'p-5 space-y-4'
      } flex flex-col`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs text-[var(--color-text-muted)]">{typeLabel}</p>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
            {product.name}
          </h3>
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">
            {formatPrice(product.price, product.currency)}
          </p>
        </div>
        <div className="h-9 w-9 rounded-lg bg-[var(--token-surface-2)] border border-[var(--color-bg-border)] flex items-center justify-center shrink-0">
          <Ticket size={16} className="text-[var(--color-brand-primary)]" />
        </div>
      </div>

      {available != null && (
        <p className="text-xs text-[var(--color-text-muted)]">
          {outOfStock ? 'Sold out' : `${available} left`}
        </p>
      )}

      {error && (
        <p className="text-xs text-red-400" role="alert">{error}</p>
      )}

      {purchased ? (
        <div className="flex items-center gap-2 text-sm text-emerald-400">
          <Check size={16} />
          <span>Recorded — track-only (no checkout)</span>
          {creditsEarned && (
            <span className="flex items-center gap-1 text-[var(--color-brand-primary)]">
              <Sparkles size={14} />
              +{creditsEarned} credits
            </span>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={loading || unavailable}
          onClick={handlePurchase}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-brand-primary)] text-white text-sm font-medium py-2.5 px-4 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Recording…
            </>
          ) : unavailable ? (
            'Unavailable'
          ) : (
            'Record purchase'
          )}
        </button>
      )}
    </article>
  );
}

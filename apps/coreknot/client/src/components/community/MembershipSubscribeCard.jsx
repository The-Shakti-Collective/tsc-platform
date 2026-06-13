import React, { useState } from 'react';
import { Check, Crown, Loader2, Sparkles } from 'lucide-react';
import {
  BENEFIT_LABELS,
  cancelMembership,
  formatMembershipPrice,
  subscribeMembership,
} from '../../lib/membershipApi';

const TIER_STYLES = {
  standard: { bg: 'rgba(148, 163, 184, 0.16)', color: '#94a3b8', label: 'Standard' },
  plus: { bg: 'rgba(96, 165, 250, 0.16)', color: '#60a5fa', label: 'Plus' },
  premium: { bg: 'rgba(168, 85, 247, 0.16)', color: '#a855f7', label: 'Premium' },
  circle: { bg: 'rgba(244, 114, 182, 0.16)', color: '#f472b6', label: 'Circle' },
  collective: { bg: 'rgba(52, 211, 153, 0.16)', color: '#34d399', label: 'Collective' },
};

export function MembershipSubscribeCard({
  program,
  subscribed = false,
  onSubscribe,
  onCancel,
  compact = false,
}) {
  const [loading, setLoading] = useState(false);
  const [localSubscribed, setLocalSubscribed] = useState(subscribed);
  const [creditsEarned, setCreditsEarned] = useState(null);

  const tierStyle = TIER_STYLES[program.tier] ?? TIER_STYLES.standard;

  async function handleSubscribe() {
    setLoading(true);
    try {
      const result = await subscribeMembership(program.id);
      setLocalSubscribed(true);
      if (result.creditsEarned) setCreditsEarned(result.creditsEarned);
      onSubscribe?.(result);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    setLoading(true);
    try {
      await cancelMembership(program.id);
      setLocalSubscribed(false);
      setCreditsEarned(null);
      onCancel?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <article
      className={`rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] ${
        compact ? 'p-4 space-y-3' : 'p-5 space-y-4'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
              {program.name}
            </h3>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full"
              style={{ backgroundColor: tierStyle.bg, color: tierStyle.color }}
            >
              <Crown size={10} />
              {tierStyle.label}
            </span>
          </div>
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">
            {formatMembershipPrice(program.price, program.currency)}
            <span className="text-xs font-normal text-[var(--color-text-muted)] ml-1">/ month</span>
          </p>
        </div>
        {!program.isActive && (
          <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] shrink-0">
            Inactive
          </span>
        )}
      </div>

      {(program.benefits ?? []).length > 0 && (
        <ul className="space-y-1.5">
          {program.benefits.map((benefit) => (
            <li key={benefit} className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              <Check size={12} className="text-emerald-500 shrink-0" />
              {BENEFIT_LABELS[benefit] ?? benefit}
            </li>
          ))}
        </ul>
      )}

      {creditsEarned != null && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <Sparkles size={12} />
          +{creditsEarned} ecosystem credits earned
        </p>
      )}

      <p className="text-[10px] text-[var(--color-text-muted)]">
        Track-only subscription — no payment gateway (Phase 10.3).
      </p>

      {program.isActive && (
        localSubscribed ? (
          <button
            type="button"
            disabled={loading}
            onClick={handleCancel}
            className="w-full text-sm px-4 py-2 rounded-lg border border-[var(--color-bg-border)] text-[var(--color-text-muted)] hover:bg-[var(--token-surface-2)] disabled:opacity-60"
          >
            {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Cancel subscription'}
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={handleSubscribe}
            className="w-full text-sm px-4 py-2 rounded-lg bg-[var(--color-brand-primary)] text-white hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>
                <Sparkles size={14} />
                Subscribe
              </>
            )}
          </button>
        )
      )}
    </article>
  );
}

export default MembershipSubscribeCard;

import React from 'react';
import { BadgeCheck, Shield, ShieldCheck, Star } from 'lucide-react';

const BADGE_META = {
  verified_brand_partner: {
    label: 'Verified Brand Partner',
    icon: ShieldCheck,
    className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  },
  verified_artist: {
    label: 'Verified Artist',
    icon: BadgeCheck,
    className: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  },
  high_trust: {
    label: 'High trust',
    icon: Star,
    className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  },
  trusted: {
    label: 'Trusted',
    icon: Shield,
    className: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  },
};

function scoreTone(score) {
  if (score == null) return 'text-[var(--color-text-muted)]';
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

/**
 * Trust badge for passport, brand pages, marketplace listings.
 * badges: verified_brand_partner | verified_artist | high_trust | trusted
 */
export default function TrustBadge({
  trustScore = null,
  badges = [],
  compact = false,
  showScore = true,
  className = '',
}) {
  const primaryBadge = badges.find((b) => BADGE_META[b]);
  const meta = primaryBadge ? BADGE_META[primaryBadge] : null;
  const Icon = meta?.icon ?? Shield;

  return (
    <div className={`inline-flex flex-wrap items-center gap-2 ${className}`}>
      {showScore && (
        <span className="text-xs text-[var(--color-text-muted)]">
          Trust{' '}
          <strong className={scoreTone(trustScore)}>
            {trustScore != null ? Math.round(trustScore) : '—'}
          </strong>
        </span>
      )}
      {meta && (
        <span
          className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${meta.className}`}
          title={meta.label}
        >
          <Icon size={compact ? 10 : 12} />
          {!compact && meta.label}
        </span>
      )}
    </div>
  );
}

export { BADGE_META, scoreTone as trustScoreTone };

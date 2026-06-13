import React, { useMemo, useState } from 'react';
import { BadgeCheck, Check, Copy, Link2 } from 'lucide-react';
import { copyTscIdentityUrl } from '../../lib/identityNetworkApi';

const BADGE_STYLES = {
  verified_artist: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  verified_community: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  verified_venue: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
  verified_brand_partner: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
};

/**
 * Verified industry badges + permanent TSC identity URL (artist.tsc/slug).
 */
export function IdentityBadgeBar({
  badges = [],
  canonicalUrl = undefined,
  handle = undefined,
  personId = undefined,
  compact = false,
  className = '',
}) {
  const [copied, setCopied] = useState(false);
  const visibleBadges = useMemo(
    () => badges.filter((entry) => entry?.label),
    [badges],
  );

  if (!visibleBadges.length && !canonicalUrl && !handle) {
    return null;
  }

  const onCopy = async () => {
    const url = canonicalUrl || (handle ? `https://tsc.in/${handle}` : '');
    if (!url) return;
    await copyTscIdentityUrl(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${compact ? 'text-xs' : 'text-sm'} ${className}`}
    >
      {visibleBadges.map((entry) => (
        <span
          key={entry.badge}
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium ${
            BADGE_STYLES[entry.badge] ?? 'border-[var(--color-bg-border)] text-[var(--color-text-muted)]'
          }`}
          title={entry.source ? `Source: ${entry.source}` : entry.label}
        >
          <BadgeCheck size={compact ? 12 : 14} />
          {entry.label}
        </span>
      ))}

      {(canonicalUrl || handle) && (
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-bg-border)] px-2.5 py-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-brand-primary)]/40 transition-colors"
          title="Copy permanent TSC identity URL"
        >
          {copied ? <Check size={compact ? 12 : 14} /> : <Copy size={compact ? 12 : 14} />}
          <Link2 size={compact ? 12 : 14} />
          <span className="font-mono truncate max-w-[220px]">
            {handle || canonicalUrl?.replace(/^https?:\/\/[^/]+\//, '')}
          </span>
        </button>
      )}
    </div>
  );
}

export default IdentityBadgeBar;

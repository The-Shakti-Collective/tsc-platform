import React from 'react';
import { Link } from 'react-router-dom';
import { Share2 } from 'lucide-react';
import TrustBadge, { trustScoreTone } from '../trust/TrustBadge';

/**
 * Compact passport card for marketplace listings and directory grids.
 * Shareable URL: /passport/:slug or /a/:slug
 */
export default function PassportCard({
  slug,
  displayName,
  headline,
  photoUrl,
  ecosystemScore,
  healthScore,
  trustScore,
  trustBadges = [],
  shareUrl,
  source,
  className = '',
}) {
  const passportHref = slug ? `/passport/${slug}` : '#';
  const shortHref = slug ? `/a/${slug}` : '#';

  return (
    <article
      className={`rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 flex gap-4 ${className}`}
    >
      <div className="shrink-0">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt=""
            className="h-16 w-16 rounded-full object-cover border border-[var(--color-bg-border)]"
          />
        ) : (
          <div className="h-16 w-16 rounded-full border border-[var(--color-bg-border)] bg-[var(--token-surface-2)] flex items-center justify-center text-lg font-semibold text-[var(--color-text-muted)]">
            {(displayName || slug || '?').slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                {displayName || slug}
              </h3>
              <TrustBadge trustScore={trustScore} badges={trustBadges} compact showScore={false} />
            </div>
            {headline && (
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-2">{headline}</p>
            )}
          </div>
          {source === 'mock' && (
            <span className="text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-400">
              Sample
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-[var(--color-text-muted)]">
            Ecosystem{' '}
            <strong className={trustScoreTone(ecosystemScore)}>
              {ecosystemScore != null ? ecosystemScore : '—'}
            </strong>
          </span>
          {healthScore != null && (
            <span className="text-[var(--color-text-muted)]">
              Health <strong className={trustScoreTone(healthScore)}>{healthScore}</strong>
            </span>
          )}
          {(trustScore != null || trustBadges.length > 0) && (
            <TrustBadge trustScore={trustScore} badges={trustBadges} compact />
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            to={passportHref}
            className="text-xs font-medium text-[var(--color-brand-primary)] hover:underline"
          >
            View passport
          </Link>
          <Link
            to={shortHref}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            /a/{slug}
          </Link>
          {shareUrl && (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              onClick={() => navigator.clipboard?.writeText(shareUrl)}
            >
              <Share2 size={12} />
              Copy link
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

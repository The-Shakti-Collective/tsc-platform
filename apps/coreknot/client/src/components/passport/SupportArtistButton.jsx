import React, { useState } from 'react';
import { Heart, Loader2, Sparkles } from 'lucide-react';
import { recordArtistSupport } from '../../lib/supportApi';

/**
 * Track-only support action for an artist — Phase 8 Step 6.
 */
export function SupportArtistButton({
  artistId,
  artistName,
  className = '',
  compact = false,
  onSupported = undefined,
}) {
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);
  const [creditsEarned, setCreditsEarned] = useState(null);

  if (!artistId) return null;

  async function handleSupport() {
    setLoading(true);
    try {
      const result = await recordArtistSupport(artistId, {
        actionType: 'general_support',
        metadata: artistName ? { artistName } : {},
      });
      setSupported(true);
      if (result.creditsEarned) setCreditsEarned(result.creditsEarned);
      onSupported?.(result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`inline-flex flex-col items-end gap-1 ${className}`}>
      <button
        type="button"
        disabled={loading || supported}
        onClick={handleSupport}
        className={`inline-flex items-center gap-1.5 rounded-lg border transition-colors ${
          compact ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2'
        } ${
          supported
            ? 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10'
            : 'border-[var(--color-bg-border)] text-[var(--color-text-primary)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)]'
        }`}
      >
        {loading ? (
          <Loader2 size={compact ? 14 : 16} className="animate-spin" />
        ) : (
          <Heart size={compact ? 14 : 16} className={supported ? 'fill-current' : ''} />
        )}
        {supported ? 'Supported' : 'Support artist'}
      </button>
      {creditsEarned != null && creditsEarned > 0 && (
        <span className="text-[10px] text-emerald-500 flex items-center gap-1">
          <Sparkles size={10} />
          +{creditsEarned} credits
        </span>
      )}
    </div>
  );
}

import React from 'react';
import { Crown, Gem, Medal, Sparkles, Star } from 'lucide-react';

const TIER_STYLES = {
  bronze: {
    label: 'Bronze',
    icon: Medal,
    bg: 'bg-amber-700/15 border-amber-700/30 text-amber-700 dark:text-amber-400',
  },
  silver: {
    label: 'Silver',
    icon: Star,
    bg: 'bg-slate-400/15 border-slate-400/30 text-slate-600 dark:text-slate-300',
  },
  gold: {
    label: 'Gold',
    icon: Sparkles,
    bg: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-700 dark:text-yellow-400',
  },
  platinum: {
    label: 'Platinum',
    icon: Gem,
    bg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-700 dark:text-cyan-300',
  },
  legend: {
    label: 'Legend',
    icon: Crown,
    bg: 'bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300',
  },
};

/**
 * Superfan tier badge — Phase 8 Step 2.
 */
export function SuperfanBadge({ tier, score = undefined, compact = false, className = '' }) {
  if (!tier) return null;

  const style = TIER_STYLES[tier] ?? TIER_STYLES.bronze;
  const Icon = style.icon;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${style.bg} ${className}`}
      >
        <Icon size={10} />
        {style.label}
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 ${style.bg} ${className}`}
    >
      <Icon size={16} />
      <div>
        <p className="text-[10px] uppercase tracking-wide opacity-80">Superfan</p>
        <p className="text-sm font-semibold leading-tight">
          {style.label}
          {score != null ? (
            <span className="font-normal opacity-80"> · {Math.round(score)}</span>
          ) : null}
        </p>
      </div>
    </div>
  );
}

export default SuperfanBadge;

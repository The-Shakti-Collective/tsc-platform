import React from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { useApplyToOpportunity } from '../../hooks/queries/opportunity';
import { formatAgentRecommendationCurrency } from '../../lib/agentsApi';

function confidenceLabel(confidence) {
  if (confidence == null) return '—';
  const pct = confidence <= 1 ? Math.round(confidence * 100) : Math.round(confidence);
  return `${pct}% confidence`;
}

export default function AgentRecommendationCard({ item, artistId, compact = false }) {
  const applyMutation = useApplyToOpportunity();
  const queryClient = useQueryClient();
  const opportunityId = item.metadata?.opportunityId;
  const canApply = Boolean(opportunityId) && item.status === 'active';

  const handleApply = () => {
    if (!opportunityId) return;
    applyMutation.mutate(
      { id: opportunityId, body: { artistId, notes: 'Applied via agent recommendation' } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['agents', 'recommendations', artistId] });
        },
      },
    );
  };

  return (
    <li className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {!compact && (
            <Sparkles size={14} className="text-[var(--color-brand-primary)] shrink-0" />
          )}
          {opportunityId ? (
            <Link
              to={`/operating/opportunities/marketplace/${opportunityId}`}
              className="text-sm font-medium text-[var(--color-brand-primary)] hover:underline truncate"
            >
              {item.title}
            </Link>
          ) : (
            <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
              {item.title}
            </span>
          )}
        </div>
        {!compact && item.rationale && (
          <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">{item.rationale}</p>
        )}
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          {item.metadata?.listingType ?? 'listing'} · {item.metadata?.city ?? 'Any city'} ·{' '}
          {formatAgentRecommendationCurrency(item.metadata?.budget)}
        </p>
        <div className="flex flex-wrap gap-1 mt-1">
          {(item.metadata?.reasonCodes ?? []).slice(0, 3).map((code) => (
            <span
              key={code}
              className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--token-surface-2)] text-[var(--color-text-muted)]"
            >
              {String(code).replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs shrink-0">
        <span>
          Score <strong>{Math.round(item.score ?? 0)}</strong>
        </span>
        <span className="text-[var(--color-text-muted)]">{confidenceLabel(item.confidence)}</span>
        {canApply && (
          <button
            type="button"
            disabled={applyMutation.isPending}
            onClick={handleApply}
            className="px-3 py-1.5 rounded-md bg-[var(--color-brand-primary)] text-white text-xs font-medium disabled:opacity-50"
          >
            {applyMutation.isPending ? 'Applying…' : 'Apply'}
          </button>
        )}
      </div>
    </li>
  );
}

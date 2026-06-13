import React from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, X } from 'lucide-react';
import { useApplyToOpportunity } from '../../hooks/queries/opportunity';
import {
  CAREER_ACTION_TYPE_LABELS,
  careerActionPriorityClass,
  dismissCareerAction,
  formatCareerConfidence,
} from '../../lib/careerApi';

function actionNavigateTarget(item) {
  const type = item.metadata?.suggestedActionType;
  const meta = item.metadata ?? {};

  switch (type) {
    case 'play_city':
      return meta.city
        ? { label: 'Explore city intel', to: `/operating/intelligence/cities/${encodeURIComponent(meta.city)}` }
        : null;
    case 'collaborate':
      if (meta.collaborationId) {
        return { label: 'View request', to: `/collaborations/${meta.collaborationId}` };
      }
      if (meta.collaboratorArtistId) {
        return {
          label: 'Find collab',
          to: `/collaborations?artist=${encodeURIComponent(meta.collaboratorArtistId)}`,
        };
      }
      return { label: 'Browse collabs', to: '/collaborations' };
    case 'apply_opportunity':
      if (meta.opportunityId) {
        return {
          label: 'Apply',
          to: `/operating/opportunities/marketplace/${meta.opportunityId}`,
          applyOpportunityId: meta.opportunityId,
        };
      }
      return { label: 'Marketplace', to: '/operating/opportunities/marketplace' };
    case 'grow_community':
      if (meta.communityId) {
        return { label: 'View community', to: `/operating/communities/${meta.communityId}` };
      }
      return { label: 'Start community', to: '/operating/communities/new' };
    case 'improve_health':
      return { label: 'Audience OS', to: `/operating/artists/${item.targetArtistId}/audience-os` };
    default:
      return null;
  }
}

export default function CareerActionCard({ item, artistId, onDismissed = undefined }) {
  const queryClient = useQueryClient();
  const applyMutation = useApplyToOpportunity();
  const nav = actionNavigateTarget(item);
  const actionType = item.metadata?.suggestedActionType;
  const priority = item.metadata?.priority ?? 'medium';

  const dismissMutation = useMutation({
    mutationFn: () => dismissCareerAction(item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career', 'actions', artistId] });
      queryClient.invalidateQueries({ queryKey: ['career', 'dashboard', artistId] });
      onDismissed?.(item.id);
    },
  });

  const handlePrimary = () => {
    if (nav?.applyOpportunityId) {
      applyMutation.mutate({
        id: nav.applyOpportunityId,
        body: { artistId, notes: 'Applied via Career OS recommendation' },
      });
      return;
    }
  };

  return (
    <li className="px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--token-surface-2)] text-[var(--color-text-muted)]">
            {CAREER_ACTION_TYPE_LABELS[actionType] ?? 'Action'}
          </span>
          <span className={`text-[10px] font-medium capitalize ${careerActionPriorityClass(priority)}`}>
            {priority} priority
          </span>
        </div>
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{item.title}</p>
        {item.rationale && (
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{item.rationale}</p>
        )}
        <div className="flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)]">
          <span>
            Score <strong className="text-[var(--color-text-primary)]">{Math.round(item.score ?? 0)}</strong>
          </span>
          <span>{formatCareerConfidence(item.confidence)}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {nav?.applyOpportunityId ? (
          <button
            type="button"
            disabled={applyMutation.isPending}
            onClick={handlePrimary}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-[var(--color-brand-primary)] text-white disabled:opacity-50"
          >
            {applyMutation.isPending ? 'Applying…' : nav.label}
            <ArrowRight size={12} />
          </button>
        ) : nav ? (
          <Link
            to={nav.to}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-[var(--color-brand-primary)] text-white hover:opacity-90"
          >
            {nav.label}
            <ArrowRight size={12} />
          </Link>
        ) : null}
        <button
          type="button"
          disabled={dismissMutation.isPending}
          onClick={() => dismissMutation.mutate()}
          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] text-[var(--color-text-muted)] hover:bg-[var(--token-surface-2)] disabled:opacity-50"
          title="Dismiss"
        >
          <X size={12} />
          Dismiss
        </button>
      </div>
    </li>
  );
}

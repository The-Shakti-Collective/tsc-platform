import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, CalendarClock, MapPin, RefreshCw, TrendingUp, Users, X } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import { formatInr, formatPercent } from '../../lib/eventIntelligenceApi';
import {
  approveEventSuggestion,
  dismissEventSuggestion,
  EVENT_PHASE_LABELS,
  EVENT_SUGGESTION_TYPE_LABELS,
  eventSuggestionPriorityClass,
  fetchEventAgentInsights,
  formatEventConfidence,
  runEventAgent,
} from '../../lib/eventAgentApi';

function SuggestionCard({ item, eventId, onAction }) {
  const queryClient = useQueryClient();
  const suggestionType = item.metadata?.suggestionType;
  const priority = item.metadata?.priority ?? 'medium';

  const approveMutation = useMutation({
    mutationFn: () => approveEventSuggestion(item.id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['event-agent', eventId] });
      onAction?.('approve', item.id, result);
    },
  });

  const dismissMutation = useMutation({
    mutationFn: () => dismissEventSuggestion(item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-agent', eventId] });
      onAction?.('dismiss', item.id);
    },
  });

  const isPending = approveMutation.isPending || dismissMutation.isPending;

  return (
    <article className="rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 rounded-full bg-[var(--token-surface-2)] text-[var(--color-text-muted)]">
              {EVENT_SUGGESTION_TYPE_LABELS[suggestionType] ?? suggestionType ?? 'Suggestion'}
            </span>
            <span className={`text-[10px] font-medium ${eventSuggestionPriorityClass(priority)}`}>
              {priority} priority
            </span>
          </div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{item.title}</h3>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">{item.score}</p>
          <p className="text-[10px] text-[var(--color-text-muted)]">{formatEventConfidence(item.confidence)}</p>
        </div>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{item.rationale}</p>
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-brand-primary)] text-white disabled:opacity-50"
          disabled={isPending}
          onClick={() => approveMutation.mutate()}
        >
          {approveMutation.isPending ? 'Approving…' : 'Approve'}
        </button>
        <button
          type="button"
          className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-bg-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-50 inline-flex items-center gap-1"
          disabled={isPending}
          onClick={() => dismissMutation.mutate()}
        >
          <X size={12} />
          Dismiss
        </button>
      </div>
      {approveMutation.isSuccess && (
        <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
          Executed: {approveMutation.data?.executedStub ?? 'stub complete'}
        </p>
      )}
    </article>
  );
}

function RecList({ title, items, icon: Icon }) {
  if (!items?.length) return null;
  return (
    <div className="rounded-lg border border-dashed border-[var(--color-bg-border)] p-3 space-y-2">
      <p className="text-xs font-medium text-[var(--color-text-primary)] inline-flex items-center gap-1.5">
        {Icon ? <Icon size={12} /> : null}
        {title}
      </p>
      <ul className="space-y-1">
        {items.slice(0, 4).map((item) => (
          <li key={`${item.entityType}-${item.entityId}`} className="flex justify-between gap-2 text-xs">
            <span className="text-[var(--color-text-primary)] truncate">{item.title}</span>
            <span className="text-[var(--color-text-muted)] shrink-0">score {item.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function EventAgentPanel({ eventId }) {
  const queryClient = useQueryClient();
  const [lastAction, setLastAction] = useState(null);

  const insightsQuery = useQuery({
    queryKey: ['event-agent', eventId],
    queryFn: () => fetchEventAgentInsights(eventId),
    enabled: Boolean(eventId),
  });

  const runMutation = useMutation({
    mutationFn: () => runEventAgent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-agent', eventId] });
    },
  });

  const data = insightsQuery.data;
  const isMock = data?._source === 'mock';
  const phase = data?.phase ?? 'pre';
  const isPre = phase === 'pre';

  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
            style={{ backgroundColor: 'rgba(167, 139, 250, 0.16)', color: '#a78bfa' }}
          >
            <Bot size={18} />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Event Agent</h2>
              <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--token-surface-2)] text-[var(--color-text-muted)]">
                {EVENT_PHASE_LABELS[phase] ?? phase}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] max-w-xl">
              Wraps Event Intelligence — pre-event predictions and post-event analysis drive actionable
              suggestions. Organizers approve before stub execution.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="text-sm px-4 py-2 rounded-lg border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)] disabled:opacity-50 inline-flex items-center gap-2 shrink-0"
          disabled={runMutation.isPending}
          onClick={() => runMutation.mutate()}
        >
          {runMutation.isPending ? <Spinner size={14} /> : <RefreshCw size={14} />}
          {runMutation.isPending ? 'Running…' : 'Run agent'}
        </button>
      </div>

      {isMock && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          TSC Underground fixtures — wire to POST /agents/event/run when API live.
        </p>
      )}

      {insightsQuery.isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size={24} />
        </div>
      ) : (
        <>
          {data?.eventStartsAt && (
            <p className="text-xs text-[var(--color-text-muted)] inline-flex items-center gap-1.5">
              <CalendarClock size={12} />
              Event starts {new Date(data.eventStartsAt).toLocaleString()}
            </p>
          )}

          {isPre ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] p-3 space-y-1">
                <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                  <Users size={14} />
                  <span className="text-xs">Predicted attendance</span>
                </div>
                <p className="text-xl font-semibold text-[var(--color-text-primary)]">
                  {data?.predictions?.predictedAttendance?.toLocaleString?.() ?? '—'}
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)]">
                  {data?.predictions?.factors?.currentRegistrations ?? 0} registered
                </p>
              </div>
              <div className="rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] p-3 space-y-1">
                <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                  <TrendingUp size={14} />
                  <span className="text-xs">Revenue stub</span>
                </div>
                <p className="text-xl font-semibold text-[var(--color-text-primary)]">
                  {formatInr(data?.predictions?.predictedRevenueStub)}
                </p>
              </div>
              <div className="rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] p-3 space-y-1">
                <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                  <MapPin size={14} />
                  <span className="text-xs">Venue capacity</span>
                </div>
                <p className="text-xl font-semibold text-[var(--color-text-primary)]">
                  {data?.predictions?.factors?.venueCapacity?.toLocaleString?.() ?? '—'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] p-3 space-y-1">
                <span className="text-xs text-[var(--color-text-muted)]">Conversion</span>
                <p className="text-xl font-semibold text-[var(--color-text-primary)]">
                  {formatPercent(data?.analysis?.conversionRate)}
                </p>
              </div>
              <div className="rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] p-3 space-y-1">
                <span className="text-xs text-[var(--color-text-muted)]">Audience growth</span>
                <p className="text-xl font-semibold text-[var(--color-text-primary)]">
                  {formatPercent(data?.analysis?.audienceGrowthImpact)}
                </p>
              </div>
              <div className="rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] p-3 space-y-1">
                <span className="text-xs text-[var(--color-text-muted)]">Community impact</span>
                <p className="text-xl font-semibold text-[var(--color-text-primary)]">
                  {formatPercent(data?.analysis?.communityImpact)}
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <RecList
              title="Recommended cities"
              items={data?.intelligenceRecommendations?.cities}
              icon={MapPin}
            />
            <RecList
              title="Recommended venues"
              items={data?.intelligenceRecommendations?.venues}
              icon={MapPin}
            />
            <RecList
              title="Recommended partners"
              items={data?.intelligenceRecommendations?.partners}
              icon={Users}
            />
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium text-[var(--color-text-primary)]">
              Suggestions ({data?.items?.length ?? 0})
              {data?.lastRunAt && (
                <span className="font-normal text-[var(--color-text-muted)] ml-2">
                  Last run {new Date(data.lastRunAt).toLocaleString()}
                </span>
              )}
            </p>
            {(data?.items ?? []).length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] py-4 text-center">
                No active suggestions — run the Event Agent to generate recommendations.
              </p>
            ) : (
              data.items.map((item) => (
                <SuggestionCard
                  key={item.id}
                  item={item}
                  eventId={eventId}
                  onAction={(action, id, result) =>
                    setLastAction({ action, id, result, at: new Date().toISOString() })
                  }
                />
              ))
            )}
          </div>

          {lastAction?.action === 'approve' && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Suggestion approved — {lastAction.result?.executedStub ?? 'stub executed'}
            </p>
          )}
        </>
      )}
    </section>
  );
}

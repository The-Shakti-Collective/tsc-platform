import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  Heart,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import CareerActionCard from '../../components/career/CareerActionCard';
import {
  CAREER_ACTION_TYPE_LABELS,
  fetchCareerActions,
  fetchCareerDashboard,
  runCareerAgent,
} from '../../lib/careerApi';

function SignalCard({ label, value, suffix = undefined, icon: Icon }) {
  return (
    <div className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 space-y-2">
      <div className="flex items-center gap-2">
        {Icon && (
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--token-surface-2)] shrink-0">
            <Icon size={15} className="text-[var(--color-brand-primary)]" />
          </div>
        )}
        <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-[var(--color-text-primary)]">
        {value ?? '—'}
        {suffix && value != null && (
          <span className="text-sm font-normal text-[var(--color-text-muted)] ml-1">{suffix}</span>
        )}
      </p>
    </div>
  );
}

export default function CareerOSPage() {
  const { artistId } = useParams();
  const queryClient = useQueryClient();

  const dashboardQuery = useQuery({
    queryKey: ['career', 'dashboard', artistId],
    queryFn: () => fetchCareerDashboard(artistId),
    enabled: Boolean(artistId),
  });

  const actionsQuery = useQuery({
    queryKey: ['career', 'actions', artistId],
    queryFn: () => fetchCareerActions(artistId),
    enabled: Boolean(artistId),
  });

  const runMutation = useMutation({
    mutationFn: () => runCareerAgent(artistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career', 'dashboard', artistId] });
      queryClient.invalidateQueries({ queryKey: ['career', 'actions', artistId] });
    },
  });

  if (!artistId) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 text-sm text-[var(--color-text-muted)]">
        Artist context required.
      </div>
    );
  }

  if (dashboardQuery.isLoading || actionsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={32} />
      </div>
    );
  }

  const dashboard = dashboardQuery.data;
  const actions = actionsQuery.data;
  const items = actions?.items ?? dashboard?.activeActions ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <Link
          to={`/operating/artists/${artistId}/workspace`}
          className="text-xs text-[var(--color-text-muted)] hover:underline"
        >
          ← Artist workspace
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <Briefcase size={22} className="text-[var(--color-brand-primary)]" />
              Career OS
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Next Best Actions — intelligence-driven career moves you approve
            </p>
          </div>
          <button
            type="button"
            disabled={runMutation.isPending}
            onClick={() => runMutation.mutate()}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[var(--color-brand-primary)] text-white disabled:opacity-50"
          >
            <RefreshCw size={12} className={runMutation.isPending ? 'animate-spin' : ''} />
            {runMutation.isPending ? 'Analyzing…' : 'Generate actions'}
          </button>
        </div>
        {(dashboard?._source === 'mock' || actions?._source === 'mock') && (
          <p className="text-xs text-amber-600 dark:text-amber-400">Sample Career OS data.</p>
        )}
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SignalCard label="Health score" value={dashboard?.healthScore} suffix="/100" icon={Heart} />
        <SignalCard
          label="Audience growth"
          value={dashboard?.audienceGrowth}
          suffix="/100"
          icon={TrendingUp}
        />
        <SignalCard label="Superfans" value={dashboard?.superfanCount} icon={Sparkles} />
        <SignalCard label="Communities" value={dashboard?.communityCount} icon={Users} />
        <SignalCard label="Reputation" value={dashboard?.reputationScore} suffix="/100" icon={Shield} />
        <SignalCard label="Trust" value={dashboard?.trustScore} suffix="/100" icon={Shield} />
        <SignalCard
          label="Revenue (stub)"
          value={
            dashboard?.revenueStub != null
              ? new Intl.NumberFormat(undefined, {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                }).format(dashboard.revenueStub)
              : null
          }
          icon={Wallet}
        />
        <SignalCard
          label="Active actions"
          value={items.length}
          icon={Briefcase}
        />
      </section>

      {dashboard?.actionCountsByType && Object.keys(dashboard.actionCountsByType).length > 0 && (
        <section className="flex flex-wrap gap-2">
          {Object.entries(dashboard.actionCountsByType).map(([type, count]) => (
            <span
              key={type}
              className="text-xs px-2.5 py-1 rounded-full border border-[var(--color-bg-border)] text-[var(--color-text-muted)]"
            >
              {CAREER_ACTION_TYPE_LABELS[type] ?? type}: {count}
            </span>
          ))}
        </section>
      )}

      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Next Best Actions</h2>
          {dashboard?.lastRunAt && (
            <span className="text-xs text-[var(--color-text-muted)]">
              Last run {new Date(dashboard.lastRunAt).toLocaleString()}
            </span>
          )}
        </div>

        {runMutation.isSuccess && runMutation.data?.recommendationsCreated != null && (
          <p className="text-xs text-green-600 dark:text-green-400">
            Career Agent created {runMutation.data.recommendationsCreated} action
            {runMutation.data.recommendationsCreated === 1 ? '' : 's'}.
          </p>
        )}

        {items.length === 0 ? (
          <div className="space-y-3 py-4">
            <p className="text-sm text-[var(--color-text-muted)]">
              No career actions yet. Run the Career Agent to analyze audience, growth, revenue, and
              collaboration signals.
            </p>
            <button
              type="button"
              disabled={runMutation.isPending}
              onClick={() => runMutation.mutate()}
              className="text-xs px-3 py-1.5 rounded-md bg-[var(--color-brand-primary)] text-white disabled:opacity-50"
            >
              Generate Next Best Actions
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--color-bg-border)] rounded-lg border border-[var(--color-bg-border)]">
            {items.map((item) => (
              <CareerActionCard key={item.id} item={item} artistId={artistId} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

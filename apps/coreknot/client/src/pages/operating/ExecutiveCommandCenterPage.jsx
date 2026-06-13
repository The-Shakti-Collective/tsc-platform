import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Briefcase,
  Building2,
  Flame,
  Heart,
  IndianRupee,
  MapPin,
  Megaphone,
  Rocket,
  Send,
  Target,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import ForecastPanel from '../../components/forecast/ForecastPanel';
import AutomationRulesPanel from '../../components/automation/AutomationRulesPanel';
import CopilotPanel from '../../components/copilot/CopilotPanel';
import HotSignalsPanel from '../../components/opportunity-generation/HotSignalsPanel';
import { Spinner } from '../../components/ui/Spinner';
import { PageContainer } from '../../components/ui/primitives';
import {
  useCommandCenter,
  useCreateCampaignAction,
  useLaunchBrandCampaignAction,
  useReviewPipelineDealsAction,
  useReviewRecoveryPlanAction,
  useApplyRecommendedAction,
  useLaunchCommunityCampaignAction,
  useExecuteInsightAction,
} from '../../hooks/queries/intelligence';

function formatCurrency(amount, currency = 'INR') {
  if (amount == null) return '—';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

function formatCompactInr(amount) {
  if (amount == null) return '—';
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return formatCurrency(amount);
}

function SectionCard({ title, icon: Icon, accent, iconColor, action = undefined, children }) {
  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div
              className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
              style={{ backgroundColor: accent, color: iconColor }}
            >
              <Icon size={16} />
            </div>
          )}
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ListRow({ primary, secondary, metric, href = undefined }) {
  const content = (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[var(--color-bg-border)] last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{primary}</p>
        {secondary && <p className="text-xs text-[var(--color-text-muted)] truncate">{secondary}</p>}
      </div>
      {metric && <span className="text-xs font-mono text-[var(--color-text-muted)] shrink-0">{metric}</span>}
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="block hover:bg-[var(--token-surface-2)] rounded-md -mx-1 px-1 transition-colors">
        {content}
      </Link>
    );
  }

  return content;
}

function ActionButton({ label, icon: Icon, onClick, pending, success }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)] disabled:opacity-60 shrink-0"
    >
      {pending ? <Spinner size={12} /> : Icon && <Icon size={12} />}
      {success ? 'Queued' : label}
    </button>
  );
}

function ForecastCard({ forecast, valueFormatter }) {
  if (!forecast) return null;
  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs text-[var(--color-text-muted)]">{forecast.label} ({forecast.period})</p>
        <p className="text-2xl font-semibold text-[var(--color-text-primary)]">
          {valueFormatter ? valueFormatter(forecast.projection, forecast.currency) : forecast.projection}
        </p>
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">{forecast.basedOn}</p>
      <p className="text-xs text-amber-600 dark:text-amber-400">{forecast.disclaimer}</p>
    </div>
  );
}

function PipelineFunnel({ funnel = [] }) {
  const maxCount = Math.max(...funnel.map((row) => row.count), 1);
  return (
    <div className="space-y-2">
      {funnel.map((row) => (
        <div key={row.stage} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="capitalize text-[var(--color-text-primary)]">{row.stage}</span>
            <span className="font-mono text-[var(--color-text-muted)]">
              {row.count} · {formatCompactInr(row.value)}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--token-surface-2)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--color-brand-primary)]"
              style={{ width: `${Math.max((row.count / maxCount) * 100, row.count > 0 ? 8 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ExecutiveCommandCenterPage() {
  const [period, setPeriod] = useState('weekly');
  const [actionNotice, setActionNotice] = useState(null);
  const { data, isLoading, isError, error } = useCommandCenter(period);

  const createCampaign = useCreateCampaignAction();
  const reviewPipeline = useReviewPipelineDealsAction();
  const launchBrandCampaign = useLaunchBrandCampaignAction();
  const reviewRecovery = useReviewRecoveryPlanAction();
  const applyRecommended = useApplyRecommendedAction();
  const launchCommunityCampaign = useLaunchCommunityCampaignAction();
  const executeInsight = useExecuteInsightAction();

  async function runAction(mutation, section, targetId, extra = {}) {
    setActionNotice(null);
    try {
      const result = await mutation.mutateAsync({ section, period, targetId, ...extra });
      setActionNotice(result?.message ?? 'Action queued.');
    } catch (err) {
      setActionNotice(err?.message ?? 'Action failed.');
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={32} />
      </div>
    );
  }

  if (isError) {
    return (
      <PageContainer className="max-w-6xl mx-auto px-4 py-8 text-center space-y-2">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">Command center unavailable</p>
        <p className="text-xs text-[var(--color-text-muted)]">{error?.message || 'Could not load intelligence data'}</p>
        <Link to="/operating/dashboard" className="text-sm text-[var(--color-brand-primary)]">
          Back to operating dashboard
        </Link>
      </PageContainer>
    );
  }

  const exec = data?.executive?.metrics;
  const participation = data?.participation;
  const v3 = data?.v3;
  const audienceKpis = data?.audienceKpis;
  const insights = data?.insights;
  const actionableInsights = data?.actionableInsights ?? [];
  const workflows = data?.workflows;
  const periodLabel = period === 'monthly' ? 'this month' : 'this week';

  return (
    <PageContainer className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <Link to="/operating/dashboard" className="text-xs text-[var(--color-text-muted)] hover:underline">
          ← Operating dashboard
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Executive Command Center</h1>
            <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
              Command Center V5 — Acts, not just reports. Audience economy KPIs, actionable insights, and autonomous workflow orchestration.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/operating/talent-discovery"
              className="text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)]"
            >
              Talent Discovery →
            </Link>
            <Link
              to="/operating/opportunity-generation"
              className="text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)]"
            >
              Opportunity generation →
            </Link>
            <div className="flex rounded-lg border border-[var(--color-bg-border)] p-0.5">
            {['weekly', 'monthly'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPeriod(tab)}
                className={`px-3 py-1 text-xs rounded-md capitalize transition-colors ${
                  period === tab
                    ? 'bg-[var(--color-brand-primary)] text-white'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--token-surface-2)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          </div>
        </div>
        {data?._source === 'mock' && (
          <p className="text-xs text-amber-600 dark:text-amber-400">Sample intelligence — live when @tsc/api is reachable.</p>
        )}
        {actionNotice && (
          <p className="text-xs text-[var(--color-text-muted)] border border-[var(--color-bg-border)] rounded-md px-3 py-2">
            {actionNotice}
          </p>
        )}
      </div>

      {workflows && (
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-[var(--color-bg-border)] p-3">
            <p className="text-xs text-[var(--color-text-muted)]">Pending decisions</p>
            <p className="text-lg font-semibold text-[var(--color-text-primary)]">
              {workflows.pendingDecisionsCount ?? '—'}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--color-bg-border)] p-3">
            <p className="text-xs text-[var(--color-text-muted)]">Active workflow runs</p>
            <p className="text-lg font-semibold text-[var(--color-text-primary)]">
              {workflows.activeRunsCount ?? '—'}
            </p>
          </div>
          {(workflows.recentRuns ?? []).slice(0, 2).map((run) => (
            <div key={run.id} className="rounded-lg border border-[var(--color-bg-border)] p-3 col-span-1">
              <p className="text-xs text-[var(--color-text-muted)] truncate">{run.workflowName}</p>
              <p className="text-sm font-semibold text-[var(--color-text-primary)] capitalize">{run.status?.replace(/_/g, ' ')}</p>
              <p className="text-[10px] text-[var(--color-text-muted)]">Step {run.currentStep}</p>
            </div>
          ))}
        </section>
      )}

      {actionableInsights.length > 0 && (
        <SectionCard
          title="Actionable Insights"
          icon={Target}
          accent="rgba(139, 92, 246, 0.16)"
          iconColor="#a78bfa"
        >
          {actionableInsights.map((insight) => (
            <div
              key={insight.id}
              className="flex items-start justify-between gap-3 py-2.5 border-b border-[var(--color-bg-border)] last:border-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{insight.title}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {insight.category} · {insight.severity}
                </p>
              </div>
              {insight.actionType && !insight.executed && (
                <ActionButton
                  label={insight.actionLabel ?? 'Execute'}
                  icon={Rocket}
                  pending={executeInsight.isPending}
                  success={executeInsight.isSuccess}
                  onClick={() =>
                    runAction(executeInsight, 'insights', insight.id, {
                      insightId: insight.id,
                      actionType: insight.actionType,
                    })
                  }
                />
              )}
            </div>
          ))}
        </SectionCard>
      )}

      {audienceKpis && (
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Audience Economy KPIs</h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Platform fan base, superfans, membership MRR, and audience health — aggregated from FanProfile, Superfan, Membership, and AudienceHealthSnapshot data.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-lg border border-[var(--color-bg-border)] p-3">
              <p className="text-xs text-[var(--color-text-muted)]">Total fans</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">{audienceKpis.totalFans?.toLocaleString() ?? '—'}</p>
            </div>
            <div className="rounded-lg border border-[var(--color-bg-border)] p-3">
              <p className="text-xs text-[var(--color-text-muted)]">Monthly active fans</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">{audienceKpis.monthlyActiveFans?.toLocaleString() ?? '—'}</p>
            </div>
            <div className="rounded-lg border border-[var(--color-bg-border)] p-3">
              <p className="text-xs text-[var(--color-text-muted)]">Superfans (gold+)</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">{audienceKpis.superfans?.total?.toLocaleString() ?? '—'}</p>
              <p className="text-[10px] text-[var(--color-text-muted)]">
                {audienceKpis.superfans ? `${audienceKpis.superfans.gold} gold · ${audienceKpis.superfans.platinum} plat · ${audienceKpis.superfans.legend} legend` : ''}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--color-bg-border)] p-3">
              <p className="text-xs text-[var(--color-text-muted)]">Membership MRR</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                {formatCompactInr(audienceKpis.membershipRevenue?.mrrStub)}
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)]">
                {audienceKpis.membershipRevenue?.activeSubscriptions != null
                  ? `${audienceKpis.membershipRevenue.activeSubscriptions} active subs`
                  : ''}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--color-bg-border)] p-3">
              <p className="text-xs text-[var(--color-text-muted)]">Avg audience growth</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                {audienceKpis.audienceGrowth != null ? `${audienceKpis.audienceGrowth}%` : '—'}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--color-bg-border)] p-3">
              <p className="text-xs text-[var(--color-text-muted)]">Avg churn / at-risk</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                {audienceKpis.audienceChurn?.avgChurn != null ? `${audienceKpis.audienceChurn.avgChurn}%` : '—'}
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)]">
                {audienceKpis.audienceChurn?.churnRiskArtistCount != null
                  ? `${audienceKpis.audienceChurn.churnRiskArtistCount} artists at churn risk`
                  : ''}
              </p>
            </div>
          </div>
        </section>
      )}

      {insights && (
        <div className="grid gap-4 lg:grid-cols-3">
          <SectionCard
            title="Most Loyal Communities"
            icon={Heart}
            accent="rgba(236, 72, 153, 0.16)"
            iconColor="#f472b6"
          >
            {(insights.mostLoyalCommunities ?? []).length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No community retention signals yet.</p>
            ) : (
              insights.mostLoyalCommunities.map((community) => (
                <ListRow
                  key={community.communityId}
                  primary={community.name}
                  secondary={`${community.activeMembers?.toLocaleString()} active · +${community.memberGrowth}% growth`}
                  metric={`${community.fanRetention}% retention`}
                  href={`/operating/communities/${community.communityId}/audience-os`}
                />
              ))
            )}
          </SectionCard>

          <SectionCard
            title="Highest Growth Artist Audiences"
            icon={TrendingUp}
            accent="rgba(34, 197, 94, 0.16)"
            iconColor="#4ade80"
          >
            {(insights.highestGrowthArtists ?? []).length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No high-growth artist audiences yet.</p>
            ) : (
              insights.highestGrowthArtists.map((artist) => (
                <ListRow
                  key={artist.artistId}
                  primary={artist.name}
                  secondary={`${artist.fanRetention}% retention · LTV stub ${formatCompactInr(artist.lifetimeValueStub)}`}
                  metric={`+${artist.audienceGrowth}%`}
                  href={`/operating/artists/${artist.artistId}/audience-os`}
                />
              ))
            )}
          </SectionCard>

          <SectionCard
            title="Highest Churn Risk"
            icon={TrendingDown}
            accent="rgba(234, 179, 8, 0.16)"
            iconColor="#facc15"
          >
            {(insights.highestChurnRisk ?? []).length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No artists flagged for churn risk.</p>
            ) : (
              insights.highestChurnRisk.map((artist) => (
                <ListRow
                  key={artist.artistId}
                  primary={artist.name}
                  secondary={`${artist.riskLevel} · ${artist.audienceChurn}% churn`}
                  metric={`${artist.fanRetention}% retention`}
                  href={`/operating/artists/${artist.artistId}/audience-os`}
                />
              ))
            )}
          </SectionCard>
        </div>
      )}

      {v3 && (
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Creator Economy KPIs</h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Revenue, opportunities, brands, artists, and deal pipeline — aggregated from Deal, RevenueTransaction, and marketplace data.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="rounded-lg border border-[var(--color-bg-border)] p-3">
              <p className="text-xs text-[var(--color-text-muted)]">Open pipeline</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                {formatCompactInr(v3.revenue?.openPipelineValue)}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--color-bg-border)] p-3">
              <p className="text-xs text-[var(--color-text-muted)]">Closed {periodLabel}</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                {formatCompactInr(v3.revenue?.closedThisPeriod)}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--color-bg-border)] p-3">
              <p className="text-xs text-[var(--color-text-muted)]">Active opportunities</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">{v3.opportunities?.activeCount ?? '—'}</p>
            </div>
            <div className="rounded-lg border border-[var(--color-bg-border)] p-3">
              <p className="text-xs text-[var(--color-text-muted)]">Active brands</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">{v3.brands?.activeCount ?? '—'}</p>
            </div>
            <div className="rounded-lg border border-[var(--color-bg-border)] p-3">
              <p className="text-xs text-[var(--color-text-muted)]">Open deals</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">{v3.deals?.totalOpen ?? '—'}</p>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-[var(--color-bg-border)] p-3">
          <p className="text-xs text-[var(--color-text-muted)]">New followers</p>
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">{exec?.newFollowers?.toLocaleString() ?? '—'}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-bg-border)] p-3">
          <p className="text-xs text-[var(--color-text-muted)]">Closing soon (7d)</p>
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">{v3?.opportunities?.closingSoon ?? exec?.openOpportunities ?? '—'}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-bg-border)] p-3">
          <p className="text-xs text-[var(--color-text-muted)]">Artists at risk</p>
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">{v3?.artists?.atRiskCount ?? exec?.atRiskArtists ?? data?.artistsAtRisk?.length ?? '—'}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-bg-border)] p-3">
          <p className="text-xs text-[var(--color-text-muted)]">High growth artists</p>
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">{v3?.artists?.highGrowthCount ?? '—'}</p>
        </div>
      </div>

      {v3 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard
            title="Revenue & Pipeline"
            icon={IndianRupee}
            accent="rgba(16, 185, 129, 0.16)"
            iconColor="#34d399"
            action={(
              <ActionButton
                label="Review pipeline deals"
                icon={Briefcase}
                pending={reviewPipeline.isPending}
                success={reviewPipeline.isSuccess}
                onClick={() => runAction(reviewPipeline, 'deals')}
              />
            )}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Open pipeline value</p>
                <p className="text-xl font-semibold">{formatCurrency(v3.revenue?.openPipelineValue, v3.revenue?.currency)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Closed {periodLabel}</p>
                <p className="text-xl font-semibold">{formatCurrency(v3.revenue?.closedThisPeriod, v3.revenue?.currency)}</p>
              </div>
            </div>
            <ForecastCard
              forecast={data?.revenueForecast}
              valueFormatter={(value, currency) => formatCurrency(value, currency)}
            />
          </SectionCard>

          <SectionCard
            title="Deal Pipeline Funnel"
            icon={Target}
            accent="rgba(139, 92, 246, 0.16)"
            iconColor="#a78bfa"
            action={(
              <Link to="/operating/deals" className="text-xs text-[var(--color-brand-primary)] hover:underline shrink-0">
                View deals →
              </Link>
            )}
          >
            <PipelineFunnel funnel={v3.deals?.pipelineFunnel ?? []} />
            <p className="text-xs text-[var(--color-text-muted)]">
              {v3.deals?.totalOpen ?? 0} open deals across pipeline stages
            </p>
          </SectionCard>

          <SectionCard
            title="Brand Partners"
            icon={Building2}
            accent="rgba(59, 130, 246, 0.18)"
            iconColor="#60a5fa"
            action={(
              <ActionButton
                label="Launch brand campaign"
                icon={Megaphone}
                pending={launchBrandCampaign.isPending}
                success={launchBrandCampaign.isSuccess}
                onClick={() => runAction(launchBrandCampaign, 'brands', v3.brands?.topBrands?.[0]?.id)}
              />
            )}
          >
            <div className="flex gap-4 text-xs text-[var(--color-text-muted)] mb-1">
              <span>{v3.brands?.activeCount ?? 0} active</span>
              <span>+{v3.brands?.newThisWeek ?? 0} this week</span>
            </div>
            {(v3.brands?.topBrands ?? []).length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No active brand partners yet.</p>
            ) : (
              v3.brands.topBrands.map((brand) => (
                <ListRow
                  key={brand.id}
                  primary={brand.name}
                  secondary={brand.verified ? 'Verified partner' : 'Brand partner'}
                  metric={brand.trustScore != null ? `trust ${brand.trustScore}` : `${brand.opportunityCount} listings`}
                  href={`/operating/brands/${brand.id}`}
                />
              ))
            )}
          </SectionCard>

          <SectionCard
            title="Artists — Growth & Risk"
            icon={AlertTriangle}
            accent="rgba(234, 179, 8, 0.16)"
            iconColor="#facc15"
            action={(
              <ActionButton
                label="Review Recovery Plan"
                icon={Target}
                pending={reviewRecovery.isPending}
                success={reviewRecovery.isSuccess}
                onClick={() =>
                  runAction(reviewRecovery, 'artists-at-risk', data?.artistsAtRisk?.[0]?.artistId, {
                    artistId: data?.artistsAtRisk?.[0]?.artistId,
                  })
                }
              />
            )}
          >
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">High growth</p>
                <p className="text-lg font-semibold">{v3.artists?.highGrowthCount ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">At risk</p>
                <p className="text-lg font-semibold">{v3.artists?.atRiskCount ?? '—'}</p>
              </div>
            </div>
            {(data?.artistsAtRisk ?? []).slice(0, 4).map((artist) => (
              <ListRow
                key={artist.artistId}
                primary={artist.name}
                secondary={artist.topAlert ?? `${artist.status} · ${artist.alertCount} alerts`}
                metric={`${artist.healthScore}/100`}
                href={`/operating/artists/${artist.artistId}/workspace`}
              />
            ))}
          </SectionCard>
        </div>
      )}

      {participation && (
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Ecosystem Participation</h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Community activity and collaboration metrics from Phase 6.5 — layered under creator-economy KPIs.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-lg border border-[var(--color-bg-border)] p-3">
              <p className="text-xs text-[var(--color-text-muted)]">Daily active members</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">{participation.dailyActiveMembers?.toLocaleString() ?? '—'}</p>
            </div>
            <div className="rounded-lg border border-[var(--color-bg-border)] p-3">
              <p className="text-xs text-[var(--color-text-muted)]">New collaborations</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">{participation.newCollaborations ?? '—'}</p>
            </div>
            <div className="rounded-lg border border-[var(--color-bg-border)] p-3">
              <p className="text-xs text-[var(--color-text-muted)]">Community growth</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">{participation.communityGrowth?.toLocaleString() ?? '—'}</p>
            </div>
            <div className="rounded-lg border border-[var(--color-bg-border)] p-3">
              <p className="text-xs text-[var(--color-text-muted)]">Participation rate</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">{participation.participationRate != null ? `${participation.participationRate}%` : '—'}</p>
            </div>
            <div className="rounded-lg border border-[var(--color-bg-border)] p-3">
              <p className="text-xs text-[var(--color-text-muted)]">Ecosystem health</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">{participation.ecosystemHealth != null ? `${participation.ecosystemHealth}/100` : '—'}</p>
            </div>
            <div className="rounded-lg border border-[var(--color-bg-border)] p-3">
              <p className="text-xs text-[var(--color-text-muted)]">Top contributor</p>
              <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{participation.topContributors?.[0]?.displayName ?? '—'}</p>
            </div>
          </div>
          {(participation.topContributors ?? []).length > 0 && (
            <SectionCard title="Top Contributors" icon={UserPlus} accent="rgba(34, 197, 94, 0.16)" iconColor="#4ade80">
              {participation.topContributors.map((contributor) => (
                <ListRow
                  key={contributor.personId}
                  primary={contributor.displayName}
                  secondary="Activity feed actor"
                  metric={`${contributor.activityCount} actions`}
                />
              ))}
            </SectionCard>
          )}
        </section>
      )}

      <HotSignalsPanel limit={5} />
      <ForecastPanel />
      <AutomationRulesPanel />
      <CopilotPanel compact />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Top Opportunities This Week"
          icon={Flame}
          accent="rgba(244, 63, 94, 0.16)"
          iconColor="#fb7185"
          action={(
            <ActionButton
              label="Apply Recommended"
              icon={Rocket}
              pending={applyRecommended.isPending}
              success={applyRecommended.isSuccess}
              onClick={() =>
                runAction(applyRecommended, 'opportunities', data?.topOpportunities?.[0]?.id, {
                  opportunityIds: (data?.topOpportunities ?? []).slice(0, 3).map((opp) => opp.id),
                })
              }
            />
          )}
        >
          {(data?.topOpportunities ?? []).length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">No marketplace opportunities this period.</p>
          ) : (
            data.topOpportunities.map((opp) => (
              <ListRow
                key={opp.id}
                primary={opp.title}
                secondary={`${opp.bucket} · ${opp.status}${opp.artistId ? ` · ${opp.artistId}` : ''}`}
                metric={`${opp.score} · ${formatCurrency(opp.value)}`}
                href="/operating/opportunities"
              />
            ))
          )}
          {v3?.opportunities && (
            <p className="text-xs text-[var(--color-text-muted)] pt-1">
              {v3.opportunities.activeCount} active · {v3.opportunities.closingSoon} closing within 7 days
            </p>
          )}
        </SectionCard>

        <SectionCard
          title="Artists At Risk"
          icon={AlertTriangle}
          accent="rgba(234, 179, 8, 0.16)"
          iconColor="#facc15"
          action={(
            <ActionButton
              label="Review Recovery Plan"
              icon={Target}
              pending={reviewRecovery.isPending}
              success={reviewRecovery.isSuccess}
              onClick={() =>
                runAction(reviewRecovery, 'artists-at-risk', data?.artistsAtRisk?.[0]?.artistId, {
                  artistId: data?.artistsAtRisk?.[0]?.artistId,
                })
              }
            />
          )}
        >
          {(data?.artistsAtRisk ?? []).length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">No artists flagged at risk.</p>
          ) : (
            data.artistsAtRisk.map((artist) => (
              <ListRow
                key={artist.artistId}
                primary={artist.name}
                secondary={artist.topAlert ?? `${artist.status} · ${artist.alertCount} alerts`}
                metric={`${artist.healthScore}/100`}
                href={`/operating/artists/${artist.artistId}/workspace`}
              />
            ))
          )}
        </SectionCard>

        <SectionCard
          title="Cities Heating Up"
          icon={MapPin}
          accent="rgba(59, 130, 246, 0.18)"
          iconColor="#60a5fa"
          action={(
            <ActionButton
              label="Create Campaign"
              icon={Megaphone}
              pending={createCampaign.isPending}
              success={createCampaign.isSuccess}
              onClick={() => runAction(createCampaign, 'cities', data?.citiesHeatingUp?.[0]?.city)}
            />
          )}
        >
          {(data?.citiesHeatingUp ?? []).length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">No city heat signals yet.</p>
          ) : (
            data.citiesHeatingUp.map((city) => (
              <ListRow
                key={city.city}
                primary={city.city}
                secondary={`${city.artistsCount} artists · ${city.eventsCount} events · ${city.fansCount?.toLocaleString()} fans`}
                metric={`heat ${city.heatScore}`}
              />
            ))
          )}
        </SectionCard>

        <SectionCard
          title="Communities Growing Fast"
          icon={Users}
          accent="rgba(236, 72, 153, 0.16)"
          iconColor="#f472b6"
          action={(
            <ActionButton
              label="Launch Campaign?"
              icon={Megaphone}
              pending={launchCommunityCampaign.isPending}
              success={launchCommunityCampaign.isSuccess}
              onClick={() =>
                runAction(
                  launchCommunityCampaign,
                  'communities',
                  data?.communitiesGrowingFast?.[0]?.communityId,
                  {
                    communityId: data?.communitiesGrowingFast?.[0]?.communityId,
                    brandId: v3?.brands?.topBrands?.[0]?.id,
                  },
                )
              }
            />
          )}
        >
          {(data?.communitiesGrowingFast ?? []).length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">No community growth signals.</p>
          ) : (
            data.communitiesGrowingFast.map((community) => (
              <ListRow
                key={community.communityId}
                primary={community.name}
                secondary={`+${community.newMembers} new · ${community.engagementRate}% engaged`}
                metric={`+${community.growthPct}% · ${community.memberCount?.toLocaleString()} members`}
              />
            ))
          )}
        </SectionCard>

        <SectionCard
          title="Revenue Forecast"
          icon={IndianRupee}
          accent="rgba(16, 185, 129, 0.16)"
          iconColor="#34d399"
        >
          <ForecastCard
            forecast={data?.revenueForecast}
            valueFormatter={(value, currency) => formatCurrency(value, currency)}
          />
        </SectionCard>

        <SectionCard
          title="Booking Demand Forecast"
          icon={TrendingUp}
          accent="rgba(139, 92, 246, 0.16)"
          iconColor="#a78bfa"
        >
          <ForecastCard
            forecast={data?.bookingDemandForecast}
            valueFormatter={(value) => `${value} weighted pipeline units`}
          />
          {data?.bookingDemandForecast && (
            <p className="text-xs text-[var(--color-text-muted)]">
              {data.bookingDemandForecast.openOpportunities} open · {data.bookingDemandForecast.hotOpportunities} hot
            </p>
          )}
        </SectionCard>
      </div>
    </PageContainer>
  );
}

import React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CalendarDays,
  Mic2,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Spinner } from '../../../components/ui/Spinner';
import { PageContainer } from '../../../components/ui/primitives';
import { CommunityJoinButton } from '../../../components/community/CommunityJoinButton';
import { CommunityMembershipPrograms } from '../../../components/community/CommunityMembershipPrograms';
import { TSC_UNDERGROUND_ID } from '../../../lib/communityApi';
import { useCommunityDashboard } from '../../../hooks/queries/community';
import CommunityAudiencePanel from '../../../components/community/CommunityAudiencePanel';
import CommunityAgentPanel from '../../../components/community/CommunityAgentPanel';

function MetricCard({ label, value, suffix = undefined, icon: Icon, accent, iconColor = undefined }) {
  return (
    <div className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 space-y-2">
      <div className="flex items-center gap-2">
        {Icon && (
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
            style={{ backgroundColor: accent, color: iconColor }}
          >
            <Icon size={15} />
          </div>
        )}
        <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-[var(--color-text-primary)]">
        {value?.toLocaleString?.() ?? value}
        {suffix && <span className="text-sm font-normal text-[var(--color-text-muted)] ml-1">{suffix}</span>}
      </p>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-5 space-y-3">
      <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h2>
      {children}
    </section>
  );
}

function ListRow({ primary, secondary, metric }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[var(--color-bg-border)] last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{primary}</p>
        {secondary && <p className="text-xs text-[var(--color-text-muted)] truncate">{secondary}</p>}
      </div>
      {metric && <span className="text-xs font-mono text-[var(--color-text-muted)] shrink-0">{metric}</span>}
    </div>
  );
}

export default function CommunityDashboardPage({ communityId: communityIdProp = undefined } = {}) {
  const { communityId: routeCommunityId } = useParams();
  const communityId = routeCommunityId ?? communityIdProp ?? TSC_UNDERGROUND_ID;
  const { data, isLoading, isError, error } = useCommunityDashboard(communityId);

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
        <p className="text-sm font-medium text-[var(--color-text-primary)]">Community dashboard unavailable</p>
        <p className="text-xs text-[var(--color-text-muted)]">{error?.message || 'Could not load community data'}</p>
        <Link to="/operating/dashboard" className="text-sm text-[var(--color-brand-primary)]">
          Back to operating dashboard
        </Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <Link to="/operating/dashboard" className="text-xs text-[var(--color-text-muted)] hover:underline">
          ← Operating dashboard
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">{data?.name}</h1>
            <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
              Community OS dashboard — members, contributors, linked artists, events, and engagement.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <CommunityJoinButton communityId={communityId} />
            <Link
              to={`/operating/communities/${communityId}/audience-os`}
              className="text-sm px-4 py-2 rounded-lg border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)]"
            >
              Audience OS →
            </Link>
            <Link
              to={`/operating/communities/${communityId}/leader`}
              className="text-sm px-4 py-2 rounded-lg border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)]"
            >
              Leader portal →
            </Link>
          </div>
        </div>
        {data?._source === 'mock' && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Sample community data — wire to @tsc/api `/communities/:id/*` when live.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Members"
          value={data?.memberCount}
          icon={Users}
          accent="rgba(96, 165, 250, 0.16)"
          iconColor="#60a5fa"
        />
        <MetricCard
          label="Active (30d)"
          value={data?.activeMemberCount}
          icon={Sparkles}
          accent="rgba(52, 211, 153, 0.16)"
          iconColor="#34d399"
        />
        <MetricCard
          label="Engagement"
          value={data?.engagementScore}
          suffix="%"
          icon={TrendingUp}
          accent="rgba(244, 114, 182, 0.16)"
          iconColor="#f472b6"
        />
        <MetricCard
          label="Upcoming events"
          value={data?.upcomingEvents?.length ?? 0}
          icon={CalendarDays}
          accent="rgba(251, 191, 36, 0.16)"
          iconColor="#fbbf24"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Top contributors (30d)">
          {(data?.topContributors ?? []).length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)]">No contributor activity yet.</p>
          ) : (
            data.topContributors.map((row) => (
              <ListRow
                key={row.personId}
                primary={row.name}
                secondary={row.lastActiveAt ? `Last active ${new Date(row.lastActiveAt).toLocaleDateString()}` : null}
                metric={`${row.postCount30d} posts`}
              />
            ))
          )}
        </SectionCard>

        <SectionCard title="Linked artists">
          {(data?.linkedArtists ?? []).length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)]">No linked artists via MEMBER_OF yet.</p>
          ) : (
            data.linkedArtists.map((artist) => (
              <ListRow
                key={artist.artistId}
                primary={artist.name}
                secondary={artist.slug ? `@${artist.slug}` : artist.artistId}
                metric={
                  <Link
                    to={`/operating/artists/${artist.artistId}/workspace`}
                    className="text-[var(--color-brand-primary)] hover:underline"
                  >
                    Workspace
                  </Link>
                }
              />
            ))
          )}
        </SectionCard>
      </div>

      <CommunityAgentPanel communityId={communityId} />

      <CommunityAudiencePanel communityId={communityId} />

      <CommunityMembershipPrograms communityId={communityId} />

      <SectionCard title="Upcoming events">
        {(data?.upcomingEvents ?? []).length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)]">No upcoming community events.</p>
        ) : (
          data.upcomingEvents.map((event) => (
            <ListRow
              key={event.id}
              primary={event.title}
              secondary={[event.venueName, event.city].filter(Boolean).join(' · ')}
              metric={new Date(event.startsAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            />
          ))
        )}
      </SectionCard>

      <div className="rounded-lg border border-dashed border-[var(--color-bg-border)] p-4 flex items-start gap-3">
        <Mic2 size={16} className="text-[var(--color-text-muted)] mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-xs font-medium text-[var(--color-text-primary)]">Engagement source</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Score from {data?.engagementSource === 'snapshot' ? 'CommunityIntelligenceSnapshot' : 'live member activity counts'} — no new analytics engine.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}

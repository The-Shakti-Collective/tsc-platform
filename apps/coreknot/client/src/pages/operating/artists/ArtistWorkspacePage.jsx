import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Spinner } from '../../../components/ui/Spinner';
import ArtistIndustryPanel from '../../../components/industry/ArtistIndustryPanel';
import ArtistHealthPanel from '../../../components/intelligence/ArtistHealthPanel';
import OpportunityIntelligencePanel from '../../../components/intelligence/OpportunityIntelligencePanel';
import RecommendedForYouPanel from '../../../components/agents/RecommendedForYouPanel';
import ArtistApplicationTracker from '../../../components/opportunities/ArtistApplicationTracker';
import EcosystemGraphView from '../../../components/intelligence/EcosystemGraphView';
import ArtistSuperfansPanel from '../../../components/intelligence/ArtistSuperfansPanel';
import AudienceInsightsPanel from '../../../components/intelligence/AudienceInsightsPanel';
import { SupportArtistButton } from '../../../components/passport/SupportArtistButton';
import { usePassportByArtistId } from '../../../hooks/queries/passport';
import { useArtistHealth } from '../../../hooks/queries/intelligence';
import { useArtistApplications } from '../../../hooks/queries/opportunity';

function MetricCard({ label, value, format = undefined }) {
  let display = '—';
  if (value != null && value !== '') {
    display = format ? format(value) : value.toLocaleString();
  }
  return (
    <div className="rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4">
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[var(--color-text-primary)]">{display}</p>
    </div>
  );
}

function formatCurrency(amount, currency = 'INR') {
  if (amount == null) return '—';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

function normalizeApplications(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export default function ArtistWorkspacePage() {
  const { artistId } = useParams();

  const passportQuery = usePassportByArtistId(artistId);
  const healthQuery = useArtistHealth(artistId);
  const applicationsQuery = useArtistApplications(artistId);

  const profile = useMemo(() => {
    const identity = passportQuery.data?.identity;
    if (!identity) return null;
    return {
      name: identity.displayName ?? identity.slug,
      bio: identity.bio,
      artistType: identity.headline,
      currentCity: null,
      status: passportQuery.data?.isPublic ? 'public' : 'private',
    };
  }, [passportQuery.data]);

  const overview = useMemo(() => {
    const applications = normalizeApplications(applicationsQuery.data);
    const career = passportQuery.data?.career ?? {};
    const reputation = passportQuery.data?.reputation ?? {};
    const openApplications = applications.filter((item) =>
      ['draft', 'submitted', 'shortlisted'].includes(item.status),
    );

    return {
      communityMembers: career.communities?.length ?? reputation.communityScore ?? null,
      monthlyListeners: null,
      upcomingGigs: career.eventsPlayed?.length ?? null,
      revenueThisMonth: null,
      currency: 'INR',
      pendingPayments: null,
      openOpportunities: openApplications.length,
      contentDue: null,
      tasksDue: healthQuery.data?.alerts?.length ?? null,
    };
  }, [applicationsQuery.data, passportQuery.data, healthQuery.data]);

  const isLoading = passportQuery.isLoading;
  const isError = passportQuery.isError;
  const error = passportQuery.error;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={32} />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 text-center space-y-2">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">Artist workspace unavailable</p>
        <p className="text-xs text-[var(--color-text-muted)]">
          {/** @type {import('axios').AxiosError} */ (error)?.response?.data?.error || error?.message || 'Passport not found for this artist.'}
        </p>
        <Link to="/operating/artists" className="text-sm text-[var(--color-brand-primary)]">
          Back to artists
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <Link to="/operating/artists" className="text-xs text-[var(--color-text-muted)] hover:underline">
          ← All artist workspaces
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">{profile.name}</h1>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              to={`/operating/artists/${artistId}/audience-os`}
              className="text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)]"
            >
              Audience OS →
            </Link>
            <Link
              to={`/operating/artists/${artistId}/career-os`}
              className="text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)]"
            >
              Career OS →
            </Link>
            <SupportArtistButton artistId={artistId} artistName={profile.name} compact />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-[var(--color-text-muted)]">
          {profile.artistType && <span>{profile.artistType}</span>}
          {profile.currentCity && <span>{profile.currentCity}</span>}
          {profile.status && <span className="capitalize">{profile.status}</span>}
        </div>
        {profile.bio && (
          <p className="text-sm text-[var(--color-text-muted)] max-w-3xl">{profile.bio}</p>
        )}
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Community members" value={overview?.communityMembers} />
          <MetricCard label="Monthly listeners" value={overview?.monthlyListeners} />
          <MetricCard label="Upcoming gigs" value={overview?.upcomingGigs} />
          <MetricCard
            label="Revenue this month"
            value={overview?.revenueThisMonth}
            format={(amount) => formatCurrency(amount, overview?.currency)}
          />
          <MetricCard label="Pending payments" value={overview?.pendingPayments} />
          <MetricCard label="Open opportunities" value={overview?.openOpportunities} />
          <MetricCard label="Content due" value={overview?.contentDue} />
          <MetricCard label="Tasks due" value={overview?.tasksDue} />
        </div>
      </section>

      <ArtistHealthPanel artistId={artistId} />

      <AudienceInsightsPanel artistId={artistId} />

      <ArtistSuperfansPanel artistId={artistId} />

      <ArtistIndustryPanel artistId={artistId} />

      <EcosystemGraphView artistId={artistId} />

      <RecommendedForYouPanel artistId={artistId} compact />

      <OpportunityIntelligencePanel compact artistId={artistId} />

      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Find Collaborators</h2>
          <Link
            to="/collaborations"
            className="text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)]"
          >
            Browse marketplace →
          </Link>
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">
          Post or apply to collaboration requests — producers, vocalists, videographers, and more.
        </p>
        <Link
          to="/collaborations/new"
          className="inline-block text-xs px-3 py-1.5 rounded-md bg-[var(--color-brand-primary)] text-white hover:opacity-90"
        >
          Post collaboration request
        </Link>
      </section>

      <ArtistApplicationTracker artistId={artistId} compact />

      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Fan Intelligence</h2>
          <Link
            to={`/operating/artists/${artistId}/fan-intelligence`}
            className="text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)]"
          >
            View fan segments →
          </Link>
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">
          Top fans, spend, loyalty, engagement, and dormant segments for this artist.
        </p>
      </section>

      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-2">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Profile sections</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Team, assets, and profile editing use the passport API — wired via
          {' '}
          <code className="text-xs">/api/artists/{artistId}/passport</code>
          .
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          {['profile', 'team', 'assets'].map((section) => (
            <span
              key={section}
              className="text-xs px-2 py-1 rounded-md border border-[var(--color-bg-border)] capitalize text-[var(--color-text-muted)]"
            >
              {section}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

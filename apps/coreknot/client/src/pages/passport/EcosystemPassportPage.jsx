import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Award,
  BadgeCheck,
  Calendar,
  ExternalLink,
  Globe,
  MapPin,
  Share2,
  Users,
} from 'lucide-react';
import { FollowButton } from '../../components/profile/FollowButton';
import { IdentityBadgeBar } from '../../components/identity/IdentityBadgeBar';
import { FanProfileSection } from '../../components/passport/FanProfileSection';
import { SupportArtistButton } from '../../components/passport/SupportArtistButton';
import { Spinner } from '../../components/ui/Spinner';
import { useEcosystemPassport } from '../../hooks/queries/profile';
import { fetchPublicTscIdentity } from '../../lib/identityNetworkApi';

const VERIFICATION_LABELS = {
  0: 'Unverified',
  1: 'Contact verified',
  2: 'Social connected',
  3: 'Community verified',
  4: 'TSC verified',
};

function ScoreRing({ label, value, visible = true }) {
  if (!visible || value == null) return null;
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 80 ? '#34d399' : pct >= 65 ? '#facc15' : '#fb7185';

  return (
    <div className="rounded-lg border border-[var(--color-bg-border)] p-4 text-center">
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function SectionList({ title, icon: Icon, items }) {
  if (!items?.length) return null;
  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-3">
      <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
        <Icon size={16} />
        {title}
      </h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id ?? item.opportunityId ?? `${item.title}-${item.entityId}`}
            className="flex items-start justify-between gap-3 text-sm border-b border-[var(--color-bg-border)] last:border-0 pb-2 last:pb-0"
          >
            <span className="text-[var(--color-text-primary)]">{item.title}</span>
            {item.effectiveFrom && (
              <span className="text-xs text-[var(--color-text-muted)] shrink-0">
                {new Date(item.effectiveFrom).getFullYear()}
              </span>
            )}
            {item.status && !item.effectiveFrom && (
              <span className="text-xs capitalize px-2 py-0.5 rounded-full border border-[var(--color-bg-border)] text-[var(--color-text-muted)]">
                {item.status}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Unified Ecosystem Passport — person-facing TSC profile surface.
 * Routes: /profile/:slug, /passport/:slug, /a/:slug
 */
export default function EcosystemPassportPage() {
  const { slug } = useParams();
  const location = useLocation();
  const { data, isLoading, isError } = useEcosystemPassport(slug);

  const namespace = location.pathname.startsWith('/a/')
    ? 'artist'
    : location.pathname.startsWith('/c/')
      ? 'community'
      : location.pathname.startsWith('/b/')
        ? 'brand'
        : 'fan';

  const { data: tscIdentity } = useQuery({
    queryKey: ['tsc-identity', namespace, slug],
    queryFn: () => fetchPublicTscIdentity(namespace, slug),
    enabled: !!slug,
  });

  const artistRole = data?.identity?.roles?.find(
    (role) => role.role === 'artist' || role.entityType === 'Artist',
  );
  const artistId = artistRole?.entityId ?? null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={32} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-3">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">Profile unavailable</p>
        <p className="text-xs text-[var(--color-text-muted)]">
          This TSC ecosystem profile is not published yet.
        </p>
        <Link to="/" className="text-sm text-[var(--color-brand-primary)]">
          Back home
        </Link>
      </div>
    );
  }

  const { identity, communities, events, opportunities, collaborations, reputation } = data;
  const verificationLabel =
    VERIFICATION_LABELS[identity.verificationLevel] ?? VERIFICATION_LABELS[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <header className="rounded-2xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="shrink-0">
            {identity.photoUrl ? (
              <img
                src={identity.photoUrl}
                alt=""
                className="h-28 w-28 rounded-2xl object-cover border border-[var(--color-bg-border)]"
              />
            ) : (
              <div className="h-28 w-28 rounded-2xl border border-[var(--color-bg-border)] bg-[var(--token-surface-2)] flex items-center justify-center text-3xl font-bold text-[var(--color-text-muted)]">
                {identity.displayName.slice(0, 1)}
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                  TSC Ecosystem Passport
                </p>
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {identity.displayName}
                </h1>
                {identity.username && (
                  <p className="text-sm text-[var(--color-text-muted)] mt-0.5">@{identity.username}</p>
                )}
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-[var(--color-bg-border)] text-[var(--color-text-muted)]">
                  <BadgeCheck size={14} className="text-[var(--color-brand-primary)]" />
                  {verificationLabel}
                </div>
                <div className="mt-3">
                  <IdentityBadgeBar
                    badges={tscIdentity?.badges ?? []}
                    canonicalUrl={tscIdentity?.identity?.canonicalUrl ?? data.shareUrl}
                    handle={tscIdentity?.identity?.handle}
                    compact
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {data._source === 'mock' && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">Sample data</span>
                )}
                <FollowButton personId={identity.personId} />
                {artistId && (
                  <SupportArtistButton
                    artistId={artistId}
                    artistName={identity.displayName}
                    compact
                  />
                )}
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--color-bg-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                  onClick={() => navigator.clipboard?.writeText(data.shareUrl)}
                >
                  <Share2 size={14} />
                  Share
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(identity.roles ?? []).map((role) => (
                <span
                  key={`${role.role}-${role.entityId ?? 'global'}`}
                  className="text-xs capitalize px-2 py-0.5 rounded-md bg-[var(--token-surface-2)] text-[var(--color-text-muted)]"
                >
                  {role.label ?? role.role}
                </span>
              ))}
            </div>

            {identity.city && (
              <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                <MapPin size={12} />
                {identity.city}
              </p>
            )}

            {identity.bio && (
              <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">{identity.bio}</p>
            )}

            {(identity.genres ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {identity.genres.map((genre) => (
                  <span
                    key={genre}
                    className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border border-[var(--color-bg-border)] text-[var(--color-text-muted)]"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {(identity.links ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {identity.links.map((link) => (
                  <a
                    key={`${link.label}-${link.url}`}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:underline"
                  >
                    <ExternalLink size={12} />
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="col-span-2 md:col-span-1 rounded-xl border border-[var(--color-bg-border)] p-4 flex flex-col items-center justify-center bg-[var(--token-surface-2)]">
          <Globe size={18} className="text-[var(--color-brand-primary)] mb-1" />
          <p className="text-xs text-[var(--color-text-muted)]">Ecosystem score</p>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">
            {reputation?.ecosystemScore ?? '—'}
          </p>
          {reputation?.ecosystemRankPercentile != null && (
            <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
              Top {100 - reputation.ecosystemRankPercentile}% stub
            </p>
          )}
        </div>
        <ScoreRing label="Reputation" value={reputation?.reputationScore} />
        <ScoreRing label="Health" value={reputation?.healthScore} />
        <ScoreRing label="Community" value={reputation?.communityScore} />
      </section>

      <FanProfileSection personId={identity.personId} />

      <div className="grid md:grid-cols-2 gap-4">
        <SectionList title="Communities" icon={Users} items={communities} />
        <SectionList title="Events" icon={Calendar} items={events} />
        <SectionList title="Collaborations" icon={Users} items={collaborations} />
        <SectionList title="Opportunities" icon={Award} items={opportunities} />
      </div>

      <p className="text-[10px] text-center text-[var(--color-text-muted)]">
        Ecosystem Passport merges PersonProfile + ArtistPassport. Scores are placeholders until Sprint 5.
      </p>
    </div>
  );
}

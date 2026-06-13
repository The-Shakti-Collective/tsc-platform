import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BadgeCheck,
  Briefcase,
  Camera,
  MapPin,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react';
import { IdentityBadgeBar } from '../../components/identity/IdentityBadgeBar';
import { Spinner } from '../../components/ui/Spinner';
import {
  CREATIVE_VERTICAL_OPTIONS,
  fetchCreativeIdentityRoles,
  fetchPublicCreativeIdentity,
} from '../../lib/creativeIdentityApi';
import { fetchCreativeIdentitySkills } from '../../lib/skillsApi';

const VERIFICATION_LABELS = {
  0: 'Unverified',
  1: 'Contact verified',
  2: 'Social connected',
  3: 'Community verified',
  4: 'TSC verified',
};

function TagList({ items, label }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={`${label}-${item}`}
          className="rounded-full border border-[var(--color-bg-border)] px-3 py-1 text-xs capitalize text-[var(--color-text-secondary)]"
        >
          {item.replace(/_/g, ' ')}
        </span>
      ))}
    </div>
  );
}

function EntityRoleCard({ role }) {
  const href =
    role.entityType === 'Artist' && role.entityId
      ? `/a/${role.entityId}`
      : role.entityType === 'Community' && role.entityId
        ? `/c/${role.entityId}`
        : null;

  const content = (
    <div className="rounded-lg border border-[var(--color-bg-border)] p-4 space-y-1">
      <p className="text-sm font-medium capitalize text-[var(--color-text-primary)]">
        {role.label ?? role.role.replace(/_/g, ' ')}
      </p>
      {role.entityType && (
        <p className="text-xs text-[var(--color-text-muted)]">
          {role.entityType}
          {role.entityId ? ` · ${role.entityId.slice(0, 8)}…` : ''}
        </p>
      )}
      <p className="text-xs text-[var(--color-text-muted)]">
        Since {new Date(role.assignedAt).getFullYear()}
      </p>
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="block hover:border-[var(--color-brand-primary)]">
        {content}
      </Link>
    );
  }

  return content;
}

/**
 * Universal Creative Identity — public multi-role creator profile.
 * Routes: /creator/:slug, /creative/:slug
 */
export default function CreativeIdentityPage() {
  const { slug } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['creative-identity', slug],
    queryFn: () => fetchPublicCreativeIdentity(slug),
    enabled: !!slug,
  });

  const { data: rolesPayload } = useQuery({
    queryKey: ['creative-identity-roles', slug],
    queryFn: () => fetchCreativeIdentityRoles(slug),
    enabled: !!slug,
  });

  const { data: skillsPayload } = useQuery({
    queryKey: ['creative-identity-skills', slug],
    queryFn: () => fetchCreativeIdentitySkills(slug),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !data?.identity) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-[var(--color-text-muted)]">
        Creative identity not found.
      </div>
    );
  }

  const { identity } = data;
  const entityRoles = rolesPayload?.roles ?? data.entityRoles ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      <header className="rounded-2xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-muted)] text-3xl font-bold text-[var(--color-brand-primary)]">
            {identity.avatarUrl ? (
              <img
                src={identity.avatarUrl}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              identity.displayName?.charAt(0)?.toUpperCase() ?? '?'
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                {identity.displayName}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-bg-border)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
                <BadgeCheck size={12} />
                {VERIFICATION_LABELS[identity.verificationLevel] ?? 'Unverified'}
              </span>
            </div>

            {identity.headline && (
              <p className="text-[var(--color-text-secondary)]">{identity.headline}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-[var(--color-text-muted)]">
              {identity.primaryCity && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} />
                  {identity.primaryCity}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Share2 size={14} />
                @{identity.slug}
              </span>
            </div>

            <IdentityBadgeBar personId={identity.personId} />

            {identity.bio && (
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {identity.bio}
              </p>
            )}
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {identity.trustScoreStub != null && (
          <div className="rounded-xl border border-[var(--color-bg-border)] p-4 text-center">
            <p className="text-xs text-[var(--color-text-muted)]">Trust (stub)</p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
              {Math.round(identity.trustScoreStub)}
            </p>
          </div>
        )}
        {identity.ecosystemScoreStub != null && (
          <div className="rounded-xl border border-[var(--color-bg-border)] p-4 text-center">
            <p className="text-xs text-[var(--color-text-muted)]">Ecosystem (stub)</p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
              {Math.round(identity.ecosystemScoreStub)}
            </p>
          </div>
        )}
        <div className="rounded-xl border border-[var(--color-bg-border)] p-4 text-center">
          <p className="text-xs text-[var(--color-text-muted)]">Active roles</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
            {entityRoles.length}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <Sparkles size={16} />
          Creative verticals
        </h2>
        <TagList items={identity.verticals?.length ? identity.verticals : CREATIVE_VERTICAL_OPTIONS.slice(0, 2)} label="vertical" />
      </section>

      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <Camera size={16} />
          Creative roles
        </h2>
        <TagList items={identity.roles} label="role" />
      </section>

      {((skillsPayload?.skills ?? identity.skills)?.length > 0 ||
        identity.capabilities?.length > 0) && (
        <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <Briefcase size={16} />
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {(skillsPayload?.skills ?? identity.skills ?? []).map((skill) => (
              <span
                key={skill.skillId ?? skill.skillSlug}
                className="rounded-full border border-[var(--color-bg-border)] px-3 py-1 text-xs text-[var(--color-text-secondary)]"
              >
                {skill.skillName ?? skill.skillSlug?.replace(/_/g, ' ')}
                {skill.isPrimary ? ' · primary' : ''}
                {skill.endorsementCount > 0 ? ` · ${skill.endorsementCount}★` : ''}
              </span>
            ))}
            {!skillsPayload?.skills?.length &&
              !identity.skills?.length &&
              identity.capabilities?.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[var(--color-bg-border)] px-3 py-1 text-xs text-[var(--color-text-muted)]"
                >
                  {item}
                </span>
              ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-[var(--color-bg-border)] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <Users size={16} />
          Entity-linked roles
        </h2>
        {entityRoles.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No linked roles yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {entityRoles.map((role) => (
              <EntityRoleCard key={role.id} role={role} />
            ))}
          </div>
        )}
      </section>

      <footer className="text-center text-xs text-[var(--color-text-muted)]">
        <Link to={`/profile/${slug}`} className="text-[var(--color-brand-primary)] hover:underline">
          View legacy profile
        </Link>
        {' · '}
        <Link to={`/passport/${slug}`} className="text-[var(--color-brand-primary)] hover:underline">
          View ecosystem passport
        </Link>
      </footer>
    </div>
  );
}

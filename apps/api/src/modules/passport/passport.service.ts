import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import {
  canManageArtist,
  type MembershipContext,
} from '@tsc/permissions';
import type {
  PassportCareerEvent,
  PassportLink,
  PassportPayload,
  PublicPassportPayload,
} from '@tsc/types';
import { OpportunityService } from '../opportunity/opportunity.service';
import type { PassportEditInput } from './dto';
import { PassportRepository } from './passport.repository';
import { PassportSyncEmitter } from './passport-sync.emitter';
import { TscIdentityProvisionService } from '../tsc-identity/tsc-identity-provision.service';

const ECOSYSTEM_WEIGHTS = {
  health: 0.4,
  community: 0.35,
  activity: 0.25,
} as const;

@Injectable()
export class PassportService {
  constructor(
    private readonly repository: PassportRepository,
    private readonly opportunityService: OpportunityService,
    private readonly syncEmitter: PassportSyncEmitter,
    private readonly tscIdentityProvision: TscIdentityProvisionService,
  ) {}

  async getPassportBySlug(
    slug: string,
    ctx?: MembershipContext,
  ): Promise<PassportPayload> {
    const passport = await this.repository.findBySlug(slug);
    if (!passport) throw new NotFoundException(`Passport ${slug} not found`);

    if (!passport.isPublic) {
      this.assertPassportAccess(ctx, passport.artistId);
    }

    return this.buildPassportPayload(passport, { includePrivate: true });
  }

  async getPublicPassportBySlug(slug: string): Promise<PublicPassportPayload> {
    const passport = await this.repository.findPublicBySlug(slug);
    if (!passport) {
      throw new NotFoundException(`Public passport ${slug} not found`);
    }

    return this.buildPassportPayload(passport, { includePrivate: false, publicOnly: true });
  }

  async getPassportByArtistId(
    artistId: string,
    ctx: MembershipContext,
  ): Promise<PassportPayload> {
    this.assertPassportAccess(ctx, artistId);

    let passport = await this.repository.findByArtistId(artistId);
    if (!passport) {
      const artist = await this.repository.findArtistById(artistId);
      if (!artist) throw new NotFoundException(`Artist ${artistId} not found`);
      passport = await this.ensurePassportStub({
        artistId: artist.id,
        slug: artist.slug,
        displayName: artist.displayName ?? artist.name,
      });
    }

    return this.buildPassportPayload(passport, { includePrivate: true });
  }

  async updatePassport(
    artistId: string,
    input: PassportEditInput,
    ctx: MembershipContext,
  ): Promise<PassportPayload> {
    this.assertPassportAccess(ctx, artistId);

    let passport = await this.repository.findByArtistId(artistId);
    if (!passport) {
      const artist = await this.repository.findArtistById(artistId);
      if (!artist) throw new NotFoundException(`Artist ${artistId} not found`);
      passport = await this.ensurePassportStub({
        artistId: artist.id,
        slug: artist.slug,
        displayName: artist.displayName ?? artist.name,
      });
    }

    const updated = await this.repository.updatePassport(artistId, input);
    return this.buildPassportPayload(updated, { includePrivate: true });
  }

  /**
   * Sync Layer entry — call when artist row is created.
   * Idempotent: returns existing passport if stub already exists.
   */
  async ensurePassportStub(input: {
    artistId: string;
    slug: string;
    displayName?: string | null;
  }) {
    const existing = await this.repository.findByArtistId(input.artistId);
    if (existing) return existing;

    const passport = await this.repository.createStub({
      artistId: input.artistId,
      slug: input.slug,
      headline: input.displayName ?? null,
    });

    this.syncEmitter.emitArtistCreated({
      artistId: input.artistId,
      slug: input.slug,
      displayName: input.displayName,
    });

    void this.tscIdentityProvision.ensureArtistIdentity(
      input.artistId,
      input.slug,
      passport.isPublic,
    );

    return passport;
  }

  async getPassportCardSummary(slug: string): Promise<{
    slug: string;
    displayName: string;
    headline: string | null;
    photoUrl: string | null;
    ecosystemScore: number | null;
    healthScore: number | null;
    shareUrl: string;
  } | null> {
    const passport = await this.repository.findPublicBySlug(slug);
    if (!passport) return null;

    const scores = await this.readReputationScores(passport.artistId);
    const ecosystemScore =
      passport.cachedEcosystemScore ??
      computeEcosystemScore(
        scores.healthScore,
        scores.communityScore,
        scores.activityScore,
      );

    return {
      slug: passport.slug,
      displayName:
        passport.artist.displayName ??
        passport.artist.name ??
        passport.slug,
      headline: passport.headline,
      photoUrl: passport.photoUrl ?? passport.artist.photoUrl ?? null,
      ecosystemScore,
      healthScore: passport.showHealthScore ? scores.healthScore : null,
      shareUrl: buildShareUrl(passport.slug),
    };
  }

  private async buildPassportPayload(
    passport: PassportRow,
    options: { includePrivate: boolean; publicOnly?: boolean },
  ): Promise<PassportPayload> {
    const artist = passport.artist;
    const scores = await this.readReputationScores(passport.artistId);
    const ecosystemScore = computeEcosystemScore(
      scores.healthScore,
      scores.communityScore,
      scores.activityScore,
    );

    if (
      ecosystemScore != null &&
      ecosystemScore !== passport.cachedEcosystemScore
    ) {
      await this.repository
        .updateCachedEcosystemScore(passport.artistId, ecosystemScore)
        .catch(() => undefined);
    }

    const career = await this.buildCareerSection(
      passport.artistId,
      passport.showCareerGraph,
      options.publicOnly,
    );

    const opportunityHistory =
      !options.publicOnly || passport.showOpportunityHistory
        ? await this.opportunityService.getPassportOpportunityHistory(
            passport.artistId,
          )
        : [];

    const reputation = this.buildReputation(passport, scores, options.publicOnly);

    return {
      identity: {
        artistId: passport.artistId,
        slug: passport.slug,
        displayName: artist.displayName ?? artist.name ?? passport.slug,
        headline: passport.headline,
        bio: passport.bio ?? artist.bio ?? null,
        photoUrl: passport.photoUrl ?? artist.photoUrl ?? null,
        links: parseLinks(passport.links),
      },
      career,
      opportunityHistory:
        !options.publicOnly || passport.showOpportunityHistory
          ? opportunityHistory
          : [],
      reputation,
      ecosystemScore:
        options.publicOnly && !passport.showHealthScore && !passport.showCommunityScore
          ? null
          : (passport.cachedEcosystemScore ?? ecosystemScore),
      isPublic: passport.isPublic,
      shareUrl: buildShareUrl(passport.slug),
      updatedAt: passport.updatedAt.toISOString(),
    };
  }

  private async buildCareerSection(
    artistId: string,
    showCareerGraph: boolean,
    publicOnly?: boolean,
  ): Promise<PassportPayload['career']> {
    const empty = { eventsPlayed: [], communities: [], collaborations: [] };
    if (publicOnly && !showCareerGraph) return empty;

    const edges = await this.repository.listCareerRelationships(artistId);
    const refs = edges.flatMap((edge) => {
      const peer = resolvePeerEntity(edge, artistId);
      return peer ? [peer] : [];
    });
    const titles = await this.repository.resolveEntityTitles(refs);

    const eventsPlayed: PassportCareerEvent[] = [];
    const communities: PassportCareerEvent[] = [];
    const collaborations: PassportCareerEvent[] = [];

    for (const edge of edges) {
      const peer = resolvePeerEntity(edge, artistId);
      if (!peer) continue;

      const item: PassportCareerEvent = {
        id: edge.id,
        relationshipType: edge.relationshipType as PassportCareerEvent['relationshipType'],
        entityType: peer.entityType,
        entityId: peer.entityId,
        title: titles.get(`${peer.entityType}:${peer.entityId}`) ?? peer.entityId,
        effectiveFrom: edge.effectiveFrom?.toISOString() ?? null,
        metadata: parseMetadata(edge.metadata),
      };

      if (edge.relationshipType === 'PERFORMED_AT') eventsPlayed.push(item);
      else if (edge.relationshipType === 'MEMBER_OF') communities.push(item);
      else if (edge.relationshipType === 'COLLABORATED_WITH') {
        collaborations.push(item);
      }
    }

    return { eventsPlayed, communities, collaborations };
  }

  private buildReputation(
    passport: PassportRow,
    scores: ReputationScores,
    publicOnly?: boolean,
  ): PassportPayload['reputation'] {
    const visibility = {
      showHealthScore: passport.showHealthScore,
      showCommunityScore: passport.showCommunityScore,
      showActivityScore: passport.showActivityScore,
    };

    if (publicOnly) {
      return {
        healthScore: passport.showHealthScore ? scores.healthScore : null,
        communityScore: passport.showCommunityScore ? scores.communityScore : null,
        activityScore: passport.showActivityScore ? scores.activityScore : null,
        healthSnapshotDate: passport.showHealthScore ? scores.healthSnapshotDate : null,
        communitySnapshotDate: passport.showCommunityScore
          ? scores.communitySnapshotDate
          : null,
        dimensions:
          passport.showHealthScore || passport.showActivityScore
            ? scores.dimensions
            : null,
        visibility,
      };
    }

    return {
      healthScore: scores.healthScore,
      communityScore: scores.communityScore,
      activityScore: scores.activityScore,
      healthSnapshotDate: scores.healthSnapshotDate,
      communitySnapshotDate: scores.communitySnapshotDate,
      dimensions: scores.dimensions,
      visibility,
    };
  }

  /** Reads latest snapshots only — no analytics recalculation. */
  private async readReputationScores(artistId: string): Promise<ReputationScores> {
    const [healthSnapshot, primaryCommunity] = await Promise.all([
      this.repository.findLatestHealthSnapshot(artistId),
      this.repository.findPrimaryCommunityId(artistId),
    ]);

    const communitySnapshot = primaryCommunity
      ? await this.repository.findLatestCommunitySnapshot(primaryCommunity.id)
      : null;

    const dimensions = parseDimensionScores(healthSnapshot?.dimensions);
    const activityScore = readActivityScoreFromDimensions(dimensions);

    return {
      healthScore: healthSnapshot?.healthScore ?? null,
      communityScore: communitySnapshot?.growth ?? null,
      activityScore,
      healthSnapshotDate: healthSnapshot?.snapshotDate?.toISOString() ?? null,
      communitySnapshotDate: communitySnapshot?.snapshotDate?.toISOString() ?? null,
      dimensions,
    };
  }

  private assertPassportAccess(ctx: MembershipContext | undefined, artistId: string) {
    if (!ctx || !canManageArtist(ctx, artistId)) {
      throw new ForbiddenException('Artist access required for private passport');
    }
  }
}

type PassportRow = NonNullable<Awaited<ReturnType<PassportRepository['findBySlug']>>>;

interface ReputationScores {
  healthScore: number | null;
  communityScore: number | null;
  activityScore: number | null;
  healthSnapshotDate: string | null;
  communitySnapshotDate: string | null;
  dimensions: Record<string, number> | null;
}

function computeEcosystemScore(
  health: number | null,
  community: number | null,
  activity: number | null,
): number | null {
  const parts: Array<{ value: number; weight: number }> = [];
  if (health != null) parts.push({ value: health, weight: ECOSYSTEM_WEIGHTS.health });
  if (community != null) {
    parts.push({ value: community, weight: ECOSYSTEM_WEIGHTS.community });
  }
  if (activity != null) parts.push({ value: activity, weight: ECOSYSTEM_WEIGHTS.activity });
  if (parts.length === 0) return null;

  const totalWeight = parts.reduce((sum, part) => sum + part.weight, 0);
  const weighted = parts.reduce((sum, part) => sum + part.value * part.weight, 0);
  return round1(weighted / totalWeight);
}

function readActivityScoreFromDimensions(
  dimensions: Record<string, number> | null,
): number | null {
  if (!dimensions) return null;
  if (typeof dimensions.activity === 'number') return dimensions.activity;
  const communityActivity = dimensions.communityActivity;
  const shows = dimensions.shows;
  if (typeof communityActivity === 'number' && typeof shows === 'number') {
    return round1((communityActivity + shows) / 2);
  }
  if (typeof communityActivity === 'number') return communityActivity;
  if (typeof shows === 'number') return shows;
  return null;
}

function parseDimensionScores(value: Prisma.JsonValue | undefined | null) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const parsed: Record<string, number> = {};
  for (const [key, raw] of Object.entries(record)) {
    if (typeof raw === 'number' && Number.isFinite(raw)) parsed[key] = raw;
  }
  return Object.keys(parsed).length > 0 ? parsed : null;
}

function parseLinks(value: Prisma.JsonValue | undefined | null): PassportLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is { label: string; url: string } =>
        !!item &&
        typeof item === 'object' &&
        typeof (item as Record<string, unknown>).label === 'string' &&
        typeof (item as Record<string, unknown>).url === 'string',
    )
    .map((item) => ({ label: item.label, url: item.url }));
}

function parseMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function resolvePeerEntity(
  edge: {
    sourceEntityType: string;
    sourceEntityId: string;
    targetEntityType: string;
    targetEntityId: string;
  },
  artistId: string,
): { entityType: string; entityId: string } | null {
  if (edge.sourceEntityType === 'Artist' && edge.sourceEntityId === artistId) {
    return { entityType: edge.targetEntityType, entityId: edge.targetEntityId };
  }
  if (edge.targetEntityType === 'Artist' && edge.targetEntityId === artistId) {
    return { entityType: edge.sourceEntityType, entityId: edge.sourceEntityId };
  }
  return null;
}

function buildShareUrl(slug: string): string {
  const base = process.env.TSC_PUBLIC_URL ?? 'https://tsc.in';
  return `${base}/${slug}`;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

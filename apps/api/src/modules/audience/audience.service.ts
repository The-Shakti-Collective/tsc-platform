import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  CHURN_RISK_RETENTION_THRESHOLD,
  HIGH_GROWTH_AUDIENCE_THRESHOLD,
} from '@tsc/database';
import type {
  AudienceHealthRefreshPayload,
  AudienceHealthSnapshotPayload,
  ChurnRiskArtistsPayload,
  CommandCenterAudienceBlock,
  CommunityAudienceRefreshPayload,
  CommunityAudienceSnapshotPayload,
  TopGrowthArtistsPayload,
} from '@tsc/types';
import type { MembershipContext } from '@tsc/permissions';
import { AudienceRepository } from './audience.repository';

@Injectable()
export class AudienceService {
  constructor(private readonly repository: AudienceRepository) {}

  async getArtistAudienceHealth(artistId: string): Promise<AudienceHealthSnapshotPayload> {
    const artist = await this.repository.findArtist(artistId);
    if (!artist) throw new NotFoundException(`Artist ${artistId} not found`);

    const cached = await this.repository.findLatestAudienceHealth(artistId);
    if (cached) return this.toArtistPayload(cached);

    return this.computeAndPersistArtistHealth(artistId);
  }

  async refreshArtistAudienceHealth(
    artistId: string,
    ctx: MembershipContext,
  ): Promise<AudienceHealthRefreshPayload> {
    this.assertAdmin(ctx);
    const artist = await this.repository.findArtist(artistId);
    if (!artist) throw new NotFoundException(`Artist ${artistId} not found`);

    const previous = await this.repository.findLatestAudienceHealth(artistId);
    const payload = await this.computeAndPersistArtistHealth(artistId);

    return {
      ...payload,
      previousSnapshotDate: previous?.snapshotDate.toISOString() ?? null,
      recomputed: true,
    };
  }

  async getCommunityAudience(communityId: string): Promise<CommunityAudienceSnapshotPayload> {
    const community = await this.repository.findCommunity(communityId);
    if (!community) throw new NotFoundException(`Community ${communityId} not found`);

    const cached = await this.repository.findLatestCommunityAudience(communityId);
    if (cached) return this.toCommunityPayload(cached);

    return this.computeAndPersistCommunityAudience(communityId, community.artistId);
  }

  async refreshCommunityAudience(
    communityId: string,
    ctx: MembershipContext,
  ): Promise<CommunityAudienceRefreshPayload> {
    this.assertAdmin(ctx);
    const community = await this.repository.findCommunity(communityId);
    if (!community) throw new NotFoundException(`Community ${communityId} not found`);

    const previous = await this.repository.findLatestCommunityAudience(communityId);
    const payload = await this.computeAndPersistCommunityAudience(
      communityId,
      community.artistId,
    );

    return {
      ...payload,
      previousSnapshotDate: previous?.snapshotDate.toISOString() ?? null,
      recomputed: true,
    };
  }

  async getTopGrowthArtists(limit: number): Promise<TopGrowthArtistsPayload> {
    const rows = await this.repository.listTopGrowthArtists(
      limit,
      HIGH_GROWTH_AUDIENCE_THRESHOLD,
    );

    return {
      artists: rows.map((row) => ({
        artistId: row.artist.id,
        name: row.artist.name,
        slug: row.artist.slug,
        audienceGrowth: row.audienceGrowth,
        fanRetention: row.fanRetention,
        lifetimeValueStub: row.lifetimeValueStub,
        snapshotDate: row.snapshotDate.toISOString(),
      })),
      threshold: HIGH_GROWTH_AUDIENCE_THRESHOLD,
      updatedAt: new Date().toISOString(),
    };
  }

  async getChurnRiskArtists(limit: number): Promise<ChurnRiskArtistsPayload> {
    const rows = await this.repository.listChurnRiskArtists(
      limit,
      CHURN_RISK_RETENTION_THRESHOLD,
    );

    return {
      artists: rows.map((row) => ({
        artistId: row.artist.id,
        name: row.artist.name,
        slug: row.artist.slug,
        fanRetention: row.fanRetention,
        audienceChurn: row.audienceChurn,
        audienceGrowth: row.audienceGrowth,
        snapshotDate: row.snapshotDate.toISOString(),
        riskLevel: row.fanRetention < 30 ? 'high' : 'elevated',
      })),
      threshold: CHURN_RISK_RETENTION_THRESHOLD,
      updatedAt: new Date().toISOString(),
    };
  }

  async getCommandCenterAudienceBlock(limit = 5): Promise<CommandCenterAudienceBlock> {
    const [loyalCommunities, growthArtists, churnRisk] = await Promise.all([
      this.repository.listMostLoyalCommunities(limit),
      this.getTopGrowthArtists(limit),
      this.getChurnRiskArtists(limit),
    ]);

    return {
      mostLoyalCommunities: loyalCommunities.map((row) => {
        const metrics =
          row.metrics && typeof row.metrics === 'object' && !Array.isArray(row.metrics)
            ? (row.metrics as Record<string, unknown>)
            : {};
        const totalMembers = Number(metrics.totalMembers ?? row.activeMembers);
        const fanRetention =
          totalMembers > 0
            ? Math.round((row.activeMembers / totalMembers) * 10000) / 100
            : row.fanGrowth;

        return {
          communityId: row.community.id,
          name: row.community.name,
          fanRetention,
          memberGrowth: row.memberGrowth,
          activeMembers: row.activeMembers,
        };
      }),
      highestGrowthArtists: growthArtists.artists,
      highestChurnRisk: churnRisk.artists,
      updatedAt: new Date().toISOString(),
    };
  }

  private async computeAndPersistArtistHealth(
    artistId: string,
  ): Promise<AudienceHealthSnapshotPayload> {
    const computed = await this.repository.collectArtistAudienceInput(artistId);
    const snapshot = await this.repository.upsertAudienceHealth(artistId, computed);
    if (!snapshot) {
      throw new ServiceUnavailableException(
        'AudienceHealthSnapshot model unavailable — apply phase8-step5.prisma migration',
      );
    }
    return this.toArtistPayload(snapshot);
  }

  private async computeAndPersistCommunityAudience(
    communityId: string,
    artistId: string | null,
  ): Promise<CommunityAudienceSnapshotPayload> {
    const computed = await this.repository.collectCommunityAudienceInput(communityId, artistId);
    const snapshot = await this.repository.upsertCommunityAudience(communityId, computed);
    if (!snapshot) {
      throw new ServiceUnavailableException(
        'CommunityAudienceSnapshot model unavailable — apply phase8-step5.prisma migration',
      );
    }
    return this.toCommunityPayload(snapshot);
  }

  private toArtistPayload(row: {
    artistId: string;
    snapshotDate: Date;
    audienceGrowth: number;
    audienceChurn: number;
    fanRetention: number;
    fanConversion: number;
    lifetimeValueStub: number;
    metrics: unknown;
    updatedAt: Date;
  }): AudienceHealthSnapshotPayload {
    return {
      artistId: row.artistId,
      snapshotDate: row.snapshotDate.toISOString(),
      audienceGrowth: row.audienceGrowth,
      audienceChurn: row.audienceChurn,
      fanRetention: row.fanRetention,
      fanConversion: row.fanConversion,
      lifetimeValueStub: row.lifetimeValueStub,
      metrics: (row.metrics ?? {}) as Record<string, unknown>,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toCommunityPayload(row: {
    communityId: string;
    snapshotDate: Date;
    memberGrowth: number;
    activeMembers: number;
    membershipRevenueStub: number;
    fanGrowth: number;
    eventConversion: number;
    metrics: unknown;
    updatedAt: Date;
  }): CommunityAudienceSnapshotPayload {
    return {
      communityId: row.communityId,
      snapshotDate: row.snapshotDate.toISOString(),
      memberGrowth: row.memberGrowth,
      activeMembers: row.activeMembers,
      membershipRevenueStub: row.membershipRevenueStub,
      fanGrowth: row.fanGrowth,
      eventConversion: row.eventConversion,
      metrics: (row.metrics ?? {}) as Record<string, unknown>,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private assertAdmin(ctx: MembershipContext) {
    if (!ctx.roles.includes('admin')) {
      throw new ForbiddenException('Admin role required to refresh audience snapshots');
    }
  }
}

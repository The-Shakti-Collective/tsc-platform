import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  calculateSuperfanScore,
  type SuperfanTier,
} from '@tsc/database';
import type {
  ArtistSuperfanSegmentsPayload,
  ArtistSuperfansPayload,
  SuperfanPayload,
  SuperfanRefreshPayload,
} from '@tsc/types';
import type { MembershipContext } from '@tsc/permissions';
import { CreditsService } from '../credits/credits.service';
import { FanRepository } from './fan.repository';

@Injectable()
export class SuperfanService {
  constructor(
    private readonly repository: FanRepository,
    private readonly creditsService: CreditsService,
  ) {}

  async getSuperfan(
    personId: string,
    artistId?: string,
  ): Promise<SuperfanPayload> {
    const person = await this.repository.findPerson(personId);
    if (!person) {
      throw new NotFoundException(`Person ${personId} not found`);
    }
    if (artistId) {
      const artist = await this.repository.findArtist(artistId);
      if (!artist) {
        throw new NotFoundException(`Artist ${artistId} not found`);
      }
    }

    const cached = await this.repository.findLatestSuperfanSnapshot(personId, artistId);
    if (cached) {
      return this.toPayload(cached);
    }

    return this.computeAndPersistSuperfan(personId, artistId);
  }

  async refreshSuperfan(
    personId: string,
    artistId: string | undefined,
    ctx: MembershipContext,
  ): Promise<SuperfanRefreshPayload> {
    if (!ctx.roles.includes('admin')) {
      throw new ForbiddenException('Admin role required to refresh superfan score');
    }

    const person = await this.repository.findPerson(personId);
    if (!person) {
      throw new NotFoundException(`Person ${personId} not found`);
    }
    if (artistId) {
      const artist = await this.repository.findArtist(artistId);
      if (!artist) {
        throw new NotFoundException(`Artist ${artistId} not found`);
      }
    }

    const previous = await this.repository.findLatestSuperfanSnapshot(personId, artistId);
    const previousTier = (previous?.tier as SuperfanTier | undefined) ?? null;

    const payload = await this.computeAndPersistSuperfan(personId, artistId);

    let platinumCreditAwarded = false;
    if (
      payload.tier === 'platinum' &&
      previousTier !== 'platinum' &&
      previousTier !== 'legend'
    ) {
      const latest = await this.repository.findLatestSuperfanSnapshot(personId, artistId);
      if (latest) {
        const earnResult = await this.creditsService.earnFromSuperfanPlatinum(
          personId,
          latest.id,
        );
        platinumCreditAwarded = earnResult != null;
      }
    }

    return {
      ...payload,
      previousTier,
      platinumCreditAwarded,
    };
  }

  private async computeAndPersistSuperfan(
    personId: string,
    artistId?: string,
  ): Promise<SuperfanPayload> {
    const input = await this.repository.collectSuperfanFactorInput(personId, artistId);
    const profile = await this.repository.findFanProfile(personId);
    const calculation = calculateSuperfanScore({
      ...input,
      spendScore: profile?.spendScore ?? input.spendScore,
    });

    const snapshot = await this.repository.upsertSuperfanSnapshot({
      personId,
      artistId: artistId ?? null,
      superfanScore: calculation.superfanScore,
      tier: calculation.tier,
      factors: calculation.factors,
    });

    if (!snapshot) {
      throw new ServiceUnavailableException(
        'SuperfanSnapshot model unavailable — apply phase8-step2.prisma migration',
      );
    }

    return this.toPayload(snapshot);
  }

  async getArtistSuperfans(
    artistId: string,
    limit: number,
  ): Promise<ArtistSuperfansPayload> {
    const artist = await this.repository.findArtist(artistId);
    if (!artist) {
      throw new NotFoundException(`Artist ${artistId} not found`);
    }

    const rows = await this.repository.listTopSuperfansByArtist(artistId, limit);
    const superfans = rows.map((row) => ({
      personId: row.personId,
      displayName:
        row.person.displayName?.trim() ||
        row.person.name?.trim() ||
        row.personId,
      slug: row.person.profile?.slug ?? null,
      superfanScore: row.superfanScore,
      tier: row.tier as SuperfanTier,
      snapshotDate: row.snapshotDate.toISOString(),
    }));

    return {
      artistId,
      superfans,
      total: superfans.length,
      updatedAt: new Date().toISOString(),
    };
  }

  async getArtistSuperfanSegments(artistId: string): Promise<ArtistSuperfanSegmentsPayload> {
    const artist = await this.repository.findArtist(artistId);
    if (!artist) {
      throw new NotFoundException(`Artist ${artistId} not found`);
    }

    const segments = await this.repository.countSuperfanSegmentsByArtist(artistId);
    const totalFans = segments.reduce((sum, row) => sum + row.count, 0);

    return {
      artistId,
      segments: segments.map((row) => ({
        tier: row.tier as SuperfanTier,
        count: row.count,
      })),
      totalFans,
      updatedAt: new Date().toISOString(),
    };
  }

  private toPayload(row: {
    personId: string;
    artistId: string | null;
    superfanScore: number;
    tier: string;
    factors: unknown;
    snapshotDate: Date;
    updatedAt: Date;
  }): SuperfanPayload {
    return {
      personId: row.personId,
      artistId: row.artistId,
      superfanScore: row.superfanScore,
      tier: row.tier as SuperfanTier,
      factors: row.factors as SuperfanPayload['factors'],
      snapshotDate: row.snapshotDate.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

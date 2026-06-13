import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  AgencyArtistsPayload,
  AgencyDetail,
  AgencyListPayload,
  AgencySummary,
} from '@tsc/types';
import type { MembershipContext } from '@tsc/permissions';
import { ActivityService } from '../activity/activity.service';
import type { AgencyCreateInput, AgencyListQuery, AgencyUpdateInput } from './dto';
import { AgencyRepository } from './agency.repository';

@Injectable()
export class AgencyService {
  constructor(
    private readonly repository: AgencyRepository,
    private readonly activityService: ActivityService,
  ) {}

  async list(query: AgencyListQuery): Promise<AgencyListPayload> {
    this.assertAvailable();
    const rows = await this.repository.list(query);
    const counts = await Promise.all(
      rows.map((row) => this.repository.countManagedArtists(row.id)),
    );
    return {
      items: rows.map((row, index) => this.toSummary(row, counts[index] ?? 0)),
      filters: { city: query.city ?? null },
      updatedAt: new Date().toISOString(),
    };
  }

  async getDetail(id: string): Promise<AgencyDetail> {
    this.assertAvailable();
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException(`Agency ${id} not found`);
    const count = await this.repository.countManagedArtists(id);
    return this.toSummary(row, count);
  }

  async create(input: AgencyCreateInput, ctx: MembershipContext): Promise<AgencySummary> {
    this.assertAvailable();
    const personId = ctx.personId ?? null;
    const row = await this.repository.create(input, personId);
    if (!row) throw new ServiceUnavailableException('Agency persistence failed');

    if (personId) {
      await this.activityService.record({
        actorPersonId: personId,
        action: 'created_agency',
        targetType: 'Agency',
        targetId: row.id,
        metadata: { agencyName: row.name, city: row.city },
      });
    }

    return this.toSummary(row, 0);
  }

  async update(id: string, input: AgencyUpdateInput): Promise<AgencyDetail> {
    this.assertAvailable();
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Agency ${id} not found`);

    const row = await this.repository.update(id, input);
    if (!row) throw new ServiceUnavailableException('Agency update failed');
    return this.getDetail(id);
  }

  async listArtists(id: string): Promise<AgencyArtistsPayload> {
    await this.getDetail(id);
    const relationships = await this.repository.listManagedArtists(id);
    const artistIds = relationships.map((rel) => rel.targetEntityId);
    const artists = await this.repository.resolveArtists(artistIds);
    const artistById = new Map(artists.map((artist) => [artist.id, artist]));

    return {
      agencyId: id,
      items: relationships
        .map((rel) => {
          const artist = artistById.get(rel.targetEntityId);
          if (!artist) return null;
          return {
            artistId: artist.id,
            artistName: artist.name,
            artistSlug: artist.slug,
            relationshipId: rel.id,
            relationshipType: 'MANAGES' as const,
            since: rel.effectiveFrom?.toISOString() ?? rel.createdAt.toISOString(),
          };
        })
        .filter((item): item is NonNullable<typeof item> => item != null),
      updatedAt: new Date().toISOString(),
    };
  }

  private assertAvailable() {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException('Agency model not migrated yet');
    }
  }

  private toSummary(
    row: {
      id: string;
      name: string;
      website: string | null;
      city: string | null;
      teamSize: number | null;
      personId: string | null;
      createdAt: Date;
      updatedAt: Date;
      contact?: {
        id: string;
        displayName: string | null;
        name: string | null;
        profile?: { slug: string; username: string | null } | null;
      } | null;
    },
    representedArtistCount: number,
  ): AgencySummary {
    const contactName =
      row.contact?.displayName?.trim() ||
      row.contact?.name?.trim() ||
      null;
    return {
      id: row.id,
      name: row.name,
      website: row.website,
      city: row.city,
      teamSize: row.teamSize,
      personId: row.personId,
      contactName,
      contactSlug: row.contact?.profile?.slug ?? row.contact?.profile?.username ?? null,
      representedArtistCount,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

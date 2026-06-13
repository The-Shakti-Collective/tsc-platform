import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  LabelDetail,
  LabelListPayload,
  LabelRosterPayload,
  LabelSigningStubPayload,
  LabelSummary,
} from '@tsc/types';
import type { MembershipContext } from '@tsc/permissions';
import { ActivityService } from '../activity/activity.service';
import type {
  LabelCreateInput,
  LabelListQuery,
  LabelSigningStubInput,
  LabelUpdateInput,
} from './dto';
import { LabelRepository } from './label.repository';

@Injectable()
export class LabelService {
  constructor(
    private readonly repository: LabelRepository,
    private readonly activityService: ActivityService,
  ) {}

  async list(query: LabelListQuery): Promise<LabelListPayload> {
    this.assertAvailable();
    const rows = await this.repository.list(query);
    const counts = await Promise.all(
      rows.map((row) => this.repository.countRoster(row.id)),
    );
    return {
      items: rows.map((row, index) => this.toSummary(row, counts[index] ?? 0)),
      filters: {
        genre: query.genre ?? null,
        city: query.city ?? null,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  async getDetail(id: string): Promise<LabelDetail> {
    this.assertAvailable();
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException(`Label ${id} not found`);
    const count = await this.repository.countRoster(id);
    return this.toSummary(row, count);
  }

  async create(input: LabelCreateInput, ctx: MembershipContext): Promise<LabelSummary> {
    this.assertAvailable();
    const row = await this.repository.create(input);
    if (!row) throw new ServiceUnavailableException('Label persistence failed');

    if (ctx.personId) {
      await this.activityService.record({
        actorPersonId: ctx.personId,
        action: 'created_label',
        targetType: 'Label',
        targetId: row.id,
        metadata: { labelName: row.name, genre: row.genre },
      });
    }

    return this.toSummary(row, 0);
  }

  async update(id: string, input: LabelUpdateInput): Promise<LabelDetail> {
    this.assertAvailable();
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Label ${id} not found`);

    const row = await this.repository.update(id, input);
    if (!row) throw new ServiceUnavailableException('Label update failed');
    return this.getDetail(id);
  }

  async listRoster(id: string): Promise<LabelRosterPayload> {
    await this.getDetail(id);
    const relationships = await this.repository.listRosterRelationships(id);
    const artistIds = relationships.map((rel) => rel.targetEntityId);
    const artists = await this.repository.resolveArtists(artistIds);
    const artistById = new Map(artists.map((artist) => [artist.id, artist]));

    return {
      labelId: id,
      items: relationships
        .map((rel) => {
          const artist = artistById.get(rel.targetEntityId);
          if (!artist) return null;
          return {
            artistId: artist.id,
            artistName: artist.name,
            artistSlug: artist.slug,
            relationshipId: rel.id,
            relationshipType: rel.relationshipType as 'MANAGES' | 'SIGNED_TO',
            since: rel.effectiveFrom?.toISOString() ?? rel.createdAt.toISOString(),
          };
        })
        .filter((item): item is NonNullable<typeof item> => item != null),
      updatedAt: new Date().toISOString(),
    };
  }

  async recordSigningStub(
    id: string,
    input: LabelSigningStubInput,
  ): Promise<LabelSigningStubPayload> {
    await this.getDetail(id);
    const relationship = await this.repository.createSigningStub(id, input);
    return {
      labelId: id,
      artistId: input.artistId,
      relationshipId: relationship.id,
      relationshipType: 'SIGNED_TO',
      stubbed: true,
      message: 'Signing workflow stub — full contract flow deferred to Month 2+',
      createdAt: relationship.createdAt.toISOString(),
    };
  }

  private assertAvailable() {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException('Label model not migrated yet');
    }
  }

  private toSummary(
    row: {
      id: string;
      name: string;
      genre: string | null;
      website: string | null;
      city: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
    rosterCount: number,
  ): LabelSummary {
    return {
      id: row.id,
      name: row.name,
      genre: row.genre,
      website: row.website,
      city: row.city,
      rosterCount,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

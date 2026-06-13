import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  WhiteLabelBrandingConfig,
  WhiteLabelTenantArtistsPayload,
  WhiteLabelTenantSummary,
} from '@tsc/types';
import type { WhiteLabelTenantCreateInput } from './dto';
import { WhiteLabelRepository } from './white-label.repository';

@Injectable()
export class WhiteLabelService {
  constructor(private readonly repository: WhiteLabelRepository) {}

  async getPublicConfig(slug: string): Promise<WhiteLabelBrandingConfig> {
    this.assertAvailable();
    const row = await this.repository.findBySlug(slug);
    if (!row) throw new NotFoundException(`White label tenant ${slug} not found`);
    return this.toBrandingConfig(row);
  }

  async createTenant(input: WhiteLabelTenantCreateInput): Promise<WhiteLabelTenantSummary> {
    this.assertAvailable();
    const row = await this.repository.create({
      slug: input.slug,
      name: input.name,
      type: input.type,
      customDomain: input.customDomain ?? null,
      logoUrl: input.logoUrl ?? null,
      primaryColor: input.primaryColor ?? null,
      config: input.config ?? {},
      apiKeyId: input.apiKeyId ?? null,
      isActive: input.isActive ?? true,
    });
    if (!row) throw new ServiceUnavailableException('White label tenant persistence failed');
    return this.toSummary(row);
  }

  async listTenantArtists(slug: string): Promise<WhiteLabelTenantArtistsPayload> {
    this.assertAvailable();
    const row = await this.repository.findBySlug(slug);
    if (!row) throw new NotFoundException(`White label tenant ${slug} not found`);

    const config = this.repository.parseConfig(row.config);
    if (row.type !== 'agency' || !config.agencyId) {
      throw new BadRequestException('Tenant artists roster requires agency white label config');
    }

    const relationships = await this.repository.listManagedArtists(config.agencyId);
    const artistIds = relationships.map((rel) => rel.targetEntityId);
    const artists = await this.repository.resolveArtists(artistIds);
    const artistById = new Map(artists.map((artist) => [artist.id, artist]));

    return {
      tenantSlug: row.slug,
      tenantType: row.type as WhiteLabelTenantArtistsPayload['tenantType'],
      agencyId: config.agencyId,
      items: relationships
        .map((rel) => {
          const artist = artistById.get(rel.targetEntityId);
          if (!artist) return null;
          return {
            artistId: artist.id,
            artistName: artist.name,
            artistSlug: artist.slug,
            relationshipType: 'MANAGES' as const,
            since: rel.effectiveFrom?.toISOString() ?? rel.createdAt.toISOString(),
          };
        })
        .filter((item): item is NonNullable<typeof item> => item != null),
      updatedAt: new Date().toISOString(),
    };
  }

  private toBrandingConfig(row: {
    slug: string;
    name: string;
    type: string;
    customDomain: string | null;
    logoUrl: string | null;
    primaryColor: string | null;
    config: unknown;
    isActive: boolean;
    updatedAt: Date;
  }): WhiteLabelBrandingConfig {
    return {
      slug: row.slug,
      name: row.name,
      type: row.type as WhiteLabelBrandingConfig['type'],
      customDomain: row.customDomain,
      logoUrl: row.logoUrl,
      primaryColor: row.primaryColor,
      config: this.repository.parseConfig(row.config),
      isActive: row.isActive,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toSummary(row: {
    id: string;
    slug: string;
    name: string;
    type: string;
    customDomain: string | null;
    logoUrl: string | null;
    primaryColor: string | null;
    config: unknown;
    apiKeyId: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): WhiteLabelTenantSummary {
    return {
      id: row.id,
      ...this.toBrandingConfig(row),
      apiKeyId: row.apiKeyId,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private assertAvailable() {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException('WhiteLabelTenant model not migrated yet');
    }
  }
}

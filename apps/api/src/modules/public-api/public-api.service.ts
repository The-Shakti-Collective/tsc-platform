import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { publicArtistListWhere } from '@tsc/database';
import type {
  ApiKeyCreatedPayload,
  ApiKeySummary,
  PublicAnalyticsSummaryPayload,
  PublicArtistDetailPayload,
  PublicArtistListPayload,
  PublicCommunityListPayload,
  PublicEventListPayload,
  PublicOpportunityListPayload,
  PublicPaginationMeta,
  PublicVenueListPayload,
} from '@tsc/types';
import type { ApiKeyCreateInput } from './dto';
import { ApiKeyAuthService } from './api-key-auth.service';
import { ApiKeyRepository } from './api-key.repository';
import { TscIdentityNetworkService } from '../tsc-identity/tsc-identity-network.service';
import type { TscIdentityNamespaceValue } from '@tsc/database';

@Injectable()
export class PublicApiService {
  constructor(
    private readonly repository: ApiKeyRepository,
    private readonly apiKeyAuthService: ApiKeyAuthService,
    private readonly identityService: TscIdentityNetworkService,
  ) {}

  async createApiKey(input: ApiKeyCreateInput): Promise<ApiKeyCreatedPayload> {
    this.assertApiKeysAvailable();
    const material = this.apiKeyAuthService.generateKeyMaterial();
    const row = await this.repository.create({
      name: input.name,
      keyHash: material.keyHash,
      prefix: material.prefix,
      scopes: input.scopes,
      ownerOrgId: input.ownerOrgId ?? null,
      rateLimit: input.rateLimit ?? 100,
    });
    if (!row) throw new ServiceUnavailableException('API key persistence failed');

    return {
      ...this.apiKeyAuthService.toSummary(row),
      key: material.key,
    };
  }

  async listApiKeys(ownerOrgId?: string): Promise<{ items: ApiKeySummary[]; updatedAt: string }> {
    this.assertApiKeysAvailable();
    const rows = await this.repository.list({ ownerOrgId });
    return {
      items: rows.map((row) => this.apiKeyAuthService.toSummary(row)),
      updatedAt: new Date().toISOString(),
    };
  }

  async revokeApiKey(id: string): Promise<ApiKeySummary> {
    this.assertApiKeysAvailable();
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`API key ${id} not found`);
    const row = await this.repository.deactivate(id);
    if (!row) throw new ServiceUnavailableException('API key revoke failed');
    return this.apiKeyAuthService.toSummary(row);
  }

  async listArtists(query: {
    page: number;
    limit: number;
    city?: string;
    genre?: string;
  }): Promise<PublicArtistListPayload> {
    const where = publicArtistListWhere({ city: query.city, genre: query.genre });
    const skip = (query.page - 1) * query.limit;
    const [rows, total] = await Promise.all([
      this.repository.listArtists({ where, skip, take: query.limit }),
      this.repository.countArtists(where),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        displayName: row.displayName,
        city: row.person?.profile?.city ?? null,
        genres: row.person?.profile?.genres ?? [],
        photoUrl: row.photoUrl,
      })),
      pagination: this.pagination(query.page, query.limit, total),
      filters: { city: query.city ?? null, genre: query.genre ?? null },
      updatedAt: new Date().toISOString(),
    };
  }

  async getArtist(id: string): Promise<PublicArtistDetailPayload> {
    const row = await this.repository.findArtistById(id);
    if (!row) throw new NotFoundException(`Artist ${id} not found`);
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      displayName: row.displayName,
      bio: row.bio,
      city: row.person?.profile?.city ?? null,
      genres: row.person?.profile?.genres ?? [],
      photoUrl: row.photoUrl,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async listCommunities(query: {
    page: number;
    limit: number;
    city?: string;
  }): Promise<PublicCommunityListPayload> {
    const skip = (query.page - 1) * query.limit;
    const [rows, total] = await Promise.all([
      this.repository.listCommunities({ city: query.city, skip, take: query.limit }),
      this.repository.countCommunitiesFiltered(query.city),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        city: row.city,
        genres: row.genres,
      })),
      pagination: this.pagination(query.page, query.limit, total),
      updatedAt: new Date().toISOString(),
    };
  }

  async listOpportunities(query: {
    page: number;
    limit: number;
    city?: string;
    category?: string;
  }): Promise<PublicOpportunityListPayload> {
    const skip = (query.page - 1) * query.limit;
    const [rows, total] = await Promise.all([
      this.repository.listPublicOpportunities({
        city: query.city,
        category: query.category,
        skip,
        take: query.limit,
      }),
      this.repository.countPublicOpportunities({
        city: query.city,
        category: query.category,
      }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        title: row.title,
        category: row.category,
        city: row.city,
        status: row.status,
        deadline: row.deadline?.toISOString() ?? null,
        listingType: row.listingType,
      })),
      pagination: this.pagination(query.page, query.limit, total),
      updatedAt: new Date().toISOString(),
    };
  }

  async listEvents(query: {
    page: number;
    limit: number;
    city?: string;
  }): Promise<PublicEventListPayload> {
    const skip = (query.page - 1) * query.limit;
    const [rows, total] = await Promise.all([
      this.repository.listEvents({ city: query.city, skip, take: query.limit }),
      this.repository.countEventsFiltered(query.city),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        city: row.city,
        startsAt: row.startsAt.toISOString(),
        artistId: row.artistId,
        venueId: row.venueId,
      })),
      pagination: this.pagination(query.page, query.limit, total),
      updatedAt: new Date().toISOString(),
    };
  }

  async listVenues(query: {
    page: number;
    limit: number;
    city?: string;
  }): Promise<PublicVenueListPayload> {
    const skip = (query.page - 1) * query.limit;
    const [rows, total] = await Promise.all([
      this.repository.listVenuesWithEventCounts({ city: query.city, skip, take: query.limit }),
      this.repository.countVenuesFiltered(query.city),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        city: row.city,
        capacity: row.capacity,
        eventCount: row._count.events,
      })),
      pagination: this.pagination(query.page, query.limit, total),
      updatedAt: new Date().toISOString(),
    };
  }

  async analyticsSummary(): Promise<PublicAnalyticsSummaryPayload> {
    const [artists, communities, opportunities, events, venues, identities] =
      await Promise.all([
        this.repository.countArtists(),
        this.repository.countCommunities(),
        this.repository.countOpportunities({ marketplaceVisible: true, status: 'open' }),
        this.repository.countEvents(),
        this.repository.countVenues(),
        this.repository.countIdentities(),
      ]);

    return {
      artists,
      communities,
      opportunities,
      events,
      venues,
      identities,
      updatedAt: new Date().toISOString(),
    };
  }

  resolveIdentity(namespace: string, slug: string) {
    return this.identityService.getPublicIdentity(namespace as TscIdentityNamespaceValue, slug);
  }

  private pagination(page: number, limit: number, total: number): PublicPaginationMeta {
    return {
      page,
      limit,
      total,
      hasMore: page * limit < total,
    };
  }

  private assertApiKeysAvailable() {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException('ApiKey model not migrated yet');
    }
  }
}

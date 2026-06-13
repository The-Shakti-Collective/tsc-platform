import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  artistsToCsv,
  buildEntitySubgraph,
  INDUSTRY_GRAPH_JSON_LD_CONTEXT,
  publicArtistListWhere,
  type GraphEntityType,
} from '@tsc/database';
import type {
  AnonymizedAnalyticsExportPayload,
  BulkArtistExportPayload,
  IndustryGraphJsonLdPayload,
  PartnerIngestPayload,
  RelationshipExportPayload,
} from '@tsc/types';
import { ApiKeyRepository } from '../public-api/api-key.repository';
import { RelationshipRepository } from '../relationship/relationship.repository';
import { ExchangePartnerRepository } from './webhook.repository';

@Injectable()
export class DataExportService {
  constructor(private readonly apiKeyRepository: ApiKeyRepository) {}

  async exportArtists(query: {
    format: 'json' | 'csv';
    page: number;
    limit: number;
    city?: string;
    genre?: string;
  }): Promise<BulkArtistExportPayload | { format: 'csv'; csv: string; updatedAt: string }> {
    const where = publicArtistListWhere({ city: query.city, genre: query.genre });
    const skip = (query.page - 1) * query.limit;
    const [rows, total] = await Promise.all([
      this.apiKeyRepository.listArtists({ where, skip, take: query.limit }),
      this.apiKeyRepository.countArtists(where),
    ]);

    const items = rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      displayName: row.displayName,
      city: row.person?.profile?.city ?? null,
      genres: row.person?.profile?.genres ?? [],
    }));

    if (query.format === 'csv') {
      return {
        format: 'csv',
        csv: artistsToCsv(items),
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      format: 'json',
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        hasMore: query.page * query.limit < total,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  async exportAnalytics(period: string): Promise<AnonymizedAnalyticsExportPayload> {
    const [artistCount, communityCount, eventCount, opportunityCount, identityCount] =
      await Promise.all([
        this.apiKeyRepository.countArtists(),
        this.apiKeyRepository.countCommunities(),
        this.apiKeyRepository.countEvents(),
        this.apiKeyRepository.countOpportunities({
          marketplaceVisible: true,
          status: 'open',
        }),
        this.apiKeyRepository.countIdentities(),
      ]);

    return {
      period,
      rollup: {
        artistCount,
        communityCount,
        eventCount,
        opportunityCount,
        identityCount,
      },
      anonymized: true,
      updatedAt: new Date().toISOString(),
    };
  }
}

@Injectable()
export class GraphExportService {
  constructor(private readonly relationshipRepository: RelationshipRepository) {}

  async exportRelationships(
    entityType: string,
    entityId: string,
  ): Promise<RelationshipExportPayload> {
    const rows = await this.relationshipRepository.listSubgraphRelationships(
      entityType as GraphEntityType,
      entityId,
      { depth: 1, includeInactive: false },
    );

    return {
      entityType,
      entityId,
      relationships: rows.map((row) => {
        const outbound =
          row.sourceEntityType === entityType && row.sourceEntityId === entityId;
        return {
          id: row.id,
          relationshipType: row.relationshipType,
          direction: outbound ? ('outbound' as const) : ('inbound' as const),
          peerEntityType: outbound ? row.targetEntityType : row.sourceEntityType,
          peerEntityId: outbound ? row.targetEntityId : row.sourceEntityId,
          strength: row.strength,
        };
      }),
      updatedAt: new Date().toISOString(),
    };
  }

  async exportGraphJsonLd(
    entityType: string,
    entityId: string,
    depth: number,
  ): Promise<IndustryGraphJsonLdPayload> {
    const rows = await this.relationshipRepository.listSubgraphRelationships(
      entityType as GraphEntityType,
      entityId,
      { depth, includeInactive: false },
    );

    const subgraph = buildEntitySubgraph(
      entityType as GraphEntityType,
      entityId,
      rows,
    );

    if (subgraph.stats.edgeCount === 0) {
      throw new NotFoundException(
        `No relationship graph found for ${entityType}/${entityId}`,
      );
    }

    return {
      '@context': { ...INDUSTRY_GRAPH_JSON_LD_CONTEXT },
      '@type': 'IndustrySubgraph',
      entityType,
      entityId,
      depth,
      nodes: subgraph.nodes.map((node) => ({
        entityType: node.entityType,
        entityId: node.entityId,
      })),
      edges: subgraph.edges.map((edge) => ({
        id: edge.id,
        relationshipType: edge.relationshipType,
        sourceEntityType: edge.sourceEntityType,
        sourceEntityId: edge.sourceEntityId,
        targetEntityType: edge.targetEntityType,
        targetEntityId: edge.targetEntityId,
      })),
      stats: subgraph.stats,
      updatedAt: new Date().toISOString(),
    };
  }
}

@Injectable()
export class ExchangePartnerService {
  private readonly logger = new Logger(ExchangePartnerService.name);

  constructor(private readonly partnerRepository: ExchangePartnerRepository) {}

  private assertAvailable() {
    if (!this.partnerRepository.isAvailable()) {
      throw new ServiceUnavailableException('DataExchangePartner model not migrated yet');
    }
  }

  async getStatus(slug: string) {
    this.assertAvailable();
    const partner = await this.partnerRepository.findBySlug(slug);
    if (!partner || !partner.isActive) {
      throw new NotFoundException(`Data exchange partner ${slug} not found`);
    }

    return {
      slug: partner.slug,
      name: partner.name,
      syncDirection: partner.syncDirection,
      isActive: partner.isActive,
      allowedScopes: partner.allowedScopes,
      lastIngestAt: null,
      updatedAt: partner.updatedAt.toISOString(),
    };
  }

  async ingest(
    slug: string,
    input: {
      eventType: string;
      externalId?: string;
      entityType?: string;
      data: Record<string, unknown>;
      occurredAt?: string;
    },
  ): Promise<PartnerIngestPayload> {
    this.assertAvailable();
    const partner = await this.partnerRepository.findBySlug(slug);
    if (!partner || !partner.isActive) {
      throw new NotFoundException(`Data exchange partner ${slug} not found`);
    }

    if (partner.syncDirection === 'outbound') {
      return {
        partnerSlug: slug,
        accepted: false,
        syncEventType: null,
        externalId: input.externalId ?? null,
        message: 'Partner configured for outbound-only sync',
      };
    }

    const syncEventType = `partner.${slug}.${input.eventType}`;
    this.logger.log(
      `[exchange-ingest] ${partner.name} → ${syncEventType} externalId=${input.externalId ?? 'n/a'}`,
    );

    return {
      partnerSlug: slug,
      accepted: true,
      syncEventType,
      externalId: input.externalId ?? null,
      message: 'Inbound event normalized to sync stub (Phase 10.5)',
    };
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  ContractCreatedPayload,
  ContractListPayload,
  ContractSignPayload,
  ContractStatus,
  ContractSummary,
  ContractTemplateListPayload,
  ContractTemplateSummary,
} from '@tsc/types';
import {
  type ContractTemplateTypeValue,
} from '@tsc/database';
import { ContractRepository } from './contract.repository';
import type { ContractCreateInput, ContractListQuery } from './dto';

@Injectable()
export class ContractService {
  constructor(private readonly repository: ContractRepository) {}

  async listTemplates(): Promise<ContractTemplateListPayload> {
    this.assertAvailable();
    await this.repository.ensureDefaultTemplates();
    const rows = await this.repository.listTemplates(true);
    return {
      items: rows.map((row) => this.toTemplateSummary(row)),
      updatedAt: new Date().toISOString(),
    };
  }

  async list(query: ContractListQuery): Promise<ContractListPayload> {
    this.assertAvailable();
    const rows = await this.repository.listContracts(query);
    return {
      items: rows.map((row) => this.toSummary(row)),
      filters: {
        artistId: query.artistId ?? null,
        brandId: query.brandId ?? null,
        status: (query.status as ContractStatus) ?? null,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  async getDetail(id: string): Promise<ContractSummary> {
    this.assertAvailable();
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException(`Contract ${id} not found`);
    return this.toSummary(row);
  }

  async create(input: ContractCreateInput): Promise<ContractCreatedPayload> {
    this.assertAvailable();
    await this.repository.ensureDefaultTemplates();

    let templateId = input.templateId;
    if (!templateId && input.templateSlug) {
      const tpl = await this.repository.findTemplateBySlug(input.templateSlug);
      templateId = tpl?.id;
    }
    if (!templateId) {
      const defaultTpl = await this.repository.findTemplateBySlug('performance-standard');
      templateId = defaultTpl?.id;
    }
    if (!templateId) {
      throw new BadRequestException('templateId or templateSlug required');
    }

    const template = await this.repository.findTemplateById(templateId);
    if (!template) throw new NotFoundException(`Template ${templateId} not found`);

    const documentUrl = this.renderDocumentUrl(template.bodyTemplate, input.variables ?? {});

    const row = await this.repository.create({
      templateId,
      dealId: input.dealId ?? null,
      bookingRequestId: input.bookingRequestId ?? null,
      artistId: input.artistId,
      brandId: input.brandId ?? null,
      variables: input.variables ?? {},
      documentUrl,
    });
    if (!row) throw new ServiceUnavailableException('Contract creation failed');

    await this.repository.createInvoiceStub({
      contractId: row.id,
      dealId: row.dealId,
      bookingRequestId: row.bookingRequestId,
      artistId: row.artistId,
      brandId: row.brandId,
      amount: this.extractFee(input.variables),
    });

    return {
      id: row.id,
      templateId: row.templateId,
      dealId: row.dealId,
      bookingRequestId: row.bookingRequestId,
      artistId: row.artistId,
      status: row.status as ContractStatus,
      documentUrl: row.documentUrl,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async sign(id: string, documentUrl?: string): Promise<ContractSignPayload> {
    this.assertAvailable();
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Contract ${id} not found`);
    if (existing.status === 'signed') {
      return {
        id: existing.id,
        status: 'signed',
        signedAt: existing.signedAt!.toISOString(),
        documentUrl: existing.documentUrl ?? '',
        updatedAt: existing.updatedAt.toISOString(),
      };
    }

    const signedAt = new Date();
    const url =
      documentUrl ??
      existing.documentUrl ??
      `https://tsc.in/contracts/${id}/signed-stub.pdf`;

    const row = await this.repository.update(id, {
      status: 'signed',
      signedAt,
      documentUrl: url,
    });
    if (!row) throw new ServiceUnavailableException('Contract sign failed');

    return {
      id: row.id,
      status: 'signed',
      signedAt: signedAt.toISOString(),
      documentUrl: url,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  /** Auto-link contract when deal reaches agreement stage */
  async ensureForDeal(input: {
    dealId: string;
    artistId: string;
    brandId?: string | null;
    templateType?: ContractTemplateTypeValue;
    variables?: Record<string, unknown>;
  }): Promise<ContractCreatedPayload | null> {
    if (!this.repository.isAvailable()) return null;

    const existing = await this.repository.findByDealId(input.dealId);
    if (existing) {
      return {
        id: existing.id,
        templateId: existing.templateId,
        dealId: existing.dealId,
        bookingRequestId: existing.bookingRequestId,
        artistId: existing.artistId,
        status: existing.status as ContractStatus,
        documentUrl: existing.documentUrl,
        createdAt: existing.createdAt.toISOString(),
      };
    }

    await this.repository.ensureDefaultTemplates();
    const slug =
      input.templateType === 'brand_deal'
        ? 'brand-deal-standard'
        : input.templateType === 'workshop'
          ? 'workshop-standard'
          : input.templateType === 'community'
            ? 'community-standard'
            : 'performance-standard';

    const template = await this.repository.findTemplateBySlug(slug);
    if (!template) return null;

    return this.create({
      templateId: template.id,
      dealId: input.dealId,
      artistId: input.artistId,
      brandId: input.brandId ?? undefined,
      variables: input.variables ?? {},
    });
  }

  async listArtistContracts(artistId: string, query: ContractListQuery) {
    return this.list({ ...query, artistId });
  }

  async listBrandContracts(brandId: string, query: ContractListQuery) {
    return this.list({ ...query, brandId });
  }

  private renderDocumentUrl(
    bodyTemplate: string,
    variables: Record<string, unknown>,
  ): string {
    let body = bodyTemplate;
    for (const [key, value] of Object.entries(variables)) {
      body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value ?? ''));
    }
    const encoded = encodeURIComponent(body.slice(0, 200));
    return `https://tsc.in/contracts/stub?body=${encoded}`;
  }

  private extractFee(variables?: Record<string, unknown>): number | null {
    const fee = variables?.fee ?? variables?.value ?? variables?.amount;
    return typeof fee === 'number' ? fee : null;
  }

  private toTemplateSummary(row: {
    id: string;
    slug: string;
    name: string;
    type: string;
    bodyTemplate: string;
    variables: string[];
    isActive: boolean;
  }): ContractTemplateSummary {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      type: row.type as ContractTemplateSummary['type'],
      bodyTemplate: row.bodyTemplate,
      variables: row.variables,
      isActive: row.isActive,
    };
  }

  private toSummary(row: {
    id: string;
    templateId: string;
    dealId: string | null;
    bookingRequestId: string | null;
    artistId: string;
    brandId: string | null;
    status: string;
    signedAt: Date | null;
    documentUrl: string | null;
    variables: unknown;
    createdAt: Date;
    updatedAt: Date;
    template?: { id: string; slug: string; name: string; type: string };
    artist?: { id: string; name: string; slug: string };
    brand?: { id: string; name: string; logo: string | null } | null;
  }): ContractSummary {
    return {
      id: row.id,
      templateId: row.templateId,
      templateName: row.template?.name ?? null,
      templateType: (row.template?.type as ContractSummary['templateType']) ?? null,
      dealId: row.dealId,
      bookingRequestId: row.bookingRequestId,
      artistId: row.artistId,
      artistName: row.artist?.name ?? null,
      brandId: row.brandId,
      brandName: row.brand?.name ?? null,
      status: row.status as ContractStatus,
      signedAt: row.signedAt?.toISOString() ?? null,
      documentUrl: row.documentUrl,
      variables: (row.variables as Record<string, unknown>) ?? {},
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private assertAvailable(): void {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException('Contract module unavailable — run Phase 10.2 migration');
    }
  }
}

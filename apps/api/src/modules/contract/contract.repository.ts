import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import {
  contractInclude,
  contractListWhere,
  DEFAULT_CONTRACT_TEMPLATES,
  type ContractStatusValue,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';

type TemplateRow = {
  id: string;
  slug: string;
  name: string;
  type: string;
  bodyTemplate: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type ContractRow = {
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
  deal?: { id: string; status: string; value: unknown } | null;
  bookingRequest?: { id: string; status: string; eventDate: Date | null } | null;
};

type TemplateClient = {
  findMany: (args: unknown) => Promise<TemplateRow[]>;
  findUnique: (args: unknown) => Promise<TemplateRow | null>;
  findFirst: (args: unknown) => Promise<TemplateRow | null>;
  create: (args: unknown) => Promise<TemplateRow>;
  upsert: (args: unknown) => Promise<TemplateRow>;
};

type ContractClient = {
  findMany: (args: unknown) => Promise<ContractRow[]>;
  findUnique: (args: unknown) => Promise<ContractRow | null>;
  findFirst: (args: unknown) => Promise<ContractRow | null>;
  create: (args: unknown) => Promise<ContractRow>;
  update: (args: unknown) => Promise<ContractRow>;
};

type InvoiceClient = {
  create: (args: unknown) => Promise<{ id: string }>;
};

@Injectable()
export class ContractRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get templateClient(): TemplateClient | null {
    const c = this.prisma.client as Prisma.TransactionClient & {
      contractTemplate?: TemplateClient;
    };
    return c.contractTemplate ?? null;
  }

  private get contractClient(): ContractClient | null {
    const c = this.prisma.client as Prisma.TransactionClient & {
      contract?: ContractClient;
    };
    return c.contract ?? null;
  }

  private get invoiceClient(): InvoiceClient | null {
    const c = this.prisma.client as Prisma.TransactionClient & {
      invoice?: InvoiceClient;
    };
    return c.invoice ?? null;
  }

  isAvailable(): boolean {
    return this.contractClient != null && this.templateClient != null;
  }

  async ensureDefaultTemplates(): Promise<TemplateRow[]> {
    if (!this.templateClient) return [];
    const results: TemplateRow[] = [];
    for (const tpl of DEFAULT_CONTRACT_TEMPLATES) {
      const row = await this.templateClient.upsert({
        where: { slug: tpl.slug },
        create: {
          id: newId(),
          slug: tpl.slug,
          name: tpl.name,
          type: tpl.type,
          bodyTemplate: tpl.bodyTemplate,
          variables: tpl.variables,
          isActive: true,
        },
        update: {},
      });
      results.push(row);
    }
    return results;
  }

  listTemplates(activeOnly = true) {
    if (!this.templateClient) return Promise.resolve([]);
    return this.templateClient.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  findTemplateById(id: string) {
    if (!this.templateClient) return Promise.resolve(null);
    return this.templateClient.findUnique({ where: { id } });
  }

  findTemplateBySlug(slug: string) {
    if (!this.templateClient) return Promise.resolve(null);
    return this.templateClient.findFirst({ where: { slug, isActive: true } });
  }

  listContracts(query: {
    artistId?: string;
    brandId?: string;
    dealId?: string;
    status?: ContractStatusValue;
    limit?: number;
  }) {
    if (!this.contractClient) return Promise.resolve([]);
    return this.contractClient.findMany({
      where: contractListWhere(query),
      include: contractInclude,
      orderBy: [{ updatedAt: 'desc' }],
      take: query.limit ?? 50,
    });
  }

  findById(id: string) {
    if (!this.contractClient) return Promise.resolve(null);
    return this.contractClient.findUnique({ where: { id }, include: contractInclude });
  }

  findByDealId(dealId: string) {
    if (!this.contractClient) return Promise.resolve(null);
    return this.contractClient.findFirst({
      where: { dealId },
      include: contractInclude,
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  create(input: {
    templateId: string;
    dealId?: string | null;
    bookingRequestId?: string | null;
    artistId: string;
    brandId?: string | null;
    variables?: Record<string, unknown>;
    documentUrl?: string | null;
  }) {
    if (!this.contractClient) return Promise.resolve(null);
    return this.contractClient.create({
      data: {
        id: newId(),
        templateId: input.templateId,
        dealId: input.dealId ?? null,
        bookingRequestId: input.bookingRequestId ?? null,
        artistId: input.artistId,
        brandId: input.brandId ?? null,
        status: 'draft',
        variables: input.variables ?? {},
        documentUrl: input.documentUrl ?? null,
      },
      include: contractInclude,
    });
  }

  update(
    id: string,
    data: {
      status?: ContractStatusValue;
      signedAt?: Date | null;
      documentUrl?: string | null;
    },
  ) {
    if (!this.contractClient) return Promise.resolve(null);
    return this.contractClient.update({
      where: { id },
      data: {
        status: data.status,
        signedAt: data.signedAt,
        documentUrl: data.documentUrl,
      },
      include: contractInclude,
    });
  }

  createInvoiceStub(input: {
    contractId?: string | null;
    dealId?: string | null;
    bookingRequestId?: string | null;
    artistId: string;
    brandId?: string | null;
    amount?: number | null;
    currency?: string;
  }) {
    if (!this.invoiceClient) return Promise.resolve(null);
    return this.invoiceClient.create({
      data: {
        id: newId(),
        contractId: input.contractId ?? null,
        dealId: input.dealId ?? null,
        bookingRequestId: input.bookingRequestId ?? null,
        artistId: input.artistId,
        brandId: input.brandId ?? null,
        amount: input.amount ?? null,
        currency: input.currency ?? 'INR',
        status: 'draft',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }
}

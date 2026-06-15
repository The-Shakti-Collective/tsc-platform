import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import type { IntegrationConnectionCreateInput } from './schema';
@Injectable()
export class IntegrationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(organizationId?: string, provider?: string) {
    return this.prisma.client.integrationConnection.findMany({
      where: {
        ...(organizationId ? { organizationId } : {}),
        ...(provider
          ? { provider: provider as 'google' | 'meta' | 'spotify' | 'youtube' | 'distrokid' | 'resend' | 'other' }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  create(data: IntegrationConnectionCreateInput) {
    return this.prisma.client.integrationConnection.create({
      data: {
        organizationId: data.organizationId,
        provider: data.provider,
        externalAccountId: data.externalAccountId,
        scopes: data.scopes ?? [],
        status: 'pending',
      },
    });
  }
}
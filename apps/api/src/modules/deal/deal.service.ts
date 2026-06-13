import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  DealCreatedPayload,
  DealDetail,
  DealListPayload,
  DealRevenuePayload,
  DealStatus,
  DealStatusUpdatePayload,
  DealSummary,
  RevenueTransactionSummary,
} from '@tsc/types';
import type { DealStatusValue } from '@tsc/database';
import type { MembershipContext } from '@tsc/permissions';
import { ActivityService } from '../activity/activity.service';
import { ContractService } from '../contract/contract.service';
import { OpportunityRepository } from '../opportunity/opportunity.repository';
import type {
  DealCreateInput,
  DealListQuery,
  DealRevenueCreateInput,
  DealStatusUpdateInput,
  DealUpdateInput,
} from './dto';
import { DealRepository } from './deal.repository';
import { DealSyncEmitter } from './deal-sync.emitter';
import {
  advanceDealStatus,
  assertDealTransition,
  InvalidDealTransitionError,
} from './deal-state';

@Injectable()
export class DealService {
  constructor(
    private readonly repository: DealRepository,
    private readonly opportunityRepository: OpportunityRepository,
    private readonly activityService: ActivityService,
    private readonly syncEmitter: DealSyncEmitter,
    private readonly contractService: ContractService,
  ) {}

  async list(query: DealListQuery): Promise<DealListPayload> {
    this.assertAvailable();
    const rows = await this.repository.list(query);
    return {
      items: rows.map((row) => this.toSummary(row)),
      filters: {
        artistId: query.artistId ?? null,
        brandId: query.brandId ?? null,
        status: (query.status as DealStatus) ?? null,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  async getDetail(id: string): Promise<DealDetail> {
    this.assertAvailable();
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException(`Deal ${id} not found`);
    return this.toSummary(row);
  }

  async createFromApplication(
    input: DealCreateInput,
    ctx: MembershipContext,
  ): Promise<DealCreatedPayload> {
    this.assertAvailable();
    const application = await this.opportunityRepository.findApplicationById(
      input.applicationId,
    );
    if (!application) {
      throw new NotFoundException(`Application ${input.applicationId} not found`);
    }
    if (application.status !== 'won') {
      throw new BadRequestException(
        'Deal can only be created from a hired (won) application',
      );
    }
    if (!application.artistId) {
      throw new BadRequestException('Application must be linked to an artist');
    }

    const existing = await this.repository.findByApplicationId(input.applicationId);
    if (existing) {
      return {
        id: existing.id,
        opportunityId: existing.opportunityId,
        applicationId: existing.applicationId,
        artistId: existing.artistId,
        brandId: existing.brandId,
        status: existing.status as DealStatus,
        createdAt: existing.createdAt.toISOString(),
      };
    }

    const opportunity = application.opportunity;
    const brandId = opportunity?.brandId ?? null;
    const agencyId = (opportunity as { agencyId?: string | null })?.agencyId ?? null;
    const value =
      input.value ??
      (opportunity?.value != null ? Number(opportunity.value) : null);

    const row = await this.repository.create({
      opportunityId: application.opportunityId,
      applicationId: application.id,
      artistId: application.artistId,
      brandId,
      agencyId,
      status: 'discussion',
      value,
      currency: input.currency,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      negotiationNotes: input.negotiationNotes ?? null,
    });
    if (!row) throw new ServiceUnavailableException('Deal creation failed');

    if (ctx.personId) {
      await this.activityService.record({
        actorPersonId: ctx.personId,
        action: 'deal_created',
        targetType: 'Deal',
        targetId: row.id,
        metadata: {
          opportunityId: row.opportunityId,
          applicationId: row.applicationId,
          artistId: row.artistId,
          brandId: row.brandId,
        },
      });
    }

    this.emitStatusChange(row, 'discussion');

    return {
      id: row.id,
      opportunityId: row.opportunityId,
      applicationId: row.applicationId,
      artistId: row.artistId,
      brandId: row.brandId,
      status: row.status as DealStatus,
      createdAt: row.createdAt.toISOString(),
    };
  }

  /** Called from Brand hire flow — idempotent per application. */
  async createFromHiredApplication(
    applicationId: string,
    actorPersonId?: string | null,
  ): Promise<DealCreatedPayload | null> {
    if (!this.repository.isAvailable()) return null;
    return this.createFromApplication(
      { applicationId, currency: 'INR' },
      { personId: actorPersonId ?? null, roles: [], artistMemberships: [], userId: null, organizationMemberships: [] },
    ).catch(() => null);
  }

  async updateDeal(id: string, input: DealUpdateInput): Promise<DealDetail> {
    this.assertAvailable();
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Deal ${id} not found`);

    const row = await this.repository.update(id, {
      value: input.value,
      currency: input.currency,
      startDate:
        input.startDate === null
          ? null
          : input.startDate
            ? new Date(input.startDate)
            : undefined,
      endDate:
        input.endDate === null
          ? null
          : input.endDate
            ? new Date(input.endDate)
            : undefined,
      negotiationNotes:
        input.negotiationNotes === null ? null : input.negotiationNotes,
      agreementUrl:
        input.agreementUrl === '' ? null : input.agreementUrl ?? undefined,
    });
    if (!row) throw new ServiceUnavailableException('Deal update failed');
    return this.toSummary(row);
  }

  async updateStatus(
    id: string,
    input: DealStatusUpdateInput,
    ctx: MembershipContext,
  ): Promise<DealStatusUpdatePayload> {
    this.assertAvailable();
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Deal ${id} not found`);

    const previousStatus = existing.status as DealStatusValue;
    let nextStatus: DealStatusValue | null = null;

    if (input.advance) {
      nextStatus = advanceDealStatus(previousStatus);
      if (!nextStatus) {
        throw new BadRequestException(`Deal already at terminal stage "${previousStatus}"`);
      }
    } else if (input.status) {
      try {
        assertDealTransition(previousStatus, input.status as DealStatusValue);
      } catch (error) {
        if (error instanceof InvalidDealTransitionError) {
          throw new BadRequestException(error.message);
        }
        throw error;
      }
      nextStatus = input.status as DealStatusValue;
    } else {
      throw new BadRequestException('Provide status or advance=true');
    }

    const paidAt = nextStatus === 'paid' ? new Date() : undefined;
    const row = await this.repository.update(id, {
      status: nextStatus,
      paidAt: paidAt ?? (nextStatus === 'paid' ? new Date() : undefined),
    });
    if (!row) throw new ServiceUnavailableException('Deal status update failed');

    await this.recordStatusActivity(row, previousStatus, nextStatus, ctx.personId);
    this.emitStatusChange(row, previousStatus);

    if (nextStatus === 'agreement') {
      await this.contractService.ensureForDeal({
        dealId: row.id,
        artistId: row.artistId,
        brandId: row.brandId,
        templateType: row.brandId ? 'brand_deal' : 'performance',
        variables: {
          fee: row.value != null ? Number(row.value) : undefined,
          currency: row.currency,
          artistName: row.artist?.name,
          brandName: row.brand?.name,
        },
      });
    }

    return {
      id: row.id,
      status: row.status as DealStatus,
      previousStatus: previousStatus as DealStatus,
      paidAt: row.paidAt?.toISOString() ?? null,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async listArtistDeals(artistId: string, query: DealListQuery): Promise<DealListPayload> {
    return this.list({ ...query, artistId });
  }

  async listBrandDeals(brandId: string, query: DealListQuery): Promise<DealListPayload> {
    return this.list({ ...query, brandId });
  }

  async recordRevenue(
    dealId: string,
    input: DealRevenueCreateInput,
  ): Promise<RevenueTransactionSummary> {
    this.assertAvailable();
    const deal = await this.repository.findById(dealId);
    if (!deal) throw new NotFoundException(`Deal ${dealId} not found`);

    const row = await this.repository.createRevenue({
      dealId,
      amount: input.amount,
      type: input.type,
      notes: input.notes,
      recordedAt: input.recordedAt ? new Date(input.recordedAt) : undefined,
    });
    if (!row) throw new ServiceUnavailableException('Revenue recording failed');

    return {
      id: row.id,
      dealId: row.dealId,
      amount: Number(row.amount),
      type: row.type as RevenueTransactionSummary['type'],
      recordedAt: row.recordedAt.toISOString(),
      notes: row.notes,
    };
  }

  async listRevenue(dealId: string): Promise<DealRevenuePayload> {
    this.assertAvailable();
    const deal = await this.repository.findById(dealId);
    if (!deal) throw new NotFoundException(`Deal ${dealId} not found`);

    const rows = await this.repository.listRevenue(dealId);
    const items = rows.map((row) => ({
      id: row.id,
      dealId: row.dealId,
      amount: Number(row.amount),
      type: row.type as RevenueTransactionSummary['type'],
      recordedAt: row.recordedAt.toISOString(),
      notes: row.notes,
    }));

    const totals = items.reduce(
      (acc, item) => {
        acc[item.type] += item.amount;
        return acc;
      },
      { expected: 0, received: 0, pending: 0 },
    );

    return {
      dealId,
      items,
      totals,
      updatedAt: new Date().toISOString(),
    };
  }

  /** Called from PaymentService when invoice is marked paid — idempotent for already-paid deals. */
  async applyPaymentReceived(
    dealId: string,
    input: { amount: number; notes?: string | null; actorPersonId?: string | null },
  ): Promise<{ dealStatus: string; revenueRecorded: boolean }> {
    this.assertAvailable();
    const existing = await this.repository.findById(dealId);
    if (!existing) throw new NotFoundException(`Deal ${dealId} not found`);

    let revenueRecorded = false;
    if (input.amount > 0) {
      await this.repository.createRevenue({
        dealId,
        amount: input.amount,
        type: 'received',
        notes: input.notes ?? 'Invoice payment received',
      });
      revenueRecorded = true;
    }

    const previousStatus = existing.status as DealStatusValue;
    if (previousStatus !== 'paid') {
      const row = await this.repository.update(dealId, {
        status: 'paid',
        paidAt: new Date(),
      });
      if (row) {
        await this.recordStatusActivity(row, previousStatus, 'paid', input.actorPersonId);
        this.emitStatusChange(row, previousStatus);
      }
    }

    return {
      dealStatus: 'paid',
      revenueRecorded,
    };
  }

  private async recordStatusActivity(
    row: {
      id: string;
      opportunityId: string;
      artistId: string;
      brandId: string | null;
    },
    previousStatus: DealStatusValue,
    nextStatus: DealStatusValue,
    actorPersonId?: string | null,
  ) {
    if (!actorPersonId) return;

    if (nextStatus === 'completed') {
      await this.activityService.record({
        actorPersonId,
        action: 'deal_completed',
        targetType: 'Deal',
        targetId: row.id,
        metadata: {
          opportunityId: row.opportunityId,
          artistId: row.artistId,
          brandId: row.brandId,
          previousStatus,
        },
      });
    }

    if (nextStatus === 'paid') {
      await this.activityService.record({
        actorPersonId,
        action: 'deal_paid',
        targetType: 'Deal',
        targetId: row.id,
        metadata: {
          opportunityId: row.opportunityId,
          artistId: row.artistId,
          brandId: row.brandId,
          previousStatus,
        },
      });
    }
  }

  private emitStatusChange(
    row: {
      id: string;
      opportunityId: string;
      applicationId: string | null;
      artistId: string;
      brandId: string | null;
      agencyId: string | null;
      status: string;
      value: unknown;
      currency: string;
      paidAt: Date | null;
    },
    previousStatus: string,
  ) {
    this.syncEmitter.emit({
      type: 'deal.status_changed',
      externalId: row.id,
      entityType: 'Deal',
      data: {
        dealId: row.id,
        opportunityId: row.opportunityId,
        applicationId: row.applicationId,
        artistId: row.artistId,
        brandId: row.brandId,
        agencyId: row.agencyId,
        previousStatus,
        status: row.status,
        value: row.value != null ? Number(row.value) : undefined,
        currency: row.currency,
        paidAt: row.paidAt?.toISOString(),
      },
    });
  }

  private assertAvailable() {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException('Deal model not migrated yet');
    }
  }

  private toSummary(row: {
    id: string;
    opportunityId: string;
    applicationId: string | null;
    artistId: string;
    brandId: string | null;
    agencyId: string | null;
    status: string;
    value: unknown;
    currency: string;
    startDate: Date | null;
    endDate: Date | null;
    negotiationNotes: string | null;
    agreementUrl: string | null;
    paidAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    opportunity?: { title: string };
    artist?: { name: string };
    brand?: { name: string } | null;
    agency?: { name: string } | null;
    _count?: { revenue: number };
  }): DealSummary {
    return {
      id: row.id,
      opportunityId: row.opportunityId,
      opportunityTitle: row.opportunity?.title ?? row.opportunityId,
      applicationId: row.applicationId,
      artistId: row.artistId,
      artistName: row.artist?.name ?? null,
      brandId: row.brandId,
      brandName: row.brand?.name ?? null,
      agencyId: row.agencyId,
      agencyName: row.agency?.name ?? null,
      status: row.status as DealStatus,
      value: row.value != null ? Number(row.value) : null,
      currency: row.currency,
      startDate: row.startDate?.toISOString() ?? null,
      endDate: row.endDate?.toISOString() ?? null,
      negotiationNotes: row.negotiationNotes,
      agreementUrl: row.agreementUrl,
      paidAt: row.paidAt?.toISOString() ?? null,
      revenueCount: row._count?.revenue ?? 0,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

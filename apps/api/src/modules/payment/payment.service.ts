import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  EscrowHoldPayload,
  EscrowReleasePayload,
  InvoiceCollectPayload,
  InvoiceMarkPaidPayload,
  PaymentsDashboardPayload,
  PayoutListPayload,
  PayoutSchedulePayload,
  PayoutSummary,
  SettlementListPayload,
  SettlementSummary,
} from '@tsc/types';
import type {
  EscrowStatusValue,
  InvoiceStatusValue,
  PaymentProviderValue,
} from '@tsc/database';
import { ActivityService } from '../activity/activity.service';
import { DealService } from '../deal/deal.service';
import { PaymentAdapterFactory } from './adapters/payment-adapter.factory';
import type {
  EscrowHoldInput,
  EscrowReleaseInput,
  InvoiceCollectInput,
  InvoiceMarkPaidInput,
  PaymentsDashboardQuery,
  PayoutScheduleInput,
  SettlementListQuery,
} from './dto';
import { PaymentRepository } from './payment.repository';

@Injectable()
export class PaymentService {
  constructor(
    private readonly repository: PaymentRepository,
    private readonly adapterFactory: PaymentAdapterFactory,
    private readonly dealService: DealService,
    private readonly activityService: ActivityService,
  ) {}

  async collectInvoice(
    invoiceId: string,
    input: InvoiceCollectInput,
    actorPersonId?: string | null,
  ): Promise<InvoiceCollectPayload> {
    this.assertAvailable();
    const invoice = await this.repository.findInvoiceById(invoiceId);
    if (!invoice) throw new NotFoundException(`Invoice ${invoiceId} not found`);
    if (invoice.status === 'paid') {
      throw new BadRequestException('Invoice already paid');
    }
    if (invoice.status === 'cancelled') {
      throw new BadRequestException('Invoice cancelled');
    }

    const provider = input.provider as PaymentProviderValue;
    const adapter = this.adapterFactory.get(provider);
    const amount =
      input.amount ??
      (invoice.amount != null ? Number(invoice.amount) : null) ??
      (invoice.deal?.value != null ? Number(invoice.deal.value) : null);

    if (!amount || amount <= 0) {
      throw new BadRequestException('Invoice amount required for collection');
    }

    const intent = await adapter.createPaymentIntent({
      amount,
      currency: invoice.currency,
      referenceId: invoiceId,
      metadata: { dealId: invoice.dealId, contractId: invoice.contractId },
    });

    const row = await this.repository.updateInvoice(invoiceId, {
      status: 'sent',
      paymentProvider: provider,
      amount,
    });
    if (!row) throw new ServiceUnavailableException('Invoice update failed');

    if (actorPersonId) {
      await this.activityService.record({
        actorPersonId,
        action: 'payment_collected',
        targetType: 'Invoice',
        targetId: invoiceId,
        metadata: {
          provider,
          externalId: intent.externalId,
          amount,
          currency: invoice.currency,
          dealId: invoice.dealId,
        },
      });
    }

    return {
      invoiceId,
      provider,
      externalId: intent.externalId,
      checkoutUrl: intent.checkoutUrl,
      status: row.status as InvoiceStatusValue,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async markInvoicePaid(
    invoiceId: string,
    input: InvoiceMarkPaidInput,
    actorPersonId?: string | null,
  ): Promise<InvoiceMarkPaidPayload> {
    this.assertAvailable();
    const invoice = await this.repository.findInvoiceById(invoiceId);
    if (!invoice) throw new NotFoundException(`Invoice ${invoiceId} not found`);
    if (invoice.status === 'paid') {
      return {
        id: invoice.id,
        status: 'paid',
        paidAt: invoice.paidAt!.toISOString(),
        paymentProvider: (invoice.paymentProvider as PaymentProviderValue) ?? 'manual',
        dealId: invoice.dealId,
        dealStatus: invoice.deal?.status ?? null,
        revenueRecorded: false,
        updatedAt: invoice.updatedAt.toISOString(),
      };
    }

    const provider = input.provider as PaymentProviderValue;
    const paidAt = input.paidAt ? new Date(input.paidAt) : new Date();
    const amount =
      invoice.amount != null
        ? Number(invoice.amount)
        : invoice.deal?.value != null
          ? Number(invoice.deal.value)
          : 0;

    const row = await this.repository.updateInvoice(invoiceId, {
      status: 'paid',
      paidAt,
      paymentProvider: provider,
    });
    if (!row) throw new ServiceUnavailableException('Invoice update failed');

    let dealStatus: string | null = null;
    let revenueRecorded = false;

    if (invoice.dealId && amount > 0) {
      const result = await this.dealService.applyPaymentReceived(invoice.dealId, {
        amount,
        notes: input.notes ?? `Invoice ${invoiceId} marked paid`,
        actorPersonId,
      });
      dealStatus = result.dealStatus;
      revenueRecorded = result.revenueRecorded;
    }

    if (actorPersonId) {
      await this.activityService.record({
        actorPersonId,
        action: 'invoice_paid',
        targetType: 'Invoice',
        targetId: invoiceId,
        metadata: {
          provider,
          amount,
          currency: invoice.currency,
          dealId: invoice.dealId,
          revenueRecorded,
        },
      });
    }

    return {
      id: row.id,
      status: 'paid',
      paidAt: paidAt.toISOString(),
      paymentProvider: provider,
      dealId: invoice.dealId,
      dealStatus,
      revenueRecorded,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async holdEscrow(
    dealId: string,
    input: EscrowHoldInput,
    actorPersonId?: string | null,
  ): Promise<EscrowHoldPayload> {
    this.assertAvailable();

    const existing = await this.repository.findEscrowByDealId(dealId);
    if (existing?.status === 'holding') {
      return {
        id: existing.id,
        dealId,
        amount: Number(existing.amount),
        currency: existing.currency,
        status: existing.status as EscrowStatusValue,
        provider: existing.provider as PaymentProviderValue,
        externalId: existing.externalId ?? '',
        heldAt: existing.heldAt?.toISOString() ?? new Date().toISOString(),
      };
    }

    const provider = input.provider as PaymentProviderValue;
    const adapter = this.adapterFactory.get(provider);
    const holdResult = await adapter.holdEscrow({
      amount: input.amount,
      currency: input.currency,
      referenceId: dealId,
      metadata: { contractId: input.contractId },
    });

    const heldAt = new Date();
    const row = await this.repository.createEscrow({
      dealId,
      contractId: input.contractId ?? null,
      amount: input.amount,
      currency: input.currency,
      status: 'holding',
      provider,
      externalId: holdResult.externalId,
      heldAt,
    });
    if (!row) throw new ServiceUnavailableException('Escrow creation failed');

    if (actorPersonId) {
      await this.activityService.record({
        actorPersonId,
        action: 'escrow_held',
        targetType: 'Escrow',
        targetId: row.id,
        metadata: { dealId, amount: input.amount, provider, externalId: holdResult.externalId },
      });
    }

    return {
      id: row.id,
      dealId,
      amount: input.amount,
      currency: input.currency,
      status: 'holding',
      provider,
      externalId: holdResult.externalId,
      heldAt: heldAt.toISOString(),
    };
  }

  async releaseEscrow(
    escrowId: string,
    input: EscrowReleaseInput,
    actorPersonId?: string | null,
  ): Promise<EscrowReleasePayload> {
    this.assertAvailable();
    const escrow = await this.repository.findEscrowById(escrowId);
    if (!escrow) throw new NotFoundException(`Escrow ${escrowId} not found`);
    if (escrow.status === 'released') {
      return {
        id: escrow.id,
        status: 'released',
        externalId: escrow.externalId,
        releasedAt: escrow.releasedAt!.toISOString(),
        updatedAt: escrow.updatedAt.toISOString(),
      };
    }
    if (escrow.status !== 'holding') {
      throw new BadRequestException(`Escrow not in holding state: ${escrow.status}`);
    }

    const provider = (input.provider ?? escrow.provider) as PaymentProviderValue;
    const adapter = this.adapterFactory.get(provider);
    if (escrow.externalId) {
      await adapter.releaseEscrow({
        externalId: escrow.externalId,
        amount: Number(escrow.amount),
      });
    }

    const releasedAt = new Date();
    const row = await this.repository.updateEscrow(escrowId, {
      status: 'released',
      releasedAt,
    });
    if (!row) throw new ServiceUnavailableException('Escrow release failed');

    if (actorPersonId) {
      await this.activityService.record({
        actorPersonId,
        action: 'escrow_released',
        targetType: 'Escrow',
        targetId: escrowId,
        metadata: {
          dealId: escrow.dealId,
          amount: Number(escrow.amount),
          provider,
        },
      });
    }

    return {
      id: row.id,
      status: 'released',
      externalId: row.externalId,
      releasedAt: releasedAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async schedulePayout(
    input: PayoutScheduleInput,
    actorPersonId?: string | null,
  ): Promise<PayoutSchedulePayload> {
    this.assertAvailable();
    const provider = input.provider as PaymentProviderValue;
    const adapter = this.adapterFactory.get(provider);
    const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : new Date();

    const payoutResult = await adapter.schedulePayout({
      amount: input.amount,
      currency: input.currency,
      beneficiaryId: input.personId,
      referenceId: `${input.personId}_${Date.now()}`,
      scheduledAt,
      metadata: { artistId: input.artistId },
    });

    const row = await this.repository.createPayout({
      artistId: input.artistId ?? null,
      personId: input.personId,
      amount: input.amount,
      currency: input.currency,
      status: 'scheduled',
      provider,
      externalId: payoutResult.externalId,
      scheduledAt,
    });
    if (!row) throw new ServiceUnavailableException('Payout scheduling failed');

    if (actorPersonId) {
      await this.activityService.record({
        actorPersonId,
        action: 'payout_scheduled',
        targetType: 'Payout',
        targetId: row.id,
        metadata: {
          artistId: input.artistId,
          personId: input.personId,
          amount: input.amount,
          provider,
          externalId: payoutResult.externalId,
        },
      });
    }

    return {
      id: row.id,
      artistId: row.artistId,
      personId: row.personId,
      amount: input.amount,
      currency: input.currency,
      status: 'scheduled',
      provider,
      externalId: payoutResult.externalId,
      scheduledAt: scheduledAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    };
  }

  async listArtistPayouts(artistId: string): Promise<PayoutListPayload> {
    this.assertAvailable();
    const rows = await this.repository.listPayouts({ artistId, limit: 100 });
    return {
      items: rows.map((row) => this.toPayoutSummary(row)),
      artistId,
      updatedAt: new Date().toISOString(),
    };
  }

  async listSettlements(query: SettlementListQuery): Promise<SettlementListPayload> {
    this.assertAvailable();
    let rows = await this.repository.listSettlements(query);

    if (rows.length === 0) {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const paidPayouts = await this.repository.listPaidPayoutsInPeriod(periodStart, periodEnd);
      const payoutIds = paidPayouts.map((p) => p.id);
      const totalAmount = paidPayouts.reduce((sum, p) => sum + Number(p.amount), 0);

      if (payoutIds.length > 0) {
        await this.repository.createSettlement({
          periodStart,
          periodEnd,
          totalAmount,
          currency: 'INR',
          status: 'pending',
          payoutIds,
        });
        rows = await this.repository.listSettlements(query);
      }
    }

    return {
      items: rows.map((row) => this.toSettlementSummary(row)),
      updatedAt: new Date().toISOString(),
    };
  }

  async dashboard(query: PaymentsDashboardQuery): Promise<PaymentsDashboardPayload> {
    this.assertAvailable();
    const [revenue, invoiceCounts, escrowHolding, payoutsScheduled] = await Promise.all([
      this.repository.aggregateRevenue(),
      this.repository.countInvoicesByStatus(),
      this.repository.sumEscrowHolding(),
      this.repository.sumScheduledPayouts(),
    ]);

    return {
      expected: revenue.expected,
      received: revenue.received,
      pending: revenue.pending,
      currency: query.currency ?? 'INR',
      invoiceCounts: {
        draft: invoiceCounts.draft ?? 0,
        sent: invoiceCounts.sent ?? 0,
        paid: invoiceCounts.paid ?? 0,
        overdue: invoiceCounts.overdue ?? 0,
        cancelled: invoiceCounts.cancelled ?? 0,
      },
      escrowHolding,
      payoutsScheduled,
      updatedAt: new Date().toISOString(),
    };
  }

  private toPayoutSummary(row: {
    id: string;
    artistId: string | null;
    personId: string;
    amount: unknown;
    currency: string;
    status: string;
    provider: string;
    externalId: string | null;
    scheduledAt: Date | null;
    paidAt: Date | null;
    createdAt: Date;
  }): PayoutSummary {
    return {
      id: row.id,
      artistId: row.artistId,
      personId: row.personId,
      amount: Number(row.amount),
      currency: row.currency,
      status: row.status as PayoutSummary['status'],
      provider: row.provider as PayoutSummary['provider'],
      externalId: row.externalId,
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
      paidAt: row.paidAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toSettlementSummary(row: {
    id: string;
    periodStart: Date;
    periodEnd: Date;
    totalAmount: unknown;
    currency: string;
    status: string;
    payoutIds: unknown;
    settledAt: Date | null;
    createdAt: Date;
  }): SettlementSummary {
    return {
      id: row.id,
      periodStart: row.periodStart.toISOString(),
      periodEnd: row.periodEnd.toISOString(),
      totalAmount: Number(row.totalAmount),
      currency: row.currency,
      status: row.status as SettlementSummary['status'],
      payoutIds: Array.isArray(row.payoutIds) ? (row.payoutIds as string[]) : [],
      settledAt: row.settledAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private assertAvailable(): void {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException('Payment module unavailable — run Phase 10.3 migration');
    }
  }
}

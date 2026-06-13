import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  BookingConvertToDealPayload,
  BookingRequestCreatedPayload,
  BookingRequestListPayload,
  BookingRequestStatus,
  BookingRequestStatusUpdatePayload,
  BookingRequestSummary,
} from '@tsc/types';
import {
  nextBookingStatus,
  type BookingRequestStatusValue,
} from '@tsc/database';
import type { MembershipContext } from '@tsc/permissions';
import { AutomationService } from '../intelligence/automation.service';
import { DealRepository } from '../deal/deal.repository';
import { WebhookEmitterService } from '../data-exchange/webhook-emitter.service';
import { BookingRepository } from './booking.repository';
import type {
  BookingInquiryCreateInput,
  BookingInquiryListQuery,
  BookingInquiryStatusUpdateInput,
} from './dto';

@Injectable()
export class BookingService {
  constructor(
    private readonly repository: BookingRepository,
    private readonly dealRepository: DealRepository,
    private readonly automationService: AutomationService,
    @Optional() private readonly webhookEmitter?: WebhookEmitterService,
  ) {}

  async list(query: BookingInquiryListQuery): Promise<BookingRequestListPayload> {
    this.assertAvailable();
    const rows = await this.repository.list(query);
    return {
      items: rows.map((row) => this.toSummary(row)),
      filters: {
        artistId: query.artistId ?? null,
        status: (query.status as BookingRequestStatus) ?? null,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  async getDetail(id: string): Promise<BookingRequestSummary> {
    this.assertAvailable();
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException(`Booking inquiry ${id} not found`);
    return this.toSummary(row);
  }

  async create(
    input: BookingInquiryCreateInput,
    ctx: MembershipContext,
  ): Promise<BookingRequestCreatedPayload> {
    this.assertAvailable();

    const row = await this.repository.create({
      requesterPersonId: input.requesterPersonId,
      artistId: input.artistId,
      venueId: input.venueId ?? null,
      eventDate: input.eventDate ? new Date(input.eventDate) : null,
      budget: input.budget ?? null,
      message: input.message ?? null,
      status: 'inquiry',
    });
    if (!row) throw new ServiceUnavailableException('Booking inquiry creation failed');

    const automation = await this.automationService.trigger({
      workflowType: 'booking_inquiry',
      payload: {
        title: input.message?.slice(0, 80) ?? `Booking inquiry for artist ${input.artistId}`,
        budget: input.budget,
        value: input.budget,
        eventDate: input.eventDate,
        venue: input.venueId,
        bookingRequestId: row.id,
        notes: input.message,
      },
      artistId: input.artistId,
      personId: input.requesterPersonId ?? ctx.personId ?? undefined,
    });

    const opportunityId =
      (automation.run.result?.opportunityId as string | undefined) ??
      automation.run.opportunityId ??
      null;

    if (opportunityId) {
      await this.repository.update(row.id, { opportunityId, status: 'matched' });
    }

    this.webhookEmitter?.emit('booking.inquiry', {
      bookingRequestId: row.id,
      artistId: row.artistId,
      requesterPersonId: row.requesterPersonId,
      venueId: row.venueId,
      status: opportunityId ? 'matched' : row.status,
      opportunityId,
    });

    return {
      id: row.id,
      status: opportunityId ? 'matched' : (row.status as BookingRequestStatus),
      artistId: row.artistId,
      automationRunId: automation.run.id,
      opportunityId,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async updateStatus(
    id: string,
    input: BookingInquiryStatusUpdateInput,
  ): Promise<BookingRequestStatusUpdatePayload> {
    this.assertAvailable();
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Booking inquiry ${id} not found`);

    const previousStatus = existing.status as BookingRequestStatusValue;
    let nextStatus: BookingRequestStatusValue | null = null;

    if (input.advance) {
      nextStatus = nextBookingStatus(previousStatus);
      if (!nextStatus) {
        throw new BadRequestException(`Booking inquiry already at terminal stage "${previousStatus}"`);
      }
    } else if (input.status) {
      nextStatus = input.status as BookingRequestStatusValue;
    } else {
      throw new BadRequestException('Provide status or advance=true');
    }

    if (nextStatus === 'cancelled' && previousStatus === 'completed') {
      throw new BadRequestException('Cannot cancel a completed booking inquiry');
    }

    const row = await this.repository.update(id, { status: nextStatus });
    if (!row) throw new ServiceUnavailableException('Booking status update failed');

    return {
      id: row.id,
      status: row.status as BookingRequestStatus,
      previousStatus: previousStatus as BookingRequestStatus,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async convertToDeal(id: string): Promise<BookingConvertToDealPayload> {
    this.assertAvailable();
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Booking inquiry ${id} not found`);

    if (existing.dealId) {
      return {
        bookingRequestId: existing.id,
        dealId: existing.dealId,
        opportunityId: existing.opportunityId ?? '',
        status: existing.status as BookingRequestStatus,
      };
    }

    if (!this.dealRepository.isAvailable()) {
      throw new ServiceUnavailableException('Deal pipeline unavailable');
    }

    let opportunityId = existing.opportunityId;
    if (!opportunityId) {
      const automation = await this.automationService.trigger({
        workflowType: 'booking_inquiry',
        payload: {
          title: existing.message?.slice(0, 80) ?? `Booking inquiry ${existing.id}`,
          budget: existing.budget != null ? Number(existing.budget) : undefined,
          value: existing.budget != null ? Number(existing.budget) : undefined,
          bookingRequestId: existing.id,
        },
        artistId: existing.artistId,
        personId: existing.requesterPersonId,
      });
      opportunityId =
        (automation.run.result?.opportunityId as string | undefined) ??
        automation.run.opportunityId ??
        null;
    }

    if (!opportunityId) {
      throw new ServiceUnavailableException('Could not create opportunity for booking inquiry');
    }

    const deal = await this.dealRepository.create({
      opportunityId,
      artistId: existing.artistId,
      status: 'discussion',
      value: existing.budget != null ? Number(existing.budget) : null,
      startDate: existing.eventDate ?? null,
      negotiationNotes: existing.message ?? null,
    });
    if (!deal) throw new ServiceUnavailableException('Deal creation failed');

    const row = await this.repository.update(id, {
      dealId: deal.id,
      opportunityId,
      status: 'negotiating',
    });
    if (!row) throw new ServiceUnavailableException('Booking inquiry update failed');

    return {
      bookingRequestId: row.id,
      dealId: deal.id,
      opportunityId,
      status: 'negotiating',
    };
  }

  /** Called from sync layer when CoreKnot emits booking.inquiry */
  async upsertFromSync(input: {
    requesterPersonId: string;
    artistId: string;
    venueId?: string | null;
    eventDate?: Date | null;
    budget?: number | null;
    message?: string | null;
    opportunityId?: string | null;
    externalId?: string;
  }): Promise<BookingRequestSummary | null> {
    if (!this.repository.isAvailable()) return null;

    const row = await this.repository.create({
      requesterPersonId: input.requesterPersonId,
      artistId: input.artistId,
      venueId: input.venueId ?? null,
      eventDate: input.eventDate ?? null,
      budget: input.budget ?? null,
      message: input.message ?? null,
      status: input.opportunityId ? 'matched' : 'inquiry',
      opportunityId: input.opportunityId ?? null,
    });
    return row ? this.toSummary(row) : null;
  }

  private toSummary(row: {
    id: string;
    requesterPersonId: string;
    artistId: string;
    venueId: string | null;
    eventDate: Date | null;
    budget: unknown;
    message: string | null;
    status: string;
    dealId: string | null;
    opportunityId: string | null;
    createdAt: Date;
    updatedAt: Date;
    requester?: { id: string; name: string | null; displayName: string | null };
    artist?: { id: string; name: string; slug: string };
    venue?: { id: string; name: string; city: string | null } | null;
  }): BookingRequestSummary {
    return {
      id: row.id,
      requesterPersonId: row.requesterPersonId,
      requesterName: row.requester?.displayName ?? row.requester?.name ?? null,
      artistId: row.artistId,
      artistName: row.artist?.name ?? null,
      venueId: row.venueId,
      venueName: row.venue?.name ?? null,
      eventDate: row.eventDate?.toISOString() ?? null,
      budget: row.budget != null ? Number(row.budget) : null,
      message: row.message,
      status: row.status as BookingRequestStatus,
      dealId: row.dealId,
      opportunityId: row.opportunityId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private assertAvailable(): void {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException('Booking module unavailable — run Phase 10.2 migration');
    }
  }
}

import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import {
  bookingListWhere,
  bookingRequestInclude,
  type BookingRequestStatusValue,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';

type BookingRow = {
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
  deal?: { id: string; status: string; value: unknown } | null;
  opportunity?: { id: string; title: string; status: string } | null;
};

type BookingClient = {
  findMany: (args: unknown) => Promise<BookingRow[]>;
  findUnique: (args: unknown) => Promise<BookingRow | null>;
  create: (args: unknown) => Promise<BookingRow>;
  update: (args: unknown) => Promise<BookingRow>;
};

@Injectable()
export class BookingRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get client(): BookingClient | null {
    const c = this.prisma.client as Prisma.TransactionClient & {
      bookingRequest?: BookingClient;
    };
    return c.bookingRequest ?? null;
  }

  isAvailable(): boolean {
    return this.client != null;
  }

  list(query: {
    artistId?: string;
    requesterPersonId?: string;
    status?: BookingRequestStatusValue;
    limit?: number;
  }) {
    if (!this.client) return Promise.resolve([]);
    return this.client.findMany({
      where: bookingListWhere(query),
      include: bookingRequestInclude,
      orderBy: [{ createdAt: 'desc' }],
      take: query.limit ?? 50,
    });
  }

  findById(id: string) {
    if (!this.client) return Promise.resolve(null);
    return this.client.findUnique({ where: { id }, include: bookingRequestInclude });
  }

  create(input: {
    requesterPersonId: string;
    artistId: string;
    venueId?: string | null;
    eventDate?: Date | null;
    budget?: number | null;
    message?: string | null;
    status?: BookingRequestStatusValue;
    opportunityId?: string | null;
  }) {
    if (!this.client) return Promise.resolve(null);
    return this.client.create({
      data: {
        id: newId(),
        requesterPersonId: input.requesterPersonId,
        artistId: input.artistId,
        venueId: input.venueId ?? null,
        eventDate: input.eventDate ?? null,
        budget: input.budget ?? null,
        message: input.message ?? null,
        status: input.status ?? 'inquiry',
        opportunityId: input.opportunityId ?? null,
      },
      include: bookingRequestInclude,
    });
  }

  update(
    id: string,
    data: {
      status?: BookingRequestStatusValue;
      dealId?: string | null;
      opportunityId?: string | null;
    },
  ) {
    if (!this.client) return Promise.resolve(null);
    return this.client.update({
      where: { id },
      data: {
        status: data.status,
        dealId: data.dealId,
        opportunityId: data.opportunityId,
      },
      include: bookingRequestInclude,
    });
  }
}

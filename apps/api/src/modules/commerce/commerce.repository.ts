import { Injectable } from '@nestjs/common';
import type {
  FanPurchaseProductTypeValue,
  FanPurchaseStatusValue,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';

type TicketRow = {
  id: string;
  eventId: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  soldCount: number;
  status: string;
};

type CommerceProductRow = {
  id: string;
  artistId: string | null;
  communityId: string | null;
  name: string;
  type: string;
  price: number;
  currency: string;
  inventory: number | null;
  soldCount: number;
  status: string;
};

type CommerceExperienceRow = {
  id: string;
  artistId: string;
  name: string;
  type: string;
  price: number;
  currency: string;
  slots: number;
  bookedCount: number;
  status: string;
};

type FanPurchaseRow = {
  id: string;
  personId: string;
  productType: string;
  productId: string;
  amount: number;
  currency: string;
  status: string;
  supportActionId: string | null;
  purchasedAt: Date;
};

@Injectable()
export class CommerceRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get ticketClient() {
    return (this.prisma.client as unknown as {
      ticket?: {
        findMany: (args: unknown) => Promise<TicketRow[]>;
        findUnique: (args: unknown) => Promise<TicketRow | null>;
        update: (args: unknown) => Promise<TicketRow>;
      };
    }).ticket ?? null;
  }

  private get productClient() {
    return (this.prisma.client as unknown as {
      commerceProduct?: {
        findMany: (args: unknown) => Promise<CommerceProductRow[]>;
        findUnique: (args: unknown) => Promise<CommerceProductRow | null>;
        update: (args: unknown) => Promise<CommerceProductRow>;
      };
    }).commerceProduct ?? null;
  }

  private get experienceClient() {
    return (this.prisma.client as unknown as {
      commerceExperience?: {
        findMany: (args: unknown) => Promise<CommerceExperienceRow[]>;
        findUnique: (args: unknown) => Promise<CommerceExperienceRow | null>;
        update: (args: unknown) => Promise<CommerceExperienceRow>;
      };
    }).commerceExperience ?? null;
  }

  private get fanPurchaseClient() {
    return (this.prisma.client as unknown as {
      fanPurchase?: {
        create: (args: unknown) => Promise<FanPurchaseRow>;
        findMany: (args: unknown) => Promise<FanPurchaseRow[]>;
        count: (args: unknown) => Promise<number>;
        update: (args: unknown) => Promise<FanPurchaseRow>;
      };
    }).fanPurchase ?? null;
  }

  isAvailable(): boolean {
    return Boolean(
      this.ticketClient &&
        this.productClient &&
        this.experienceClient &&
        this.fanPurchaseClient,
    );
  }

  listTickets(eventId?: string) {
    if (!this.ticketClient) return Promise.resolve([]);
    const where: Record<string, unknown> = {
      status: 'active',
      ...(eventId ? { eventId } : {}),
    };
    return this.ticketClient.findMany({
      where,
      orderBy: { price: 'asc' },
    });
  }

  findTicket(id: string) {
    if (!this.ticketClient) return Promise.resolve(null);
    return this.ticketClient.findUnique({ where: { id } });
  }

  incrementTicketSold(id: string) {
    if (!this.ticketClient) return Promise.resolve(null);
    return this.ticketClient.update({
      where: { id },
      data: { soldCount: { increment: 1 } },
    });
  }

  markTicketSoldOut(id: string) {
    if (!this.ticketClient) return Promise.resolve(null);
    return this.ticketClient.update({
      where: { id },
      data: { status: 'sold_out' },
    });
  }

  listProducts(artistId?: string, communityId?: string) {
    if (!this.productClient) return Promise.resolve([]);
    const where: Record<string, unknown> = {
      status: 'active',
      ...(artistId ? { artistId } : {}),
      ...(communityId ? { communityId } : {}),
    };
    return this.productClient.findMany({
      where,
      orderBy: { price: 'asc' },
    });
  }

  findProduct(id: string) {
    if (!this.productClient) return Promise.resolve(null);
    return this.productClient.findUnique({ where: { id } });
  }

  incrementProductSold(id: string) {
    if (!this.productClient) return Promise.resolve(null);
    return this.productClient.update({
      where: { id },
      data: { soldCount: { increment: 1 } },
    });
  }

  markProductSoldOut(id: string) {
    if (!this.productClient) return Promise.resolve(null);
    return this.productClient.update({
      where: { id },
      data: { status: 'sold_out' },
    });
  }

  listExperiences(artistId?: string) {
    if (!this.experienceClient) return Promise.resolve([]);
    const where: Record<string, unknown> = {
      status: 'active',
      ...(artistId ? { artistId } : {}),
    };
    return this.experienceClient.findMany({
      where,
      orderBy: { price: 'asc' },
    });
  }

  findExperience(id: string) {
    if (!this.experienceClient) return Promise.resolve(null);
    return this.experienceClient.findUnique({ where: { id } });
  }

  incrementExperienceBooked(id: string) {
    if (!this.experienceClient) return Promise.resolve(null);
    return this.experienceClient.update({
      where: { id },
      data: { bookedCount: { increment: 1 } },
    });
  }

  markExperienceSoldOut(id: string) {
    if (!this.experienceClient) return Promise.resolve(null);
    return this.experienceClient.update({
      where: { id },
      data: { status: 'sold_out' },
    });
  }

  createFanPurchase(input: {
    personId: string;
    productType: FanPurchaseProductTypeValue;
    productId: string;
    amount: number;
    currency: string;
    status?: FanPurchaseStatusValue;
  }) {
    if (!this.fanPurchaseClient) return Promise.resolve(null);
    return this.fanPurchaseClient.create({
      data: {
        personId: input.personId,
        productType: input.productType,
        productId: input.productId,
        amount: input.amount,
        currency: input.currency,
        status: input.status ?? 'recorded',
      },
    });
  }

  linkFanPurchaseSupport(fanPurchaseId: string, supportActionId: string) {
    if (!this.fanPurchaseClient) return Promise.resolve(null);
    return this.fanPurchaseClient.update({
      where: { id: fanPurchaseId },
      data: { supportActionId },
    });
  }

  listFanPurchases(personId: string, limit: number) {
    if (!this.fanPurchaseClient) return Promise.resolve([]);
    return this.fanPurchaseClient.findMany({
      where: { personId },
      orderBy: { purchasedAt: 'desc' },
      take: limit,
    });
  }

  countFanPurchases(personId: string) {
    if (!this.fanPurchaseClient) return Promise.resolve(0);
    return this.fanPurchaseClient.count({ where: { personId } });
  }

  findEvent(eventId: string) {
    return this.prisma.client.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, slug: true, artistId: true },
    });
  }

  findArtist(artistId: string) {
    return this.prisma.client.artist.findUnique({
      where: { id: artistId },
      select: { id: true, name: true, displayName: true, slug: true },
    });
  }

  findCommunity(communityId: string) {
    return this.prisma.client.community.findUnique({
      where: { id: communityId },
      select: { id: true, name: true, slug: true },
    });
  }

  findTicketsByIds(ids: string[]) {
    if (!ids.length || !this.ticketClient) return Promise.resolve([]);
    return this.ticketClient.findMany({
      where: { id: { in: ids } },
    });
  }

  findProductsByIds(ids: string[]) {
    if (!ids.length || !this.productClient) return Promise.resolve([]);
    return this.productClient.findMany({
      where: { id: { in: ids } },
    });
  }

  findExperiencesByIds(ids: string[]) {
    if (!ids.length || !this.experienceClient) return Promise.resolve([]);
    return this.experienceClient.findMany({
      where: { id: { in: ids } },
    });
  }
}

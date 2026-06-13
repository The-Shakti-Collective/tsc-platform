import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  isCatalogItemAvailable,
  supportMappingForExperience,
  supportMappingForMerch,
  supportMappingForTicket,
  type CommerceCatalogStatusValue,
  type CommerceExperienceTypeValue,
  type CommerceProductTypeValue,
  type FanPurchaseProductTypeValue,
  type FanPurchaseStatusValue,
} from '@tsc/database';
import type {
  ExperienceCatalogItem,
  ExperienceCatalogPayload,
  FanPurchasePayload,
  FanPurchaseRecord,
  FanPurchasesPayload,
  MerchCatalogItem,
  MerchCatalogPayload,
  TicketCatalogItem,
  TicketCatalogPayload,
} from '@tsc/types';
import type { MembershipContext } from '@tsc/permissions';
import { ActivityService } from '../activity/activity.service';
import { CreditsService } from '../credits/credits.service';
import { WebhookEmitterService } from '../data-exchange/webhook-emitter.service';
import { FanService } from '../fan/fan.service';
import { SupportService } from '../support/support.service';
import { CommerceRepository } from './commerce.repository';

@Injectable()
export class CommerceService {
  constructor(
    private readonly repository: CommerceRepository,
    private readonly supportService: SupportService,
    private readonly activityService: ActivityService,
    private readonly creditsService: CreditsService,
    private readonly fanService: FanService,
    @Optional() private readonly webhookEmitter?: WebhookEmitterService,
  ) {}

  async listTickets(eventId?: string): Promise<TicketCatalogPayload> {
    this.assertAvailable();
    const rows = await this.repository.listTickets(eventId);
    return {
      eventId: eventId ?? null,
      items: rows.map((row) => this.toTicketItem(row)),
      total: rows.length,
      updatedAt: new Date().toISOString(),
    };
  }

  async listMerch(artistId?: string, communityId?: string): Promise<MerchCatalogPayload> {
    this.assertAvailable();
    const rows = await this.repository.listProducts(artistId, communityId);
    return {
      artistId: artistId ?? null,
      communityId: communityId ?? null,
      items: rows.map((row) => this.toMerchItem(row)),
      total: rows.length,
      updatedAt: new Date().toISOString(),
    };
  }

  async listExperiences(artistId?: string): Promise<ExperienceCatalogPayload> {
    this.assertAvailable();
    const rows = await this.repository.listExperiences(artistId);
    return {
      artistId: artistId ?? null,
      items: rows.map((row) => this.toExperienceItem(row)),
      total: rows.length,
      updatedAt: new Date().toISOString(),
    };
  }

  async purchaseTicket(ticketId: string, ctx: MembershipContext): Promise<FanPurchasePayload> {
    this.assertAvailable();
    const personId = this.requirePersonId(ctx);
    const ticket = await this.repository.findTicket(ticketId);
    if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);
    if (ticket.status !== 'active') {
      throw new BadRequestException('Ticket is not available for purchase');
    }
    if (!isCatalogItemAvailable(ticket.soldCount, ticket.quantity)) {
      throw new BadRequestException('Ticket is sold out');
    }

    const event = await this.repository.findEvent(ticket.eventId);
    if (!event) throw new NotFoundException(`Event ${ticket.eventId} not found`);

    return this.completePurchase({
      personId,
      productType: 'ticket',
      productId: ticket.id,
      amount: ticket.price,
      currency: ticket.currency,
      productName: ticket.name,
      supportMapping: supportMappingForTicket(ticket.eventId),
      metadata: {
        ticketId: ticket.id,
        ticketName: ticket.name,
        eventId: ticket.eventId,
        eventTitle: event.title,
        eventSlug: event.slug,
      },
      activityTargetType: 'Ticket',
      activityTargetId: ticket.id,
      onInventoryUpdate: async () => {
        const updated = await this.repository.incrementTicketSold(ticket.id);
        if (updated && updated.soldCount >= updated.quantity) {
          await this.repository.markTicketSoldOut(ticket.id);
        }
      },
      eventIntelligenceLinked: true,
    });
  }

  async purchaseMerch(productId: string, ctx: MembershipContext): Promise<FanPurchasePayload> {
    this.assertAvailable();
    const personId = this.requirePersonId(ctx);
    const product = await this.repository.findProduct(productId);
    if (!product) throw new NotFoundException(`Product ${productId} not found`);
    if (product.status !== 'active') {
      throw new BadRequestException('Product is not available for purchase');
    }
    if (
      product.inventory != null &&
      !isCatalogItemAvailable(product.soldCount, product.inventory)
    ) {
      throw new BadRequestException('Product is out of stock');
    }

    const mapping = supportMappingForMerch({
      artistId: product.artistId,
      communityId: product.communityId,
      type: product.type as CommerceProductTypeValue,
    });
    if (!mapping.targetId) {
      throw new BadRequestException('Product has no artist or community target');
    }

    const meta = await this.resolveMerchMeta(product);

    return this.completePurchase({
      personId,
      productType: 'merch',
      productId: product.id,
      amount: product.price,
      currency: product.currency,
      productName: product.name,
      supportMapping: mapping,
      metadata: {
        commerceProductId: product.id,
        productName: product.name,
        productType: product.type,
        ...meta,
      },
      activityTargetType: 'CommerceProduct',
      activityTargetId: product.id,
      onInventoryUpdate: async () => {
        if (product.inventory == null) {
          await this.repository.incrementProductSold(product.id);
          return;
        }
        const updated = await this.repository.incrementProductSold(product.id);
        if (updated && updated.inventory != null && updated.soldCount >= updated.inventory) {
          await this.repository.markProductSoldOut(product.id);
        }
      },
      eventIntelligenceLinked: false,
    });
  }

  async purchaseExperience(
    experienceId: string,
    ctx: MembershipContext,
  ): Promise<FanPurchasePayload> {
    this.assertAvailable();
    const personId = this.requirePersonId(ctx);
    const experience = await this.repository.findExperience(experienceId);
    if (!experience) {
      throw new NotFoundException(`Experience ${experienceId} not found`);
    }
    if (experience.status !== 'active') {
      throw new BadRequestException('Experience is not available for booking');
    }
    if (!isCatalogItemAvailable(experience.bookedCount, experience.slots)) {
      throw new BadRequestException('Experience is fully booked');
    }

    const artist = await this.repository.findArtist(experience.artistId);
    if (!artist) throw new NotFoundException(`Artist ${experience.artistId} not found`);

    const mapping = supportMappingForExperience({
      artistId: experience.artistId,
      type: experience.type as CommerceExperienceTypeValue,
    });

    return this.completePurchase({
      personId,
      productType: 'experience',
      productId: experience.id,
      amount: experience.price,
      currency: experience.currency,
      productName: experience.name,
      supportMapping: mapping,
      metadata: {
        experienceId: experience.id,
        experienceName: experience.name,
        experienceType: experience.type,
        artistId: experience.artistId,
        artistName: artist.displayName ?? artist.name,
        artistSlug: artist.slug,
      },
      activityTargetType: 'CommerceExperience',
      activityTargetId: experience.id,
      onInventoryUpdate: async () => {
        const updated = await this.repository.incrementExperienceBooked(experience.id);
        if (updated && updated.bookedCount >= updated.slots) {
          await this.repository.markExperienceSoldOut(experience.id);
        }
      },
      eventIntelligenceLinked: false,
    });
  }

  async getMyPurchases(ctx: MembershipContext, limit = 50): Promise<FanPurchasesPayload> {
    this.assertAvailable();
    const personId = this.requirePersonId(ctx);
    const rows = await this.repository.listFanPurchases(personId, limit);
    const total = await this.repository.countFanPurchases(personId);

    const ticketIds = rows
      .filter((row) => row.productType === 'ticket')
      .map((row) => row.productId);
    const merchIds = rows
      .filter((row) => row.productType === 'merch')
      .map((row) => row.productId);
    const experienceIds = rows
      .filter((row) => row.productType === 'experience')
      .map((row) => row.productId);

    const [tickets, products, experiences] = await Promise.all([
      this.repository.findTicketsByIds(ticketIds),
      this.repository.findProductsByIds(merchIds),
      this.repository.findExperiencesByIds(experienceIds),
    ]);

    const ticketMap = new Map(tickets.map((t) => [t.id, t.name]));
    const productMap = new Map(products.map((p) => [p.id, p.name]));
    const experienceMap = new Map(experiences.map((e) => [e.id, e.name]));

    return {
      personId,
      items: rows.map((row) => {
        const names =
          row.productType === 'ticket'
            ? { ticketName: ticketMap.get(row.productId) }
            : row.productType === 'merch'
              ? { productName: productMap.get(row.productId) }
              : { experienceName: experienceMap.get(row.productId) };
        return this.toFanPurchaseRecord(row, names);
      }),
      total,
      updatedAt: new Date().toISOString(),
    };
  }

  private async completePurchase(input: {
    personId: string;
    productType: FanPurchaseProductTypeValue;
    productId: string;
    amount: number;
    currency: string;
    productName: string;
    supportMapping: ReturnType<typeof supportMappingForTicket>;
    metadata: Record<string, unknown>;
    activityTargetType: string;
    activityTargetId: string;
    onInventoryUpdate: () => Promise<void>;
    eventIntelligenceLinked: boolean;
  }): Promise<FanPurchasePayload> {
    await this.fanService.ensureFanProfileStub(input.personId);

    const purchase = await this.repository.createFanPurchase({
      personId: input.personId,
      productType: input.productType,
      productId: input.productId,
      amount: input.amount,
      currency: input.currency,
      status: 'recorded',
    });
    if (!purchase) {
      throw new ServiceUnavailableException('FanPurchase model unavailable');
    }

    const support = await this.supportService.recordFromCommerce(
      input.personId,
      input.supportMapping.targetType,
      input.supportMapping.targetId,
      input.supportMapping.actionType,
      input.amount,
      input.currency,
      {
        ...input.metadata,
        fanPurchaseId: purchase.id,
        productType: input.productType,
        productId: input.productId,
      },
    );

    if (support?.supportActionId) {
      await this.repository.linkFanPurchaseSupport(purchase.id, support.supportActionId);
    }

    await input.onInventoryUpdate();

    await this.activityService.recordInternal({
      actorPersonId: input.personId,
      action: 'purchased_product',
      targetType: input.activityTargetType,
      targetId: input.activityTargetId,
      metadata: {
        ...input.metadata,
        fanPurchaseId: purchase.id,
        productType: input.productType,
        amount: input.amount,
        currency: input.currency,
        status: 'recorded',
        trackOnly: true,
        supportActionId: support?.supportActionId ?? null,
        eventIntelligenceLinked: input.eventIntelligenceLinked,
      },
      visibility: 'public',
    });

    const earn = await this.creditsService.earnFromFanPurchase(
      input.personId,
      purchase.id,
    );

    this.webhookEmitter?.emit('fan.purchase', {
      fanPurchaseId: purchase.id,
      personId: input.personId,
      productType: input.productType,
      productId: input.productId,
      amount: input.amount,
      currency: input.currency,
      productName: input.productName,
    });

    return {
      fanPurchaseId: purchase.id,
      personId: input.personId,
      productType: input.productType,
      productId: input.productId,
      amount: input.amount,
      currency: input.currency,
      status: purchase.status as FanPurchaseStatusValue,
      supportActionId: support?.supportActionId ?? null,
      relationshipId: support?.relationshipId ?? null,
      relationshipType: support?.relationshipType === 'PURCHASED' ? 'PURCHASED' : null,
      creditsEarned: earn?.amount ?? null,
      spendScoreDelta: support?.spendScoreDelta ?? null,
      purchasedAt: purchase.purchasedAt.toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private async resolveMerchMeta(product: {
    artistId: string | null;
    communityId: string | null;
  }): Promise<Record<string, unknown>> {
    if (product.communityId) {
      const community = await this.repository.findCommunity(product.communityId);
      return {
        communityId: product.communityId,
        communityName: community?.name,
        communitySlug: community?.slug,
      };
    }
    if (product.artistId) {
      const artist = await this.repository.findArtist(product.artistId);
      return {
        artistId: product.artistId,
        artistName: artist?.displayName ?? artist?.name,
        artistSlug: artist?.slug,
      };
    }
    return {};
  }

  private toTicketItem(row: {
    id: string;
    eventId: string;
    name: string;
    price: number;
    currency: string;
    quantity: number;
    soldCount: number;
    status: string;
  }): TicketCatalogItem {
    return {
      id: row.id,
      eventId: row.eventId,
      name: row.name,
      price: row.price,
      currency: row.currency,
      quantity: row.quantity,
      soldCount: row.soldCount,
      available: Math.max(0, row.quantity - row.soldCount),
      status: row.status as CommerceCatalogStatusValue,
    };
  }

  private toMerchItem(row: {
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
  }): MerchCatalogItem {
    return {
      id: row.id,
      artistId: row.artistId,
      communityId: row.communityId,
      name: row.name,
      type: row.type as CommerceProductTypeValue,
      price: row.price,
      currency: row.currency,
      inventory: row.inventory,
      soldCount: row.soldCount,
      available:
        row.inventory == null ? null : Math.max(0, row.inventory - row.soldCount),
      status: row.status as CommerceCatalogStatusValue,
    };
  }

  private toExperienceItem(row: {
    id: string;
    artistId: string;
    name: string;
    type: string;
    price: number;
    currency: string;
    slots: number;
    bookedCount: number;
    status: string;
  }): ExperienceCatalogItem {
    return {
      id: row.id,
      artistId: row.artistId,
      name: row.name,
      type: row.type as CommerceExperienceTypeValue,
      price: row.price,
      currency: row.currency,
      slots: row.slots,
      bookedCount: row.bookedCount,
      available: Math.max(0, row.slots - row.bookedCount),
      status: row.status as CommerceCatalogStatusValue,
    };
  }

  private toFanPurchaseRecord(
    row: {
      id: string;
      personId: string;
      productType: string;
      productId: string;
      amount: number;
      currency: string;
      status: string;
      supportActionId: string | null;
      purchasedAt: Date;
    },
    names: {
      ticketName?: string;
      productName?: string;
      experienceName?: string;
    },
  ): FanPurchaseRecord {
    const productName =
      names.ticketName ?? names.productName ?? names.experienceName ?? null;
    return {
      id: row.id,
      personId: row.personId,
      productType: row.productType as FanPurchaseProductTypeValue,
      productId: row.productId,
      amount: row.amount,
      currency: row.currency,
      status: row.status as FanPurchaseStatusValue,
      supportActionId: row.supportActionId,
      purchasedAt: row.purchasedAt.toISOString(),
      productName,
    };
  }

  private requirePersonId(ctx: MembershipContext): string {
    const personId = ctx.personId ?? ctx.userId;
    if (!personId) {
      throw new ForbiddenException('Authenticated person required');
    }
    return personId;
  }

  private assertAvailable() {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException(
        'Commerce models not merged — apply phase8-step8.prisma migration',
      );
    }
  }
}

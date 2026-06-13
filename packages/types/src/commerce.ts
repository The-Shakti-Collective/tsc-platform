import type {
  CommerceCatalogStatusValue,
  CommerceExperienceTypeValue,
  CommerceProductTypeValue,
  FanPurchaseProductTypeValue,
  FanPurchaseStatusValue,
  SupportActionTypeValue,
  SupportTargetTypeValue,
} from '@tsc/database';

export interface TicketCatalogItem {
  id: string;
  eventId: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  soldCount: number;
  available: number;
  status: CommerceCatalogStatusValue;
}

export interface MerchCatalogItem {
  id: string;
  artistId: string | null;
  communityId: string | null;
  name: string;
  type: CommerceProductTypeValue;
  price: number;
  currency: string;
  inventory: number | null;
  soldCount: number;
  available: number | null;
  status: CommerceCatalogStatusValue;
}

export interface ExperienceCatalogItem {
  id: string;
  artistId: string;
  name: string;
  type: CommerceExperienceTypeValue;
  price: number;
  currency: string;
  slots: number;
  bookedCount: number;
  available: number;
  status: CommerceCatalogStatusValue;
}

export interface TicketCatalogPayload {
  eventId: string | null;
  items: TicketCatalogItem[];
  total: number;
  updatedAt: string;
}

export interface MerchCatalogPayload {
  artistId: string | null;
  communityId: string | null;
  items: MerchCatalogItem[];
  total: number;
  updatedAt: string;
}

export interface ExperienceCatalogPayload {
  artistId: string | null;
  items: ExperienceCatalogItem[];
  total: number;
  updatedAt: string;
}

export interface FanPurchaseRecord {
  id: string;
  personId: string;
  productType: FanPurchaseProductTypeValue;
  productId: string;
  amount: number;
  currency: string;
  status: FanPurchaseStatusValue;
  supportActionId: string | null;
  purchasedAt: string;
  productName?: string | null;
  metadata?: Record<string, unknown>;
}

export interface FanPurchasePayload {
  fanPurchaseId: string;
  personId: string;
  productType: FanPurchaseProductTypeValue;
  productId: string;
  amount: number;
  currency: string;
  status: FanPurchaseStatusValue;
  supportActionId: string | null;
  relationshipId: string | null;
  relationshipType: 'PURCHASED' | null;
  creditsEarned: number | null;
  spendScoreDelta: number | null;
  purchasedAt: string;
  updatedAt: string;
}

export interface FanPurchasesPayload {
  personId: string;
  items: FanPurchaseRecord[];
  total: number;
  updatedAt: string;
}

export interface CommercePurchaseSideEffects {
  supportTargetType: SupportTargetTypeValue;
  supportTargetId: string;
  supportActionType: SupportActionTypeValue;
  eventIntelligenceLinked: boolean;
}

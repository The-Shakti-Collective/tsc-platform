/** Phase 8 Step 8 — Fan Commerce catalog + purchases (track-only). */

import type { SupportActionTypeValue, SupportTargetTypeValue } from './support-action.js';

export const COMMERCE_CATALOG_STATUSES = ['active', 'inactive', 'sold_out'] as const;

export type CommerceCatalogStatusValue = (typeof COMMERCE_CATALOG_STATUSES)[number];

export const COMMERCE_PRODUCT_TYPES = [
  'physical_merch',
  'sample_pack',
  'digital_download',
] as const;

export type CommerceProductTypeValue = (typeof COMMERCE_PRODUCT_TYPES)[number];

export const COMMERCE_EXPERIENCE_TYPES = [
  'vip_meet_greet',
  'workshop',
  'backstage',
  'community_pass',
] as const;

export type CommerceExperienceTypeValue = (typeof COMMERCE_EXPERIENCE_TYPES)[number];

export const FAN_PURCHASE_PRODUCT_TYPES = ['ticket', 'merch', 'experience'] as const;

export type FanPurchaseProductTypeValue = (typeof FAN_PURCHASE_PRODUCT_TYPES)[number];

export const FAN_PURCHASE_STATUSES = ['recorded', 'pending_payment'] as const;

export type FanPurchaseStatusValue = (typeof FAN_PURCHASE_STATUSES)[number];

export const COMMERCE_MODELS = [
  'Ticket',
  'CommerceProduct',
  'CommerceExperience',
  'FanPurchase',
] as const;

export type CommerceModel = (typeof COMMERCE_MODELS)[number];

export interface CommerceSupportMapping {
  targetType: SupportTargetTypeValue;
  targetId: string;
  actionType: SupportActionTypeValue;
}

/** Map catalog product to SupportAction ledger row for PURCHASED edges. */
export function supportMappingForMerch(product: {
  artistId?: string | null;
  communityId?: string | null;
  type: CommerceProductTypeValue;
}): CommerceSupportMapping {
  if (product.communityId) {
    return {
      targetType: 'Community',
      targetId: product.communityId,
      actionType: 'buy_membership',
    };
  }
  return {
    targetType: 'Artist',
    targetId: product.artistId ?? '',
    actionType:
      product.type === 'sample_pack' ? 'buy_membership' : 'buy_experience',
  };
}

export function supportMappingForExperience(experience: {
  artistId: string;
  type: CommerceExperienceTypeValue;
}): CommerceSupportMapping {
  return {
    targetType: 'Artist',
    targetId: experience.artistId,
    actionType: experience.type === 'workshop' ? 'buy_workshop' : 'buy_experience',
  };
}

export function supportMappingForTicket(eventId: string): CommerceSupportMapping {
  return {
    targetType: 'Event',
    targetId: eventId,
    actionType: 'buy_ticket',
  };
}

export function isCatalogItemAvailable(
  soldOrBooked: number,
  capacity: number | null | undefined,
): boolean {
  if (capacity == null) return true;
  return soldOrBooked < capacity;
}

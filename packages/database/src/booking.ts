import type { Prisma } from '@prisma/client';

export const BOOKING_REQUEST_STATUSES = [
  'inquiry',
  'matched',
  'negotiating',
  'contracted',
  'completed',
  'cancelled',
] as const;

export type BookingRequestStatusValue = (typeof BOOKING_REQUEST_STATUSES)[number];

export const BOOKING_STATUS_PIPELINE: BookingRequestStatusValue[] = [
  'inquiry',
  'matched',
  'negotiating',
  'contracted',
  'completed',
];

export function nextBookingStatus(
  current: BookingRequestStatusValue,
): BookingRequestStatusValue | null {
  const index = BOOKING_STATUS_PIPELINE.indexOf(current);
  if (index < 0 || index >= BOOKING_STATUS_PIPELINE.length - 1) return null;
  return BOOKING_STATUS_PIPELINE[index + 1] ?? null;
}

export const bookingRequestInclude = {
  requester: {
    select: { id: true, name: true, displayName: true },
  },
  artist: {
    select: { id: true, name: true, slug: true },
  },
  venue: {
    select: { id: true, name: true, city: true },
  },
  deal: {
    select: { id: true, status: true, value: true },
  },
  opportunity: {
    select: { id: true, title: true, status: true },
  },
} satisfies Prisma.BookingRequestInclude;

export function bookingListWhere(input: {
  artistId?: string;
  requesterPersonId?: string;
  status?: BookingRequestStatusValue;
}): Prisma.BookingRequestWhereInput {
  const where: Prisma.BookingRequestWhereInput = {};
  if (input.artistId) where.artistId = input.artistId;
  if (input.requesterPersonId) where.requesterPersonId = input.requesterPersonId;
  if (input.status) where.status = input.status;
  return where;
}

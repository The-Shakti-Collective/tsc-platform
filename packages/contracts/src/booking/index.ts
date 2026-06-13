import { z } from 'zod';

export const BookingRequestStatusSchema = z.enum([
  'inquiry',
  'matched',
  'negotiating',
  'contracted',
  'completed',
  'cancelled',
]);

export const BookingInquiryListQuerySchema = z.object({
  artistId: z.string().min(1).optional(),
  requesterPersonId: z.string().min(1).optional(),
  status: BookingRequestStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const BookingInquiryCreateSchema = z.object({
  requesterPersonId: z.string().min(1),
  artistId: z.string().min(1),
  venueId: z.string().min(1).optional(),
  eventDate: z.string().datetime().optional(),
  budget: z.coerce.number().nonnegative().optional(),
  message: z.string().max(4000).optional(),
});

export const BookingInquiryStatusUpdateSchema = z.object({
  status: BookingRequestStatusSchema.optional(),
  advance: z.boolean().optional().default(false),
});

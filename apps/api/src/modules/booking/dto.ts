import type { z } from 'zod';
import type {
  BookingInquiryCreateSchema,
  BookingInquiryListQuerySchema,
  BookingInquiryStatusUpdateSchema,
} from './schema';

export type BookingInquiryListQuery = z.infer<typeof BookingInquiryListQuerySchema>;
export type BookingInquiryCreateInput = z.infer<typeof BookingInquiryCreateSchema>;
export type BookingInquiryStatusUpdateInput = z.infer<typeof BookingInquiryStatusUpdateSchema>;

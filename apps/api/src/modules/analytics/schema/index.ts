import { z } from 'zod';

export const AnalyticsCumulativeQuerySchema = z.object({
  organizationId: z.string().optional(),
});

export const AnalyticsCompareQuerySchema = z.object({
  metric: z.string().min(1),
  currentStart: z.coerce.date(),
  currentEnd: z.coerce.date(),
  previousStart: z.coerce.date(),
  previousEnd: z.coerce.date(),
  organizationId: z.string().optional(),
});

export const AnalyticsSparklineQuerySchema = z.object({
  metric: z.string().min(1),
  days: z.coerce.number().int().min(1).max(90).default(7),
  organizationId: z.string().optional(),
});

export type AnalyticsCompareQuery = z.infer<typeof AnalyticsCompareQuerySchema>;
export type AnalyticsSparklineQuery = z.infer<typeof AnalyticsSparklineQuerySchema>;

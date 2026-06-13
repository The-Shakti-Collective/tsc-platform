import { z } from 'zod';
import { ActivityFeedQuerySchema, ActivityRecordSchema } from '@tsc/contracts';

export const ActivityFeedQuerySchemaLocal = ActivityFeedQuerySchema;
export const ActivityRecordSchemaLocal = ActivityRecordSchema;

export type ActivityFeedQuery = z.output<typeof ActivityFeedQuerySchema>;
export type ActivityRecordInput = z.output<typeof ActivityRecordSchema>;

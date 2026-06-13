import type { z } from 'zod';
import type {
  AutomationRuleCreateSchema,
  AutomationRuleListQuerySchema,
  AutomationRuleUpdateSchema,
  AutomationTriggerSchema,
  GoalCreateSchema,
  GoalDashboardQuerySchema,
  GoalListQuerySchema,
  GoalUpdateSchema,
} from './schema';

export type AutomationRuleCreateInput = z.infer<typeof AutomationRuleCreateSchema>;
export type AutomationRuleUpdateInput = z.infer<typeof AutomationRuleUpdateSchema>;
export type AutomationRuleListQuery = z.infer<typeof AutomationRuleListQuerySchema>;
export type AutomationTriggerInput = z.infer<typeof AutomationTriggerSchema>;
export type GoalCreateInput = z.infer<typeof GoalCreateSchema>;
export type GoalUpdateInput = z.infer<typeof GoalUpdateSchema>;
export type GoalListQuery = z.infer<typeof GoalListQuerySchema>;
export type GoalDashboardQuery = z.infer<typeof GoalDashboardQuerySchema>;

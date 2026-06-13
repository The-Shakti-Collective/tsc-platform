import { z } from 'zod';

export const IdentifierProviderSchema = z.enum([
  'email',
  'phone',
  'instagram',
  'spotify',
  'tiktok',
  'twitter',
  'community_account',
  'coreknot_user',
  'website',
  'other',
]);

export const PersonRoleTypeSchema = z.enum([
  'artist',
  'manager',
  'fan',
  'community_leader',
  'booker',
  'curator',
  'brand_rep',
  'organizer',
  'other',
]);

export const PersonRoleStatusSchema = z.enum(['active', 'inactive', 'pending']);

export const IdentityMergeReasonSchema = z.enum([
  'manual',
  'auto_match',
  'sync_reconcile',
  'admin_override',
]);

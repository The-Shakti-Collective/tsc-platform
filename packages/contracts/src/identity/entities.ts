import { z } from 'zod';
import {
  IdentifierProviderSchema,
  IdentityMergeReasonSchema,
  PersonRoleStatusSchema,
  PersonRoleTypeSchema,
} from './enums.js';

export const PersonIdentifierSchema = z.object({
  id: z.string(),
  personId: z.string(),
  provider: IdentifierProviderSchema,
  externalId: z.string(),
  normalizedId: z.string().nullable(),
  verified: z.boolean(),
  primary: z.boolean(),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const PersonRoleSchema = z.object({
  id: z.string(),
  personId: z.string(),
  role: PersonRoleTypeSchema,
  status: PersonRoleStatusSchema,
  entityType: z.string().nullable(),
  entityId: z.string().nullable(),
  metadata: z.record(z.unknown()),
  assignedAt: z.string().datetime(),
  expiresAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const IdentityMergeLogSchema = z.object({
  id: z.string(),
  survivorPersonId: z.string(),
  mergedPersonId: z.string(),
  reason: IdentityMergeReasonSchema,
  matchSignals: z.record(z.unknown()).nullable(),
  conflictResolutions: z.record(z.unknown()).nullable(),
  mergedBy: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  createdAt: z.string().datetime(),
});

export const LinkedEntityRefSchema = z.object({
  entityType: z.string(),
  entityId: z.string(),
  label: z.string().nullable(),
  role: z.string().nullable().optional(),
  linkedAt: z.string().datetime().nullable().optional(),
});

export const RelationshipSummarySchema = z.object({
  id: z.string(),
  sourceEntityType: z.string(),
  sourceEntityId: z.string(),
  targetEntityType: z.string(),
  targetEntityId: z.string(),
  relationshipType: z.string(),
  metadata: z.record(z.unknown()),
});

export const PersonCoreSummarySchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  displayName: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  mergedIntoId: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const Person360PayloadSchema = z.object({
  person: PersonCoreSummarySchema,
  identifiers: z.array(PersonIdentifierSchema),
  roles: z.array(PersonRoleSchema),
  linkedEntities: z.object({
    artists: z.array(LinkedEntityRefSchema),
    communities: z.array(LinkedEntityRefSchema),
    events: z.array(LinkedEntityRefSchema),
    opportunities: z.array(LinkedEntityRefSchema),
  }),
  relationships: z.array(RelationshipSummarySchema),
  mergeHistory: z.array(IdentityMergeLogSchema),
  updatedAt: z.string().datetime(),
});

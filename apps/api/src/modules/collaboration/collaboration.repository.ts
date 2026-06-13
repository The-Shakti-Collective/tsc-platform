import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import {
  COLLABORATED_WITH_RELATIONSHIP,
  WORKED_WITH_RELATIONSHIP,
  collaborationApplicationInclude,
  collaborationBrowseWhere,
  collaborationCreatorInclude,
  collaborationDetailInclude,
  normalizeRelationshipType,
  type CollaborationApplicationStatusValue,
  type CollaborationStatusValue,
  type CollaborationTypeValue,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { toInputJson } from '../../common/json';
import type {
  CollaborationBrowseQuery,
  CollaborationCreateInput,
  CollaborationUpdateInput,
} from './dto';

type CollaborationRow = {
  id: string;
  creatorPersonId: string;
  title: string;
  description: string | null;
  type: string;
  genres: string[];
  city: string | null;
  status: string;
  createdAt: Date;
  expiresAt: Date | null;
  creator?: {
    id: string;
    displayName: string | null;
    name: string | null;
    profile?: { slug: string; username: string | null } | null;
  };
  _count?: { applications: number };
  applications?: CollaborationApplicationRow[];
};

type CollaborationApplicationRow = {
  id: string;
  collaborationId: string;
  applicantPersonId: string;
  message: string | null;
  status: string;
  appliedAt: Date;
  applicant?: {
    id: string;
    displayName: string | null;
    name: string | null;
    profile?: { slug: string; username: string | null } | null;
  };
  collaboration?: {
    id: string;
    title: string;
    type: string;
    city: string | null;
    status: string;
  };
};

type CollaborationClient = {
  findMany: (args: unknown) => Promise<CollaborationRow[]>;
  findUnique: (args: unknown) => Promise<CollaborationRow | null>;
  create: (args: unknown) => Promise<CollaborationRow>;
  update: (args: unknown) => Promise<CollaborationRow>;
};

type CollaborationApplicationClient = {
  findUnique: (args: unknown) => Promise<CollaborationApplicationRow | null>;
  findMany: (args: unknown) => Promise<CollaborationApplicationRow[]>;
  upsert: (args: unknown) => Promise<CollaborationApplicationRow>;
  update: (args: unknown) => Promise<CollaborationApplicationRow>;
};

@Injectable()
export class CollaborationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get collaborationClient(): CollaborationClient | null {
    const client = this.prisma.client as Prisma.TransactionClient & {
      collaboration?: CollaborationClient;
    };
    return client.collaboration ?? null;
  }

  private get applicationClient(): CollaborationApplicationClient | null {
    const client = this.prisma.client as Prisma.TransactionClient & {
      collaborationApplication?: CollaborationApplicationClient;
    };
    return client.collaborationApplication ?? null;
  }

  isAvailable(): boolean {
    return this.collaborationClient != null;
  }

  browse(query: CollaborationBrowseQuery) {
    if (!this.collaborationClient) return Promise.resolve([] as CollaborationRow[]);
    return this.collaborationClient.findMany({
      where: collaborationBrowseWhere({
        type: query.type as CollaborationTypeValue | undefined,
        genre: query.genre,
        city: query.city,
        status: query.status as CollaborationStatusValue,
      }),
      include: collaborationCreatorInclude,
      orderBy: [{ createdAt: 'desc' }],
      take: query.limit,
    });
  }

  findById(id: string) {
    if (!this.collaborationClient) return Promise.resolve(null);
    return this.collaborationClient.findUnique({
      where: { id },
      include: collaborationDetailInclude,
    });
  }

  listCreatedByPerson(creatorPersonId: string) {
    if (!this.collaborationClient) return Promise.resolve([] as CollaborationRow[]);
    return this.collaborationClient.findMany({
      where: { creatorPersonId },
      include: collaborationCreatorInclude,
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  listApplicationsByPerson(applicantPersonId: string) {
    if (!this.applicationClient) return Promise.resolve([] as CollaborationApplicationRow[]);
    return this.applicationClient.findMany({
      where: { applicantPersonId },
      include: {
        ...collaborationApplicationInclude,
        collaboration: {
          select: {
            id: true,
            title: true,
            type: true,
            city: true,
            status: true,
          },
        },
      },
      orderBy: [{ appliedAt: 'desc' }],
    });
  }

  findApplication(collaborationId: string, applicantPersonId: string) {
    if (!this.applicationClient) return Promise.resolve(null);
    return this.applicationClient.findUnique({
      where: {
        collaborationId_applicantPersonId: { collaborationId, applicantPersonId },
      },
      include: collaborationApplicationInclude,
    });
  }

  findApplicationById(id: string) {
    if (!this.applicationClient) return Promise.resolve(null);
    return this.applicationClient.findUnique({
      where: { id },
      include: {
        ...collaborationApplicationInclude,
        collaboration: {
          select: {
            id: true,
            title: true,
            creatorPersonId: true,
            status: true,
          },
        },
      },
    });
  }

  create(input: CollaborationCreateInput, creatorPersonId: string) {
    if (!this.collaborationClient) return Promise.resolve(null);
    return this.collaborationClient.create({
      data: {
        id: newId(),
        creatorPersonId,
        title: input.title,
        description: input.description ?? null,
        type: input.type,
        genres: (input.genres ?? []).map((g) => g.toLowerCase()),
        city: input.city ?? null,
        status: 'open',
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
      include: collaborationCreatorInclude,
    });
  }

  update(id: string, input: CollaborationUpdateInput) {
    if (!this.collaborationClient) return Promise.resolve(null);
    return this.collaborationClient.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        type: input.type,
        genres: input.genres?.map((g) => g.toLowerCase()),
        city: input.city,
        status: input.status,
        expiresAt:
          input.expiresAt !== undefined
            ? input.expiresAt
              ? new Date(input.expiresAt)
              : null
            : undefined,
      },
      include: collaborationDetailInclude,
    });
  }

  upsertApplication(input: {
    collaborationId: string;
    applicantPersonId: string;
    message?: string | null;
  }) {
    if (!this.applicationClient) return Promise.resolve(null);
    return this.applicationClient.upsert({
      where: {
        collaborationId_applicantPersonId: {
          collaborationId: input.collaborationId,
          applicantPersonId: input.applicantPersonId,
        },
      },
      create: {
        id: newId(),
        collaborationId: input.collaborationId,
        applicantPersonId: input.applicantPersonId,
        message: input.message ?? null,
        status: 'applied',
        appliedAt: new Date(),
      },
      update: {
        message: input.message ?? undefined,
        status: 'applied',
        appliedAt: new Date(),
      },
      include: collaborationApplicationInclude,
    });
  }

  updateApplicationStatus(id: string, status: CollaborationApplicationStatusValue) {
    if (!this.applicationClient) return Promise.resolve(null);
    return this.applicationClient.update({
      where: { id },
      data: { status },
      include: collaborationApplicationInclude,
    });
  }

  upsertCollaborationRelationships(creatorPersonId: string, applicantPersonId: string) {
    const metadata = toInputJson({
      source: 'collaboration-marketplace',
      createdAt: new Date().toISOString(),
    });

    const upsertEdge = (
      sourcePersonId: string,
      targetPersonId: string,
      relationshipType: string,
    ) =>
      this.prisma.client.relationship.upsert({
        where: {
          sourceEntityType_sourceEntityId_targetEntityType_targetEntityId_relationshipType:
            {
              sourceEntityType: 'Person',
              sourceEntityId: sourcePersonId,
              targetEntityType: 'Person',
              targetEntityId: targetPersonId,
              relationshipType: normalizeRelationshipType(relationshipType),
            },
        },
        create: {
          id: newId(),
          sourceEntityType: 'Person',
          sourceEntityId: sourcePersonId,
          targetEntityType: 'Person',
          targetEntityId: targetPersonId,
          relationshipType: normalizeRelationshipType(relationshipType),
          effectiveFrom: new Date(),
          metadata,
        },
        update: {
          effectiveTo: null,
          effectiveFrom: new Date(),
          metadata,
        },
      });

    return Promise.all([
      upsertEdge(creatorPersonId, applicantPersonId, COLLABORATED_WITH_RELATIONSHIP),
      upsertEdge(creatorPersonId, applicantPersonId, WORKED_WITH_RELATIONSHIP),
    ]);
  }
}

export type { CollaborationRow, CollaborationApplicationRow };

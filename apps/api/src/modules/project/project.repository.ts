import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import {
  projectInclude,
  projectMemberInclude,
  projectWorkspaceSlugWhere,
  projectsByWorkspaceWhere,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';

type ProjectRow = {
  id: string;
  workspaceId: string;
  slug: string;
  name: string;
  type: string;
  description: string | null;
  status: string;
  budget: number | null;
  currency: string | null;
  timelineStart: Date | null;
  timelineEnd: Date | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  members?: ProjectMemberRow[];
  tasks?: { id: string; status: string }[];
};

type ProjectMemberRow = {
  projectId: string;
  personId: string;
  role: string;
  joinedAt: Date;
  person?: {
    id: string;
    displayName: string | null;
    name: string | null;
    profile: { slug: string; username: string | null } | null;
  };
};

@Injectable()
export class ProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(field: string): unknown {
    return (this.prisma.client as unknown as Record<string, unknown>)[field] ?? null;
  }

  isAvailable(): boolean {
    return this.client('project') != null;
  }

  findByWorkspaceSlug(workspaceId: string, slug: string) {
    const project = this.client('project') as {
      findFirst: (args: unknown) => Promise<ProjectRow | null>;
    } | null;
    if (!project) return Promise.resolve(null);
    return project.findFirst({
      where: projectWorkspaceSlugWhere(workspaceId, slug),
      include: projectInclude,
    });
  }

  findById(projectId: string) {
    const project = this.client('project') as {
      findFirst: (args: unknown) => Promise<ProjectRow | null>;
    } | null;
    if (!project) return Promise.resolve(null);
    return project.findFirst({
      where: { id: projectId },
      include: projectInclude,
    });
  }

  listByWorkspace(workspaceId: string) {
    const project = this.client('project') as {
      findMany: (args: unknown) => Promise<ProjectRow[]>;
    } | null;
    if (!project) return Promise.resolve([]);
    return project.findMany({
      where: projectsByWorkspaceWhere(workspaceId),
      include: projectInclude,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  slugExists(workspaceId: string, slug: string) {
    const project = this.client('project') as {
      findFirst: (args: unknown) => Promise<{ id: string } | null>;
    } | null;
    if (!project) return Promise.resolve(false);
    return project
      .findFirst({
        where: projectWorkspaceSlugWhere(workspaceId, slug),
        select: { id: true },
      })
      .then((row) => row != null);
  }

  create(input: {
    workspaceId: string;
    slug: string;
    name: string;
    type: string;
    description?: string | null;
    status?: string;
    budget?: number | null;
    currency?: string | null;
    timelineStart?: Date | null;
    timelineEnd?: Date | null;
    metadata?: Prisma.InputJsonValue;
    ownerPersonId: string;
  }) {
    const project = this.client('project') as {
      create: (args: unknown) => Promise<ProjectRow>;
    } | null;
    if (!project) return Promise.resolve(null);
    return project.create({
      data: {
        id: newId(),
        workspaceId: input.workspaceId,
        slug: input.slug,
        name: input.name,
        type: input.type,
        description: input.description ?? null,
        status: input.status ?? 'planning',
        budget: input.budget ?? null,
        currency: input.currency ?? null,
        timelineStart: input.timelineStart ?? null,
        timelineEnd: input.timelineEnd ?? null,
        metadata: input.metadata ?? {},
        members: {
          create: {
            personId: input.ownerPersonId,
            role: 'owner',
          },
        },
      },
      include: projectInclude,
    });
  }

  update(
    projectId: string,
    data: {
      name?: string;
      type?: string;
      description?: string | null;
      status?: string;
      budget?: number | null;
      currency?: string | null;
      timelineStart?: Date | null;
      timelineEnd?: Date | null;
      metadata?: Prisma.InputJsonValue;
    },
  ) {
    const project = this.client('project') as {
      update: (args: unknown) => Promise<ProjectRow>;
    } | null;
    if (!project) return Promise.resolve(null);
    return project.update({
      where: { id: projectId },
      data,
      include: projectInclude,
    });
  }

  delete(projectId: string) {
    const project = this.client('project') as {
      delete: (args: unknown) => Promise<ProjectRow>;
    } | null;
    if (!project) return Promise.resolve(null);
    return project.delete({
      where: { id: projectId },
      include: projectInclude,
    });
  }

  listMembers(projectId: string) {
    const member = this.client('projectMember') as {
      findMany: (args: unknown) => Promise<ProjectMemberRow[]>;
    } | null;
    if (!member) return Promise.resolve([]);
    return member.findMany({
      where: { projectId },
      include: projectMemberInclude,
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });
  }

  addMember(input: { projectId: string; personId: string; role: string }) {
    const member = this.client('projectMember') as {
      upsert: (args: unknown) => Promise<ProjectMemberRow>;
    } | null;
    if (!member) return Promise.resolve(null);
    return member.upsert({
      where: {
        projectId_personId: {
          projectId: input.projectId,
          personId: input.personId,
        },
      },
      create: {
        projectId: input.projectId,
        personId: input.personId,
        role: input.role,
      },
      update: {
        role: input.role,
        joinedAt: new Date(),
      },
      include: projectMemberInclude,
    });
  }
}

export type { ProjectRow, ProjectMemberRow };

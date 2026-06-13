import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import {
  activeWorkspaceMembersWhere,
  personalWorkspaceWhere,
  workspaceInclude,
  workspaceMemberInclude,
  workspaceMemberWhere,
  workspaceOwnerWhere,
  workspaceSlugWhere,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';

type WorkspaceRow = {
  id: string;
  slug: string;
  name: string;
  ownerPersonId: string;
  type: string;
  settings: unknown;
  createdAt: Date;
  updatedAt: Date;
  owner?: {
    id: string;
    displayName: string | null;
    name: string | null;
    profile: { slug: string; username: string | null } | null;
  };
  members?: WorkspaceMemberRow[];
  teams?: WorkspaceTeamRow[];
};

type WorkspaceMemberRow = {
  id: string;
  workspaceId: string;
  personId: string;
  role: string;
  joinedAt: Date;
  status: string;
  person?: {
    id: string;
    displayName: string | null;
    name: string | null;
    profile: { slug: string; username: string | null } | null;
  };
};

type WorkspaceTeamRow = {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class WorkspaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(field: string): unknown {
    return (this.prisma.client as unknown as Record<string, unknown>)[field] ?? null;
  }

  isAvailable(): boolean {
    return this.client('workspace') != null;
  }

  findBySlug(slug: string) {
    const workspace = this.client('workspace') as {
      findFirst: (args: unknown) => Promise<WorkspaceRow | null>;
    } | null;
    if (!workspace) return Promise.resolve(null);
    return workspace.findFirst({
      where: workspaceSlugWhere(slug),
      include: workspaceInclude,
    });
  }

  findPersonalByOwner(personId: string) {
    const workspace = this.client('workspace') as {
      findFirst: (args: unknown) => Promise<WorkspaceRow | null>;
    } | null;
    if (!workspace) return Promise.resolve(null);
    return workspace.findFirst({
      where: personalWorkspaceWhere(personId),
      include: workspaceInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  findDefaultForPerson(personId: string) {
    const workspace = this.client('workspace') as {
      findFirst: (args: unknown) => Promise<WorkspaceRow | null>;
    } | null;
    if (!workspace) return Promise.resolve(null);

    return workspace.findFirst({
      where: {
        OR: [
          personalWorkspaceWhere(personId),
          {
            members: {
              some: {
                personId,
                status: 'active',
              },
            },
          },
          workspaceOwnerWhere(personId),
        ],
      },
      include: workspaceInclude,
      orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findOwnedByPerson(personId: string) {
    const workspace = this.client('workspace') as {
      findMany: (args: unknown) => Promise<WorkspaceRow[]>;
    } | null;
    if (!workspace) return Promise.resolve([]);
    return workspace.findMany({
      where: workspaceOwnerWhere(personId),
      include: workspaceInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  findMember(workspaceId: string, personId: string) {
    const member = this.client('workspaceMember') as {
      findFirst: (args: unknown) => Promise<WorkspaceMemberRow | null>;
    } | null;
    if (!member) return Promise.resolve(null);
    return member.findFirst({
      where: workspaceMemberWhere(workspaceId, personId),
      include: workspaceMemberInclude,
    });
  }

  listMembers(workspaceId: string) {
    const member = this.client('workspaceMember') as {
      findMany: (args: unknown) => Promise<WorkspaceMemberRow[]>;
    } | null;
    if (!member) return Promise.resolve([]);
    return member.findMany({
      where: activeWorkspaceMembersWhere(workspaceId),
      include: workspaceMemberInclude,
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });
  }

  listTeams(workspaceId: string) {
    const team = this.client('workspaceTeam') as {
      findMany: (args: unknown) => Promise<WorkspaceTeamRow[]>;
    } | null;
    if (!team) return Promise.resolve([]);
    return team.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' },
    });
  }

  createWorkspace(input: {
    slug: string;
    name: string;
    ownerPersonId: string;
    type: string;
    settings?: Prisma.InputJsonValue;
  }) {
    const workspace = this.client('workspace') as {
      create: (args: unknown) => Promise<WorkspaceRow>;
    } | null;
    if (!workspace) return Promise.resolve(null);
    return workspace.create({
      data: {
        id: newId(),
        slug: input.slug,
        name: input.name,
        ownerPersonId: input.ownerPersonId,
        type: input.type,
        settings: input.settings ?? {},
        members: {
          create: {
            id: newId(),
            personId: input.ownerPersonId,
            role: 'owner',
            status: 'active',
          },
        },
      },
      include: workspaceInclude,
    });
  }

  updateWorkspace(
    workspaceId: string,
    data: {
      name?: string;
      settings?: Prisma.InputJsonValue;
    },
  ) {
    const workspace = this.client('workspace') as {
      update: (args: unknown) => Promise<WorkspaceRow>;
    } | null;
    if (!workspace) return Promise.resolve(null);
    return workspace.update({
      where: { id: workspaceId },
      data,
      include: workspaceInclude,
    });
  }

  addMember(input: {
    workspaceId: string;
    personId: string;
    role: string;
    status?: string;
  }) {
    const member = this.client('workspaceMember') as {
      upsert: (args: unknown) => Promise<WorkspaceMemberRow>;
    } | null;
    if (!member) return Promise.resolve(null);
    return member.upsert({
      where: {
        workspaceId_personId: {
          workspaceId: input.workspaceId,
          personId: input.personId,
        },
      },
      create: {
        id: newId(),
        workspaceId: input.workspaceId,
        personId: input.personId,
        role: input.role,
        status: input.status ?? 'active',
      },
      update: {
        role: input.role,
        status: input.status ?? 'active',
        joinedAt: new Date(),
      },
      include: workspaceMemberInclude,
    });
  }

  updateMemberRole(workspaceId: string, personId: string, role: string) {
    const member = this.client('workspaceMember') as {
      update: (args: unknown) => Promise<WorkspaceMemberRow>;
    } | null;
    if (!member) return Promise.resolve(null);
    return member.update({
      where: {
        workspaceId_personId: {
          workspaceId,
          personId,
        },
      },
      data: { role },
      include: workspaceMemberInclude,
    });
  }

  removeMember(workspaceId: string, personId: string) {
    const member = this.client('workspaceMember') as {
      update: (args: unknown) => Promise<WorkspaceMemberRow>;
    } | null;
    if (!member) return Promise.resolve(null);
    return member.update({
      where: {
        workspaceId_personId: {
          workspaceId,
          personId,
        },
      },
      data: { status: 'removed' },
      include: workspaceMemberInclude,
    });
  }

  createTeam(input: {
    workspaceId: string;
    name: string;
    slug: string;
    description?: string | null;
  }) {
    const team = this.client('workspaceTeam') as {
      create: (args: unknown) => Promise<WorkspaceTeamRow>;
    } | null;
    if (!team) return Promise.resolve(null);
    return team.create({
      data: {
        id: newId(),
        workspaceId: input.workspaceId,
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
      },
    });
  }

  findPersonProfile(personId: string) {
    const profile = this.client('personProfile') as {
      findUnique: (args: unknown) => Promise<{
        slug: string;
        personId: string;
      } | null>;
    } | null;
    if (!profile) return Promise.resolve(null);
    return profile.findUnique({
      where: { personId },
      select: { slug: true, personId: true },
    });
  }

  findArtistByPersonId(personId: string) {
    const artist = this.client('artist') as {
      findFirst: (args: unknown) => Promise<{ id: string; slug: string } | null>;
    } | null;
    if (!artist) return Promise.resolve(null);
    return artist.findFirst({
      where: { personId },
      select: { id: true, slug: true },
    });
  }

  findPersonByCoreKnotUser(userId: string) {
    const identifier = this.client('personIdentifier') as {
      findFirst: (args: unknown) => Promise<{ personId: string } | null>;
    } | null;
    if (!identifier) return Promise.resolve(null);
    return identifier.findFirst({
      where: {
        provider: 'coreknot_user',
        externalId: userId,
      },
      select: { personId: true },
    });
  }

  findPersonIdByArtistId(artistId: string) {
    const artist = this.client('artist') as {
      findUnique: (args: unknown) => Promise<{ personId: string | null } | null>;
    } | null;
    if (!artist) return Promise.resolve(null);
    return artist
      .findUnique({
        where: { id: artistId },
        select: { personId: true },
      })
      .then((row) => row?.personId ?? null);
  }

  slugExists(slug: string) {
    const workspace = this.client('workspace') as {
      findFirst: (args: unknown) => Promise<{ id: string } | null>;
    } | null;
    if (!workspace) return Promise.resolve(false);
    return workspace
      .findFirst({
        where: workspaceSlugWhere(slug),
        select: { id: true },
      })
      .then((row) => row != null);
  }

  teamSlugExists(workspaceId: string, slug: string) {
    const team = this.client('workspaceTeam') as {
      findFirst: (args: unknown) => Promise<{ id: string } | null>;
    } | null;
    if (!team) return Promise.resolve(false);
    return team
      .findFirst({
        where: { workspaceId, slug },
        select: { id: true },
      })
      .then((row) => row != null);
  }
}

export type { WorkspaceRow, WorkspaceMemberRow, WorkspaceTeamRow };

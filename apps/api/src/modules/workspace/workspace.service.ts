import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  canManageWorkspaceMembers,
  extractWorkspaceIdentityLink,
  slugifyWorkspace,
  type WorkspaceMemberRoleValue,
} from '@tsc/database';
import type {
  WorkspaceCreatePayload,
  WorkspaceDetailPayload,
  WorkspaceMemberSummary,
  WorkspaceMembersPayload,
  WorkspaceSummary,
  WorkspaceTeamSummary,
  WorkspaceTeamsPayload,
} from '@tsc/types';
import type { MembershipContext } from '@tsc/permissions';
import { toInputJson } from '../../common/json';
import { ActivityService } from '../activity/activity.service';
import type {
  WorkspaceCreateInput,
  WorkspaceMemberAddInput,
  WorkspaceMemberPatchInput,
  WorkspaceSettingsPatchInput,
  WorkspaceTeamCreateInput,
} from './dto';
import { WorkspaceProvisionService } from './workspace-provision.service';
import {
  WorkspaceRepository,
  type WorkspaceMemberRow,
  type WorkspaceRow,
  type WorkspaceTeamRow,
} from './workspace.repository';

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly provisionService: WorkspaceProvisionService,
    private readonly activityService: ActivityService,
  ) {}

  async create(
    input: WorkspaceCreateInput,
    ctx: MembershipContext,
  ): Promise<WorkspaceCreatePayload> {
    this.assertAvailable();
    const personId = await this.resolvePersonId(ctx);

    const provisioned = await this.provisionService.ensureWorkspaceForPerson(personId, {
      name: input.name,
      slug: input.slug,
      type: input.type,
    });

    if (!provisioned) {
      throw new ServiceUnavailableException('Workspace creation failed');
    }

    const workspace = await this.repository.findBySlug(provisioned.slug);
    if (!workspace) {
      throw new ServiceUnavailableException('Workspace persistence failed');
    }

    if (provisioned.created) {
      await this.activityService.recordInternal({
        actorPersonId: personId,
        action: 'workspace_created',
        targetType: 'Workspace',
        targetId: workspace.id,
        metadata: {
          workspaceSlug: workspace.slug,
          workspaceType: workspace.type,
        },
      });
    }

    return {
      workspace: this.toSummary(workspace),
      created: provisioned.created,
    };
  }

  async getMyWorkspace(ctx: MembershipContext): Promise<WorkspaceDetailPayload> {
    this.assertAvailable();
    const personId = await this.resolvePersonId(ctx);

    let workspace = await this.repository.findDefaultForPerson(personId);
    if (!workspace) {
      const provisioned = await this.provisionService.ensurePersonalWorkspace(personId);
      if (provisioned?.created) {
        await this.activityService.recordInternal({
          actorPersonId: personId,
          action: 'workspace_created',
          targetType: 'Workspace',
          targetId: provisioned.workspaceId,
          metadata: {
            workspaceSlug: provisioned.slug,
            workspaceType: 'personal',
            autoProvisioned: true,
          },
        });
      }
      workspace = provisioned
        ? await this.repository.findBySlug(provisioned.slug)
        : null;
    }

    if (!workspace) {
      throw new NotFoundException('No workspace available for current user');
    }

    return this.toDetail(workspace);
  }

  async getBySlug(slug: string, ctx: MembershipContext): Promise<WorkspaceDetailPayload> {
    this.assertAvailable();
    const workspace = await this.requireWorkspace(slug);
    await this.requireMemberAccess(workspace, ctx);
    return this.toDetail(workspace);
  }

  async patchSettings(
    slug: string,
    input: WorkspaceSettingsPatchInput,
    ctx: MembershipContext,
  ): Promise<WorkspaceSummary> {
    this.assertAvailable();
    const workspace = await this.requireWorkspace(slug);
    await this.requireManageAccess(workspace, ctx);

    const nextSettings =
      input.settings != null
        ? {
            ...((workspace.settings as Record<string, unknown>) ?? {}),
            ...input.settings,
          }
        : undefined;

    const updated = await this.repository.updateWorkspace(workspace.id, {
      name: input.name,
      settings: nextSettings !== undefined ? toInputJson(nextSettings) : undefined,
    });

    if (!updated) {
      throw new ServiceUnavailableException('Workspace update failed');
    }

    return this.toSummary(updated);
  }

  async listMembers(slug: string, ctx: MembershipContext): Promise<WorkspaceMembersPayload> {
    this.assertAvailable();
    const workspace = await this.requireWorkspace(slug);
    await this.requireMemberAccess(workspace, ctx);

    const members = await this.repository.listMembers(workspace.id);
    return {
      workspaceSlug: workspace.slug,
      items: members.map((row) => this.toMemberSummary(row)),
      updatedAt: new Date().toISOString(),
    };
  }

  async addMember(
    slug: string,
    input: WorkspaceMemberAddInput,
    ctx: MembershipContext,
  ): Promise<WorkspaceMemberSummary> {
    this.assertAvailable();
    const workspace = await this.requireWorkspace(slug);
    const actor = await this.requireManageAccess(workspace, ctx);

    if (input.role === 'owner') {
      throw new BadRequestException('Cannot assign owner role via invite');
    }

    const row = await this.repository.addMember({
      workspaceId: workspace.id,
      personId: input.personId,
      role: input.role,
      status: 'active',
    });

    if (!row) {
      throw new ServiceUnavailableException('Workspace member add failed');
    }

    await this.activityService.recordInternal({
      actorPersonId: actor.personId,
      action: 'workspace_member_added',
      targetType: 'Workspace',
      targetId: workspace.id,
      metadata: {
        workspaceSlug: workspace.slug,
        memberPersonId: input.personId,
        role: input.role,
      },
    });

    return this.toMemberSummary(row);
  }

  async patchMemberRole(
    slug: string,
    personId: string,
    input: WorkspaceMemberPatchInput,
    ctx: MembershipContext,
  ): Promise<WorkspaceMemberSummary> {
    this.assertAvailable();
    const workspace = await this.requireWorkspace(slug);
    await this.requireManageAccess(workspace, ctx);

    if (personId === workspace.ownerPersonId && input.role !== 'owner') {
      throw new BadRequestException('Workspace owner role cannot be changed');
    }

    if (input.role === 'owner') {
      throw new BadRequestException('Transfer ownership is not supported in Sprint 1');
    }

    const row = await this.repository.updateMemberRole(workspace.id, personId, input.role);
    if (!row) {
      throw new NotFoundException(`Workspace member ${personId} not found`);
    }

    return this.toMemberSummary(row);
  }

  async removeMember(
    slug: string,
    personId: string,
    ctx: MembershipContext,
  ): Promise<WorkspaceMemberSummary> {
    this.assertAvailable();
    const workspace = await this.requireWorkspace(slug);
    await this.requireManageAccess(workspace, ctx);

    if (personId === workspace.ownerPersonId) {
      throw new BadRequestException('Cannot remove workspace owner');
    }

    const row = await this.repository.removeMember(workspace.id, personId);
    if (!row) {
      throw new NotFoundException(`Workspace member ${personId} not found`);
    }

    return this.toMemberSummary(row);
  }

  async createTeam(
    slug: string,
    input: WorkspaceTeamCreateInput,
    ctx: MembershipContext,
  ): Promise<WorkspaceTeamSummary> {
    this.assertAvailable();
    const workspace = await this.requireWorkspace(slug);
    await this.requireManageAccess(workspace, ctx);

    const baseSlug = slugifyWorkspace(input.slug ?? input.name);
    const teamSlug = await this.uniqueTeamSlug(workspace.id, baseSlug);

    const row = await this.repository.createTeam({
      workspaceId: workspace.id,
      name: input.name,
      slug: teamSlug,
      description: input.description ?? null,
    });

    if (!row) {
      throw new ServiceUnavailableException('Workspace team creation failed');
    }

    return this.toTeamSummary(row);
  }

  async listTeams(slug: string, ctx: MembershipContext): Promise<WorkspaceTeamsPayload> {
    this.assertAvailable();
    const workspace = await this.requireWorkspace(slug);
    await this.requireMemberAccess(workspace, ctx);

    const teams = await this.repository.listTeams(workspace.id);
    return {
      workspaceSlug: workspace.slug,
      items: teams.map((row) => this.toTeamSummary(row)),
      updatedAt: new Date().toISOString(),
    };
  }

  private async requireWorkspace(slug: string): Promise<WorkspaceRow> {
    const workspace = await this.repository.findBySlug(slug);
    if (!workspace) {
      throw new NotFoundException(`Workspace ${slug} not found`);
    }
    return workspace;
  }

  private async requireMemberAccess(
    workspace: WorkspaceRow,
    ctx: MembershipContext,
  ): Promise<WorkspaceMemberRow> {
    const personId = await this.resolvePersonId(ctx);
    if (workspace.ownerPersonId === personId) {
      return {
        id: 'owner',
        workspaceId: workspace.id,
        personId,
        role: 'owner',
        joinedAt: workspace.createdAt,
        status: 'active',
      };
    }

    const member = await this.repository.findMember(workspace.id, personId);
    if (!member || member.status !== 'active') {
      throw new ForbiddenException('Workspace membership required');
    }

    return member;
  }

  private async requireManageAccess(
    workspace: WorkspaceRow,
    ctx: MembershipContext,
  ): Promise<WorkspaceMemberRow> {
    const member = await this.requireMemberAccess(workspace, ctx);
    if (!canManageWorkspaceMembers(member.role as WorkspaceMemberRoleValue)) {
      throw new ForbiddenException('Workspace admin access required');
    }
    return member;
  }

  private async uniqueTeamSlug(workspaceId: string, base: string): Promise<string> {
    const normalized = base || 'team';
    let candidate = normalized;
    let suffix = 1;

    while (await this.repository.teamSlugExists(workspaceId, candidate)) {
      candidate = `${normalized}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private async resolvePersonId(ctx: MembershipContext): Promise<string> {
    const mapped = await this.repository.findPersonByCoreKnotUser(ctx.userId);
    if (mapped?.personId) return mapped.personId;

    if (ctx.artistMemberships.length > 0) {
      const personId = await this.repository.findPersonIdByArtistId(
        ctx.artistMemberships[0],
      );
      if (personId) return personId;
    }

    throw new NotFoundException(
      'No person linked to membership — set coreknot_user identifier or artist membership',
    );
  }

  private toSummary(row: WorkspaceRow): WorkspaceSummary {
    const identityLink = extractWorkspaceIdentityLink(row.settings);
    const members = row.members ?? [];
    const teams = row.teams ?? [];

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      ownerPersonId: row.ownerPersonId,
      type: row.type as WorkspaceSummary['type'],
      settings: (row.settings as Record<string, unknown>) ?? {},
      identityLink,
      memberCount: members.length || 1,
      teamCount: teams.length,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toDetail(row: WorkspaceRow): WorkspaceDetailPayload {
    const summary = this.toSummary(row);
    const members = row.members?.length
      ? row.members.map((member) => this.toMemberSummary(member))
      : [];

    return {
      ...summary,
      members,
      teams: (row.teams ?? []).map((team) => this.toTeamSummary(team)),
    };
  }

  private toMemberSummary(row: WorkspaceMemberRow): WorkspaceMemberSummary {
    const person = row.person;
    const displayName =
      person?.displayName?.trim() ||
      person?.name?.trim() ||
      person?.id ||
      row.personId;

    return {
      id: row.id,
      personId: row.personId,
      displayName,
      slug: person?.profile?.slug ?? null,
      role: row.role as WorkspaceMemberSummary['role'],
      status: row.status as WorkspaceMemberSummary['status'],
      joinedAt: row.joinedAt.toISOString(),
    };
  }

  private toTeamSummary(row: WorkspaceTeamRow): WorkspaceTeamSummary {
    return {
      id: row.id,
      workspaceId: row.workspaceId,
      name: row.name,
      slug: row.slug,
      description: row.description,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private assertAvailable(): void {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException('Workspace models unavailable');
    }
  }
}

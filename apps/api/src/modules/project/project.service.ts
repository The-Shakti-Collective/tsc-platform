import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { slugifyProject } from '@tsc/database';
import type {
  ProjectDetailPayload,
  ProjectMemberSummary,
  ProjectMembersPayload,
  ProjectSummary,
  ProjectsListPayload,
} from '@tsc/types';
import type { MembershipContext } from '@tsc/permissions';
import { toInputJson } from '../../common/json';
import { ActivityService } from '../activity/activity.service';
import { RelationshipRepository } from '../relationship/relationship.repository';
import { WorkspaceContextService } from '../workspace/workspace-context.service';
import type {
  ProjectCreateInput,
  ProjectMemberAddInput,
  ProjectPatchInput,
} from './dto';
import {
  ProjectRepository,
  type ProjectMemberRow,
  type ProjectRow,
} from './project.repository';

@Injectable()
export class ProjectService {
  constructor(
    private readonly repository: ProjectRepository,
    private readonly workspaceContext: WorkspaceContextService,
    private readonly activityService: ActivityService,
    private readonly relationshipRepository: RelationshipRepository,
  ) {}

  async list(slug: string, ctx: MembershipContext): Promise<ProjectsListPayload> {
    this.assertAvailable();
    const workspace = await this.workspaceContext.requireWorkspace(slug);
    await this.workspaceContext.requireMemberAccess(workspace, ctx);

    const rows = await this.repository.listByWorkspace(workspace.id);
    return {
      workspaceSlug: workspace.slug,
      items: rows.map((row) => this.toSummary(row)),
      updatedAt: new Date().toISOString(),
    };
  }

  async create(
    slug: string,
    input: ProjectCreateInput,
    ctx: MembershipContext,
  ): Promise<ProjectDetailPayload> {
    this.assertAvailable();
    const workspace = await this.workspaceContext.requireWorkspace(slug);
    const actor = await this.workspaceContext.requireManageAccess(workspace, ctx);
    const personId = actor.personId;

    const baseSlug = slugifyProject(input.slug ?? input.name);
    const projectSlug = await this.uniqueSlug(workspace.id, baseSlug);

    const row = await this.repository.create({
      workspaceId: workspace.id,
      slug: projectSlug,
      name: input.name,
      type: input.type ?? 'general',
      description: input.description ?? null,
      status: input.status ?? 'planning',
      budget: input.budget ?? null,
      currency: input.currency ?? null,
      timelineStart: input.timelineStart ? new Date(input.timelineStart) : null,
      timelineEnd: input.timelineEnd ? new Date(input.timelineEnd) : null,
      metadata: toInputJson(input.metadata ?? {}),
      ownerPersonId: personId,
    });

    if (!row) {
      throw new ServiceUnavailableException('Project creation failed');
    }

    await this.activityService.recordInternal({
      actorPersonId: personId,
      action: 'project_created',
      targetType: 'Project',
      targetId: row.id,
      metadata: {
        workspaceSlug: workspace.slug,
        projectSlug: row.slug,
        projectType: row.type,
      },
    });

    return this.toDetail(row);
  }

  async getBySlug(
    slug: string,
    projectSlug: string,
    ctx: MembershipContext,
  ): Promise<ProjectDetailPayload> {
    this.assertAvailable();
    const workspace = await this.workspaceContext.requireWorkspace(slug);
    await this.workspaceContext.requireMemberAccess(workspace, ctx);

    const row = await this.requireProject(workspace.id, projectSlug);
    return this.toDetail(row);
  }

  async patch(
    slug: string,
    projectSlug: string,
    input: ProjectPatchInput,
    ctx: MembershipContext,
  ): Promise<ProjectDetailPayload> {
    this.assertAvailable();
    const workspace = await this.workspaceContext.requireWorkspace(slug);
    await this.workspaceContext.requireManageAccess(workspace, ctx);

    const existing = await this.requireProject(workspace.id, projectSlug);

    const nextMetadata =
      input.metadata != null
        ? {
            ...((existing.metadata as Record<string, unknown>) ?? {}),
            ...input.metadata,
          }
        : undefined;

    const updated = await this.repository.update(existing.id, {
      name: input.name,
      type: input.type,
      description: input.description,
      status: input.status,
      budget: input.budget,
      currency: input.currency,
      timelineStart:
        input.timelineStart !== undefined
          ? input.timelineStart
            ? new Date(input.timelineStart)
            : null
          : undefined,
      timelineEnd:
        input.timelineEnd !== undefined
          ? input.timelineEnd
            ? new Date(input.timelineEnd)
            : null
          : undefined,
      metadata: nextMetadata !== undefined ? toInputJson(nextMetadata) : undefined,
    });

    if (!updated) {
      throw new ServiceUnavailableException('Project update failed');
    }

    return this.toDetail(updated);
  }

  async delete(
    slug: string,
    projectSlug: string,
    ctx: MembershipContext,
  ): Promise<ProjectSummary> {
    this.assertAvailable();
    const workspace = await this.workspaceContext.requireWorkspace(slug);
    await this.workspaceContext.requireManageAccess(workspace, ctx);

    const existing = await this.requireProject(workspace.id, projectSlug);
    const deleted = await this.repository.delete(existing.id);
    if (!deleted) {
      throw new ServiceUnavailableException('Project delete failed');
    }

    return this.toSummary(deleted);
  }

  async listMembers(
    slug: string,
    projectSlug: string,
    ctx: MembershipContext,
  ): Promise<ProjectMembersPayload> {
    this.assertAvailable();
    const workspace = await this.workspaceContext.requireWorkspace(slug);
    await this.workspaceContext.requireMemberAccess(workspace, ctx);

    const project = await this.requireProject(workspace.id, projectSlug);
    const members = await this.repository.listMembers(project.id);

    return {
      workspaceSlug: workspace.slug,
      projectSlug: project.slug,
      items: members.map((row) => this.toMemberSummary(row)),
      updatedAt: new Date().toISOString(),
    };
  }

  async addMember(
    slug: string,
    projectSlug: string,
    input: ProjectMemberAddInput,
    ctx: MembershipContext,
  ): Promise<ProjectMemberSummary> {
    this.assertAvailable();
    const workspace = await this.workspaceContext.requireWorkspace(slug);
    const actor = await this.workspaceContext.requireManageAccess(workspace, ctx);

    if (input.role === 'owner') {
      throw new BadRequestException('Cannot assign owner role via member add');
    }

    const project = await this.requireProject(workspace.id, projectSlug);
    const row = await this.repository.addMember({
      projectId: project.id,
      personId: input.personId,
      role: input.role ?? 'member',
    });

    if (!row) {
      throw new ServiceUnavailableException('Project member add failed');
    }

    await this.stubWorkedWithRelationship(actor.personId, input.personId, project);

    return this.toMemberSummary(row);
  }

  private async stubWorkedWithRelationship(
    actorPersonId: string,
    memberPersonId: string,
    project: ProjectRow,
  ): Promise<void> {
    if (actorPersonId === memberPersonId) return;

    try {
      await this.relationshipRepository.createRelationship({
        sourceEntityType: 'Person',
        sourceEntityId: actorPersonId,
        targetEntityType: 'Person',
        targetEntityId: memberPersonId,
        relationshipType: 'WORKED_WITH',
        metadata: {
          stub: true,
          source: 'project_member_add',
          projectId: project.id,
          projectSlug: project.slug,
        },
      });
    } catch {
      // Optional stub — ignore duplicate or graph unavailable
    }
  }

  private async requireProject(workspaceId: string, projectSlug: string): Promise<ProjectRow> {
    const row = await this.repository.findByWorkspaceSlug(workspaceId, projectSlug);
    if (!row) {
      throw new NotFoundException(`Project ${projectSlug} not found`);
    }
    return row;
  }

  private async uniqueSlug(workspaceId: string, base: string): Promise<string> {
    const normalized = base || 'project';
    let candidate = normalized;
    let suffix = 1;

    while (await this.repository.slugExists(workspaceId, candidate)) {
      candidate = `${normalized}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private toSummary(row: ProjectRow): ProjectSummary {
    const members = row.members ?? [];
    const tasks = row.tasks ?? [];

    return {
      id: row.id,
      workspaceId: row.workspaceId,
      slug: row.slug,
      name: row.name,
      type: row.type as ProjectSummary['type'],
      description: row.description,
      status: row.status as ProjectSummary['status'],
      budget: row.budget,
      currency: row.currency,
      timelineStart: row.timelineStart?.toISOString() ?? null,
      timelineEnd: row.timelineEnd?.toISOString() ?? null,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      memberCount: members.length || 1,
      taskCount: tasks.length,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toDetail(row: ProjectRow): ProjectDetailPayload {
    const summary = this.toSummary(row);
    const members = row.members?.length
      ? row.members.map((member) => this.toMemberSummary(member))
      : [];

    return { ...summary, members };
  }

  private toMemberSummary(row: ProjectMemberRow): ProjectMemberSummary {
    const person = row.person;
    const displayName =
      person?.displayName?.trim() ||
      person?.name?.trim() ||
      person?.id ||
      row.personId;

    return {
      projectId: row.projectId,
      personId: row.personId,
      displayName,
      slug: person?.profile?.slug ?? null,
      role: row.role as ProjectMemberSummary['role'],
      joinedAt: row.joinedAt.toISOString(),
    };
  }

  private assertAvailable(): void {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException('Project models unavailable');
    }
  }
}

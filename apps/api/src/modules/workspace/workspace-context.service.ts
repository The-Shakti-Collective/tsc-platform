import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { canManageWorkspaceMembers } from '@tsc/database';
import type { MembershipContext } from '@tsc/permissions';
import {
  WorkspaceRepository,
  type WorkspaceMemberRow,
  type WorkspaceRow,
} from './workspace.repository';

@Injectable()
export class WorkspaceContextService {
  constructor(private readonly workspaceRepository: WorkspaceRepository) {}

  async resolvePersonId(ctx: MembershipContext): Promise<string> {
    const mapped = await this.workspaceRepository.findPersonByCoreKnotUser(ctx.userId);
    if (mapped?.personId) return mapped.personId;

    if (ctx.artistMemberships.length > 0) {
      const personId = await this.workspaceRepository.findPersonIdByArtistId(
        ctx.artistMemberships[0],
      );
      if (personId) return personId;
    }

    throw new NotFoundException(
      'No person linked to membership — set coreknot_user identifier or artist membership',
    );
  }

  async requireWorkspace(slug: string): Promise<WorkspaceRow> {
    const workspace = await this.workspaceRepository.findBySlug(slug);
    if (!workspace) {
      throw new NotFoundException(`Workspace ${slug} not found`);
    }
    return workspace;
  }

  async requireMemberAccess(
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

    const member = await this.workspaceRepository.findMember(workspace.id, personId);
    if (!member || member.status !== 'active') {
      throw new ForbiddenException('Workspace membership required');
    }

    return member;
  }

  async requireManageAccess(
    workspace: WorkspaceRow,
    ctx: MembershipContext,
  ): Promise<WorkspaceMemberRow> {
    const member = await this.requireMemberAccess(workspace, ctx);
    if (!canManageWorkspaceMembers(member.role as 'owner' | 'admin' | 'member' | 'guest')) {
      throw new ForbiddenException('Workspace admin access required');
    }
    return member;
  }
}

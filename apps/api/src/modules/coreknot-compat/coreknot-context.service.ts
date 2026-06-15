import { BadRequestException, Injectable } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { WorkspaceService } from '../workspace/workspace.service';

@Injectable()
export class CoreknotContextService {
  constructor(private readonly workspaceService: WorkspaceService) {}

  resolveOrganizationId(ctx: MembershipContext): string {
    const fromMembership = ctx.organizationMemberships[0]?.organizationId;
    if (fromMembership) return fromMembership;

    const fromEnv = process.env.COREKNOT_DEFAULT_ORG_ID?.trim();
    if (fromEnv) return fromEnv;

    throw new BadRequestException(
      'No organization membership — set COREKNOT_DEFAULT_ORG_ID or link user to an organization',
    );
  }

  async resolveWorkspaceSlug(ctx: MembershipContext): Promise<string> {
    const detail = await this.workspaceService.getMyWorkspace(ctx);
    return detail.slug;
  }
}

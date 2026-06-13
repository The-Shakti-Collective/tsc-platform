import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import type {
  CreativeIdentityMergeSummary,
  CreativeIdentityPublicPayload,
  CreativeIdentityRecord,
  CreativeIdentityRolesPayload,
  CreativeRoleAssignmentInput,
} from '@tsc/types';
import { ActivityService } from '../activity/activity.service';
import { SkillsService } from '../skills/skills.service';
import { TscIdentityProvisionService } from '../tsc-identity/tsc-identity-provision.service';
import type { CreativeIdentityPatchInput } from './dto';
import {
  toCreativeIdentityRecord,
  toPublicPayload,
  toRolesPayload,
} from './creative-identity.mapper';
import { CreativeIdentityRepository } from './creative-identity.repository';

@Injectable()
export class CreativeIdentityService {
  constructor(
    private readonly repository: CreativeIdentityRepository,
    private readonly activityService: ActivityService,
    private readonly tscIdentityProvision: TscIdentityProvisionService,
    private readonly skillsService: SkillsService,
  ) {}

  async ensureStub(input: {
    personId: string;
    slug?: string | null;
    displayName?: string | null;
  }): Promise<CreativeIdentityRecord | null> {
    const result = await this.repository.createFromProfileSeed(input);
    if (!result) return null;

    if (result.created) {
      void this.tscIdentityProvision.ensureFanIdentity(result.row.personId, result.row.slug);
      void this.tscIdentityProvision.ensureCreativeIdentity(
        result.row.personId,
        result.row.slug,
      );

      await this.activityService.record({
        actorPersonId: result.row.personId,
        action: 'creative_identity_created',
        targetType: 'Person',
        targetId: result.row.personId,
        metadata: {
          creativeIdentityId: result.row.id,
          slug: result.row.slug,
        },
      });
    }

    return toCreativeIdentityRecord(result.row, await this.skillsService.getSkillsForPerson(result.row.personId));
  }

  async getMyIdentity(ctx: MembershipContext): Promise<CreativeIdentityRecord> {
    const personId = await this.resolvePersonId(ctx);
    const record = await this.ensureStub({ personId });
    if (!record) {
      throw new ServiceUnavailableException(
        'CreativeIdentity model unavailable — apply phase13-module1.prisma migration',
      );
    }
    return record;
  }

  private async toRecordWithSkills(row: Parameters<typeof toCreativeIdentityRecord>[0]) {
    const skills = await this.skillsService.getSkillsForPerson(row.personId);
    return toCreativeIdentityRecord(row, skills);
  }

  async patchMyIdentity(
    input: CreativeIdentityPatchInput,
    ctx: MembershipContext,
  ): Promise<CreativeIdentityRecord> {
    const personId = await this.resolvePersonId(ctx);
    await this.ensureStub({ personId });

    const row = await this.repository.updateByPersonId(personId, input);
    return this.toRecordWithSkills(row);
  }

  async getPublicBySlug(slug: string): Promise<CreativeIdentityPublicPayload> {
    const row = await this.repository.findBySlug(slug);

    if (!row) {
      const privateRow = await this.repository.findBySlugIncludingPrivate(slug);
      if (privateRow && !privateRow.isPublic) {
        throw new NotFoundException(`Creative identity ${slug} is private`);
      }
    }

    if (!row) {
      throw new NotFoundException(`Creative identity ${slug} not found`);
    }

    const entityRoles = await this.repository.listActiveRoles(row.personId);
    const skills = await this.skillsService.getSkillsForPerson(row.personId);
    return toPublicPayload(row, entityRoles, skills);
  }

  async getRolesBySlug(slug: string): Promise<CreativeIdentityRolesPayload> {
    const row = await this.repository.findBySlugIncludingPrivate(slug);
    if (!row) {
      throw new NotFoundException(`Creative identity ${slug} not found`);
    }

    const entityRoles = await this.repository.listActiveRoles(row.personId);
    return toRolesPayload(row.slug, row.personId, entityRoles);
  }

  async addRoleAssignment(
    input: CreativeRoleAssignmentInput,
    ctx: MembershipContext,
  ) {
    const personId = await this.resolvePersonId(ctx);
    await this.ensureStub({ personId });

    const role = await this.repository.createRole({
      personId,
      role: input.role,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      metadata: input.metadata,
    });

    if (input.role === 'artist' || input.role === 'manager' || input.role === 'community_leader') {
      void this.repository.appendRoleTag(personId, input.role);
    }

    await this.activityService.record({
      actorPersonId: personId,
      action: 'creative_role_added',
      targetType: 'PersonRole',
      targetId: role.id,
      metadata: {
        role: input.role,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
      },
    });

    return toRolesPayload(
      (await this.repository.findByPersonId(personId))?.slug ?? personId,
      personId,
      await this.repository.listActiveRoles(personId),
    );
  }

  async removeRoleAssignment(roleId: string, ctx: MembershipContext) {
    const personId = await this.resolvePersonId(ctx);
    const existing = await this.repository.findRoleById(roleId, personId);
    if (!existing) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }

    await this.repository.deactivateRole(roleId, personId);

    const identity = await this.repository.findByPersonId(personId);
    return toRolesPayload(
      identity?.slug ?? personId,
      personId,
      await this.repository.listActiveRoles(personId),
    );
  }

  async getMergeSummaryBySlug(slug: string): Promise<CreativeIdentityMergeSummary | null> {
    try {
      const payload = await this.getPublicBySlug(slug);
      const { identity } = payload;
      return {
        slug: identity.slug,
        displayName: identity.displayName,
        headline: identity.headline,
        verticals: identity.verticals,
        roles: identity.roles,
        capabilities: identity.capabilities,
        skills: identity.skills,
        shareUrl: identity.shareUrl,
        routePath: identity.routePath,
      };
    } catch {
      return null;
    }
  }

  async getMergeSummaryByPersonId(
    personId: string,
  ): Promise<CreativeIdentityMergeSummary | null> {
    const row = await this.repository.findByPersonId(personId);
    if (!row || !row.isPublic) return null;
    const record = await this.toRecordWithSkills(row);
    return {
      slug: record.slug,
      displayName: record.displayName,
      headline: record.headline,
      verticals: record.verticals,
      roles: record.roles,
      capabilities: record.capabilities,
      skills: record.skills,
      shareUrl: record.shareUrl,
      routePath: record.routePath,
    };
  }

  /** Sync hook: artist.created → ensure artist role tag + PersonRole */
  async syncArtistCreated(personId: string, artistId: string, slug?: string | null) {
    await this.ensureStub({ personId, slug });
    await this.repository.appendRoleTag(personId, 'artist');

    const roles = await this.repository.listActiveRoles(personId);
    const hasArtistRole = roles.some(
      (row) => row.role === 'artist' && row.entityType === 'Artist' && row.entityId === artistId,
    );

    if (!hasArtistRole) {
      await this.repository.createRole({
        personId,
        role: 'artist',
        entityType: 'Artist',
        entityId: artistId,
        metadata: { source: 'artist.created' },
      });

      await this.activityService.record({
        actorPersonId: personId,
        action: 'creative_role_added',
        targetType: 'Artist',
        targetId: artistId,
        metadata: { role: 'artist', source: 'artist.created' },
      });
    }
  }

  /** Phase 12 hook stub — link workspace to creative identity when field exists */
  async linkWorkspaceToCreativeIdentity(
    _workspaceId: string,
    ownerPersonId: string,
  ): Promise<{ creativeIdentityId: string | null }> {
    const identity = await this.ensureStub({ personId: ownerPersonId });
    return { creativeIdentityId: identity?.id ?? null };
  }

  private async resolvePersonId(ctx: MembershipContext): Promise<string> {
    const mapped = await this.repository.findPersonByCoreKnotUser(ctx.userId);
    if (mapped?.personId) return mapped.personId;

    if (ctx.artistMemberships.length > 0) {
      const row = await this.repository.findPersonIdByArtistMembership(
        ctx.artistMemberships[0],
      );
      if (row?.personId) return row.personId;
    }

    throw new NotFoundException(
      'No person linked to membership — set coreknot_user identifier or artist membership',
    );
  }
}

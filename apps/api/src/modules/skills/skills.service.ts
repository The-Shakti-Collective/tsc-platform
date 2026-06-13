import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import {
  SKILL_GRAPH_RELATIONSHIP_TYPE,
  isSkillCategory,
  resolveProficiency,
} from '@tsc/database';
import type {
  AddCreativeIdentitySkillInput,
  CreativeIdentitySkillEntry,
  CreativeIdentitySkillsPayload,
  EndorseSkillInput,
  EndorseSkillPayload,
  SkillCreatorsPayload,
  SkillDetailPayload,
  SkillsListPayload,
} from '@tsc/types';
import { ActivityService } from '../activity/activity.service';
import { RelationshipRepository } from '../relationship/relationship.repository';
import {
  buildCapabilityCompatFromSkills,
  toCreativeIdentitySkillEntry,
  toCreativeIdentitySkillsPayload,
  toEndorseSkillPayload,
  toSkillCreatorsPayload,
  toSkillDetailPayload,
  toSkillsListPayload,
} from './skills.mapper';
import { SkillsRepository } from './skills.repository';

@Injectable()
export class SkillsService {
  constructor(
    private readonly repository: SkillsRepository,
    private readonly activityService: ActivityService,
    private readonly relationshipRepository: RelationshipRepository,
  ) {}

  async listSkills(category?: string | null): Promise<SkillsListPayload> {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException(
        'Skill model unavailable — apply phase13-module2.prisma migration',
      );
    }

    const parsedCategory = category && isSkillCategory(category) ? category : null;
    const rows = await this.repository.listSkills(parsedCategory);
    return toSkillsListPayload(rows, parsedCategory);
  }

  async getSkillBySlug(slug: string): Promise<SkillDetailPayload> {
    const row = await this.requireSkillBySlug(slug);
    const creatorCount = await this.repository.countCreatorsForSkill(row.id);
    return toSkillDetailPayload(row, creatorCount);
  }

  async getCreatorsBySkillSlug(
    slug: string,
    city?: string | null,
    limit = 20,
  ): Promise<SkillCreatorsPayload> {
    const skill = await this.requireSkillBySlug(slug);
    const rows = await this.repository.listCreatorsBySkill(skill.id, city, limit);

    const endorsementCounts: Record<string, number> = {};
    for (const row of rows) {
      const key = `${row.creativeIdentityId}:${row.skillId}`;
      endorsementCounts[key] = await this.repository.countEndorsements(
        row.creativeIdentityId,
        row.skillId,
      );
    }

    return toSkillCreatorsPayload(skill, rows, city?.trim() || null, endorsementCounts);
  }

  async getSkillsByCreativeSlug(slug: string): Promise<CreativeIdentitySkillsPayload> {
    const identity = await this.repository.findIdentityBySlug(slug, true);
    if (!identity) {
      throw new NotFoundException(`Creative identity ${slug} not found`);
    }

    return this.buildIdentitySkillsPayload(identity);
  }

  async getSkillsForPerson(personId: string): Promise<CreativeIdentitySkillEntry[]> {
    const identity = await this.repository.findIdentityByPersonId(personId);
    if (!identity) return [];

    const rows = await this.repository.listIdentitySkills(identity.id);
    const endorsementCounts = await this.repository.countEndorsementsForIdentitySkills(
      identity.id,
      rows.map((row) => row.skillId),
    );

    return rows.map((row) =>
      toCreativeIdentitySkillEntry(row, endorsementCounts[row.skillId] ?? 0),
    );
  }

  async addSkillToMyProfile(
    input: AddCreativeIdentitySkillInput,
    ctx: MembershipContext,
  ): Promise<CreativeIdentitySkillsPayload> {
    const personId = await this.resolvePersonId(ctx);
    const identity = await this.repository.findIdentityByPersonId(personId);
    if (!identity) {
      throw new NotFoundException('Creative identity not found for current user');
    }

    const skill = await this.requireSkillBySlug(input.skillSlug);
    const proficiency = resolveProficiency(input.proficiency, input.yearsExperience);

    await this.repository.upsertIdentitySkill({
      creativeIdentityId: identity.id,
      skillId: skill.id,
      proficiency,
      yearsExperience: input.yearsExperience ?? null,
      isPrimary: input.isPrimary ?? false,
    });

    await this.syncHasSkillEdge(identity.id, skill.id, proficiency);

    await this.activityService.record({
      actorPersonId: personId,
      action: 'skill_added',
      targetType: 'Skill',
      targetId: skill.id,
      metadata: {
        skillSlug: skill.slug,
        skillName: skill.name,
        proficiency,
        creativeIdentityId: identity.id,
        creativeIdentitySlug: identity.slug,
      },
    });

    return this.buildIdentitySkillsPayload(identity);
  }

  async removeSkillFromMyProfile(
    skillId: string,
    ctx: MembershipContext,
  ): Promise<CreativeIdentitySkillsPayload> {
    const personId = await this.resolvePersonId(ctx);
    const identity = await this.repository.findIdentityByPersonId(personId);
    if (!identity) {
      throw new NotFoundException('Creative identity not found for current user');
    }

    const existing = await this.repository.findSkillById(skillId);
    if (!existing) {
      throw new NotFoundException(`Skill ${skillId} not found`);
    }

    await this.repository.removeIdentitySkill(identity.id, skillId);
    await this.removeHasSkillEdge(identity.id, skillId);

    return this.buildIdentitySkillsPayload(identity);
  }

  async endorseCreator(
    skillSlug: string,
    input: EndorseSkillInput,
    ctx: MembershipContext,
  ): Promise<EndorseSkillPayload> {
    const endorserPersonId = await this.resolvePersonId(ctx);
    const skill = await this.requireSkillBySlug(skillSlug);
    const target = await this.repository.findIdentityBySlug(input.creativeIdentitySlug, true);

    if (!target) {
      throw new NotFoundException(`Creative identity ${input.creativeIdentitySlug} not found`);
    }

    if (target.personId === endorserPersonId) {
      throw new BadRequestException('Cannot endorse your own skill profile');
    }

    const hasSkill = await this.repository.listIdentitySkills(target.id);
    if (!hasSkill.some((row) => row.skillId === skill.id)) {
      throw new BadRequestException(
        `${input.creativeIdentitySlug} has not listed ${skillSlug} on their profile`,
      );
    }

    try {
      const endorsement = await this.repository.createPeerEndorsement({
        skillId: skill.id,
        creativeIdentityId: target.id,
        endorserPersonId,
      });

      await this.activityService.record({
        actorPersonId: endorserPersonId,
        action: 'skill_endorsed',
        targetType: 'CreativeIdentity',
        targetId: target.id,
        metadata: {
          skillSlug: skill.slug,
          skillName: skill.name,
          creativeIdentitySlug: target.slug,
          endorsementId: endorsement.id,
        },
      });

      return toEndorseSkillPayload(endorsement.id, skill.slug, target.slug);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        throw new ConflictException('You have already endorsed this skill for this creator');
      }
      throw error;
    }
  }

  buildCapabilityCompat(skills: CreativeIdentitySkillEntry[]): string[] {
    return buildCapabilityCompatFromSkills(skills);
  }

  private async buildIdentitySkillsPayload(
    identity: { id: string; slug: string; displayName: string; primaryCity: string | null },
  ): Promise<CreativeIdentitySkillsPayload> {
    const rows = await this.repository.listIdentitySkills(identity.id);
    const endorsementCounts = await this.repository.countEndorsementsForIdentitySkills(
      identity.id,
      rows.map((row) => row.skillId),
    );

    return toCreativeIdentitySkillsPayload(
      identity as Parameters<typeof toCreativeIdentitySkillsPayload>[0],
      rows,
      endorsementCounts,
    );
  }

  private async requireSkillBySlug(slug: string) {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException(
        'Skill model unavailable — apply phase13-module2.prisma migration',
      );
    }

    const row = await this.repository.findSkillBySlug(slug);
    if (!row) {
      throw new NotFoundException(`Skill ${slug} not found`);
    }
    return row;
  }

  private async syncHasSkillEdge(
    creativeIdentityId: string,
    skillId: string,
    proficiency: string,
  ) {
    try {
      await this.relationshipRepository.createRelationship({
        sourceEntityType: 'CreativeIdentity' as never,
        sourceEntityId: creativeIdentityId,
        targetEntityType: 'Skill' as never,
        targetEntityId: skillId,
        relationshipType: SKILL_GRAPH_RELATIONSHIP_TYPE as never,
        weight: proficiency === 'expert' ? 1 : proficiency === 'intermediate' ? 0.7 : 0.4,
        metadata: { proficiency, source: 'skill_graph' },
      });
    } catch {
      // Graph enum merge optional — skill junction is source of truth
    }
  }

  private async removeHasSkillEdge(creativeIdentityId: string, skillId: string) {
    try {
      const rows = await this.relationshipRepository.listRelationships({
        entityType: 'CreativeIdentity' as never,
        entityId: creativeIdentityId,
        relationshipType: SKILL_GRAPH_RELATIONSHIP_TYPE as never,
        includeInactive: false,
        limit: 50,
      });

      const match = rows.find(
        (row) =>
          row.targetEntityType === 'Skill' &&
          row.targetEntityId === skillId &&
          row.relationshipType === SKILL_GRAPH_RELATIONSHIP_TYPE,
      );

      if (match) {
        await this.relationshipRepository.deleteRelationship(match.id);
      }
    } catch {
      // optional graph layer
    }
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


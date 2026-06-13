import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import { CANONICAL_SKILLS, skillCategoryWhere, skillSlugWhere } from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';

type SkillClient = {
  findMany: (args: unknown) => Promise<SkillRow[]>;
  findFirst: (args: unknown) => Promise<SkillRow | null>;
  findUnique: (args: unknown) => Promise<SkillRow | null>;
  create: (args: unknown) => Promise<SkillRow>;
  count: (args: unknown) => Promise<number>;
};

type CreativeIdentitySkillClient = {
  findMany: (args: unknown) => Promise<IdentitySkillRow[]>;
  findUnique: (args: unknown) => Promise<IdentitySkillRow | null>;
  upsert: (args: unknown) => Promise<IdentitySkillRow>;
  delete: (args: unknown) => Promise<IdentitySkillRow>;
  update: (args: unknown) => Promise<IdentitySkillRow>;
  count: (args: unknown) => Promise<number>;
};

type SkillEndorsementClient = {
  findMany: (args: unknown) => Promise<SkillEndorsementRow[]>;
  create: (args: unknown) => Promise<SkillEndorsementRow>;
  count: (args: unknown) => Promise<number>;
};

type CreativeIdentityClient = {
  findFirst: (args: unknown) => Promise<CreativeIdentityLookup | null>;
  findUnique: (args: unknown) => Promise<CreativeIdentityLookup | null>;
};

export type SkillRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type IdentitySkillRow = {
  creativeIdentityId: string;
  skillId: string;
  proficiency: string;
  yearsExperience: number | null;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
  skill?: SkillRow;
  creativeIdentity?: CreativeIdentityLookup;
};

export type SkillEndorsementRow = {
  id: string;
  skillId: string;
  creativeIdentityId: string;
  endorserPersonId: string | null;
  source: string;
  weight: number;
  createdAt: Date;
};

export type CreativeIdentityLookup = {
  id: string;
  personId: string;
  slug: string;
  displayName: string;
  headline: string | null;
  primaryCity: string | null;
  isPublic: boolean;
};

@Injectable()
export class SkillsRepository {
  private seedPromise: Promise<void> | null = null;

  constructor(private readonly prisma: PrismaService) {}

  isAvailable(): boolean {
    return !!this.skillClient;
  }

  private get skillClient(): SkillClient | null {
    const prisma = this.prisma.client as Prisma.TransactionClient & {
      skill?: SkillClient;
    };
    return prisma.skill ?? null;
  }

  private get identitySkillClient(): CreativeIdentitySkillClient | null {
    const prisma = this.prisma.client as Prisma.TransactionClient & {
      creativeIdentitySkill?: CreativeIdentitySkillClient;
    };
    return prisma.creativeIdentitySkill ?? null;
  }

  private get endorsementClient(): SkillEndorsementClient | null {
    const prisma = this.prisma.client as Prisma.TransactionClient & {
      skillEndorsement?: SkillEndorsementClient;
    };
    return prisma.skillEndorsement ?? null;
  }

  private get identityClient(): CreativeIdentityClient | null {
    const prisma = this.prisma.client as Prisma.TransactionClient & {
      creativeIdentity?: CreativeIdentityClient;
    };
    return prisma.creativeIdentity ?? null;
  }

  async ensureCanonicalSkills(): Promise<void> {
    if (!this.skillClient) return;
    if (!this.seedPromise) {
      this.seedPromise = this.seedCanonicalSkills();
    }
    await this.seedPromise;
  }

  private async seedCanonicalSkills(): Promise<void> {
    if (!this.skillClient) return;

    const existing = await this.skillClient.count({});
    if (existing > 0) return;

    for (const seed of CANONICAL_SKILLS) {
      await this.skillClient.create({
        data: {
          id: newId(),
          slug: seed.slug,
          name: seed.name,
          category: seed.category,
          description: seed.description ?? null,
          isActive: true,
        },
      });
    }
  }

  async listSkills(category?: string | null) {
    await this.ensureCanonicalSkills();
    if (!this.skillClient) return [];

    return this.skillClient.findMany({
      where: skillCategoryWhere(category),
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async findSkillBySlug(slug: string) {
    await this.ensureCanonicalSkills();
    if (!this.skillClient) return null;
    return this.skillClient.findFirst({ where: skillSlugWhere(slug) });
  }

  async findSkillById(skillId: string) {
    await this.ensureCanonicalSkills();
    if (!this.skillClient) return null;
    return this.skillClient.findUnique({ where: { id: skillId } });
  }

  async countCreatorsForSkill(skillId: string, city?: string | null) {
    if (!this.identitySkillClient) return 0;

    const where: Record<string, unknown> = { skillId };
    if (city?.trim()) {
      where.creativeIdentity = {
        isPublic: true,
        primaryCity: { equals: city.trim(), mode: 'insensitive' },
      };
    } else {
      where.creativeIdentity = { isPublic: true };
    }

    return this.identitySkillClient.count({ where });
  }

  async listCreatorsBySkill(skillId: string, city?: string | null, limit = 20) {
    if (!this.identitySkillClient) return [];

    const where: Record<string, unknown> = { skillId };
    if (city?.trim()) {
      where.creativeIdentity = {
        isPublic: true,
        primaryCity: { equals: city.trim(), mode: 'insensitive' },
      };
    } else {
      where.creativeIdentity = { isPublic: true };
    }

    return this.identitySkillClient.findMany({
      where,
      include: {
        creativeIdentity: true,
        skill: true,
      },
      orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
    });
  }

  async listIdentitySkills(creativeIdentityId: string) {
    if (!this.identitySkillClient) return [];

    return this.identitySkillClient.findMany({
      where: { creativeIdentityId },
      include: { skill: true },
      orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async countEndorsements(creativeIdentityId: string, skillId: string) {
    if (!this.endorsementClient) return 0;
    return this.endorsementClient.count({
      where: { creativeIdentityId, skillId },
    });
  }

  async countEndorsementsForIdentitySkills(
    creativeIdentityId: string,
    skillIds: string[],
  ): Promise<Record<string, number>> {
    if (!this.endorsementClient || skillIds.length === 0) return {};

    const rows = await this.endorsementClient.findMany({
      where: {
        creativeIdentityId,
        skillId: { in: skillIds },
      },
    });

    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.skillId] = (counts[row.skillId] ?? 0) + 1;
    }
    return counts;
  }

  async findIdentityBySlug(slug: string, publicOnly = true) {
    if (!this.identityClient) return null;
    return this.identityClient.findFirst({
      where: publicOnly
        ? { slug: { equals: slug, mode: 'insensitive' }, isPublic: true }
        : { slug: { equals: slug, mode: 'insensitive' } },
    });
  }

  async findIdentityByPersonId(personId: string) {
    if (!this.identityClient) return null;
    return this.identityClient.findUnique({ where: { personId } });
  }

  async upsertIdentitySkill(input: {
    creativeIdentityId: string;
    skillId: string;
    proficiency: string;
    yearsExperience?: number | null;
    isPrimary?: boolean;
  }) {
    if (!this.identitySkillClient) {
      throw new Error('CreativeIdentitySkill model unavailable');
    }

    if (input.isPrimary) {
      const existingPrimary = await this.identitySkillClient.findMany({
        where: { creativeIdentityId: input.creativeIdentityId, isPrimary: true },
      });

      for (const row of existingPrimary) {
        if (row.skillId !== input.skillId) {
          await this.identitySkillClient.update({
            where: {
              creativeIdentityId_skillId: {
                creativeIdentityId: row.creativeIdentityId,
                skillId: row.skillId,
              },
            },
            data: { isPrimary: false },
          });
        }
      }
    }

    return this.identitySkillClient.upsert({
      where: {
        creativeIdentityId_skillId: {
          creativeIdentityId: input.creativeIdentityId,
          skillId: input.skillId,
        },
      },
      create: {
        creativeIdentityId: input.creativeIdentityId,
        skillId: input.skillId,
        proficiency: input.proficiency,
        yearsExperience: input.yearsExperience ?? null,
        isPrimary: input.isPrimary ?? false,
      },
      update: {
        proficiency: input.proficiency,
        yearsExperience: input.yearsExperience ?? null,
        isPrimary: input.isPrimary ?? false,
      },
      include: { skill: true },
    });
  }

  async removeIdentitySkill(creativeIdentityId: string, skillId: string) {
    if (!this.identitySkillClient) {
      throw new Error('CreativeIdentitySkill model unavailable');
    }

    return this.identitySkillClient.delete({
      where: {
        creativeIdentityId_skillId: { creativeIdentityId, skillId },
      },
      include: { skill: true },
    });
  }

  async createPeerEndorsement(input: {
    skillId: string;
    creativeIdentityId: string;
    endorserPersonId: string;
    weight?: number;
  }) {
    if (!this.endorsementClient) {
      throw new Error('SkillEndorsement model unavailable');
    }

    return this.endorsementClient.create({
      data: {
        id: newId(),
        skillId: input.skillId,
        creativeIdentityId: input.creativeIdentityId,
        endorserPersonId: input.endorserPersonId,
        source: 'peer',
        weight: input.weight ?? 1,
      },
    });
  }

  findPersonByCoreKnotUser(userId: string) {
    return this.prisma.client.personIdentifier.findFirst({
      where: {
        provider: 'coreknot_user',
        externalId: userId,
        person: { mergedIntoId: null },
      },
      select: { personId: true },
    });
  }

  findPersonIdByArtistMembership(artistId: string) {
    return this.prisma.client.artist.findUnique({
      where: { id: artistId },
      select: { personId: true },
    });
  }
}

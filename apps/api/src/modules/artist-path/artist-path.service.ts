import { Injectable, NotFoundException, ServiceUnavailableException, BadRequestException } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { assertOrgRead } from '../../common/org/org-access';
import type { ArtistPathApplicationSubmitInput } from './dto';

type AnswersRecord = Record<string, string | undefined>;

function resolveOrganizationId(ctx: MembershipContext, explicit?: string): string {
  const fromQuery = explicit?.trim();
  if (fromQuery) {
    assertOrgRead(ctx, fromQuery);
    return fromQuery;
  }
  const fromMembership = ctx.organizationMemberships?.[0]?.organizationId;
  if (fromMembership) {
    assertOrgRead(ctx, fromMembership);
    return fromMembership;
  }
  const fromEnv = process.env.TSC_DEFAULT_ORG_ID?.trim();
  if (fromEnv) {
    assertOrgRead(ctx, fromEnv);
    return fromEnv;
  }
  throw new BadRequestException('organizationId is required');
}

function displayArtistLabel(answers: AnswersRecord): string | undefined {
  const identity = answers.artistIdentity?.trim();
  if (identity) return identity;
  const stage = answers.stageName?.trim();
  if (stage) return stage;
  return undefined;
}

function buildAnswers(input: ArtistPathApplicationSubmitInput): AnswersRecord {
  const {
    fullName,
    email,
    phone,
    city,
    stageName,
    instagram,
    spotify,
    youtube,
    artistIdentity,
    trainingDetails,
    coreSkills,
    strengthsUniqueness,
    dailyTime,
    mentorName,
    songsReleased,
    showsPerformed,
    currentFans,
    currentSetup,
    currentlyWorkingOn,
    dailyRituals,
    learningNeeds,
    mentorshipNeeds,
    curationNeeds,
    fandomNeeds,
    aspirationalGoal,
    anythingElse,
  } = input;

  return {
    name: fullName,
    email,
    phone,
    city,
    stageName,
    instagram,
    spotify,
    youtube,
    artistIdentity,
    trainingDetails,
    coreSkills,
    strengthsUniqueness,
    dailyTime,
    mentorName,
    songsReleased,
    showsPerformed,
    currentFans,
    currentSetup,
    currentlyWorkingOn,
    dailyRituals,
    learningNeeds,
    mentorshipNeeds,
    curationNeeds,
    fandomNeeds,
    aspirationalGoal,
    anythingElse,
  };
}

@Injectable()
export class ArtistPathService {
  constructor(private readonly prisma: PrismaService) {}

  async submitPublicApplication(input: ArtistPathApplicationSubmitInput) {
    const organizationId = process.env.TSC_DEFAULT_ORG_ID?.trim();
    if (!organizationId) {
      throw new ServiceUnavailableException('TSC_DEFAULT_ORG_ID is not configured');
    }

    const answers = buildAnswers(input);
    const email = input.email.trim().toLowerCase();
    const externalRowId = `theartistpath:${email}:${Date.now()}`;

    const row = await this.prisma.client.artistPathApplication.create({
      data: {
        id: newId(),
        organizationId,
        fullName: input.fullName.trim(),
        email,
        phone: input.phone.trim(),
        city: input.city?.trim() || null,
        stageName: input.stageName?.trim() || null,
        answers,
        rawPayload: input,
        source: input.source?.trim() || 'theartistpath.in',
        externalRowId,
        status: 'submitted',
      },
    });

    return {
      id: row.id,
      organizationId: row.organizationId,
      status: row.status,
      submittedAt: row.submittedAt.toISOString(),
    };
  }

  async listApplications(
    ctx: MembershipContext,
    filters: { organizationId?: string; page?: number; limit?: number; search?: string },
  ) {
    const organizationId = resolveOrganizationId(ctx, filters.organizationId);
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 24;
    const search = filters.search?.trim();

    const where = {
      organizationId,
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search, mode: 'insensitive' as const } },
              { city: { contains: search, mode: 'insensitive' as const } },
              { stageName: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.client.artistPathApplication.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
    });

    const grouped = new Map<
      string,
      {
        id: string;
        personId: string;
        name: string;
        email: string;
        phone: string | null;
        city: string | null;
        lastActivityAt: string;
        latestArtistType: string | undefined;
        artistPathResponseCount: number;
      }
    >();

    for (const row of rows) {
      const key = row.email.toLowerCase();
      const answers = (row.answers as AnswersRecord) ?? {};
      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, {
          id: row.id,
          personId: row.id,
          name: row.fullName,
          email: row.email,
          phone: row.phone,
          city: row.city ?? answers.city ?? null,
          lastActivityAt: row.submittedAt.toISOString(),
          latestArtistType: displayArtistLabel(answers),
          artistPathResponseCount: 1,
        });
      } else {
        existing.artistPathResponseCount += 1;
        if (row.submittedAt.toISOString() > existing.lastActivityAt) {
          existing.id = row.id;
          existing.personId = row.id;
          existing.name = row.fullName;
          existing.phone = row.phone;
          existing.city = row.city ?? answers.city ?? existing.city;
          existing.lastActivityAt = row.submittedAt.toISOString();
          existing.latestArtistType = displayArtistLabel(answers) ?? existing.latestArtistType;
        }
      }
    }

    const all = Array.from(grouped.values()).sort(
      (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime(),
    );
    const total = all.length;
    const pages = Math.ceil(total / limit) || 0;
    const start = (page - 1) * limit;
    const data = all.slice(start, start + limit).map((item) => ({
      ...item,
      _id: item.personId,
    }));

    return { data, total, page, pages };
  }

  async getApplicationDetail(
    applicationId: string,
    ctx: MembershipContext,
    organizationId?: string,
  ) {
    const orgId = resolveOrganizationId(ctx, organizationId);

    const anchor = await this.prisma.client.artistPathApplication.findFirst({
      where: { id: applicationId, organizationId: orgId },
    });
    if (!anchor) {
      throw new NotFoundException('Artist Path application not found');
    }

    const responses = await this.prisma.client.artistPathApplication.findMany({
      where: { organizationId: orgId, email: anchor.email },
      orderBy: { submittedAt: 'desc' },
    });

    const latest = responses[0];
    const latestAnswers = (latest.answers as AnswersRecord) ?? {};

    return {
      email: latest.email,
      phone: latest.phone,
      hub: {
        name: latest.fullName,
        email: latest.email,
        phone: latest.phone,
        city: latest.city ?? latestAnswers.city,
        latestArtistType: displayArtistLabel(latestAnswers),
      },
      person: null,
      identifiers: [],
      responses: responses.map((row) => ({
        id: row.id,
        submittedAt: row.submittedAt.toISOString(),
        answers: row.answers as AnswersRecord,
        source: row.source,
        status: row.status,
      })),
    };
  }
}

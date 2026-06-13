import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { canManageArtist, type MembershipContext } from '@tsc/permissions';
import { ActivityService } from '../../modules/activity/activity.service';
import { CreditsService } from '../credits/credits.service';
import { ProfileService } from '../profile/profile.service';
import { FanService } from '../fan/fan.service';
import { TscIdentityProvisionService } from '../tsc-identity/tsc-identity-provision.service';
import {
  CommunityRepository,
  displayArtistName,
  displayPersonName,
} from './community.repository';
import type {
  CommunityAddMemberInput,
  CommunityCreateOpportunityInput,
  CommunityLeaderSettingsInput,
  CommunityMemberRolePatchInput,
  CommunityMembersQuery,
} from './dto';
import type {
  CommunityDashboardPayload,
  CommunityEventsPayload,
  CommunityJoinPayload,
  CommunityLeavePayload,
  CommunityMemberAddedPayload,
  CommunityMemberRolePayload,
  CommunityMembersPayload,
  CommunityOpportunityCreatedPayload,
  CommunitySettingsPayload,
} from './types';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

@Injectable()
export class CommunityService {
  constructor(
    private readonly repository: CommunityRepository,
    private readonly profileService: ProfileService,
    private readonly fanService: FanService,
    private readonly activityService: ActivityService,
    private readonly creditsService: CreditsService,
    private readonly tscIdentityProvision: TscIdentityProvisionService,
  ) {}

  async getDashboard(
    communityId: string,
    ctx: MembershipContext,
  ): Promise<CommunityDashboardPayload> {
    const community = await this.requireCommunity(communityId);
    await this.assertCanView(communityId, ctx, community.artistId);

    const since = this.repository.since30Days();
    const [
      activeAuthors,
      contributorGroups,
      linkedArtists,
      upcomingEvents,
      snapshot,
    ] = await Promise.all([
      this.repository.countActiveMembersSince(communityId, since),
      this.repository.listTopContributors(communityId, since),
      this.repository.listLinkedArtists(communityId, community.artistId),
      this.repository.listUpcomingEvents(communityId, community.artistId),
      this.repository.findLatestIntelligenceSnapshot(communityId),
    ]);

    const memberCount = community._count.members;
    const activeMemberCount = activeAuthors.length;

    let engagementScore = 0;
    let engagementSource: 'snapshot' | 'counts' = 'counts';

    if (snapshot) {
      const metrics =
        snapshot.metrics &&
        typeof snapshot.metrics === 'object' &&
        !Array.isArray(snapshot.metrics)
          ? (snapshot.metrics as Record<string, unknown>)
          : null;
      if (typeof snapshot.retention === 'number') {
        engagementScore = round2(snapshot.retention);
        engagementSource = 'snapshot';
      } else if (metrics && typeof metrics.activeMembersLast30 === 'number' && memberCount > 0) {
        engagementScore = round2((Number(metrics.activeMembersLast30) / memberCount) * 100);
        engagementSource = 'snapshot';
      }
    }

    if (engagementSource === 'counts') {
      engagementScore =
        memberCount > 0 ? round2((activeMemberCount / memberCount) * 100) : 0;
    }

    const contributorPeople = await this.repository.resolvePersonNames(
      contributorGroups.map((group) => group.authorId),
    );
    const personById = new Map(contributorPeople.map((person) => [person.id, person]));

    const topContributors = await Promise.all(
      contributorGroups.map(async (group) => {
        const person = personById.get(group.authorId);
        const lastPost = await this.repository.findPersonLastPostAt(
          group.authorId,
          communityId,
        );
        return {
          personId: group.authorId,
          name: person ? displayPersonName(person) : group.authorId,
          postCount30d: group._count.authorId,
          lastActiveAt: lastPost?.publishedAt?.toISOString() ?? null,
        };
      }),
    );

    return {
      communityId,
      name: community.name,
      slug: community.slug ?? null,
      memberCount,
      activeMemberCount,
      engagementScore,
      engagementSource,
      topContributors,
      linkedArtists: linkedArtists.map((artist) => ({
        artistId: artist.id,
        name: displayArtistName(artist),
        slug: artist.slug,
      })),
      upcomingEvents: upcomingEvents.map((event) => ({
        id: event.id,
        title: event.title,
        startsAt: event.startsAt.toISOString(),
        venueName: event.venue?.name ?? null,
        city: event.venue?.city ?? null,
      })),
      updatedAt: new Date().toISOString(),
    };
  }

  async listMembers(
    communityId: string,
    query: CommunityMembersQuery,
    ctx: MembershipContext,
  ): Promise<CommunityMembersPayload> {
    const community = await this.requireCommunity(communityId);
    await this.assertCanView(communityId, ctx, community.artistId);

    const since = this.repository.since30Days();
    const [rows, total] = await this.repository.listMembers(communityId, query);

    const items = await Promise.all(
      rows.map(async (row) => {
        const [postCount30d, lastPost, isLeader] = await Promise.all([
          this.repository.countMemberPostsSince(row.personId, communityId, since),
          this.repository.findPersonLastPostAt(row.personId, communityId),
          this.repository.personManagesCommunity(communityId, row.personId),
        ]);

        return {
          personId: row.personId,
          name: displayPersonName(row.person),
          role: row.role,
          status: row.status,
          joinedAt: row.joinedAt.toISOString(),
          leftAt: row.leftAt?.toISOString() ?? null,
          lastActiveAt: lastPost?.publishedAt?.toISOString() ?? row.updatedAt.toISOString(),
          postCount30d,
          isLeader: isLeader || row.role === 'Founder',
        };
      }),
    );

    return {
      communityId,
      items,
      page: query.page,
      limit: query.limit,
      total,
      hasMore: query.page * query.limit < total,
      updatedAt: new Date().toISOString(),
    };
  }

  async addMember(
    communityId: string,
    input: CommunityAddMemberInput,
    ctx: MembershipContext,
  ): Promise<CommunityMemberAddedPayload> {
    const community = await this.requireCommunity(communityId);
    await this.assertCanManage(communityId, ctx, community.artistId);

    const person = await this.repository.findPerson(input.personId);
    if (!person) {
      throw new NotFoundException(`Person ${input.personId} not found`);
    }

    const existing = await this.repository.findMember(communityId, input.personId);
    const wasActive = existing?.status === 'active';
    const member = await this.repository.upsertMember(communityId, input);
    const relationship = await this.repository.upsertMemberOfRelationship(
      communityId,
      input.personId,
    );

    await this.activityService.recordFromStub({
      type: 'community.member.added',
      actorId: ctx.userId,
      entityType: 'Community',
      entityId: communityId,
      targetEntityType: 'Person',
      targetEntityId: input.personId,
      metadata: { role: member.role, source: 'leader-add' },
    });

    return {
      communityId,
      personId: input.personId,
      role: member.role,
      relationshipId: relationship.id,
      memberId: member.id,
      created: !wasActive,
      updatedAt: new Date().toISOString(),
    };
  }

  async join(
    communityId: string,
    ctx: MembershipContext,
  ): Promise<CommunityJoinPayload> {
    const community = await this.requireCommunity(communityId);
    const personId = ctx.userId;

    const person = await this.repository.findPerson(personId);
    if (!person) {
      throw new NotFoundException(`Person ${personId} not found — resolve identity first`);
    }

    await this.profileService.ensureProfileStub({
      personId: person.id,
      displayName: person.displayName ?? person.name,
    });
    void this.fanService.ensureFanProfileStub(person.id);

    const existing = await this.repository.findMember(communityId, personId);
    const wasActive = existing?.status === 'active';
    const member = await this.repository.joinMember(communityId, personId);
    const relationship = await this.repository.upsertMemberOfRelationship(
      communityId,
      personId,
    );

    await this.activityService.recordFromStub({
      type: 'community.member.joined',
      actorId: personId,
      entityType: 'Community',
      entityId: communityId,
      targetEntityType: 'Person',
      targetEntityId: personId,
      metadata: { communityName: community.name, role: member.role },
    });

    if (!wasActive) {
      void this.creditsService.earnFromCommunityJoin(personId, communityId);
    }

    return {
      communityId,
      personId,
      role: member.role,
      status: member.status,
      relationshipId: relationship.id,
      memberId: member.id,
      created: !wasActive,
      updatedAt: new Date().toISOString(),
    };
  }

  async leave(
    communityId: string,
    ctx: MembershipContext,
  ): Promise<CommunityLeavePayload> {
    await this.requireCommunity(communityId);
    const personId = ctx.userId;

    const member = await this.repository.findMember(communityId, personId);
    if (!member || member.status !== 'active') {
      throw new BadRequestException('Not an active member of this community');
    }

    const updated = await this.repository.leaveMember(communityId, personId);
    await this.repository.endMemberOfRelationship(communityId, personId);
    const relationship = await this.repository.findMemberOfRelationship(
      communityId,
      personId,
    );

    await this.activityService.recordFromStub({
      type: 'community.member.left',
      actorId: personId,
      entityType: 'Community',
      entityId: communityId,
      targetEntityType: 'Person',
      targetEntityId: personId,
    });

    return {
      communityId,
      personId,
      status: updated.status,
      leftAt: updated.leftAt?.toISOString() ?? new Date().toISOString(),
      relationshipId: relationship?.id ?? null,
      updatedAt: new Date().toISOString(),
    };
  }

  async updateMemberRole(
    communityId: string,
    personId: string,
    input: CommunityMemberRolePatchInput,
    ctx: MembershipContext,
  ): Promise<CommunityMemberRolePayload> {
    const community = await this.requireCommunity(communityId);
    await this.assertCanManage(communityId, ctx, community.artistId);

    const member = await this.repository.findMember(communityId, personId);
    if (!member || member.status !== 'active') {
      throw new NotFoundException(`Active member ${personId} not found`);
    }

    const updated = await this.repository.updateMemberRole(
      communityId,
      personId,
      input,
    );

    await this.activityService.recordFromStub({
      type: 'community.member.role_changed',
      actorId: ctx.userId,
      entityType: 'Community',
      entityId: communityId,
      targetEntityType: 'Person',
      targetEntityId: personId,
      metadata: { role: updated.role },
    });

    return {
      communityId,
      personId,
      role: updated.role,
      updatedAt: new Date().toISOString(),
    };
  }

  async listEvents(
    communityId: string,
    ctx: MembershipContext,
  ): Promise<CommunityEventsPayload> {
    const community = await this.requireCommunity(communityId);
    await this.assertCanView(communityId, ctx, community.artistId);

    const events = await this.repository.listUpcomingEvents(
      communityId,
      community.artistId,
      25,
    );

    return {
      communityId,
      items: events.map((event) => ({
        id: event.id,
        title: event.title,
        startsAt: event.startsAt.toISOString(),
        venueName: event.venue?.name ?? null,
        city: event.venue?.city ?? null,
      })),
      updatedAt: new Date().toISOString(),
    };
  }

  async createOpportunity(
    communityId: string,
    input: CommunityCreateOpportunityInput,
    ctx: MembershipContext,
  ): Promise<CommunityOpportunityCreatedPayload> {
    const community = await this.requireCommunity(communityId);
    await this.assertCanManage(communityId, ctx, community.artistId);

    const opportunity = await this.repository.createCommunityOpportunity(
      communityId,
      input,
      ctx.userId,
    );

    return {
      id: opportunity.id,
      communityId,
      title: opportunity.title,
      status: opportunity.status,
      category: opportunity.category ?? null,
      createdAt: opportunity.createdAt.toISOString(),
    };
  }

  async updateLeaderSettings(
    communityId: string,
    input: CommunityLeaderSettingsInput,
    ctx: MembershipContext,
  ): Promise<CommunitySettingsPayload> {
    const community = await this.requireCommunity(communityId);
    await this.assertCanManage(communityId, ctx, community.artistId);

    const updated = await this.repository.updateCommunitySettings(
      communityId,
      input,
      null,
    );

    return {
      communityId,
      name: updated.name,
      slug: updated.slug ?? null,
      settings: input,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  private async requireCommunity(communityId: string) {
    const community = await this.repository.findCommunity(communityId);
    if (!community) {
      throw new NotFoundException(`Community ${communityId} not found`);
    }
    void this.tscIdentityProvision.ensureCommunityIdentity(communityId, community.slug);
    return community;
  }

  private async assertCanView(
    communityId: string,
    ctx: MembershipContext,
    artistId?: string | null,
  ) {
    if (ctx.roles.includes('admin')) return;
    if (artistId && canManageArtist(ctx, artistId)) return;
    if (await this.repository.personManagesCommunity(communityId, ctx.userId)) return;

    const member = await this.repository.findMember(communityId, ctx.userId);
    if (member?.status === 'active') return;

    throw new ForbiddenException('Cannot view this community');
  }

  private async assertCanManage(
    communityId: string,
    ctx: MembershipContext,
    artistId?: string | null,
  ) {
    if (ctx.roles.includes('admin')) return;
    if (artistId && canManageArtist(ctx, artistId)) return;
    if (await this.repository.personManagesCommunity(communityId, ctx.userId)) return;

    throw new ForbiddenException('Community leader permissions required');
  }
}

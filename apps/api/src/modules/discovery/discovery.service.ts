import { ForbiddenException, Injectable } from '@nestjs/common';
import type { DiscoveryQuery } from '@tsc/contracts/discovery';
import type {
  DiscoveryCollaborationItem,
  DiscoveryCommunityItem,
  DiscoveryEventItem,
  DiscoveryListPayload,
  DiscoveryPersonItem,
} from '@tsc/types';
import type { MembershipContext } from '@tsc/permissions';
import { IntelligenceService } from '../intelligence/intelligence.service';
import { DiscoveryRepository } from './discovery.repository';

const COLLABORATION_SKILL_MAP: Record<string, string[]> = {
  need_rapper: ['rap', 'rapper', 'vocals', 'hip-hop'],
  need_producer: ['producer', 'beatmaking', 'production', 'mixing'],
  need_guitarist: ['guitar', 'guitarist', 'live'],
  need_videographer: ['video', 'videography', 'filmmaking', 'content'],
  need_cover_artist: ['cover', 'singer', 'vocals'],
  general: [],
};

function displayName(person: {
  displayName: string | null;
  name: string | null;
  id: string;
}): string {
  return person.displayName?.trim() || person.name?.trim() || person.id;
}

function genreOverlap(a: string[], b: string[]): number {
  const setB = new Set(b.map((g) => g.toLowerCase()));
  return a.filter((g) => setB.has(g.toLowerCase())).length;
}

function skillMatchScore(skills: string[], collaborationType: string): number {
  const keywords = COLLABORATION_SKILL_MAP[collaborationType] ?? [];
  if (keywords.length === 0) return 40;
  const normalized = skills.map((s) => s.toLowerCase());
  const hits = keywords.filter((kw) =>
    normalized.some((skill) => skill.includes(kw) || kw.includes(skill)),
  );
  return hits.length > 0 ? 60 + hits.length * 15 : 10;
}

@Injectable()
export class DiscoveryService {
  constructor(
    private readonly repository: DiscoveryRepository,
    private readonly intelligenceService: IntelligenceService,
  ) {}

  async discoverPeople(
    ctx: MembershipContext,
    query: DiscoveryQuery,
  ): Promise<DiscoveryListPayload<DiscoveryPersonItem>> {
    const personId = this.requirePersonId(ctx);
    const [profile, communityIds, followingIds, connectedIds] = await Promise.all([
      this.repository.findPersonProfile(personId),
      this.repository.listPersonCommunityIds(personId),
      this.repository.listFollowingIds(personId),
      this.repository.listConnectedPersonIds(personId),
    ]);

    const excludeIds = [...new Set([...followingIds, ...connectedIds])];
    const rows = await this.repository.discoverPeople({
      personId,
      communityIds,
      city: query.city ?? profile?.city ?? null,
      genres: profile?.genres ?? [],
      excludeIds,
      limit: query.limit,
    });

    const items: DiscoveryPersonItem[] = rows
      .map((row) => {
        const personProfile = row.person.profile;
        const sharedCommunities = row.shared ?? 0;
        const cityMatch =
          profile?.city && personProfile?.city
            ? profile.city.toLowerCase() === personProfile.city.toLowerCase()
            : false;
        const genres = personProfile?.genres ?? [];
        const overlap = genreOverlap(profile?.genres ?? [], genres);
        const matchScore =
          sharedCommunities * 25 + overlap * 15 + (cityMatch ? 20 : 0) + 10;
        const reasons: string[] = [];
        if (sharedCommunities > 0) reasons.push(`${sharedCommunities} shared communities`);
        if (overlap > 0) reasons.push(`${overlap} shared genres`);
        if (cityMatch) reasons.push('same city');

        return {
          personId: row.person.id,
          displayName: displayName(row.person),
          slug: personProfile?.slug ?? null,
          city: personProfile?.city ?? null,
          genres,
          sharedCommunities,
          matchScore,
          reason: reasons.length > 0 ? reasons.join(' · ') : 'Participation overlap',
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, query.limit);

    return { items, updatedAt: new Date().toISOString() };
  }

  async discoverCommunities(
    ctx: MembershipContext,
    query: DiscoveryQuery,
  ): Promise<DiscoveryListPayload<DiscoveryCommunityItem>> {
    const personId = this.requirePersonId(ctx);
    const [profile, communityIds, followingIds] = await Promise.all([
      this.repository.findPersonProfile(personId),
      this.repository.listPersonCommunityIds(personId),
      this.repository.listFollowingIds(personId),
    ]);

    const rows = await this.repository.discoverCommunities({
      personId,
      communityIds,
      followingIds,
      city: query.city ?? profile?.city ?? null,
      genres: profile?.genres ?? [],
      limit: query.limit,
    });

    const items: DiscoveryCommunityItem[] = rows
      .map((row) => {
        const overlap = genreOverlap(profile?.genres ?? [], row.genres);
        const cityMatch =
          profile?.city && row.city
            ? profile.city.toLowerCase() === row.city.toLowerCase()
            : false;
        const matchScore =
          overlap * 20 + row.friendsInCommunity * 25 + (cityMatch ? 15 : 0) + 10;
        const reasons: string[] = [];
        if (row.friendsInCommunity > 0) {
          reasons.push(`${row.friendsInCommunity} people you follow are members`);
        }
        if (overlap > 0) reasons.push(`${overlap} genre matches`);
        if (cityMatch) reasons.push('in your city');

        return {
          communityId: row.id,
          name: row.name,
          city: row.city,
          genres: row.genres,
          memberCount: row.memberCount,
          friendsInCommunity: row.friendsInCommunity,
          matchScore,
          reason: reasons.length > 0 ? reasons.join(' · ') : 'Ecosystem participation fit',
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, query.limit);

    return { items, updatedAt: new Date().toISOString() };
  }

  async discoverEvents(
    ctx: MembershipContext,
    query: DiscoveryQuery,
  ): Promise<DiscoveryListPayload<DiscoveryEventItem>> {
    const personId = this.requirePersonId(ctx);
    const [profile, attendedCities, recommendationPayload] = await Promise.all([
      this.repository.findPersonProfile(personId),
      this.repository.listAttendedEventCities(personId),
      this.intelligenceService
        .getRecommendations('events', personId, ctx)
        .catch(() => null),
    ]);

    const rows = await this.repository.discoverEvents({
      personId,
      city: query.city ?? profile?.city ?? null,
      attendedCities,
      limit: query.limit,
    });

    const recScoreById = new Map<string, number>(
      (recommendationPayload?.items ?? []).map((item) => [item.entityId, item.score]),
    );

    const items: DiscoveryEventItem[] = rows
      .map((row) => {
        const cityMatch = attendedCities.some(
          (city) => city && row.city && city.toLowerCase() === row.city.toLowerCase(),
        );
        const enrichment = recScoreById.get(row.id) ?? 0;
        const matchScore = (cityMatch ? 40 : 20) + enrichment;
        return {
          eventId: row.id,
          title: row.title,
          city: row.city,
          startsAt: row.startsAt?.toISOString() ?? null,
          matchScore,
          reason: enrichment > 0
            ? 'Matches attendance patterns + intelligence recommendations'
            : cityMatch
              ? 'Near your past attendance cities'
              : 'Upcoming in your area',
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, query.limit);

    return { items, updatedAt: new Date().toISOString() };
  }

  async discoverCollaborations(
    ctx: MembershipContext,
    query: DiscoveryQuery,
  ): Promise<DiscoveryListPayload<DiscoveryCollaborationItem>> {
    const personId = this.requirePersonId(ctx);
    const profile = await this.repository.findPersonProfile(personId);
    const skills = profile?.skills ?? [];

    const rows = await this.repository.discoverCollaborations({
      skills,
      city: query.city ?? profile?.city ?? null,
      limit: query.limit,
    });

    const items: DiscoveryCollaborationItem[] = rows
      .map((row) => {
        const score = skillMatchScore(skills, row.type);
        const overlap = genreOverlap(profile?.genres ?? [], row.genres);
        const matchScore = score + overlap * 10;
        return {
          collaborationId: row.id,
          title: row.title,
          type: row.type,
          city: row.city,
          genres: row.genres,
          matchScore,
          reason:
            score > 40
              ? `Your skills match ${row.type.replace(/_/g, ' ')}`
              : 'Open collaboration in your ecosystem',
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, query.limit);

    return { items, updatedAt: new Date().toISOString() };
  }

  private requirePersonId(ctx: MembershipContext): string {
    if (!ctx.personId) {
      throw new ForbiddenException('Authenticated person required');
    }
    return ctx.personId;
  }
}

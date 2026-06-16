import type {
  Artist,
  Community,
  Opportunity,
  Organization,
  Project,
} from '@prisma/client';

export function toUnixMs(date: Date): number {
  return Math.floor(date.getTime());
}

export function mapArtist(artist: Artist) {
  return {
    id: artist.id,
    name: artist.name,
    displayName: artist.displayName ?? undefined,
    slug: artist.slug,
    bio: artist.bio ?? undefined,
    updatedAt: toUnixMs(artist.updatedAt),
  };
}

export function mapOpportunity(opportunity: Opportunity) {
  return {
    id: opportunity.id,
    title: opportunity.title,
    category: opportunity.category,
    city: opportunity.city ?? undefined,
    status: opportunity.status,
    genre: opportunity.genre ?? undefined,
    listingType: opportunity.listingType ?? undefined,
    requirements: opportunity.requirements.length ? opportunity.requirements : undefined,
    updatedAt: toUnixMs(opportunity.updatedAt),
  };
}

export function mapProject(project: Project) {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    description: project.description ?? undefined,
    status: project.status,
    type: project.type,
    workspaceId: project.workspaceId,
    updatedAt: toUnixMs(project.updatedAt),
  };
}

export function mapOrganization(organization: Organization) {
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    type: organization.type ?? undefined,
    updatedAt: toUnixMs(organization.updatedAt),
  };
}

export function mapCommunityProfile(community: Community) {
  return {
    id: community.id,
    name: community.name,
    slug: community.slug,
    description: community.description ?? undefined,
    city: community.city ?? undefined,
    genres: community.genres.length ? community.genres : undefined,
    artistId: community.artistId ?? undefined,
    updatedAt: toUnixMs(community.updatedAt),
  };
}

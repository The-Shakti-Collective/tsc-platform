import type { Prisma } from '@prisma/client';

export const SKILL_CATEGORIES = [
  'production',
  'performance',
  'visual',
  'management',
  'technical',
  'marketing',
] as const;

export type SkillCategoryValue = (typeof SKILL_CATEGORIES)[number];

export const SKILL_PROFICIENCIES = ['learning', 'intermediate', 'expert'] as const;

export type SkillProficiencyValue = (typeof SKILL_PROFICIENCIES)[number];

export const SKILL_ENDORSEMENT_SOURCES = ['peer', 'project', 'system'] as const;

export type SkillEndorsementSourceValue = (typeof SKILL_ENDORSEMENT_SOURCES)[number];

export const SKILL_GRAPH_RELATIONSHIP_TYPE = 'HAS_SKILL' as const;

export interface CanonicalSkillSeed {
  slug: string;
  name: string;
  category: SkillCategoryValue;
  description?: string;
}

/** ~20 canonical skills seeded on first migrate / first API bootstrap. */
export const CANONICAL_SKILLS: readonly CanonicalSkillSeed[] = [
  { slug: 'cinematography', name: 'Cinematography', category: 'visual', description: 'Camera work and visual storytelling for film and video.' },
  { slug: 'music_production', name: 'Music Production', category: 'production', description: 'Composing, arranging, and producing recorded music.' },
  { slug: 'mixing', name: 'Mixing', category: 'technical', description: 'Balancing and blending multi-track audio.' },
  { slug: 'mastering', name: 'Mastering', category: 'technical', description: 'Final polish and delivery prep for audio releases.' },
  { slug: 'graphic_design', name: 'Graphic Design', category: 'visual', description: 'Visual identity, layouts, and brand assets.' },
  { slug: 'artist_management', name: 'Artist Management', category: 'management', description: 'Career strategy and day-to-day artist operations.' },
  { slug: 'tour_management', name: 'Tour Management', category: 'management', description: 'Routing, logistics, and on-road crew coordination.' },
  { slug: 'songwriting', name: 'Songwriting', category: 'production', description: 'Lyrics, toplines, and song structure.' },
  { slug: 'vocal_performance', name: 'Vocal Performance', category: 'performance', description: 'Live and studio vocal delivery.' },
  { slug: 'live_sound', name: 'Live Sound', category: 'technical', description: 'FOH and monitor engineering for live events.' },
  { slug: 'photography', name: 'Photography', category: 'visual', description: 'Portrait, event, and editorial photography.' },
  { slug: 'video_editing', name: 'Video Editing', category: 'visual', description: 'Post-production editing and motion assembly.' },
  { slug: 'branding', name: 'Branding', category: 'marketing', description: 'Brand narrative, positioning, and identity systems.' },
  { slug: 'social_media_marketing', name: 'Social Media Marketing', category: 'marketing', description: 'Audience growth and content distribution on social platforms.' },
  { slug: 'event_production', name: 'Event Production', category: 'management', description: 'End-to-end planning and execution of live experiences.' },
  { slug: 'audio_engineering', name: 'Audio Engineering', category: 'technical', description: 'Recording, signal flow, and studio engineering.' },
  { slug: 'choreography', name: 'Choreography', category: 'performance', description: 'Movement design for stage and screen.' },
  { slug: 'acting', name: 'Acting', category: 'performance', description: 'Performance for film, theatre, and branded content.' },
  { slug: 'podcast_production', name: 'Podcast Production', category: 'production', description: 'Show format, recording, and episode production.' },
  { slug: 'content_strategy', name: 'Content Strategy', category: 'marketing', description: 'Editorial planning and multi-platform content roadmaps.' },
] as const;

export const skillInclude = {
  skills: {
    include: {
      skill: true,
    },
    orderBy: [{ isPrimary: 'desc' as const }, { updatedAt: 'desc' as const }],
  },
} satisfies Prisma.CreativeIdentityInclude;

export function isSkillCategory(value: string): value is SkillCategoryValue {
  return (SKILL_CATEGORIES as readonly string[]).includes(value);
}

export function isSkillProficiency(value: string): value is SkillProficiencyValue {
  return (SKILL_PROFICIENCIES as readonly string[]).includes(value);
}

export function isSkillEndorsementSource(value: string): value is SkillEndorsementSourceValue {
  return (SKILL_ENDORSEMENT_SOURCES as readonly string[]).includes(value);
}

/** Rule-based proficiency — no ML. */
export function deriveProficiencyFromYears(yearsExperience?: number | null): SkillProficiencyValue {
  if (yearsExperience == null || yearsExperience < 3) return 'learning';
  if (yearsExperience < 8) return 'intermediate';
  return 'expert';
}

export function resolveProficiency(
  proficiency?: SkillProficiencyValue | null,
  yearsExperience?: number | null,
): SkillProficiencyValue {
  if (proficiency && isSkillProficiency(proficiency)) return proficiency;
  return deriveProficiencyFromYears(yearsExperience);
}

export function skillSlugWhere(slug: string): Prisma.SkillWhereInput {
  return {
    slug: { equals: slug, mode: 'insensitive' },
    isActive: true,
  };
}

export function skillCategoryWhere(category?: string | null): Prisma.SkillWhereInput {
  if (!category || !isSkillCategory(category)) return { isActive: true };
  return { category, isActive: true };
}

/**
 * Export lib/*.ts content to src/data/*.json for static site build.
 * Run: node scripts/export-site-data.mjs (requires tsx)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'src', 'data');

mkdirSync(outDir, { recursive: true });

const siteContent = await import('../lib/siteContent.ts');
const navigation = await import('../lib/navigation.ts');
const rosterArtists = await import('../lib/rosterArtists.ts');
const siteConstants = await import('../lib/siteConstants.ts');
const siteUrls = await import('../lib/siteUrls.ts');

writeFileSync(join(outDir, 'siteContent.json'), JSON.stringify({
  HERO_HEADLINE_PREFIX: siteContent.HERO_HEADLINE_PREFIX,
  HERO_HEADLINE_SUFFIXES: siteContent.HERO_HEADLINE_SUFFIXES,
  HERO_SUBHEADLINE: siteContent.HERO_SUBHEADLINE,
  HERO_CTAS: siteContent.HERO_CTAS,
  HOME_ABOUT: siteContent.HOME_ABOUT,
  METEOR_EFFECT: siteContent.METEOR_EFFECT,
  ROUNDWAY_STAGES: siteContent.ROUNDWAY_STAGES,
  WHAT_WE_BUILD: siteContent.WHAT_WE_BUILD,
  WHO_THIS_IS_FOR: siteContent.WHO_THIS_IS_FOR,
  STORIES_IPS: siteContent.STORIES_IPS,
  STORIES_INITIATIVES: siteContent.STORIES_INITIATIVES,
  FILM_CATALOGUE: siteContent.FILM_CATALOGUE,
  FILMS_SERVICES: siteContent.FILMS_SERVICES,
  FILMS_APPROACH: siteContent.FILMS_APPROACH,
  FILMS_WORK: siteContent.FILMS_WORK,
  FILMS_STATS: siteContent.FILMS_STATS,
  COLLAB_SERVICES: siteContent.COLLAB_SERVICES,
  COLLAB_CASE_STUDIES: siteContent.COLLAB_CASE_STUDIES,
  COLLAB_VALUE_PROPS: siteContent.COLLAB_VALUE_PROPS,
  ABOUT_FAQ: siteContent.ABOUT_FAQ,
  FREE_TOOLS: siteContent.FREE_TOOLS,
  INSIGHT_RESOURCES: siteContent.INSIGHT_RESOURCES,
  ACADEMY_COURSES: siteContent.ACADEMY_COURSES,
  MENTOR_BIOS: siteContent.MENTOR_BIOS,
  ACADEMY_TESTIMONIALS: siteContent.ACADEMY_TESTIMONIALS,
  ARTIST_ECOSYSTEM: siteContent.ARTIST_ECOSYSTEM,
}, null, 2));
writeFileSync(join(outDir, 'navigation.json'), JSON.stringify({
  NAV_INTENT_LABEL: navigation.NAV_INTENT_LABEL,
  MAIN_NAV: navigation.MAIN_NAV,
  FOOTER_SECTIONS: navigation.FOOTER_SECTIONS,
  SOCIAL_LINKS: navigation.SOCIAL_LINKS,
}, null, 2));
writeFileSync(join(outDir, 'rosterArtists.json'), JSON.stringify({
  ROSTER_ARTISTS: rosterArtists.ROSTER_ARTISTS,
}, null, 2));
writeFileSync(
  join(outDir, 'constants.json'),
  JSON.stringify(
    {
      SITE_EMAIL: siteConstants.SITE_EMAIL,
      FILMS_CONTACT_EMAIL: siteConstants.FILMS_CONTACT_EMAIL,
      WHATSAPP_COMMUNITY_URL:
        process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL ||
        siteConstants.WHATSAPP_COMMUNITY_URL,
      ROHIT_LINKEDIN_URL: siteConstants.ROHIT_LINKEDIN_URL,
      PRASAD_YOUTUBE_URL: siteConstants.PRASAD_YOUTUBE_URL,
      SANDESH_SPOTIFY_URL: siteConstants.SANDESH_SPOTIFY_URL,
      ARTIST_PATH_LANDING_URL: siteUrls.ARTIST_PATH_LANDING_URL,
      ARTIST_PATH_FORM_PATH: siteUrls.ARTIST_PATH_FORM_PATH,
      ARTIST_BOOKING_FORM_PATH: siteUrls.ARTIST_BOOKING_FORM_PATH,
    },
    null,
    2,
  ),
);

console.log('Exported site data to src/data/');

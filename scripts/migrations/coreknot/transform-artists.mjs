import { oid } from './lib/mongo.mjs';
import { slugify, toDate } from './lib/utils.mjs';

/**
 * @param {import('mongodb').Document[]} artists
 */
export function transformArtists(artists) {
  return artists.map((a) => {
    const externalId = oid(a);
    const name = String(a.name || 'Unknown Artist').trim();
    return {
      externalId,
      tenantId: a.tenantId ? String(a.tenantId) : null,
      name,
      slug: slugify(a.slug || name, `artist-${externalId?.slice(-6) ?? 'x'}`),
      bio: a.bio ?? null,
      photoUrl: a.profileImage ?? null,
      teamUserIds: Array.isArray(a.team) ? a.team.map((id) => String(id)) : [],
      metadata: {
        website: a.website ?? null,
        socials: a.socials ?? {},
        legacyEvents: a.events ?? [],
        discography: a.discography ?? [],
        tenantId: a.tenantId ? String(a.tenantId) : null,
        teamUserIds: Array.isArray(a.team) ? a.team.map((id) => String(id)) : [],
        migratedFrom: 'artists',
      },
      createdAt: toDate(a.createdAt),
      updatedAt: toDate(a.updatedAt) ?? toDate(a.createdAt),
    };
  });
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const { extractArtists } = await import('./extract-artists.mjs');
  const raw = await extractArtists();
  console.log(JSON.stringify(transformArtists(raw), null, 2));
  process.exit(0);
}

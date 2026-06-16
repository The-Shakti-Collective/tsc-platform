/** TSC bookable roster — content sourced from dedicated artist profile pages. */
export type ArtistMedia = {
  title: string;
  href: string;
  platform: 'youtube' | 'spotify' | 'instagram';
  image?: string;
};

export type ArtistSocial = {
  label: string;
  href: string;
  external?: boolean;
};

export type RosterArtist = {
  slug: string;
  href: string;
  name: string;
  role: string;
  tagline: string;
  image: string;
  portrait?: string;
  bio?: string;
  tags?: string[];
  highlights: string[];
  social?: ArtistSocial[];
  media?: ArtistMedia[];
  /** Value for the `artist` field on /query */
  queryArtist: string;
};

export const ROSTER_ARTISTS: RosterArtist[] = [
  {
    slug: 'harshadduhita',
    href: '/harshadduhita',
    name: 'Harshaduhita Collective',
    role: 'Live Classical Fusion Duo',
    tagline:
      'A live music duo blending deep-rooted Indian classical music with divine emotion and diverse musical expression.',
    image: '/artists/harshadduhita/heroHND.jpeg',
    portrait: '/artists/harshadduhita/heroHND.jpeg',
    bio: 'Harshad and Duhita bring Rampur-Sham Chaurasi gharana lineage into contemporary live settings — from classical repertoire to fusion collaborations that honour tradition while reaching new audiences.',
    tags: ['Rampur Gharana', 'Harshaduhita Collective', 'Live Fusion'],
    highlights: [
      'Padma Shri Mahendra Kapoor Award 2026',
      "India's Got Talent Season 11",
      'Gananayaka',
    ],
    social: [
      { label: 'Duhita Golesar', href: 'https://www.instagram.com/duhita_harshad/', external: true },
      { label: 'Harshaduhita Collective', href: 'https://www.instagram.com/harshaduhita_collective/', external: true },
      { label: 'Spotify', href: 'https://open.spotify.com/artist/6L88xirodmbWYoZuvseUnc', external: true },
    ],
    media: [
      {
        title: 'Performance Highlight',
        href: 'https://www.youtube.com/watch?v=IcknSFj2rys',
        platform: 'youtube',
        image: '/artists/harshadduhita/heroHND.jpeg',
      },
      {
        title: 'On Spotify',
        href: 'https://open.spotify.com/artist/6L88xirodmbWYoZuvseUnc',
        platform: 'spotify',
      },
    ],
    queryArtist: 'Harshad and Duhita Golesar',
  },
  {
    slug: 'yugm',
    href: '/yugm',
    name: 'Yugm',
    role: 'Jaipur Folk Fusion Band',
    tagline:
      'Bringing India’s traditional roots into contemporary folk fusion — stories of water, gender, culture and hope.',
    image: '/artists/yugm/img-9384.jpg',
    portrait: '/artists/yugm/img-9384.jpg',
    bio: 'Yugm weaves Rajasthani folk with contemporary arrangements — performing at IPL, Netflix productions, and stages across India with a message of cultural continuity and hope.',
    tags: ['Jaipur Folk', 'Fusion', 'TEDx'],
    highlights: [
      'Netflix Mismatched S2 & S3',
      'IPL 2025 · Rajasthan Royals',
      '900+ performances · 9 TEDx talks',
    ],
    social: [
      { label: 'Instagram', href: 'https://www.instagram.com/yugmofficial/', external: true },
      { label: 'YouTube', href: 'https://www.youtube.com/@yugmofficial', external: true },
    ],
    media: [
      {
        title: 'Yugm Live',
        href: 'https://www.youtube.com/@yugmofficial',
        platform: 'youtube',
        image: '/artists/yugm/img-9384.jpg',
      },
    ],
    queryArtist: 'YUGM',
  },
  {
    slug: 'mohitshanker',
    href: '/mohitshanker',
    name: 'Mohit Shankar',
    role: 'Emerging Vocalist & Performer',
    tagline:
      'Hindustani-trained vocalist building a live performance career across Delhi NCR — rooted in riyaz, stagecraft, and contemporary repertoire.',
    image: '/assets/academy/deepank.jpg',
    portrait: '/assets/academy/deepank.jpg',
    bio: 'Mohit trains in the guru-shishya tradition while building a contemporary live repertoire — performing across Delhi NCR and developing as part of the TSC emerging artist roster.',
    tags: ['Hindustani Vocal', 'Emerging Artist', 'Delhi NCR'],
    highlights: [
      'Daily riyaz · guru-shishya training',
      'Live venues across Delhi NCR',
      'TSC emerging artist roster',
    ],
    social: [
      { label: 'Book via TSC', href: '/query?artist=Mohit%20Shankar', external: false },
    ],
    queryArtist: 'Mohit Shankar',
  },
];

export function artistBookingHref(queryArtist?: string) {
  if (!queryArtist) return '/query';
  return `/query?artist=${encodeURIComponent(queryArtist)}`;
}

import { ARTIST_PATH_FORM_PATH, ARTIST_PATH_LANDING_URL } from './siteUrls.js';
import { WHATSAPP_COMMUNITY_URL } from './siteConstants.js';

/** Hero-only label — not used in main navbar */
export const NAV_INTENT_LABEL = 'I want to';

/** Sitemap main website navbar */
export const MAIN_NAV = [
  { label: 'About', href: '/about' },
  {
    label: 'Work',
    href: '/stories',
    matchPrefixes: ['/stories', '/films', '/collab', '/ip'],
    children: [
      { label: 'Build Stories', href: '/stories', description: 'Original IPs and cultural initiatives' },
      { label: 'TSC Films', href: '/films', description: 'Film mounting and audience ecosystems' },
      { label: 'Collab with TSC', href: '/collab', description: 'Brand partnerships and co-created IP' },
    ],
  },
  {
    label: 'Artists',
    href: '/artists',
    emphasis: true,
    matchPrefixes: ['/artists', '/artist', '/artist-path', '/harshadduhita', '/yugm', '/mohitshanker', '/query'],
    children: [
      { label: 'All Artists', href: '/artists', description: 'Browse TSC artist roster' },
      { label: 'Book an Artist', href: '/query', description: 'Bookings and collaborations' },
      { label: 'Artist Path', href: '/artist-path', description: 'Personalized growth roadmap' },
    ],
  },
  { label: 'TSC Academy', href: '/academy', matchPrefixes: ['/academy', '/tscacademy', '/courses', '/masterclass'] },
  { label: 'Resources', href: '/insights', matchPrefixes: ['/insights', '/resources'] },
] as const;

/** @deprecated Use MAIN_NAV — kept for footer / legacy references */
export const PRIMARY_NAV = [
  { label: 'Learn Music', href: '/academy' },
  { label: 'Build Stories', href: '/stories' },
  { label: 'TSC Films', href: '/films' },
  { label: 'Collab with TSC', href: '/collab' },
  { label: 'Book an Artist', href: '/query' },
] as const;

export const NAV_WHATSAPP = {
  label: 'Join WA Community',
  href: WHATSAPP_COMMUNITY_URL,
  external: true,
} as const;

export const FOOTER_SECTIONS = [
  {
    title: 'Explore',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Build Stories', href: '/stories' },
      { label: 'TSC Films', href: '/films' },
      { label: 'Artists', href: '/artists' },
      { label: 'TSC Academy', href: '/academy' },
      { label: 'Resources', href: '/insights' },
    ],
  },
  {
    title: 'Artists',
    links: [
      { label: 'Artist Path', href: ARTIST_PATH_LANDING_URL, external: true },
      { label: 'Start Artist Path', href: ARTIST_PATH_FORM_PATH },
      { label: 'Book an Artist', href: '/query' },
      { label: 'Ambassador Program', href: '/academy/ambassador' },
    ],
  },
  {
    title: 'Connect',
    links: [
      { label: 'Collab with TSC', href: '/collab' },
      { label: 'Book a Call', href: '/book-a-call' },
      { label: 'Join WhatsApp Community', href: WHATSAPP_COMMUNITY_URL, external: true },
      { label: 'Instagram', href: 'https://www.instagram.com/the_shakti_collective', external: true },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/rohitsobti/', external: true },
      { label: 'YouTube', href: 'https://www.youtube.com/@theshakticollective', external: true },
      { label: 'Spotify', href: 'https://open.spotify.com/', external: true },
    ],
  },
] as const;

export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/the_shakti_collective',
  linkedin: 'https://www.linkedin.com/in/rohitsobti/',
  youtube: 'https://www.youtube.com/@theshakticollective',
  spotify: 'https://open.spotify.com/',
  whatsapp: WHATSAPP_COMMUNITY_URL,
} as const;

export function isNavActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isMainNavActive(
  pathname: string,
  item: (typeof MAIN_NAV)[number],
): boolean {
  if ('matchPrefixes' in item && item.matchPrefixes) {
    return item.matchPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
  }
  return isNavActive(pathname, item.href);
}

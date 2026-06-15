import cmsData from './cms-data.json';

export interface IP {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  type: string;
  status: string;
  logline: string;
  heroImage: string;
  description: string;
  culturalRootedness: string;
  contemporaryFormat: string;
  partnerships: string[];
  monetisationTags: string[];
  tags: string[];
  ctaLabel: string;
  ctaLink: string;
}

export interface Artist {
  id: string;
  slug: string;
  name: string;
  roles: string[];
  location: string;
  bioShort: string;
  bioLong: string;
  image: string;
  bookingEnabled: boolean;
  genres: string[];
  social?: {
    instagram?: string;
    spotify?: string;
  };
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  mentor: string;
  price: number;
  description: string;
  outcomes: string[];
  modules: string[];
  startDate: string;
  ctaLabel: string;
  image: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  date: string;
  author: string;
  image: string;
  content: string;
}

export interface ProofTile {
  id: string;
  title: string;
  category: string;
  image: string;
  summary: string;
  link: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
}

// CMS API
export const cms = {
  // IPs
  getIPs: (): IP[] => cmsData.ips,
  getIPBySlug: (slug: string): IP | undefined =>
    cmsData.ips.find((ip) => ip.slug === slug),
  getIPById: (id: string): IP | undefined =>
    cmsData.ips.find((ip) => ip.id === id),

  // Artists
  getArtists: (): Artist[] => cmsData.artists,
  getArtistBySlug: (slug: string): Artist | undefined =>
    cmsData.artists.find((artist) => artist.slug === slug),
  getArtistById: (id: string): Artist | undefined =>
    cmsData.artists.find((artist) => artist.id === id),

  // Courses
  getCourses: (): Course[] => cmsData.courses,
  getCourseBySlug: (slug: string): Course | undefined =>
    cmsData.courses.find((course) => course.slug === slug),
  getCourseById: (id: string): Course | undefined =>
    cmsData.courses.find((course) => course.id === id),

  // Articles
  getArticles: (): Article[] => cmsData.articles,
  getArticleBySlug: (slug: string): Article | undefined =>
    cmsData.articles.find((article) => article.slug === slug),
  getArticleById: (id: string): Article | undefined =>
    cmsData.articles.find((article) => article.id === id),
  getArticlesByCategory: (category: string): Article[] =>
    cmsData.articles.filter((article) => article.category === category),

  // Proof Tiles
  getProofTiles: (): ProofTile[] => cmsData.proofTiles,

  // Team
  getTeam: (): TeamMember[] => cmsData.team,
  getTeamMemberById: (id: string): TeamMember | undefined =>
    cmsData.team.find((member) => member.id === id),
};

export default cms;

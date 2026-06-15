export const MOCK_DASHBOARD = {
  displayName: 'Raghav',
  reputationScore: 1280,
  membershipTier: 'Collaborator',
  snapshot: {
    profileStrength: 92,
    opportunitiesAvailable: 15,
    collaborationRequests: 3,
    tasksDue: 4,
    reputationPoints: 1280,
  },
  recommendedActions: [
    { id: '1', label: 'Complete portfolio', href: '/profile' },
    { id: '2', label: 'Apply to opportunity', href: '/opportunities/opp-1' },
    { id: '3', label: 'Reply to collaboration request', href: '/collaborations' },
    { id: '4', label: 'Attend upcoming session', href: '/events' },
  ],
  opportunities: [
    {
      id: 'opp-1',
      title: 'Indie Film Score — Short Documentary',
      organization: 'Riverlight Studios',
      location: 'Mumbai · Hybrid',
      compensation: '₹45,000',
      deadline: '2026-07-01',
      matchPercent: 94,
      category: 'Film Projects',
    },
    {
      id: 'opp-2',
      title: 'Live Session — Rooftop Series',
      organization: 'The Hive',
      location: 'Bangalore',
      compensation: '₹18,000 + rev share',
      deadline: '2026-06-28',
      matchPercent: 88,
      category: 'Gigs',
    },
    {
      id: 'opp-3',
      title: 'Brand Campaign — Sonic Identity',
      organization: 'Northwind Audio',
      location: 'Remote',
      compensation: '₹60,000',
      deadline: '2026-07-15',
      matchPercent: 82,
      category: 'Music Projects',
    },
  ],
  events: [
    { id: 'ev-1', title: 'Producer Roundtable', type: 'Workshop', date: 'Jun 18' },
    { id: 'ev-2', title: 'Community Call — June', type: 'Community Call', date: 'Jun 22' },
    { id: 'ev-3', title: 'Open Auditions — Web Series', type: 'Audition', date: 'Jun 25' },
  ],
  insights: [
    { id: 'in-1', title: 'How to price your first brand deal', tag: 'Creative Entrepreneurship' },
    { id: 'in-2', title: 'Building a reel that gets callbacks', tag: 'Film' },
    { id: 'in-3', title: 'Collaboration etiquette for remote crews', tag: 'Business' },
  ],
};

export const MOCK_OPPORTUNITIES = [
  ...MOCK_DASHBOARD.opportunities,
  {
    id: 'opp-4',
    title: 'Photography — Festival Coverage',
    organization: 'Sundown Collective',
    location: 'Goa',
    compensation: '₹25,000',
    deadline: '2026-07-10',
    matchPercent: 76,
    category: 'Freelance Work',
  },
  {
    id: 'opp-5',
    title: 'Emerging Artist Grant 2026',
    organization: 'Shakti Arts Fund',
    location: 'India-wide',
    compensation: '₹2,00,000 grant',
    deadline: '2026-08-01',
    matchPercent: 71,
    category: 'Grants',
  },
  {
    id: 'opp-6',
    title: 'Mentorship — Music Business',
    organization: 'TSC Mentors',
    location: 'Remote',
    compensation: 'Stipend included',
    deadline: 'Rolling',
    matchPercent: 68,
    category: 'Mentorships',
  },
];

export const OPPORTUNITY_CATEGORIES = [
  'Gigs',
  'Film Projects',
  'Music Projects',
  'Creative Jobs',
  'Freelance Work',
  'Grants',
  'Competitions',
  'Auditions',
  'Internships',
  'Mentorships',
] as const;

export const MOCK_OPPORTUNITY_DETAILS: Record<
  string,
  {
    overview: string;
    requirements: string[];
    deliverables: string[];
    timeline: string;
    compensation: string;
    team: string[];
    applicationProcess: string[];
  }
> = {
  'opp-1': {
    overview:
      'Riverlight Studios is producing a 20-minute documentary on urban waterways. Seeking a composer comfortable with ambient, folk and subtle electronic textures.',
    requirements: [
      '3+ scored projects in portfolio',
      'Ability to deliver stems and final mix',
      'Comfort collaborating with director remotely',
    ],
    deliverables: ['Original score (12–15 min)', 'Stems package', '2 revision rounds'],
    timeline: 'Kickoff Jul 2026 · Delivery Aug 2026',
    compensation: '₹45,000 · 50% on signing, 50% on delivery',
    team: ['Director — Ananya Mehta', 'Producer — Vikram Joshi', 'Sound — TSC Verified'],
    applicationProcess: [
      'Submit portfolio links',
      'Short creative brief response',
      '15-min chemistry call',
    ],
  },
  'opp-2': {
    overview:
      'Monthly rooftop live session series featuring emerging artists. One-night performance with professional backline and recording.',
    requirements: ['Live performance experience', '45-min set ready', 'Based in or willing to travel to Bangalore'],
    deliverables: ['Live performance', '1 promotional clip'],
    timeline: 'Event Jul 12, 2026',
    compensation: '₹18,000 + revenue share on ticketed stream',
    team: ['Curator — The Hive', 'Production — TSC Events'],
    applicationProcess: ['Submit demo reel', 'Set list outline', 'Availability confirmation'],
  },
};

export const MOCK_SUCCESS_STORIES = [
  {
    name: 'Priya N.',
    role: 'Singer-songwriter',
    before: 'Gigging locally with no label connections.',
    discovered: 'Brand sync opportunity via TSC match feed.',
    result: 'Signed 3 sync deals and doubled monthly income in 8 months.',
  },
  {
    name: 'Arjun K.',
    role: 'Filmmaker',
    before: 'Struggling to crew a short film.',
    discovered: 'Collaboration board for DOP + editor.',
    result: 'Completed festival run — 2 selections, 1 award.',
  },
  {
    name: 'Meera S.',
    role: 'Music Producer',
    before: 'Portfolio on Instagram only.',
    discovered: 'Mentorship hub + portfolio review.',
    result: 'Landmark EP release with collective distribution support.',
  },
];

export const MOCK_PROFILE_EXTRAS = {
  creativeTitle: 'Music Producer & Composer',
  availability: 'Available for Collaborations',
  about:
    'Composer and producer working across film, brands and live experiences. Focused on texture-driven scores and artist development within the collective.',
  skills: {
    creative: ['Composition', 'Arrangement', 'Sound Design'],
    technical: ['Ableton', 'Pro Tools', 'Mixing'],
    business: ['Licensing', 'Project Management', 'Client Relations'],
  },
  achievements: ['TSC Pioneer Nominee 2025', 'IFFI Short Film — Best Score'],
  endorsements: [
    { from: 'Ananya M.', text: 'Brought calm leadership to a chaotic post schedule.' },
    { from: 'Vikram J.', text: 'Delivered beyond brief — rare find for documentary work.' },
  ],
  metrics: {
    projectsCompleted: 24,
    collaborations: 18,
    communityContributions: 42,
    eventsAttended: 11,
    mentorshipHours: 8,
  },
};

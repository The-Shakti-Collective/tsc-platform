export const CREATOR_CATEGORIES = [
  { label: 'Musicians', icon: 'music' },
  { label: 'Photographers', icon: 'camera' },
  { label: 'Videographers', icon: 'video' },
  { label: 'Editors', icon: 'scissors' },
  { label: 'Producers', icon: 'sliders' },
  { label: 'Managers', icon: 'briefcase' },
  { label: 'Designers', icon: 'palette' },
  { label: 'Writers', icon: 'pen' },
  { label: 'Dancers', icon: 'sparkles' },
  { label: 'Actors', icon: 'clapperboard' },
] as const;

export const LIVE_ACTIVITY_STATS = [
  { value: '124', label: 'collaborations this week' },
  { value: '38', label: 'gigs posted today' },
  { value: '17', label: 'events this month' },
] as const;

export const MOCK_FEATURED_MEMBERS = [
  {
    name: 'Ananya Mehta',
    username: 'ananyamehta',
    role: 'Director',
    location: 'Mumbai',
    genre: 'Indie Film',
    rating: 4.9,
    verified: true,
  },
  {
    name: 'Dev Kapoor',
    username: 'devkapoor',
    role: 'Music Producer',
    location: 'Delhi',
    genre: 'Hip Hop',
    rating: 4.8,
    verified: true,
  },
  {
    name: 'Sana Iyer',
    username: 'sanaiyer',
    role: 'Photographer',
    location: 'Bangalore',
    genre: 'Commercial',
    rating: 4.7,
    verified: false,
  },
  {
    name: 'Rohan Das',
    username: 'rohandas',
    role: 'Editor',
    location: 'Hyderabad',
    genre: 'Wedding',
    rating: 4.6,
    verified: true,
  },
] as const;

export const MOCK_TRENDING_PROJECTS = [
  {
    id: 'proj-1',
    title: 'Monsoon Music Video',
    team: '6 creators',
    genre: 'Indie',
    progress: 72,
  },
  {
    id: 'proj-2',
    title: 'Brand Sonic Identity',
    team: '4 creators',
    genre: 'Commercial',
    progress: 45,
  },
  {
    id: 'proj-3',
    title: 'Documentary Score',
    team: '3 creators',
    genre: 'Film',
    progress: 88,
  },
] as const;

export const MOCK_COMMUNITY_ACTIVITY = [
  { id: 'act-1', type: 'collaboration', text: 'Dev matched with a vocalist in Delhi', time: '2h ago' },
  { id: 'act-2', type: 'opportunity', text: 'New gig: Rooftop live session in Bangalore', time: '4h ago' },
  { id: 'act-3', type: 'project', text: 'Monsoon Music Video reached 72% completion', time: '6h ago' },
  { id: 'act-4', type: 'event', text: 'Producer Roundtable — 28 RSVPs', time: '1d ago' },
] as const;

export const MOCK_LEADERBOARD = [
  { name: 'Priya N.', username: 'priyan', role: 'Singer', score: 2840 },
  { name: 'Arjun K.', username: 'arjunk', role: 'Filmmaker', score: 2610 },
  { name: 'Meera S.', username: 'meeras', role: 'Producer', score: 2495 },
  { name: 'Vikram J.', username: 'vikramj', role: 'Manager', score: 2310 },
  { name: 'Ananya M.', username: 'ananyamehta', role: 'Director', score: 2180 },
] as const;

export const EXPLORE_FILTERS = [
  'Role',
  'Location',
  'Genre',
  'Skill',
  'Availability',
  'Verified',
  'Top Rated',
  'Trending',
] as const;

export const ONBOARDING_ROLES = [
  'Artist',
  'Photographer',
  'Videographer',
  'Editor',
  'Producer',
  'Manager',
] as const;

export const ONBOARDING_GOALS = [
  'Find gigs',
  'Find collaborators',
  'Learn',
  'Hire talent',
  'Build audience',
] as const;

export const ONBOARDING_GENRES = [
  'Hip Hop',
  'Bollywood',
  'Commercial',
  'Wedding',
  'Indie',
  'Rock',
  'EDM',
] as const;

export const ONBOARDING_SKILL_LEVELS = [
  'Student',
  'Beginner',
  'Intermediate',
  'Professional',
  'Industry',
] as const;

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
  pulse: {
    collaborationMatches: 3,
    newOpportunities: 5,
    eventInvitations: 2,
    projectUpdates: 1,
  },
  recommendedCreators: MOCK_FEATURED_MEMBERS.slice(0, 3),
  trendingProjects: MOCK_TRENDING_PROJECTS,
  communityActivity: MOCK_COMMUNITY_ACTIVITY,
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

export const FEATURED_OPPORTUNITIES = MOCK_OPPORTUNITIES;

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

export const MOCK_BADGES = [
  { id: 'first-collab', label: 'First Collaboration', earned: true, icon: 'handshake' },
  { id: 'ten-projects', label: '10 Projects', earned: true, icon: 'folder' },
  { id: 'hundred-connections', label: '100 Connections', earned: false, icon: 'users' },
  { id: 'verified-artist', label: 'Verified Artist', earned: true, icon: 'badge' },
  { id: 'community-mentor', label: 'Community Mentor', earned: false, icon: 'mentor' },
  { id: 'top-contributor', label: 'Top Contributor', earned: false, icon: 'trophy' },
] as const;

export const MOCK_COLLABORATION_REQUEST = {
  need: 'Music Producer',
  location: 'Delhi',
  budget: '₹20,000',
  timeline: '4 weeks',
  description: 'Indie pop track — need producer for arrangement and mix.',
};

export const MOCK_AI_MATCHES = [
  { name: 'Dev Kapoor', username: 'devkapoor', role: 'Music Producer', match: 96, location: 'Delhi' },
  { name: 'Meera S.', username: 'meeras', role: 'Producer', match: 91, location: 'Delhi · Remote' },
  { name: 'Rohan Das', username: 'rohandas', role: 'Editor / Producer', match: 84, location: 'Hyderabad' },
  { name: 'Priya N.', username: 'priyan', role: 'Singer / Co-producer', match: 79, location: 'Mumbai' },
  { name: 'Arjun K.', username: 'arjunk', role: 'Sound Designer', match: 76, location: 'Remote' },
  { name: 'Sana Iyer', username: 'sanaiyer', role: 'Producer', match: 72, location: 'Bangalore' },
  { name: 'Vikram J.', username: 'vikramj', role: 'Executive Producer', match: 68, location: 'Mumbai' },
] as const;

export const MOCK_COLLABORATIONS = [
  {
    id: 'col-1',
    title: 'Indie Pop Track — Delhi',
    type: 'Project Based',
    roles: ['Producer', 'Vocalist'],
    budget: '₹20,000',
    status: 'Open',
    applicants: 7,
  },
  {
    id: 'col-2',
    title: 'Documentary Sound Design',
    type: 'Skill Exchange',
    roles: ['Sound Designer', 'Composer'],
    budget: 'Rev share',
    status: 'Matching',
    applicants: 4,
  },
  {
    id: 'col-3',
    title: 'Wedding Film Crew',
    type: 'Long Term',
    roles: ['DOP', 'Editor'],
    budget: '₹35,000',
    status: 'Active',
    applicants: 12,
  },
] as const;

export const MOCK_PROJECTS = [
  {
    id: 'proj-1',
    title: 'Monsoon Music Video',
    status: 'In Progress',
    progress: 72,
    team: 6,
    rooms: ['Chat', 'Files', 'Timeline', 'Team', 'Deliverables'],
  },
  {
    id: 'proj-2',
    title: 'Brand Sonic Identity',
    status: 'Kickoff',
    progress: 45,
    team: 4,
    rooms: ['Chat', 'Files', 'Timeline', 'Team', 'Deliverables'],
  },
  {
    id: 'proj-3',
    title: 'Documentary Score',
    status: 'Review',
    progress: 88,
    team: 3,
    rooms: ['Chat', 'Files', 'Timeline', 'Team', 'Deliverables'],
  },
] as const;

export const MOCK_PROJECT_ROOM = {
  id: 'proj-1',
  title: 'Monsoon Music Video',
  description: 'Indie music video shoot across Mumbai monsoon locations.',
  timeline: [
    { label: 'Pre-production', done: true },
    { label: 'Shoot week 1', done: true },
    { label: 'Edit & grade', done: false },
    { label: 'Sound & delivery', done: false },
  ],
  team: [
    { name: 'Ananya Mehta', role: 'Director' },
    { name: 'Dev Kapoor', role: 'Producer' },
    { name: 'Sana Iyer', role: 'DOP' },
    { name: 'Rohan Das', role: 'Editor' },
  ],
  deliverables: ['Rough cut v2', 'Color grade', 'Final master'],
  files: ['shot-list.pdf', 'storyboard-v3.pdf', 'reference-tracks.zip'],
};

export const MOCK_EVENTS = [
  {
    id: 'ev-1',
    title: 'Producer Roundtable',
    type: 'Workshop',
    date: 'Jun 18, 2026',
    location: 'Mumbai · Hybrid',
    spots: 12,
    featured: false,
  },
  {
    id: 'ev-2',
    title: 'TSC Community Call — June',
    type: 'Community Call',
    date: 'Jun 22, 2026',
    location: 'Online',
    spots: 200,
    featured: true,
  },
  {
    id: 'ev-3',
    title: 'Open Auditions — Web Series',
    type: 'Audition',
    date: 'Jun 25, 2026',
    location: 'Bangalore',
    spots: 40,
    featured: false,
  },
  {
    id: 'ev-4',
    title: 'Film Scoring Masterclass',
    type: 'Masterclass',
    date: 'Jul 2, 2026',
    location: 'Delhi',
    spots: 30,
    featured: false,
  },
] as const;

export const MOCK_LEARNING = [
  { id: 'lrn-1', title: 'Pricing your first brand deal', type: 'Playbook', category: 'Business', duration: '12 min' },
  { id: 'lrn-2', title: 'Building a reel that gets callbacks', type: 'Course', category: 'Film', duration: '45 min' },
  { id: 'lrn-3', title: 'Remote crew collaboration checklist', type: 'Checklist', category: 'Business', duration: '5 min' },
  { id: 'lrn-4', title: 'AI tools for music producers', type: 'Toolkit', category: 'AI', duration: '20 min' },
  { id: 'lrn-5', title: 'Personal branding for creators', type: 'Course', category: 'Personal Branding', duration: '30 min' },
] as const;

export const MOCK_CONVERSATIONS = [
  {
    id: 'msg-1',
    name: 'Dev Kapoor',
    preview: 'Sent you the stem pack for review…',
    time: '2m',
    unread: true,
  },
  {
    id: 'msg-2',
    name: 'Ananya Mehta',
    preview: 'Can we lock shoot dates next week?',
    time: '1h',
    unread: true,
  },
  {
    id: 'msg-3',
    name: 'TSC Opportunities',
    preview: 'New 94% match: Indie Film Score',
    time: '3h',
    unread: false,
  },
] as const;

export const MOCK_REPUTATION = {
  score: 1280,
  tier: 'Collaborator',
  rank: 42,
  breakdown: [
    { label: 'Projects completed', points: 480, max: 600 },
    { label: 'Collaborations', points: 320, max: 400 },
    { label: 'Community contributions', points: 280, max: 350 },
    { label: 'Endorsements', points: 200, max: 250 },
  ],
  history: [
    { event: 'Completed Monsoon MV milestone', points: +40, date: 'Jun 10' },
    { event: 'Endorsement from Ananya M.', points: +25, date: 'Jun 8' },
    { event: 'Applied to opportunity', points: +10, date: 'Jun 5' },
  ],
};

export const MOCK_CRM_CONTACTS = [
  { id: 'crm-1', name: 'Riverlight Studios', type: 'Client', stage: 'Active', lastTouch: '2d ago' },
  { id: 'crm-2', name: 'The Hive', type: 'Venue', stage: 'Negotiating', lastTouch: '5d ago' },
  { id: 'crm-3', name: 'Northwind Audio', type: 'Brand', stage: 'Lead', lastTouch: '1w ago' },
] as const;

export const MOCK_CRM_TASKS = [
  { id: 'task-1', label: 'Follow up on documentary brief', due: 'Today' },
  { id: 'task-2', label: 'Send portfolio to Riverlight', due: 'Jun 17' },
  { id: 'task-3', label: 'Prep for Producer Roundtable', due: 'Jun 18' },
] as const;

export const MOCK_AI_AGENTS = [
  {
    id: 'agent-match',
    name: 'Collaboration Matcher',
    description: 'Finds creators by role, budget, location, and genre fit.',
    status: 'Active',
  },
  {
    id: 'agent-brief',
    name: 'Brief Writer',
    description: 'Turns ideas into collaboration briefs and project scopes.',
    status: 'Active',
  },
  {
    id: 'agent-opportunity',
    name: 'Opportunity Scout',
    description: 'Surfaces gigs and grants matched to your Passport.',
    status: 'Beta',
  },
] as const;

export const MOCK_MARKETPLACE = [
  ...MOCK_OPPORTUNITIES,
  {
    id: 'mkt-1',
    title: 'Session Musician — Studio Day',
    organization: 'Echo Lane Studios',
    location: 'Mumbai',
    compensation: '₹8,000/day',
    deadline: 'Rolling',
    matchPercent: 85,
    category: 'Gigs',
  },
] as const;

export const MOCK_PASSPORT = {
  ...MOCK_PROFILE_EXTRAS,
  bannerGradient: 'from-brand-teal-deep via-brand-teal-mid to-brand-green',
  credits: [
    { title: 'Urban Waters', role: 'Composer', year: '2025' },
    { title: 'Rooftop Sessions S2', role: 'Producer', year: '2024' },
    { title: 'Brand Sonic — Northwind', role: 'Sound Design', year: '2024' },
  ],
  projects: MOCK_TRENDING_PROJECTS,
  socialLinks: [
    { label: 'Instagram', url: 'https://instagram.com' },
    { label: 'Spotify', url: 'https://spotify.com' },
    { label: 'YouTube', url: 'https://youtube.com' },
  ],
  calendar: [
    { date: 'Jun 18', event: 'Producer Roundtable' },
    { date: 'Jun 22', event: 'Community Call' },
    { date: 'Jul 12', event: 'Rooftop Session gig' },
  ],
  badges: MOCK_BADGES,
  reputationScore: MOCK_REPUTATION.score,
};

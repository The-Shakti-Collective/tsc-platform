export type CommunityTheme = 'light' | 'dark' | 'midnight' | 'shakti';

export type FeedPriority =
  | 'opportunities'
  | 'learning'
  | 'collaborations'
  | 'creators';

export type HomeWidget =
  | 'events'
  | 'projects'
  | 'collaborations'
  | 'opportunities'
  | 'leaderboard';

export interface CommunityPreferences {
  theme: CommunityTheme;
  feedPriorities: FeedPriority[];
  homeWidgets: HomeWidget[];
}

const STORAGE_KEY = 'tsc-community-preferences';

export const DEFAULT_PREFERENCES: CommunityPreferences = {
  theme: 'light',
  feedPriorities: ['opportunities', 'collaborations', 'learning', 'creators'],
  homeWidgets: ['events', 'projects', 'collaborations', 'opportunities', 'leaderboard'],
};

export function loadPreferences(): CommunityPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: CommunityPreferences): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function applyTheme(theme: CommunityTheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.communityTheme = theme;
}

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  applyTheme,
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  type CommunityPreferences,
  type CommunityTheme,
  type FeedPriority,
  type HomeWidget,
} from '@/lib/community-preferences';
import { cn } from '@/lib/utils';

const THEMES: { id: CommunityTheme; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'midnight', label: 'Midnight' },
  { id: 'shakti', label: 'Shakti' },
];

const FEED_OPTIONS: { id: FeedPriority; label: string }[] = [
  { id: 'opportunities', label: 'More opportunities' },
  { id: 'learning', label: 'More learning' },
  { id: 'collaborations', label: 'More collaborations' },
  { id: 'creators', label: 'More creators' },
];

const WIDGET_OPTIONS: { id: HomeWidget; label: string }[] = [
  { id: 'events', label: 'Events' },
  { id: 'projects', label: 'Projects' },
  { id: 'collaborations', label: 'Collaborations' },
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'leaderboard', label: 'Leaderboard' },
];

export function CommunityPreferencesPanel() {
  const [prefs, setPrefs] = useState<CommunityPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const loaded = loadPreferences();
    setPrefs(loaded);
    applyTheme(loaded.theme);
  }, []);

  const update = (next: CommunityPreferences) => {
    setPrefs(next);
    savePreferences(next);
    applyTheme(next.theme);
  };

  const toggleFeed = (id: FeedPriority) => {
    const exists = prefs.feedPriorities.includes(id);
    const feedPriorities = exists
      ? prefs.feedPriorities.filter((p) => p !== id)
      : [...prefs.feedPriorities, id];
    update({ ...prefs, feedPriorities });
  };

  const toggleWidget = (id: HomeWidget) => {
    const exists = prefs.homeWidgets.includes(id);
    const homeWidgets = exists
      ? prefs.homeWidgets.filter((w) => w !== id)
      : [...prefs.homeWidgets, id];
    update({ ...prefs, homeWidgets });
  };

  return (
    <div className="space-y-6">
      <Card className="border-brand-teal-deep/10">
        <CardHeader>
          <CardTitle className="text-brand-teal-deep">Theme</CardTitle>
          <CardDescription>Customize your Creator OS appearance.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {THEMES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => update({ ...prefs, theme: id })}
              className={cn(
                'cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-200',
                prefs.theme === id
                  ? 'border-brand-green bg-brand-green text-brand-cream-wash'
                  : 'border-brand-teal-deep/15 hover:bg-brand-cream-muted',
              )}
            >
              {label}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="border-brand-teal-deep/10">
        <CardHeader>
          <CardTitle className="text-brand-teal-deep">Feed priorities</CardTitle>
          <CardDescription>What should Activity and dashboard emphasize?</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {FEED_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => toggleFeed(id)}
              className={cn(
                'cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors duration-200',
                prefs.feedPriorities.includes(id)
                  ? 'border-brand-pumpkin bg-brand-pumpkin-soft text-brand-espresso'
                  : 'border-brand-teal-deep/15',
              )}
            >
              {label}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="border-brand-teal-deep/10">
        <CardHeader>
          <CardTitle className="text-brand-teal-deep">Home widgets</CardTitle>
          <CardDescription>Choose which widgets appear on your dashboard rail.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {WIDGET_OPTIONS.map(({ id, label }) => (
            <label
              key={id}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-brand-teal-deep/10 px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={prefs.homeWidgets.includes(id)}
                onChange={() => toggleWidget(id)}
                className="accent-brand-green"
              />
              {label}
            </label>
          ))}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Drag-and-drop widget ordering — next API sprint. Preferences saved locally.
      </p>
    </div>
  );
}

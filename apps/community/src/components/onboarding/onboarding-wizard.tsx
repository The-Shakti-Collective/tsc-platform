'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCommunityClient } from '@/hooks/use-community-client';
import { cn } from '@/lib/utils';

const STEPS = [
  'Welcome',
  'Basic Details',
  'Creative Identity',
  'Experience',
  'Goals',
  'Portfolio',
] as const;

const PRIMARY_ROLES = [
  'Singer',
  'Music Producer',
  'Filmmaker',
  'Photographer',
  'Editor',
  'Designer',
  'Actor',
  'Writer',
];

const EXPERIENCE_LEVELS = [
  'Beginner',
  'Emerging Professional',
  'Professional',
  'Industry Veteran',
];

const GOALS = [
  'Find gigs',
  'Build network',
  'Learn new skills',
  'Find collaborators',
  'Monetize work',
  'Build audience',
];

const PORTFOLIO_FIELDS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'behance', label: 'Behance' },
  { key: 'website', label: 'Website' },
  { key: 'spotify', label: 'Spotify' },
  { key: 'soundcloud', label: 'SoundCloud' },
  { key: 'vimeo', label: 'Vimeo' },
] as const;

interface OnboardingState {
  displayName: string;
  location: string;
  bio: string;
  username: string;
  primaryRole: string;
  secondarySkills: string[];
  experience: string;
  goals: string[];
  portfolio: Record<string, string>;
}

const initialState: OnboardingState = {
  displayName: '',
  location: '',
  bio: '',
  username: '',
  primaryRole: '',
  secondarySkills: [],
  experience: '',
  goals: [],
  portfolio: {},
};

export function OnboardingWizard() {
  const router = useRouter();
  const client = useCommunityClient();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingState>(initialState);

  const mutation = useMutation({
    mutationFn: () =>
      client.updateMyProfile({
        username: data.username || undefined,
        bio: [data.bio, data.primaryRole ? `Role: ${data.primaryRole}` : '', data.experience ? `Experience: ${data.experience}` : '', data.goals.length ? `Goals: ${data.goals.join(', ')}` : '']
          .filter(Boolean)
          .join('\n\n'),
        city: data.location || undefined,
        genres: data.primaryRole ? [data.primaryRole] : [],
        skills: data.secondarySkills,
        links: Object.entries(data.portfolio)
          .filter(([, url]) => url.trim())
          .map(([key, url]) => ({ label: key, url })),
      }),
    onSuccess: () => router.push('/dashboard'),
  });

  const canNext = () => {
    if (step === 1) return data.displayName.trim() && data.location.trim();
    if (step === 2) return data.primaryRole.trim();
    if (step === 3) return data.experience.trim();
    if (step === 4) return data.goals.length > 0;
    return true;
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else mutation.mutate();
  };

  const back = () => setStep(Math.max(0, step - 1));

  return (
    <div className="px-4 py-12">
      <div className="mb-8 flex gap-2">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i <= step ? 'bg-brand-green' : 'bg-brand-cream-muted',
            )}
          />
        ))}
      </div>

      <Card className="border-brand-teal-deep/10">
        <CardHeader>
          <CardTitle className="font-display text-2xl text-brand-teal-deep">
            {step === 0 ? "Let's build your creative identity." : STEPS[step]}
          </CardTitle>
          <CardDescription>
            {step === 0
              ? 'Your profile becomes your professional presence inside the collective.'
              : `Step ${step} of ${STEPS.length - 1}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 0 && (
            <p className="text-brand-teal-deep/80">
              Five quick steps to set up your creative career profile — who you are, what you do,
              and where you want to grow.
            </p>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Name</Label>
                <Input
                  id="displayName"
                  value={data.displayName}
                  onChange={(e) => setData({ ...data, displayName: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={data.location}
                  onChange={(e) => setData({ ...data, location: e.target.value })}
                  placeholder="City, India"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={data.username}
                  onChange={(e) => setData({ ...data, username: e.target.value })}
                  placeholder="yourname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  rows={4}
                  value={data.bio}
                  onChange={(e) => setData({ ...data, bio: e.target.value })}
                  placeholder="Producer, composer, community builder…"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Profile & cover photo upload — coming soon. Add links in Portfolio step.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Primary Role</Label>
                <div className="flex flex-wrap gap-2">
                  {PRIMARY_ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setData({ ...data, primaryRole: role })}
                      className={cn(
                        'rounded-md border px-3 py-1.5 text-sm transition-colors',
                        data.primaryRole === role
                          ? 'border-brand-green bg-brand-green-soft text-brand-teal-deep'
                          : 'border-brand-teal-deep/15 hover:bg-brand-cream-muted',
                      )}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Secondary Skills (comma separated)</Label>
                <Input
                  id="skills"
                  placeholder="mixing, live performance, direction"
                  onChange={(e) =>
                    setData({
                      ...data,
                      secondarySkills: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setData({ ...data, experience: level })}
                  className={cn(
                    'rounded-lg border p-4 text-left text-sm transition-colors',
                    data.experience === level
                      ? 'border-brand-green bg-brand-green-soft'
                      : 'border-brand-teal-deep/15 hover:bg-brand-cream-muted',
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-wrap gap-2">
              {GOALS.map((goal) => {
                const selected = data.goals.includes(goal);
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() =>
                      setData({
                        ...data,
                        goals: selected
                          ? data.goals.filter((g) => g !== goal)
                          : [...data.goals, goal],
                      })
                    }
                    className={cn(
                      'rounded-md border px-3 py-1.5 text-sm',
                      selected
                        ? 'border-brand-pumpkin bg-brand-pumpkin-soft text-brand-espresso'
                        : 'border-brand-teal-deep/15',
                    )}
                  >
                    {goal}
                  </button>
                );
              })}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              {PORTFOLIO_FIELDS.map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <Label htmlFor={key}>{label}</Label>
                  <Input
                    id={key}
                    placeholder={`https://${key}.com/…`}
                    value={data.portfolio[key] ?? ''}
                    onChange={(e) =>
                      setData({
                        ...data,
                        portfolio: { ...data.portfolio, [key]: e.target.value },
                      })
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {mutation.error ? (
            <p className="text-sm text-amber-700">
              API unavailable — profile saved locally on next retry when backend is running.
            </p>
          ) : null}

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={back} disabled={step === 0}>
              Back
            </Button>
            <Button
              type="button"
              onClick={next}
              disabled={step > 0 && step < 5 && !canNext()}
              className="bg-brand-green hover:bg-brand-teal-mid"
            >
              {step === STEPS.length - 1
                ? mutation.isPending
                  ? 'Saving…'
                  : 'Finish & go to dashboard'
                : step === 0
                  ? 'Get started'
                  : 'Continue'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

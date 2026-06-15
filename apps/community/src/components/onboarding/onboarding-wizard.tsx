'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCommunityClient } from '@/hooks/use-community-client';
import {
  ONBOARDING_GENRES,
  ONBOARDING_GOALS,
  ONBOARDING_ROLES,
  ONBOARDING_SKILL_LEVELS,
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const STEPS = ['Who are you?', 'Goals', 'Genres', 'Skill Level'] as const;

interface OnboardingState {
  primaryRole: string;
  goals: string[];
  genres: string[];
  skillLevel: string;
}

const initialState: OnboardingState = {
  primaryRole: '',
  goals: [],
  genres: [],
  skillLevel: '',
};

export function OnboardingWizard() {
  const router = useRouter();
  const client = useCommunityClient();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingState>(initialState);

  const mutation = useMutation({
    mutationFn: () =>
      client.updateMyProfile({
        bio: [
          data.primaryRole ? `Role: ${data.primaryRole}` : '',
          data.skillLevel ? `Level: ${data.skillLevel}` : '',
          data.goals.length ? `Goals: ${data.goals.join(', ')}` : '',
        ]
          .filter(Boolean)
          .join('\n\n'),
        genres: data.genres.length ? data.genres : data.primaryRole ? [data.primaryRole] : [],
        skills: data.goals,
      }),
    onSuccess: () => router.push('/dashboard'),
  });

  const canNext = () => {
    if (step === 0) return data.primaryRole.trim();
    if (step === 1) return data.goals.length > 0;
    if (step === 2) return data.genres.length > 0;
    if (step === 3) return data.skillLevel.trim();
    return true;
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else mutation.mutate();
  };

  const back = () => setStep(Math.max(0, step - 1));

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-brand-green">Creator Passport</p>
        <h1 className="mt-2 font-display text-3xl font-light text-brand-teal-deep">
          Let&apos;s personalize your experience
        </h1>
        <p className="mt-2 text-brand-teal-deep/70">
          Four quick steps so we can surface the right people, spaces, and opportunities.
        </p>
      </div>

      <div className="mb-8 flex gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div
              className={cn(
                'h-1 rounded-full transition-colors duration-200',
                i <= step ? 'bg-brand-green' : 'bg-brand-cream-muted',
              )}
            />
            <p
              className={cn(
                'mt-2 hidden text-xs sm:block',
                i === step ? 'text-brand-teal-deep' : 'text-brand-teal-deep/50',
              )}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      <Card className="border-brand-teal-deep/10">
        <CardHeader>
          <CardTitle className="font-display text-xl text-brand-teal-deep">
            Step {step + 1} — {STEPS[step]}
          </CardTitle>
          <CardDescription>
            {step === 0 && 'Select your primary creative role.'}
            {step === 1 && 'What do you want from the collective?'}
            {step === 2 && 'Which genres or industries do you work in?'}
            {step === 3 && 'Where are you in your creative journey?'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {ONBOARDING_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setData({ ...data, primaryRole: role })}
                  className={cn(
                    'cursor-pointer rounded-lg border p-4 text-left text-sm font-medium transition-colors duration-200',
                    data.primaryRole === role
                      ? 'border-brand-green bg-brand-green-soft text-brand-teal-deep'
                      : 'border-brand-teal-deep/15 hover:bg-brand-cream-muted',
                  )}
                >
                  {role}
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-wrap gap-2">
              {ONBOARDING_GOALS.map((goal) => {
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
                      'cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors duration-200',
                      selected
                        ? 'border-brand-pumpkin bg-brand-pumpkin-soft text-brand-espresso'
                        : 'border-brand-teal-deep/15 hover:bg-brand-cream-muted',
                    )}
                  >
                    {goal}
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-wrap gap-2">
              {ONBOARDING_GENRES.map((genre) => {
                const selected = data.genres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() =>
                      setData({
                        ...data,
                        genres: selected
                          ? data.genres.filter((g) => g !== genre)
                          : [...data.genres, genre],
                      })
                    }
                    className={cn(
                      'cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors duration-200',
                      selected
                        ? 'border-brand-green bg-brand-green-soft text-brand-teal-deep'
                        : 'border-brand-teal-deep/15 hover:bg-brand-cream-muted',
                    )}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-2">
              {ONBOARDING_SKILL_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setData({ ...data, skillLevel: level })}
                  className={cn(
                    'cursor-pointer rounded-lg border p-4 text-left text-sm transition-colors duration-200',
                    data.skillLevel === level
                      ? 'border-brand-green bg-brand-green-soft'
                      : 'border-brand-teal-deep/15 hover:bg-brand-cream-muted',
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          )}

          {mutation.error ? (
            <p className="text-sm text-amber-700">
              API unavailable — you can continue to the dashboard and complete your Passport later.
            </p>
          ) : null}

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={back}
              disabled={step === 0}
              className="cursor-pointer"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={next}
              disabled={!canNext() || mutation.isPending}
              className="cursor-pointer bg-brand-green hover:bg-brand-teal-mid"
            >
              {step === STEPS.length - 1
                ? mutation.isPending
                  ? 'Building your dashboard…'
                  : 'Go to dashboard'
                : 'Continue'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

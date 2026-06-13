'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProfileEditSchema } from '@tsc/contracts/profile';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCommunityClient } from '@/hooks/use-community-client';

type OnboardingForm = z.infer<typeof ProfileEditSchema> & {
  displayName?: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const client = useCommunityClient();
  const form = useForm<OnboardingForm>({
    resolver: zodResolver(ProfileEditSchema),
    defaultValues: {
      bio: '',
      city: '',
      genres: [],
      skills: [],
      links: [],
      username: '',
    },
  });

  const profileQuery = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => client.getMyProfile(),
  });

  const mutation = useMutation({
    mutationFn: (values: OnboardingForm) => client.updateMyProfile(values),
    onSuccess: () => router.push('/profile'),
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Set up your profile</CardTitle>
          <CardDescription>
            Choose a username and tell the community who you are. You can edit this anytime.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" placeholder="yourname" {...form.register('username')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="Mumbai" {...form.register('city')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" rows={4} placeholder="Producer, DJ, community builder…" {...form.register('bio')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genres">Genres (comma separated)</Label>
              <Input
                id="genres"
                placeholder="electronic, hip-hop"
                defaultValue=""
                onChange={(event) =>
                  form.setValue(
                    'genres',
                    event.target.value
                      .split(',')
                      .map((v) => v.trim())
                      .filter(Boolean),
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skills">Skills (comma separated)</Label>
              <Input
                id="skills"
                placeholder="production, live performance"
                defaultValue=""
                onChange={(event) =>
                  form.setValue(
                    'skills',
                    event.target.value
                      .split(',')
                      .map((v) => v.trim())
                      .filter(Boolean),
                  )
                }
              />
            </div>
            {profileQuery.error ? (
              <p className="text-sm text-amber-600">
                API unavailable — form will retry when the backend is running.
              </p>
            ) : null}
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Continue to profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

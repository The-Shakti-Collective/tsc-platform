'use client';

import Link from 'next/link';
import {
  Award,
  BadgeCheck,
  Calendar,
  ExternalLink,
  MapPin,
  Sparkles,
  Star,
} from 'lucide-react';
import type { PersonProfileRecord } from '@tsc/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BadgesPanel } from '@/components/gamification/badges-panel';
import { MOCK_PASSPORT } from '@/lib/mock-data';
import { shouldUseMockData } from '@/lib/use-mock-data';

interface CreatorPassportProps {
  data: PersonProfileRecord;
}

export function CreatorPassport({ data }: CreatorPassportProps) {
  const useMock = shouldUseMockData();
  const passport = useMock ? MOCK_PASSPORT : null;
  const displayName = data.displayName ?? 'Member';

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section className="overflow-hidden rounded-xl border border-brand-teal-deep/10">
        <div
          className={`h-36 bg-gradient-to-r ${passport?.bannerGradient ?? 'from-brand-teal-deep via-brand-teal-mid to-brand-green'}`}
        />
        <div className="relative px-6 pb-6">
          <div className="-mt-14 flex h-28 w-28 items-center justify-center rounded-2xl border-4 border-brand-cream-wash bg-brand-green-soft text-3xl font-semibold text-brand-teal-deep shadow-md">
            {displayName.charAt(0)}
          </div>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-brand-green">Creator Passport</p>
              <h1 className="font-display text-3xl text-brand-teal-deep">{displayName}</h1>
              {data.username ? <p className="text-muted-foreground">@{data.username}</p> : null}
              {passport?.creativeTitle ? (
                <p className="mt-1 font-medium text-brand-green">{passport.creativeTitle}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {passport?.availability ? (
                <Badge className="bg-brand-green-soft text-brand-teal-deep">
                  <BadgeCheck className="mr-1 h-3 w-3" />
                  {passport.availability}
                </Badge>
              ) : null}
              <Badge variant="outline" className="gap-1 border-brand-pumpkin/30 text-brand-espresso">
                <Star className="h-3 w-3 fill-brand-amber text-brand-amber" />
                Rep {(passport?.reputationScore ?? data.reputationScore ?? 0).toLocaleString()}
              </Badge>
            </div>
          </div>
          {data.city ? (
            <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {data.city}
            </p>
          ) : null}
        </div>
      </section>

      {passport ? <BadgesPanel badges={[...passport.badges]} /> : null}

      <section>
        <h2 className="mb-3 font-display text-xl text-brand-teal-deep">About</h2>
        <p className="text-brand-teal-deep/80">
          {data.bio ?? passport?.about ?? 'Complete onboarding to tell the community about your work.'}
        </p>
      </section>

      {passport ? (
        <>
          <section>
            <h2 className="mb-4 font-display text-xl text-brand-teal-deep">Skills</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {(
                [
                  ['Creative', passport.skills.creative],
                  ['Technical', passport.skills.technical],
                  ['Business', passport.skills.business],
                ] as const
              ).map(([title, items]) => (
                <Card key={title} className="border-brand-teal-deep/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-brand-teal-deep">{title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {items.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl text-brand-teal-deep">Credits</h2>
            <div className="space-y-2">
              {passport.credits.map((credit) => (
                <div
                  key={credit.title}
                  className="flex items-center justify-between rounded-lg border border-brand-teal-deep/10 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-brand-teal-deep">{credit.title}</p>
                    <p className="text-brand-teal-deep/60">{credit.role}</p>
                  </div>
                  <span className="text-brand-teal-deep/50">{credit.year}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl text-brand-teal-deep">Projects</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {passport.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="cursor-pointer rounded-lg border border-brand-teal-deep/10 p-4 transition-colors duration-200 hover:border-brand-green/30 hover:bg-brand-green-soft/20"
                >
                  <p className="font-medium text-brand-teal-deep">{project.title}</p>
                  <p className="text-xs text-brand-teal-deep/60">{project.progress}% complete</p>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl text-brand-teal-deep">Portfolio & Social</h2>
            <div className="flex flex-wrap gap-2">
              {passport.socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-brand-teal-deep/10 px-4 py-2 text-sm text-brand-green transition-colors duration-200 hover:bg-brand-green-soft/50"
                >
                  {link.label}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 font-display text-xl text-brand-teal-deep">
              <Calendar className="h-5 w-5 text-brand-green" />
              Calendar
            </h2>
            <Card className="border-brand-teal-deep/10">
              <CardContent className="divide-y pt-2">
                {passport.calendar.map((item) => (
                  <div key={item.event} className="flex justify-between py-3 text-sm">
                    <span className="text-brand-teal-deep">{item.event}</span>
                    <span className="text-brand-pumpkin">{item.date}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 font-display text-xl text-brand-teal-deep">
              <Award className="h-5 w-5 text-brand-pumpkin" />
              Achievements
            </h2>
            <ul className="space-y-2 text-sm text-brand-teal-deep/80">
              {passport.achievements.map((a) => (
                <li key={a} className="flex gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber" />
                  {a}
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}

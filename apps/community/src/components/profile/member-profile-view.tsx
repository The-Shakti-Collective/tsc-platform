'use client';

import type { PersonProfileRecord } from '@tsc/types';
import { BadgeCheck, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_PROFILE_EXTRAS } from '@/lib/mock-data';
import { shouldUseMockData } from '@/lib/use-mock-data';

interface MemberProfileViewProps {
  data: PersonProfileRecord;
}

export function MemberProfileView({ data }: MemberProfileViewProps) {
  const useMock = shouldUseMockData();
  const extras = useMock ? MOCK_PROFILE_EXTRAS : null;
  const displayName = data.displayName ?? 'Member';

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      {/* Profile Header */}
      <section className="overflow-hidden rounded-xl border border-brand-teal-deep/10">
        <div className="h-32 bg-gradient-to-r from-brand-teal-deep via-brand-teal-mid to-brand-green" />
        <div className="relative px-6 pb-6">
          <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-full border-4 border-brand-cream-wash bg-brand-green-soft text-2xl font-semibold text-brand-teal-deep">
            {displayName.charAt(0)}
          </div>
          <h1 className="mt-4 font-display text-3xl text-brand-teal-deep">{displayName}</h1>
          {data.username ? (
            <p className="text-muted-foreground">@{data.username}</p>
          ) : null}
          {extras?.creativeTitle ? (
            <p className="mt-1 text-brand-green">{extras.creativeTitle}</p>
          ) : null}
          {data.city ? (
            <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {data.city}
            </p>
          ) : null}
          {extras?.availability ? (
            <Badge className="mt-3 bg-brand-green-soft text-brand-teal-deep">
              <BadgeCheck className="mr-1 h-3 w-3" />
              {extras.availability}
            </Badge>
          ) : null}
        </div>
      </section>

      {/* About */}
      <section>
        <h2 className="mb-3 font-display text-xl text-brand-teal-deep">About</h2>
        <p className="text-brand-teal-deep/80">
          {data.bio ?? extras?.about ?? 'Add a bio in settings to tell the community about your work.'}
        </p>
      </section>

      {(extras || (data.skills?.length ?? 0) > 0) && (
        <section>
          <h2 className="mb-4 font-display text-xl text-brand-teal-deep">Skills</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {(
              extras
                ? ([
                    ['Creative Skills', extras.skills.creative],
                    ['Technical Skills', extras.skills.technical],
                    ['Business Skills', extras.skills.business],
                  ] as const)
                : ([['Skills', data.skills ?? []]] as const)
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
      )}

      {/* Portfolio placeholder */}
      <section>
        <h2 className="mb-3 font-display text-xl text-brand-teal-deep">Portfolio</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(data.links ?? []).length > 0 ? (
            data.links!.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-brand-teal-deep/10 p-4 text-sm text-brand-green hover:bg-brand-green-soft/50"
              >
                {link.label}
              </a>
            ))
          ) : (
            <p className="text-sm text-muted-foreground col-span-2">
              Images · Videos · Audio · Documents — wire to media API in next sprint.
            </p>
          )}
        </div>
      </section>

      {extras ? (
        <div className="grid gap-6 md:grid-cols-2">
          <section>
            <h2 className="mb-3 font-display text-xl text-brand-teal-deep">Achievements</h2>
            <ul className="space-y-2 text-sm text-brand-teal-deep/80">
              {extras.achievements.map((a) => (
                <li key={a} className="flex gap-2">
                  <span className="text-brand-pumpkin">✦</span>
                  {a}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="mb-3 font-display text-xl text-brand-teal-deep">Endorsements</h2>
            {extras.endorsements.map((e) => (
              <blockquote
                key={e.from}
                className="mb-3 border-l-2 border-brand-green pl-3 text-sm text-brand-teal-deep/80"
              >
                &ldquo;{e.text}&rdquo; — {e.from}
              </blockquote>
            ))}
          </section>
        </div>
      ) : null}

      {extras ? (
        <section>
          <h2 className="mb-4 font-display text-xl text-brand-teal-deep">Reputation Metrics</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {Object.entries(extras.metrics).map(([key, value]) => (
              <Card key={key} className="border-brand-teal-deep/10 text-center">
                <CardContent className="pt-6">
                  <p className="text-2xl font-semibold text-brand-teal-deep">{value}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : data.reputationScore != null ? (
        <section>
          <h2 className="mb-4 font-display text-xl text-brand-teal-deep">Reputation</h2>
          <Card className="border-brand-teal-deep/10 text-center">
            <CardContent className="pt-6">
              <p className="text-2xl font-semibold text-brand-teal-deep">
                {data.reputationScore.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Reputation score</p>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}

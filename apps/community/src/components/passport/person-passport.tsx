'use client';

import { motion } from 'framer-motion';
import { BadgeCheck, ExternalLink, MapPin, Sparkles } from 'lucide-react';
import type { EcosystemPassportPayload, PersonProfileRecord } from '@tsc/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type PassportData =
  | PersonProfileRecord
  | EcosystemPassportPayload['identity']
  | (PersonProfileRecord & { photoUrl?: string | null });

interface PersonPassportProps {
  data: PassportData;
  reputation?: {
    reputationScore?: number | null;
    ecosystemScore?: number | null;
  };
  className?: string;
}

function verificationLabel(level: number) {
  if (level >= 4) return 'Admin verified';
  if (level >= 3) return 'Community leader';
  if (level >= 2) return 'Social linked';
  if (level >= 1) return 'Contact verified';
  return 'Unverified';
}

export function PersonPassport({ data, reputation, className }: PersonPassportProps) {
  const displayName = (data as PersonProfileRecord).displayName;

  const username = data.username ?? null;
  const bio = data.bio ?? null;
  const city = data.city ?? null;
  const genres = data.genres ?? [];
  const skills = data.skills ?? [];
  const links = data.links ?? [];
  const verificationLevel = data.verificationLevel ?? 0;
  const reputationScore =
    reputation?.reputationScore ??
    ('reputationScore' in data ? data.reputationScore : null);
  const ecosystemScore =
    reputation?.ecosystemScore ??
    ('ecosystemScore' in data ? data.ecosystemScore : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn('mx-auto w-full max-w-xl', className)}
    >
      <Card className="overflow-hidden border-brand-teal-deep/20 bg-gradient-to-br from-brand-cream-wash via-background to-brand-green-soft/30">
        <div className="h-2 bg-gradient-to-r from-brand-teal-deep via-brand-green to-brand-pumpkin" />
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                TSC Passport
              </p>
              <CardTitle className="text-3xl">{displayName}</CardTitle>
              {username ? <p className="text-muted-foreground">@{username}</p> : null}
            </div>
            <Badge variant={verificationLevel >= 1 ? 'verified' : 'outline'} className="gap-1">
              {verificationLevel >= 1 ? <BadgeCheck className="h-3 w-3" /> : null}
              {verificationLabel(verificationLevel)}
            </Badge>
          </div>
          {bio ? <p className="text-sm leading-relaxed text-muted-foreground">{bio}</p> : null}
          {city ? (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {city}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-5">
          {genres.length > 0 ? (
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Genres
              </h4>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <Badge key={genre} variant="secondary">
                    {genre}
                  </Badge>
                ))}
              </div>
            </section>
          ) : null}

          {skills.length > 0 ? (
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </section>
          ) : null}

          {links.length > 0 ? (
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Links
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      {link.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="grid grid-cols-2 gap-3 rounded-lg border bg-background/60 p-4">
            <div>
              <p className="text-xs text-muted-foreground">Reputation</p>
              <p className="text-2xl font-semibold">
                {reputationScore != null ? Math.round(reputationScore) : '—'}
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                Ecosystem
              </p>
              <p className="text-2xl font-semibold">
                {ecosystemScore != null ? Math.round(ecosystemScore) : '—'}
              </p>
            </div>
          </section>
        </CardContent>
      </Card>
    </motion.div>
  );
}

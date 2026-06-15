import Link from 'next/link';
import { TrendingUp, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BadgesPanel } from '@/components/gamification/badges-panel';
import { MOCK_BADGES, MOCK_LEADERBOARD, MOCK_REPUTATION } from '@/lib/mock-data';

export function ReputationDashboard() {
  const rep = MOCK_REPUTATION;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-green">Reputation</p>
        <h1 className="mt-2 font-display text-3xl font-light text-brand-teal-deep">
          Status, not points for points&apos; sake
        </h1>
      </div>

      <Card className="border-brand-teal-deep/10 bg-gradient-to-r from-brand-cream-wash to-brand-green-soft/40">
        <CardContent className="flex flex-wrap items-center justify-between gap-6 pt-8">
          <div>
            <p className="text-sm text-brand-teal-deep/60">Reputation score</p>
            <p className="font-display text-5xl font-light text-brand-teal-deep">
              {rep.score.toLocaleString()}
            </p>
            <Badge className="mt-2 bg-brand-green text-brand-cream-wash">{rep.tier}</Badge>
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-1 text-sm text-brand-teal-deep/60">
              <Trophy className="h-4 w-4 text-brand-pumpkin" />
              Community rank
            </p>
            <p className="text-3xl font-semibold text-brand-teal-deep">#{rep.rank}</p>
          </div>
        </CardContent>
      </Card>

      <BadgesPanel badges={[...MOCK_BADGES]} />

      <section>
        <h2 className="mb-4 font-display text-xl text-brand-teal-deep">Score breakdown</h2>
        <div className="space-y-4">
          {rep.breakdown.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-brand-teal-deep">{item.label}</span>
                <span className="text-brand-teal-deep/60">
                  {item.points}/{item.max}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-brand-cream-muted">
                <div
                  className="h-full rounded-full bg-brand-green"
                  style={{ width: `${(item.points / item.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl text-brand-teal-deep">
          <TrendingUp className="h-5 w-5 text-brand-green" />
          Recent activity
        </h2>
        <Card className="border-brand-teal-deep/10">
          <CardContent className="divide-y pt-2">
            {rep.history.map((item) => (
              <div key={item.event} className="flex items-center justify-between py-3 text-sm">
                <span className="text-brand-teal-deep/85">{item.event}</span>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-brand-green">+{item.points}</span>
                  <span className="text-brand-teal-deep/50">{item.date}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card className="border-brand-teal-deep/10">
        <CardHeader>
          <CardTitle className="text-brand-teal-deep">Leaderboard preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {MOCK_LEADERBOARD.slice(0, 5).map((member, i) => (
            <div key={member.username} className="flex justify-between text-sm">
              <span>
                {i + 1}. {member.name} · {member.role}
              </span>
              <span className="text-brand-teal-deep/60">{member.score.toLocaleString()}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button asChild className="cursor-pointer bg-brand-green hover:bg-brand-teal-mid">
        <Link href="/profile">View full Passport</Link>
      </Button>
    </div>
  );
}

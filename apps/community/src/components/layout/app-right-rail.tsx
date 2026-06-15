import Link from 'next/link';
import { ArrowRight, Calendar, MapPin, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MOCK_DASHBOARD,
  MOCK_FEATURED_MEMBERS,
  MOCK_LEADERBOARD,
  MOCK_OPPORTUNITIES,
} from '@/lib/mock-data';

export function AppRightRail() {
  const events = MOCK_DASHBOARD.events.slice(0, 3);
  const opportunities = MOCK_OPPORTUNITIES.slice(0, 3);

  return (
    <aside className="hidden w-72 shrink-0 space-y-4 xl:block">
      <Card className="border-brand-teal-deep/10 bg-brand-cream-wash/80">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-brand-teal-deep">
            <Calendar className="h-4 w-4 text-brand-green" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {events.map((ev) => (
            <div key={ev.id} className="text-sm">
              <p className="font-medium text-brand-teal-deep">{ev.title}</p>
              <p className="text-xs text-brand-teal-deep/60">
                {ev.type} · {ev.date}
              </p>
            </div>
          ))}
          <Button asChild variant="ghost" size="sm" className="h-8 px-0 text-brand-green">
            <Link href="/events">
              View all
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-brand-teal-deep/10 bg-brand-cream-wash/80">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-brand-teal-deep">
            <Trophy className="h-4 w-4 text-brand-pumpkin" />
            Top Contributors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {MOCK_LEADERBOARD.slice(0, 3).map((member, index) => (
            <div key={member.username} className="flex items-center gap-2 text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-green-soft text-xs font-semibold text-brand-teal-deep">
                {index + 1}
              </span>
              <div>
                <p className="font-medium text-brand-teal-deep">{member.name}</p>
                <p className="text-xs text-brand-teal-deep/60">{member.role}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-brand-teal-deep/10 bg-brand-cream-wash/80">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-brand-teal-deep">
            <MapPin className="h-4 w-4 text-brand-teal-mid" />
            Creators Near You
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {MOCK_FEATURED_MEMBERS.slice(0, 2).map((member) => (
            <Link
              key={member.username}
              href={`/u/${member.username}`}
              className="block cursor-pointer rounded-md p-2 transition-colors duration-200 hover:bg-brand-green-soft/50"
            >
              <p className="text-sm font-medium text-brand-teal-deep">{member.name}</p>
              <p className="text-xs text-brand-teal-deep/60">
                {member.role} · {member.location}
              </p>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="border-brand-teal-deep/10 bg-brand-cream-wash/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-brand-teal-deep">Open Opportunities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {opportunities.map((opp) => (
            <Link
              key={opp.id}
              href={`/opportunities/${opp.id}`}
              className="block cursor-pointer text-sm transition-colors duration-200 hover:text-brand-green"
            >
              <p className="font-medium text-brand-teal-deep">{opp.title}</p>
              <p className="text-xs text-brand-teal-deep/60">{opp.compensation}</p>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="border-brand-teal-deep/10 bg-gradient-to-br from-brand-teal-deep to-brand-teal-mid text-brand-cream-wash">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {MOCK_LEADERBOARD.slice(0, 5).map((member, index) => (
            <div key={member.username} className="flex items-center justify-between text-sm">
              <span>
                {index + 1}. {member.name}
              </span>
              <span className="text-brand-cream/80">{member.score.toLocaleString()}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}

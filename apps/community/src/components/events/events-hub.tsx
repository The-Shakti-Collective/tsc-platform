'use client';

import { Calendar, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MOCK_EVENTS } from '@/lib/mock-data';

export function EventsHub() {
  const featured = MOCK_EVENTS.find((e) => e.featured);
  const upcoming = MOCK_EVENTS.filter((e) => !e.featured);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-green">Events</p>
        <h1 className="mt-2 font-display text-3xl font-light text-brand-teal-deep">
          Workshops, showcases & community calls
        </h1>
      </div>

      {featured ? (
        <Card className="overflow-hidden border-brand-teal-deep/10 bg-gradient-to-br from-brand-teal-deep to-brand-teal-mid text-brand-cream-wash">
          <CardHeader>
            <Badge className="w-fit bg-brand-pumpkin text-white">Featured</Badge>
            <CardTitle className="text-2xl">{featured.title}</CardTitle>
            <CardDescription className="text-brand-cream/75">
              {featured.type} · {featured.date}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-4 text-sm text-brand-cream/80">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {featured.location}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {featured.spots} spots
              </span>
            </div>
            <Button className="cursor-pointer bg-brand-pumpkin hover:bg-brand-amber">RSVP</Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {upcoming.map((event) => (
          <Card key={event.id} className="border-brand-teal-deep/10">
            <CardHeader className="pb-2">
              <Badge variant="outline" className="w-fit">
                {event.type}
              </Badge>
              <CardTitle className="text-lg text-brand-teal-deep">{event.title}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {event.date}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-sm text-brand-teal-deep/60">{event.location}</span>
              <Button size="sm" variant="outline" className="cursor-pointer">
                Register
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

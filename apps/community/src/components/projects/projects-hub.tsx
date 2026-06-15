'use client';

import Link from 'next/link';
import { FolderKanban, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MOCK_PROJECTS } from '@/lib/mock-data';

export function ProjectsHub() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-brand-green">Projects</p>
          <h1 className="mt-2 font-display text-3xl font-light text-brand-teal-deep">
            Project rooms
          </h1>
          <p className="mt-2 text-brand-teal-deep/70">
            One room per project — chat, files, timeline, team, deliverables.
          </p>
        </div>
        <Button className="cursor-pointer bg-brand-green hover:bg-brand-teal-mid">
          <Plus className="mr-2 h-4 w-4" />
          New project
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_PROJECTS.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`} className="cursor-pointer">
            <Card className="h-full border-brand-teal-deep/10 transition-all duration-200 hover:border-brand-green/30 hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <FolderKanban className="h-6 w-6 text-brand-green" />
                  <Badge variant="outline">{project.status}</Badge>
                </div>
                <CardTitle className="text-brand-teal-deep">{project.title}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {project.team} members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-brand-teal-deep/60">Progress</span>
                  <span className="font-medium text-brand-green">{project.progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-brand-cream-muted">
                  <div
                    className="h-full rounded-full bg-brand-green"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-1">
                  {project.rooms.map((room) => (
                    <Badge key={room} variant="secondary" className="text-xs">
                      {room}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CheckCircle2,
  Circle,
  FileText,
  MessageSquare,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MOCK_PROJECT_ROOM } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const ROOM_TABS = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'files', label: 'Files', icon: FileText },
  { id: 'timeline', label: 'Timeline', icon: Circle },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'deliverables', label: 'Deliverables', icon: CheckCircle2 },
] as const;

export function ProjectRoom() {
  const pathname = usePathname();
  const activeTab = pathname?.includes('files')
    ? 'files'
    : pathname?.includes('team')
      ? 'team'
      : 'chat';
  const project = MOCK_PROJECT_ROOM;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-green">Project Room</p>
        <h1 className="mt-2 font-display text-3xl font-light text-brand-teal-deep">
          {project.title}
        </h1>
        <p className="mt-2 text-brand-teal-deep/70">{project.description}</p>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-b border-brand-teal-deep/10">
        {ROOM_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={cn(
              'flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors duration-200',
              activeTab === id
                ? 'border-brand-green text-brand-teal-deep'
                : 'border-transparent text-brand-teal-deep/60 hover:text-brand-teal-deep',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-brand-teal-deep/10 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-brand-teal-deep">Team chat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg bg-brand-green-soft/40 p-3">
              <p className="font-medium text-brand-teal-deep">Ananya Mehta</p>
              <p className="text-brand-teal-deep/80">Rough cut uploaded — please review by Friday.</p>
            </div>
            <div className="rounded-lg border border-brand-teal-deep/10 p-3">
              <p className="font-medium text-brand-teal-deep">Dev Kapoor</p>
              <p className="text-brand-teal-deep/80">On it. Will add temp score over the weekend.</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-brand-teal-deep/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-brand-teal-deep">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {project.timeline.map((step) => (
                <div key={step.label} className="flex items-center gap-2 text-sm">
                  {step.done ? (
                    <CheckCircle2 className="h-4 w-4 text-brand-green" />
                  ) : (
                    <Circle className="h-4 w-4 text-brand-teal-deep/30" />
                  )}
                  <span className={step.done ? 'text-brand-teal-deep' : 'text-brand-teal-deep/60'}>
                    {step.label}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-brand-teal-deep/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-brand-teal-deep">Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {project.team.map((member) => (
                <div key={member.name} className="flex justify-between text-sm">
                  <span className="text-brand-teal-deep">{member.name}</span>
                  <Badge variant="outline">{member.role}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-brand-teal-deep/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-brand-teal-deep">Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {project.files.map((file) => (
              <Link
                key={file}
                href="#"
                className="block cursor-pointer rounded-md px-2 py-1.5 text-sm text-brand-green hover:bg-brand-green-soft/40"
              >
                {file}
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card className="border-brand-teal-deep/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-brand-teal-deep">Deliverables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {project.deliverables.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-brand-teal-deep/80">
                <CheckCircle2 className="h-4 w-4 text-brand-pumpkin" />
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

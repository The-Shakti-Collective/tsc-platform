'use client';

import Link from 'next/link';
import { Briefcase, CheckSquare, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MOCK_CRM_CONTACTS, MOCK_CRM_TASKS } from '@/lib/mock-data';

export function CreatorCrm() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-green">Creator CRM</p>
        <h1 className="mt-2 font-display text-3xl font-light text-brand-teal-deep">
          Manage relationships & pipeline
        </h1>
        <p className="mt-2 text-brand-teal-deep/70">
          Clients, venues, brands — tasks and follow-ups in one place.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-brand-teal-deep/10 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-brand-teal-deep">
              <Users className="h-5 w-5 text-brand-green" />
              Contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {MOCK_CRM_CONTACTS.map((contact) => (
              <div key={contact.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-brand-teal-deep">{contact.name}</p>
                  <p className="text-sm text-brand-teal-deep/60">{contact.type}</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Badge variant="outline">{contact.stage}</Badge>
                  <span className="text-brand-teal-deep/50">{contact.lastTouch}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-brand-teal-deep/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-brand-teal-deep">
              <CheckSquare className="h-5 w-5 text-brand-pumpkin" />
              Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_CRM_TASKS.map((task) => (
              <div
                key={task.id}
                className="rounded-lg border border-brand-teal-deep/10 px-3 py-2 text-sm"
              >
                <p className="text-brand-teal-deep">{task.label}</p>
                <p className="text-xs text-brand-pumpkin">Due {task.due}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-brand-teal-deep/10">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div className="flex items-center gap-2 text-sm text-brand-teal-deep">
            <Briefcase className="h-4 w-4 text-brand-green" />
            Link opportunities to contacts when Platform API is live
          </div>
          <Button asChild variant="outline" className="cursor-pointer">
            <Link href="/opportunities">View opportunities</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

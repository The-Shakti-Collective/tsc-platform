'use client';

import { useState } from 'react';
import { Search, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MOCK_CONVERSATIONS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export function MessagesInbox() {
  const [activeId, setActiveId] = useState<string>(MOCK_CONVERSATIONS[0]?.id ?? '');
  const active = MOCK_CONVERSATIONS.find((c) => c.id === activeId);

  return (
    <div className="mx-auto flex h-[calc(100vh-12rem)] max-w-5xl flex-col gap-4 lg:flex-row">
      <Card className="flex w-full flex-col border-brand-teal-deep/10 lg:w-80">
        <div className="border-b border-brand-teal-deep/10 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-teal-deep/40" />
            <Input placeholder="Search messages…" className="pl-9" />
          </div>
        </div>
        <CardContent className="flex-1 divide-y overflow-y-auto p-0">
          {MOCK_CONVERSATIONS.map((convo) => (
            <button
              key={convo.id}
              type="button"
              onClick={() => setActiveId(convo.id)}
              className={cn(
                'flex w-full cursor-pointer gap-3 px-4 py-3 text-left transition-colors duration-200 hover:bg-brand-green-soft/30',
                activeId === convo.id && 'bg-brand-green-soft/50',
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-teal-deep text-sm font-semibold text-brand-cream-wash">
                {convo.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn('truncate font-medium', convo.unread && 'text-brand-teal-deep')}>
                    {convo.name}
                  </p>
                  <span className="shrink-0 text-xs text-brand-teal-deep/50">{convo.time}</span>
                </div>
                <p className="truncate text-sm text-brand-teal-deep/60">{convo.preview}</p>
              </div>
              {convo.unread ? (
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-pumpkin" />
              ) : null}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="flex min-h-80 flex-1 flex-col border-brand-teal-deep/10">
        {active ? (
          <>
            <div className="border-b border-brand-teal-deep/10 px-4 py-3">
              <p className="font-medium text-brand-teal-deep">{active.name}</p>
            </div>
            <CardContent className="flex flex-1 flex-col justify-end gap-4 p-4">
              <div className="rounded-lg bg-brand-green-soft/40 p-3 text-sm text-brand-teal-deep/85">
                {active.preview}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Write a message…" className="flex-1" />
                <Button size="sm" className="cursor-pointer bg-brand-green px-3 hover:bg-brand-teal-mid">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex flex-1 items-center justify-center text-brand-teal-deep/50">
            Select a conversation
          </CardContent>
        )}
      </Card>
    </div>
  );
}

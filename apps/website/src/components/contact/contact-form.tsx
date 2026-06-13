'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, Textarea } from '@/components/ui/label';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export function ContactForm() {
  const [state, setState] = useState<FormState>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('submitting');
    setMessage('');

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      interest: String(formData.get('interest') ?? ''),
      message: String(formData.get('message') ?? ''),
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; detail?: string };

      if (!response.ok || !data.ok) {
        setState('error');
        setMessage(data.error ?? data.detail ?? 'Something went wrong. Please try again.');
        return;
      }

      setState('success');
      setMessage('Thanks — we received your message and will be in touch.');
      event.currentTarget.reset();
    } catch {
      setState('error');
      setMessage('Network error. Check your connection and try again.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required autoComplete="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="interest">I&apos;m interested in</Label>
        <Input id="interest" name="interest" placeholder="Artist path, community leadership, partnerships…" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" required placeholder="Tell us about your scene or project." />
      </div>
      <Button type="submit" disabled={state === 'submitting'}>
        {state === 'submitting' ? 'Sending…' : 'Send message'}
      </Button>
      {message ? (
        <p className={`text-sm ${state === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>{message}</p>
      ) : null}
    </form>
  );
}

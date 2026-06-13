import React from 'react';
import { CalendarCheck, QrCode } from 'lucide-react';
import {
  useEventCheckIn,
  useEventParticipation,
  useEventRegister,
} from '../../hooks/queries/event';

export function EventRegisterButton({ eventId, className = '' }) {
  const participation = useEventParticipation(eventId);
  const register = useEventRegister(eventId);
  const checkIn = useEventCheckIn(eventId);

  const status = participation.data?.status;
  const pending = register.isPending || checkIn.isPending || participation.isLoading;

  if (status === 'checked_in') {
    return (
      <span
        className={
          className ||
          'inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
        }
      >
        <QrCode size={15} />
        Checked in
      </span>
    );
  }

  if (status === 'registered') {
    return (
      <button
        type="button"
        onClick={() => !pending && checkIn.mutate({ qrToken: 'stub-qr' })}
        disabled={pending}
        className={
          className ||
          'inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-[var(--color-bg-border)] hover:bg-[var(--token-surface-2)] disabled:opacity-60'
        }
      >
        <QrCode size={15} />
        {pending ? 'Checking in…' : 'Check in (QR stub)'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => !pending && register.mutate({ role: 'Attendee' })}
      disabled={pending}
      className={
        className ||
        'inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)] disabled:opacity-60'
      }
    >
      <CalendarCheck size={15} />
      {pending ? 'Registering…' : 'Register for event'}
      {participation.data?._source === 'mock' && (
        <span className="text-[10px] text-amber-600 dark:text-amber-400">(mock)</span>
      )}
    </button>
  );
}

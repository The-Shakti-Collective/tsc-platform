import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, IndianRupee, MessageSquare, Plus } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import {
  BOOKING_STATUS_LABELS,
  advanceBookingStatus,
  convertBookingToDeal,
  createBookingInquiry,
  fetchBookingInquiries,
  groupInquiriesByStatus,
} from '../../lib/bookingApi';
import { useQuery, useQueryClient } from '@tanstack/react-query';

function formatCurrency(value) {
  if (value == null) return '—';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `INR ${value}`;
  }
}

function InquiryCard({ inquiry, onAdvance, onConvert }) {
  return (
    <div className="rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-[var(--color-text-primary)] line-clamp-2">
          {inquiry.message ?? 'Booking inquiry'}
        </p>
        <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] shrink-0">
          {BOOKING_STATUS_LABELS[inquiry.status] ?? inquiry.status}
        </span>
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">
        {inquiry.requesterName ?? inquiry.requesterPersonId}
        {' · '}
        {inquiry.artistName ?? inquiry.artistId}
        {inquiry.venueName ? ` · ${inquiry.venueName}` : ''}
      </p>
      <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <span className="inline-flex items-center gap-1">
          <IndianRupee size={12} />
          {formatCurrency(inquiry.budget)}
        </span>
        {inquiry.eventDate && (
          <span className="inline-flex items-center gap-1">
            <Calendar size={12} />
            {new Date(inquiry.eventDate).toLocaleDateString('en-IN')}
          </span>
        )}
      </div>
      <div className="flex gap-2 pt-1">
        {inquiry.status !== 'contracted' && inquiry.status !== 'completed' && (
          <button
            type="button"
            onClick={() => onAdvance(inquiry.id)}
            className="text-[10px] px-2 py-1 rounded border border-[var(--color-bg-border)] hover:border-[var(--color-brand-primary)]/50"
          >
            Advance
          </button>
        )}
        {!inquiry.dealId && inquiry.status !== 'cancelled' && (
          <button
            type="button"
            onClick={() => onConvert(inquiry.id)}
            className="text-[10px] px-2 py-1 rounded bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]"
          >
            Convert to deal
          </button>
        )}
        {inquiry.dealId && (
          <Link
            to={`/deals/${inquiry.dealId}`}
            className="text-[10px] px-2 py-1 rounded border border-[var(--color-bg-border)]"
          >
            View deal
          </Link>
        )}
      </div>
    </div>
  );
}

export default function BookingInquiryPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    requesterPersonId: 'person-demo',
    artistId: 'artist-ritviz',
    message: '',
    budget: '',
    eventDate: '',
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['booking-inquiries'],
    queryFn: () => fetchBookingInquiries(),
  });

  const stages = useMemo(
    () => groupInquiriesByStatus(data?.items ?? []),
    [data?.items],
  );

  async function handleCreate(e) {
    e.preventDefault();
    await createBookingInquiry({
      ...form,
      budget: form.budget ? Number(form.budget) : undefined,
      eventDate: form.eventDate ? new Date(form.eventDate).toISOString() : undefined,
    });
    setShowForm(false);
    setForm({ requesterPersonId: 'person-demo', artistId: 'artist-ritviz', message: '', budget: '', eventDate: '' });
    queryClient.invalidateQueries({ queryKey: ['booking-inquiries'] });
  }

  async function handleAdvance(id) {
    await advanceBookingStatus(id);
    queryClient.invalidateQueries({ queryKey: ['booking-inquiries'] });
  }

  async function handleConvert(id) {
    await convertBookingToDeal(id);
    queryClient.invalidateQueries({ queryKey: ['booking-inquiries'] });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-sm text-[var(--color-text-muted)]">Could not load booking inquiries.</p>
        <button type="button" onClick={() => refetch()} className="text-xs px-3 py-1.5 rounded-md border">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <MessageSquare size={20} />
            Booking Inquiries
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            In-platform flow — inquiry → negotiation → contract → invoice
            {data?._source === 'mock' && ' · mock data'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md bg-[var(--color-brand-primary)] text-white"
        >
          <Plus size={16} />
          New inquiry
        </button>
      </header>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-xs space-y-1">
              <span className="text-[var(--color-text-muted)]">Artist ID</span>
              <input
                className="w-full rounded border px-2 py-1.5 text-sm bg-transparent"
                value={form.artistId}
                onChange={(e) => setForm({ ...form, artistId: e.target.value })}
              />
            </label>
            <label className="text-xs space-y-1">
              <span className="text-[var(--color-text-muted)]">Budget (INR)</span>
              <input
                type="number"
                className="w-full rounded border px-2 py-1.5 text-sm bg-transparent"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
              />
            </label>
          </div>
          <label className="text-xs space-y-1 block">
            <span className="text-[var(--color-text-muted)]">Message</span>
            <textarea
              className="w-full rounded border px-2 py-1.5 text-sm bg-transparent min-h-[72px]"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Event details, deliverables, venue preferences..."
            />
          </label>
          <div className="flex gap-2">
            <button type="submit" className="text-sm px-3 py-1.5 rounded-md bg-[var(--color-brand-primary)] text-white">
              Submit inquiry
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm px-3 py-1.5 rounded-md border">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto">
        {stages.map((stage) => (
          <section key={stage.status} className="min-w-[220px] space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] flex justify-between">
              {BOOKING_STATUS_LABELS[stage.status]}
              <span>{stage.count}</span>
            </h2>
            <div className="space-y-2">
              {stage.items.length === 0 ? (
                <p className="text-xs text-[var(--color-text-muted)] py-4 text-center border border-dashed rounded-lg">
                  Empty
                </p>
              ) : (
                stage.items.map((inquiry) => (
                  <InquiryCard
                    key={inquiry.id}
                    inquiry={inquiry}
                    onAdvance={handleAdvance}
                    onConvert={handleConvert}
                  />
                ))
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

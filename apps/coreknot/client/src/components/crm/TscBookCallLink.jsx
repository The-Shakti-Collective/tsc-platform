import React, { useCallback, useState } from 'react';
import { CalendarClock, Copy, ExternalLink, Check } from 'lucide-react';
import { Button } from '../ui';
import { getBookACallUrl } from '../../lib/tscWebsiteLinks';

/**
 * Share the public TSC "Book a call" form — submissions land in CoreKnot CRM via webhook.
 */
export default function TscBookCallLink({ variant = 'toolbar', className = '' }) {
  const url = getBookACallUrl();
  const [copied, setCopied] = useState(false);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy booking link:', url);
    }
  }, [url]);

  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[var(--color-accent-primary)] hover:underline"
        >
          <ExternalLink size={12} />
          Book a call form
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-workspace)] px-3 py-2.5 ${className}`}
    >
      <div className="flex items-start gap-2 min-w-0 flex-1">
        <CalendarClock size={16} className="text-[var(--color-accent-primary)] shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-[var(--color-text-primary)]">Public booking form</p>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
            Share with prospects — submissions create leads in CRM (source: Website Booking).
          </p>
          <p className="text-[9px] font-mono text-[var(--color-text-secondary)] truncate mt-1" title={url}>
            {url}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="xs" variant="secondary" onClick={copyLink} className="gap-1">
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Button size="xs" variant="primary" className="gap-1">
            <ExternalLink size={12} />
            Open form
          </Button>
        </a>
      </div>
    </div>
  );
}

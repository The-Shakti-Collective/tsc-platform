import React, { useCallback, useState } from 'react';
import { CalendarClock, Copy, ExternalLink, Check } from 'lucide-react';
import { DashboardWidgetShell, Button } from '../ui';
import { getBookACallUrl } from '../../lib/tscWebsiteLinks';

/**
 * Data Hub widget: public book-a-call link + quick actions for sales team.
 */
const BookedCallsWidget = () => {
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

  return (
    <DashboardWidgetShell
      className="shrink-0"
      title="Book a call"
      icon={CalendarClock}
    >
      <p className="text-[10px] text-[var(--color-text-muted)] mb-3">
        Website form at theshakticollective.in — new submissions sync to CRM as leads.
      </p>
      <p
        className="text-[9px] font-mono text-[var(--color-text-secondary)] bg-[var(--color-bg-workspace)] rounded-lg px-2 py-1.5 truncate mb-3"
        title={url}
      >
        {url}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="xs" variant="secondary" onClick={copyLink} className="gap-1">
          {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy link'}
        </Button>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Button size="xs" variant="primary" className="gap-1">
            <ExternalLink size={12} />
            Open form
          </Button>
        </a>
      </div>
    </DashboardWidgetShell>
  );
};

export default BookedCallsWidget;

import React, { useMemo } from 'react';
import { Activity, ExternalLink } from 'lucide-react';
import { SiSentry, SiPosthog, SiBetterstack, SiDatadog } from 'react-icons/si';
import { DashboardWidgetShell, Badge } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { isAdminUser } from '../../utils/departmentPermissions';
import { getObservabilityLinks } from '../../lib/observabilityLinks';

const TOOL_ICONS = {
  sentry: SiSentry,
  posthog: SiPosthog,
  betterstack: SiBetterstack,
  datadog: SiDatadog,
};

function ToolTile({ tool }) {
  const Icon = TOOL_ICONS[tool.id] || Activity;
  const content = (
    <>
      <div className="flex items-start justify-between gap-2 w-full">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]">
          <Icon size={16} aria-hidden />
        </span>
        <ExternalLink
          size={12}
          className="shrink-0 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
          aria-hidden
        />
      </div>
      <div className="min-w-0 w-full mt-2">
        <p className="text-xs font-bold text-[var(--color-text-primary)] truncate">{tool.name}</p>
        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 truncate">{tool.description}</p>
      </div>
      {!tool.showSetupBadge ? null : (
        <Badge variant="neutral" className="text-[8px] mt-2 self-start">
          Add keys in .env.local
        </Badge>
      )}
    </>
  );

  const className =
    'group flex flex-col min-h-[88px] rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-workspace)] p-2.5 transition-colors hover:border-[var(--color-brand-primary)]/40 hover:bg-[var(--color-bg-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]/50';

  if (!tool.url) {
    return (
      <div className={`${className} cursor-default opacity-70`} aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <a
      href={tool.url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={`Open ${tool.name} dashboard in new tab`}
    >
      {content}
    </a>
  );
}

function ObservabilityLinksCard() {
  const { user } = useAuth();
  const isAdmin = isAdminUser(user);

  const tools = useMemo(() => getObservabilityLinks(), []);
  const configuredCount = tools.filter((t) => t.configured).length;

  if (!isAdmin) {
    return (
      <DashboardWidgetShell title="Analytics & Monitoring" icon={Activity} bodyClassName="p-4 min-h-[160px]">
        <p className="text-xs text-[var(--color-text-muted)] italic">Admin access required</p>
      </DashboardWidgetShell>
    );
  }

  return (
    <DashboardWidgetShell
      title="Analytics & Monitoring"
      icon={Activity}
      bodyClassName="p-4 flex flex-col min-h-[160px]"
    >
      <p className="text-[10px] text-[var(--color-text-muted)] mb-3">
        External observability dashboards
        {configuredCount > 0 ? (
          <span className="tabular-nums"> · {configuredCount}/{tools.length} instrumented</span>
        ) : (
          <span> · add VITE_* keys in client/.env.local</span>
        )}
      </p>

      <div className="grid grid-cols-2 gap-2 flex-1">
        {tools.map((tool) => (
          <ToolTile key={tool.id} tool={tool} />
        ))}
      </div>
    </DashboardWidgetShell>
  );
}

export default ObservabilityLinksCard;

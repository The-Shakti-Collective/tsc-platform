import React, { useEffect, useMemo, useState } from 'react';
import { fetchWhiteLabelConfig } from '../../lib/whiteLabelApi';

function applyTenantTheme(primaryColor) {
  if (!primaryColor || typeof document === 'undefined') return () => {};
  const root = document.documentElement;
  const previous = root.style.getPropertyValue('--color-brand-primary');
  root.style.setProperty('--color-brand-primary', primaryColor);
  return () => {
    if (previous) root.style.setProperty('--color-brand-primary', previous);
    else root.style.removeProperty('--color-brand-primary');
  };
}

/**
 * White-label shell — loads tenant branding config and applies CSS vars + logo.
 * Wrap tenant routes under `/t/:tenantSlug/*`.
 */
export function WhiteLabelShell({ tenantSlug, children, fallback = null }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetchWhiteLabelConfig(tenantSlug)
      .then((payload) => {
        if (!active) return;
        if (!payload) {
          setError('Tenant not found');
          setConfig(null);
          return;
        }
        setConfig(payload);
      })
      .catch(() => {
        if (!active) return;
        setError('Could not load tenant config');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [tenantSlug]);

  useEffect(() => {
    if (!config?.primaryColor) return undefined;
    return applyTenantTheme(config.primaryColor);
  }, [config?.primaryColor]);

  const header = useMemo(() => {
    if (!config) return null;
    return (
      <header className="flex items-center gap-3 border-b border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] px-4 py-3">
        {config.logoUrl ? (
          <img
            src={config.logoUrl}
            alt={`${config.name} logo`}
            className="h-8 w-8 rounded object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded bg-[var(--color-brand-primary)]/15 text-xs font-bold text-[var(--color-brand-primary)]">
            {config.name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{config.name}</p>
          {config.config?.tagline ? (
            <p className="text-xs text-[var(--color-text-muted)]">{config.config.tagline}</p>
          ) : (
            <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              {config.type} OS
            </p>
          )}
        </div>
      </header>
    );
  }, [config]);

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center text-sm text-[var(--color-text-muted)]">
        Loading tenant…
      </div>
    );
  }

  if (error || !config) {
    return (
      fallback ?? (
        <div className="rounded-lg border border-[var(--color-bg-border)] p-4 text-sm text-[var(--color-text-muted)]">
          {error ?? 'Tenant unavailable'}
        </div>
      )
    );
  }

  return (
    <div className="white-label-shell" data-tenant-slug={tenantSlug} data-tenant-type={config.type}>
      {header}
      <div className="white-label-shell-body">{children}</div>
    </div>
  );
}

export default WhiteLabelShell;

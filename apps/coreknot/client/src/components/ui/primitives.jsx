export function PageContainer({ children, className = '', title = undefined, subtitle = undefined }) {
  return (
    <div className={`mx-auto max-w-6xl px-4 py-8 space-y-6 ${className}`}>
      {(title || subtitle) && (
        <header className="space-y-1">
          {title ? (
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">{title}</h1>
          ) : null}
          {subtitle ? <p className="text-sm text-[var(--color-text-muted)]">{subtitle}</p> : null}
        </header>
      )}
      {children}
    </div>
  );
}

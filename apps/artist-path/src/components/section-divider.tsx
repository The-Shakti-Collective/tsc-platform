export function SectionDivider() {
  return (
    <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-6" aria-hidden>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-brand-teal-deep/15" />
      <svg width="24" height="24" viewBox="0 0 24 24" className="text-brand-pumpkin/60" fill="currentColor">
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.5" />
      </svg>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-brand-teal-deep/15" />
    </div>
  );
}

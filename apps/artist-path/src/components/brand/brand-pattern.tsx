type BrandPatternProps = {
  variant?: 'hero' | 'section' | 'footer';
  className?: string;
};

/** Subtle TSC-inspired geometric motifs — low-opacity brand pattern overlays */
export function BrandPattern({ variant = 'section', className }: BrandPatternProps) {
  if (variant === 'hero') {
    return (
      <div className={className} aria-hidden>
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.14]"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern id="hero-dots" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#ffecd1" />
            </pattern>
            <pattern id="hero-arcs" width="120" height="120" patternUnits="userSpaceOnUse">
              <path
                d="M0 60 Q60 0 120 60"
                fill="none"
                stroke="#ffecd1"
                strokeWidth="0.75"
                opacity="0.5"
              />
              <path
                d="M0 90 Q60 30 120 90"
                fill="none"
                stroke="#126d5e"
                strokeWidth="0.5"
                opacity="0.4"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-dots)" />
          <rect width="100%" height="100%" fill="url(#hero-arcs)" />
        </svg>
        <div
          className="absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-brand-green/20 blur-3xl"
        />
        <div
          className="absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-brand-pumpkin/15 blur-3xl"
        />
        <svg
          className="absolute right-[8%] top-[18%] h-40 w-40 text-brand-cream/10 animate-float"
          viewBox="0 0 200 200"
          fill="none"
        >
          <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="1" />
          <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="0.75" />
          <circle cx="100" cy="100" r="30" stroke="currentColor" strokeWidth="0.5" />
        </svg>
        <svg
          className="absolute bottom-[12%] left-[6%] h-24 w-24 text-brand-cream/8"
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          <polygon points="50,5 95,50 50,95 5,50" />
        </svg>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <div className={className} aria-hidden>
        <svg className="h-full w-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="footer-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M48 0H0V48" fill="none" stroke="#083d3a" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#footer-grid)" />
        </svg>
      </div>
    );
  }

  return (
    <div className={className} aria-hidden>
      <svg className="h-full w-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="section-lines" width="64" height="64" patternUnits="userSpaceOnUse">
            <path d="M0 32h64M32 0v64" stroke="#083d3a" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#section-lines)" />
      </svg>
    </div>
  );
}

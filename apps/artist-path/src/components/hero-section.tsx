import { Calendar, Clock, GraduationCap, IndianRupee, MapPin, Users } from 'lucide-react';
import { ApplyButton } from '@/components/apply-button';
import { BrandPattern } from '@/components/brand/brand-pattern';
import { siteConfig } from '@/lib/config';
import { frameworkPillars } from '@/lib/content';

const programStats = [
  {
    icon: Clock,
    label: 'Duration',
    value: siteConfig.program.duration,
    accent: 'bg-brand-green/20 text-brand-green',
  },
  {
    icon: Calendar,
    label: 'Starts',
    value: siteConfig.program.startDate,
    accent: 'bg-brand-pumpkin/20 text-brand-pumpkin',
  },
  {
    icon: MapPin,
    label: 'Format',
    value: siteConfig.program.format,
    accent: 'bg-brand-teal-mid/20 text-brand-teal-mid',
  },
  {
    icon: Users,
    label: 'Selected',
    value: `${siteConfig.program.artistsSelected} artists`,
    accent: 'bg-brand-burgundy/15 text-brand-burgundy',
  },
  {
    icon: GraduationCap,
    label: 'Scholarships',
    value: siteConfig.program.scholarshipSeats,
    accent: 'bg-brand-mustard/20 text-brand-mustard',
  },
  {
    icon: IndianRupee,
    label: 'Development grant',
    value: siteConfig.program.developmentGrant,
    accent: 'bg-brand-pumpkin/20 text-brand-pumpkin',
  },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-brand-teal-deep text-brand-cream">
      <BrandPattern variant="hero" className="pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 md:pb-24 md:pt-14">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          {/* Copy */}
          <div className="animate-fade-up space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-brand-cream/25 bg-brand-cream/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-cream">
                TSC Accelerator
              </span>
              <span className="rounded-full bg-brand-pumpkin px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                Applications open
              </span>
            </div>

            <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-balance md:text-5xl lg:text-[3.25rem]">
              Build your music career.
              <span className="block text-brand-cream/75">Not just your next song.</span>
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-brand-cream/80 md:text-xl">
              A 9-month accelerator for independent artists ready to move from skill to career — identity,
              craft, audience, industry and opportunity in one structured path.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <ApplyButton size="lg" />
              <p className="text-sm text-brand-cream/60">
                Only <strong className="text-brand-cream">{siteConfig.program.artistsSelected}</strong> artists
                selected
              </p>
            </div>
          </div>

          {/* Program at a glance */}
          <div className="animate-fade-up space-y-4 lg:pt-4" style={{ animationDelay: '0.15s' }}>
            <div className="rounded-2xl border border-brand-cream/15 bg-brand-teal-mid/40 p-5 backdrop-blur-sm md:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-cream/60">
                Program at a glance
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {programStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-brand-cream/10 bg-brand-teal-deep/50 p-3.5 transition-colors hover:border-brand-cream/25"
                  >
                    <div className={`mb-2 inline-flex rounded-lg p-2 ${stat.accent}`}>
                      <stat.icon className="h-4 w-4" aria-hidden />
                    </div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-brand-cream/55">
                      {stat.label}
                    </p>
                    <p className="mt-0.5 font-display text-lg font-semibold text-brand-cream">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini framework preview */}
            <div className="rounded-2xl border border-brand-cream/15 bg-brand-cream/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-cream/60">
                The journey
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {frameworkPillars.map((pillar, i) => (
                  <div
                    key={pillar.label}
                    className="flex items-center gap-2 rounded-full border border-brand-cream/15 bg-brand-teal-deep/40 px-3 py-1.5"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-pumpkin text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-brand-cream">{pillar.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave to cream section */}
      <div className="relative leading-[0]">
        <svg
          className="w-full text-brand-cream-wash"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M0,40 C360,80 720,0 1080,40 C1260,56 1380,64 1440,56 L1440,80 L0,80 Z"
          />
        </svg>
      </div>
    </section>
  );
}

import { Calendar, Clock, GraduationCap, IndianRupee, MapPin, Timer, Users } from 'lucide-react';
import { ApplyButton } from '@/components/apply-button';
import { BrandPattern } from '@/components/brand/brand-pattern';
import { SurfaceCard } from '@/components/ui/surface-card';
import { siteConfig } from '@/lib/config';
import { frameworkPillars } from '@/lib/content';

const programStats = [
  { icon: Clock, label: 'Duration', value: siteConfig.program.duration },
  { icon: Calendar, label: 'Start Date', value: siteConfig.program.startDate },
  { icon: Timer, label: 'Apply By', value: siteConfig.program.registrationDeadline },
  { icon: MapPin, label: 'Format', value: siteConfig.program.format },
  { icon: Users, label: 'Artists Selected', value: String(siteConfig.program.artistsSelected) },
  { icon: GraduationCap, label: 'Scholarship Seats', value: siteConfig.program.scholarshipSeats },
  { icon: IndianRupee, label: 'Program Fees', value: siteConfig.program.programFees },
];
export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-brand-red-oxide bg-gradient-to-br from-brand-red-oxide via-brand-burgundy to-brand-espresso text-brand-cream">
      <BrandPattern variant="hero" className="pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-6 md:pb-20 md:pt-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div className="animate-fade-up space-y-6">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-cream/80">
              The Artist Path
            </p>
            <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-balance md:text-5xl lg:text-[3.25rem]">
              Build Your Music Career.
              <span className="block text-brand-cream/80">Not Just Your Next Song.</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-brand-cream/90 md:text-xl">
              A 9-month accelerator for independent artists ready to move from skill to career.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-brand-cream/25 bg-brand-cream/10 px-4 py-1.5 text-sm font-semibold text-brand-cream">
                {siteConfig.registrationOpenLabel}
              </span>
              <span className="text-sm text-brand-cream/75">
                {siteConfig.program.artistsSelected} Artists Selected
              </span>
            </div>
            <ApplyButton size="lg" showCountdown />
          </div>

          <div className="animate-fade-up space-y-4" style={{ animationDelay: '0.12s' }}>
            <SurfaceCard variant="glass-dark" className="p-5 md:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-cream/65">
                Program at a glance
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {programStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-brand-cream/12 bg-white/10 p-3.5 transition-colors duration-200"
                  >
                    <div className="mb-2 inline-flex rounded-lg bg-brand-cream/15 p-2 text-brand-cream">
                      <stat.icon className="h-4 w-4" aria-hidden />
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-cream/55">
                      {stat.label}
                    </p>
                    <p className="mt-0.5 font-display text-base font-bold text-brand-cream md:text-lg">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard variant="glass-dark" className="p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-cream/65">The journey</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {frameworkPillars.map((pillar, i) => (
                  <span
                    key={pillar.label}
                    className="inline-flex items-center gap-2 rounded-full border border-brand-cream/15 bg-black/15 px-3 py-1.5 text-sm font-medium text-brand-cream"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-pumpkin text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    {pillar.label}
                  </span>
                ))}
              </div>
            </SurfaceCard>
          </div>
        </div>
      </div>

      <div className="relative leading-[0]">
        <svg className="w-full text-brand-cream-wash" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden>
          <path fill="currentColor" d="M0,40 C360,80 720,0 1080,40 C1260,56 1380,64 1440,56 L1440,80 L0,80 Z" />
        </svg>
      </div>
    </section>
  );
}

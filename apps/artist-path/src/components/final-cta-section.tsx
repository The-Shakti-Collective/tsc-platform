import { ApplyButton } from '@/components/apply-button';
import { BrandPattern } from '@/components/brand/brand-pattern';
import { SurfaceCard } from '@/components/ui/surface-card';
import { siteConfig } from '@/lib/config';

export function FinalCtaSection() {
  return (
    <section id="apply" className="mx-auto max-w-6xl px-4 pb-20 md:pb-28">
      <div
        className="relative overflow-hidden rounded-3xl bg-brand-red-oxide bg-gradient-to-br from-brand-red-oxide via-brand-burgundy to-brand-espresso shadow-soft-lg"
      >
        <BrandPattern variant="hero" className="pointer-events-none absolute inset-0 opacity-20" />
        <div
          className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-brand-peacock/25 blur-3xl"
          aria-hidden
        />

        <div className="relative p-8 md:p-12 lg:p-14">
          <SurfaceCard variant="glass-dark" className="max-w-3xl border-brand-cream/20 p-8 md:p-10">
            <h2 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
              Final Thought
            </h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-brand-cream/90">
              <p>Most artists spend years trying to figure things out alone.</p>
              <p>
                The Artist Path exists to help artists move faster, make better decisions, and build a meaningful
                career with clarity, community and opportunity.
              </p>
              <p className="font-semibold text-white">You already have the talent.</p>
              <p className="font-display text-xl font-semibold text-white">Are you ready to build the path?</p>
              <p className="text-sm text-brand-cream/75">
                {siteConfig.registrationOpenLabel}. Program starts {siteConfig.program.startDate}.
              </p>
            </div>
            <div className="mt-8">
              <ApplyButton size="lg" variant="primary" />
            </div>
          </SurfaceCard>
        </div>
      </div>
    </section>
  );
}

import { Calendar, Sparkles, Users } from 'lucide-react';
import { ApplyButton } from '@/components/apply-button';
import { BrandPattern } from '@/components/brand/brand-pattern';
import { siteConfig } from '@/lib/config';

export function FinalCtaSection() {
  return (
    <section id="apply" className="mx-auto max-w-6xl px-4 pb-20 md:pb-28">
      <div
        className="relative overflow-hidden rounded-3xl bg-brand-teal-deep bg-gradient-to-br from-brand-teal-deep via-brand-teal-mid to-brand-green shadow-2xl shadow-brand-teal-deep/30"
      >
        <BrandPattern variant="hero" className="pointer-events-none absolute inset-0 opacity-20" />

        {/* Accent glow */}
        <div
          className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-brand-pumpkin/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 left-1/4 h-48 w-48 rounded-full bg-brand-green/30 blur-3xl"
          aria-hidden
        />

        <div className="relative grid items-center gap-10 p-8 md:grid-cols-[1.2fr_0.8fr] md:p-12 lg:p-14">
          <div className="text-brand-cream">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-cream/70">
              Applications open · {siteConfig.program.artistsSelected} seats
            </p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-[2.75rem]">
              You already have the talent.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-brand-cream/90">
              Most artists spend years figuring things out alone. The Artist Path helps you move faster — with clarity,
              community and real opportunity.
            </p>
            <p className="mt-4 font-display text-xl font-semibold text-white">
              Are you ready to build the path?
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <ApplyButton size="lg" variant="primary" />
              <span className="text-sm text-brand-cream/75">
                Starts {siteConfig.program.startDate} · {siteConfig.program.duration}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-cream/20 bg-brand-teal-deep/60 p-6 backdrop-blur-sm md:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-cream/65">
              Why apply now
            </p>
            <ul className="mt-5 space-y-4">
              {[
                {
                  icon: Sparkles,
                  text: 'Structured 9-month path from identity to career',
                },
                {
                  icon: Users,
                  text: `Only ${siteConfig.program.artistsSelected} artists — selective cohort`,
                },
                {
                  icon: Calendar,
                  text: `${siteConfig.program.developmentGrant} development grant for top performers`,
                },
              ].map((item) => (
                <li key={item.text} className="flex gap-3 text-brand-cream/90">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-pumpkin/25 text-brand-cream">
                    <item.icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="pt-1.5 text-sm leading-snug md:text-base">{item.text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-xl border border-brand-cream/15 bg-brand-cream/10 px-4 py-3 text-center">
              <p className="text-xs uppercase tracking-widest text-brand-cream/60">Scholarships</p>
              <p className="mt-1 font-display text-lg font-bold text-brand-cream">
                {siteConfig.program.scholarshipSeats}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useState } from 'react';
import {
  Check,
  ChevronDown,
  Compass,
  Globe,
  Headphones,
  Layers,
  Mic2,
  Music2,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { FinalCtaSection } from '@/components/final-cta-section';
import { HeroSection } from '@/components/hero-section';
import { SectionDivider } from '@/components/section-divider';
import { SiteHeader } from '@/components/site-header';
import { ArtistPathLogo } from '@/components/brand/artist-path-logo';
import { BrandPattern } from '@/components/brand/brand-pattern';
import { SectionEyebrow } from '@/components/ui/section-eyebrow';
import { SurfaceCard } from '@/components/ui/surface-card';
import { siteConfig } from '@/lib/config';
import { programHighlightRows } from '@/lib/program-highlights';
import {
  artistBenefits,
  businessTopics,
  careerPillars,
  faqs,
  frameworkPillars,
  industryExposure,
  notThisProgram,
  opportunityBullets,
  pathwayOutcomes,
  selectionSteps,
  whoShouldApply,
  workPhases,
} from '@/lib/content';
import { cn } from '@/lib/utils';

const frameworkIcons = [Compass, Sparkles, Music2, Users, TrendingUp];
const phaseIcons = [Compass, Mic2, Layers, Rocket, Globe, Target];

function SectionHeading({
  title,
  subtitle,
  align = 'left',
  light,
  className,
}: {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  light?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', align === 'center' && 'mx-auto max-w-2xl text-center', className)}>
      <h2
        className={cn(
          'font-display text-3xl font-bold tracking-tight text-balance md:text-4xl',
          light ? 'text-brand-cream' : 'text-brand-teal-deep',
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            'text-lg text-balance leading-relaxed',
            light ? 'text-brand-cream/85' : 'text-brand-teal-deep/80',
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <SurfaceCard className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-200 hover:bg-brand-cream-muted/40"
        aria-expanded={open}
      >
        <span className="font-medium text-brand-teal-deep">{question}</span>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 text-brand-teal-deep/60 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      {open ? (
        <div className="border-t border-brand-teal-deep/10 px-5 py-4 leading-relaxed text-brand-teal-deep/80">
          {answer}
        </div>
      ) : null}
    </SurfaceCard>
  );
}

export function LandingPage() {
  return (
    <div className="relative bg-brand-cream-wash">
      <SiteHeader />
      <HeroSection />

      {/* Opportunity */}
      <section className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
        <BrandPattern variant="section" className="pointer-events-none absolute inset-0" />
        <div className="relative">
          <SectionEyebrow>Market context</SectionEyebrow>
          <SectionHeading title="The Opportunity Has Never Been Bigger" className="mt-3" />
          <div className="mt-12 grid gap-10 lg:grid-cols-2">
            <div className="space-y-5 text-brand-teal-deep/85">
              <p className="text-lg font-semibold text-brand-teal-deep">
                India is one of the largest music markets in the world.
              </p>
              <p>Hundreds of millions of listeners stream music every day.</p>
              <p>Independent artists can now:</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {opportunityBullets.map((item) => (
                  <SurfaceCard key={item} hover className="flex items-start gap-3 p-4">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-pumpkin" />
                    <span>{item}</span>
                  </SurfaceCard>
                ))}
              </div>
              <p>Yet most artists never realize their potential.</p>
              <p>Not because they lack talent.</p>
              <p className="font-semibold text-brand-teal-deep">Because talent alone is not enough.</p>
              <p>The artists who build careers understand:</p>
            </div>
            <SurfaceCard variant="accent" className="p-6 md:p-8">
              <SectionEyebrow>Five pillars</SectionEyebrow>
              <div className="mt-4 flex flex-wrap gap-2">
                {careerPillars.map((pillar) => (
                  <span
                    key={pillar}
                    className="rounded-xl border border-brand-teal-deep/10 bg-white px-4 py-2 font-display text-sm font-bold text-brand-teal-deep shadow-sm"
                  >
                    {pillar}
                  </span>
                ))}
              </div>
              <p className="mt-8 font-display text-xl font-bold text-brand-teal-deep">
                The Artist Path exists to help artists develop all five.
              </p>
            </SurfaceCard>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* What is */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <SectionEyebrow>Program overview</SectionEyebrow>
        <SectionHeading
          className="mt-3"
          title="What Is The Artist Path?"
          subtitle="The Artist Path is a 9-month artist accelerator designed for independent artists who are serious about building a professional music career."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {notThisProgram.map((line) => (
            <SurfaceCard key={line} className="flex flex-col items-center p-6 text-center text-brand-teal-deep/80">
              <X className="mb-3 h-6 w-6 text-brand-burgundy" aria-hidden />
              {line}
            </SurfaceCard>
          ))}
        </div>
        <SurfaceCard className="mt-8 p-6 md:p-8">
          <p className="font-semibold text-brand-teal-deep">It is a structured pathway that helps artists:</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pathwayOutcomes.map((outcome) => (
              <div
                key={outcome}
                className="flex items-center gap-3 rounded-xl bg-brand-cream-muted/70 px-4 py-3 text-brand-teal-deep/90"
              >
                <Headphones className="h-4 w-4 shrink-0 text-brand-green" aria-hidden />
                {outcome}
              </div>
            ))}
          </div>
        </SurfaceCard>
      </section>

      {/* Why */}
      <section className="relative overflow-hidden bg-brand-red-oxide bg-gradient-to-br from-brand-red-oxide via-brand-burgundy to-brand-espresso py-16 text-brand-cream md:py-24">
        <BrandPattern variant="hero" className="pointer-events-none absolute inset-0 opacity-35" />
        <div className="relative mx-auto max-w-6xl px-4">
          <SectionEyebrow light>Origin story</SectionEyebrow>
          <SectionHeading className="mt-3" title="Why We Built This" light />
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <SurfaceCard variant="glass-dark" className="p-6 md:p-8">
              <p className="font-display text-2xl font-bold leading-snug md:text-3xl">
                Many talented artists never reach their potential.
              </p>
              <p className="mt-4 text-brand-cream/85">
                Not because they lack skill. Because they lack guidance, structure, industry understanding and the
                right opportunities at the right time.
              </p>
            </SurfaceCard>
            <div className="space-y-5 text-brand-cream/85 leading-relaxed">
              <p>
                Over the past 27 years, Rohith Sobti has worked across music labels, films, artists, IPs and talent
                ecosystems.
              </p>
              <p>
                He has worked with artists at different stages of their careers and has seen one recurring pattern:
              </p>
              <p className="font-display text-xl font-bold text-white">
                The Artist Path was created to solve that problem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Framework */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <SectionEyebrow>The model</SectionEyebrow>
        <SectionHeading
          className="mt-3"
          title="The Framework"
          subtitle="This journey is at the heart of The Artist Path."
          align="center"
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {frameworkPillars.map((pillar, index) => {
            const Icon = frameworkIcons[index] ?? Sparkles;
            return (
              <SurfaceCard key={pillar.label} hover className="group p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-pumpkin">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-green-soft transition-colors duration-200 group-hover:bg-brand-green/15">
                  <Icon className="h-6 w-6 text-brand-green" aria-hidden />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-brand-teal-deep">{pillar.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-teal-deep/70">{pillar.description}</p>
              </SurfaceCard>
            );
          })}
        </div>
      </section>

      <SectionDivider />

      {/* Work phases */}
      <section className="bg-brand-cream-muted/50 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <SectionEyebrow>Curriculum</SectionEyebrow>
          <SectionHeading className="mt-3" title="What You Will Work On" />
          <div className="mt-12 space-y-6">
            {workPhases.map((phase, index) => {
              const Icon = phaseIcons[index] ?? Target;
              return (
                <div key={phase.id} className="relative flex gap-5 md:gap-6">
                  {index < workPhases.length - 1 ? (
                    <div
                      className="absolute left-6 top-14 bottom-0 w-px bg-brand-teal-deep/15 md:left-7"
                      aria-hidden
                    />
                  ) : null}
                  <div
                    className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-brand-pumpkin bg-white shadow-soft md:h-14 md:w-14"
                  >
                    <Icon className="h-5 w-5 text-brand-pumpkin md:h-6 md:w-6" aria-hidden />
                  </div>
                  <SurfaceCard className="flex-1 p-6 md:p-8">
                    <h3 className="font-display text-2xl font-bold text-brand-teal-deep">{phase.title}</h3>
                    <p className="mt-3 text-brand-teal-deep/75">{phase.intro}</p>
                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                      <ul className="space-y-2">
                        {phase.bullets.map((b) => (
                          <li key={b} className="flex gap-2 text-brand-teal-deep/85">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" aria-hidden />
                            {b}
                          </li>
                        ))}
                      </ul>
                      <div className="rounded-xl bg-brand-green-soft/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-brand-green">Outputs</p>
                        <ul className="mt-3 space-y-2">
                          {phase.outputs.map((o) => (
                            <li key={o} className="flex gap-2 text-sm text-brand-teal-deep/90">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-pumpkin" aria-hidden />
                              {o}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </SurfaceCard>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits bento */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <SectionEyebrow>Included</SectionEyebrow>
        <SectionHeading className="mt-3" title="What Artists Receive" subtitle="Every selected artist receives:" />
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {artistBenefits.map((item) => (
            <li key={item}>
              <SurfaceCard hover className="flex items-start gap-3 px-4 py-3.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-pumpkin" aria-hidden />
                <span className="text-brand-teal-deep/90">{item}</span>
              </SurfaceCard>
            </li>
          ))}
        </ul>
      </section>

      <SectionDivider />

      {/* Industry + Business */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid gap-8 lg:grid-cols-2">
          <SurfaceCard className="p-6 md:p-8">
            <SectionHeading title="Industry Exposure" />
            <p className="mt-4 text-brand-teal-deep/75">
              Throughout the program, artists interact with professionals across the ecosystem including:
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {industryExposure.map((role) => (
                <span
                  key={role}
                  className="rounded-lg border border-brand-teal-deep/10 bg-brand-cream-muted/60 px-3 py-1.5 text-sm text-brand-teal-deep/85"
                >
                  {role}
                </span>
              ))}
            </div>
            <p className="mt-6 text-sm text-brand-teal-deep/65">
              Because building a music career requires understanding more than music.
            </p>
          </SurfaceCard>
          <SurfaceCard variant="accent" className="p-6 md:p-8">
            <SectionHeading title="Understanding The Business" />
            <p className="mt-4 text-brand-teal-deep/75">Artists will gain practical understanding of:</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {businessTopics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-lg bg-brand-peacock px-3 py-1.5 text-sm font-medium text-brand-cream"
                >
                  {topic}
                </span>
              ))}
            </div>
            <p className="mt-6 font-semibold text-brand-teal-deep">
              Every artist should understand how money flows through music.
            </p>
          </SurfaceCard>
        </div>
      </section>

      {/* Program structure bento */}
      <section className="relative overflow-hidden bg-brand-red-oxide bg-gradient-to-br from-brand-red-oxide via-brand-burgundy to-brand-espresso py-16 text-brand-cream md:py-24">
        <BrandPattern variant="hero" className="pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-6xl px-4">
          <SectionEyebrow light>At a glance</SectionEyebrow>
          <SectionHeading className="mt-3" title="Program Structure" light align="center" />
          <dl className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {programHighlightRows.map((item) => (
              <SurfaceCard key={item.label} variant="glass-dark" className="p-6 text-center">
                <dt className="text-xs font-bold uppercase tracking-[0.15em] text-brand-cream/60">{item.label}</dt>
                <dd className="mt-2 font-display text-2xl font-bold text-white">{item.value}</dd>
              </SurfaceCard>
            ))}
          </dl>
        </div>
      </section>

      {/* Who + Selection */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionEyebrow>Fit</SectionEyebrow>
            <SectionHeading
              className="mt-3"
              title="Who Should Apply?"
              subtitle="This program is designed for:"
            />
            <ul className="mt-8 space-y-3">
              {whoShouldApply.map((item) => (
                <SurfaceCard key={item} className="flex items-center gap-3 px-4 py-3">
                  <Mic2 className="h-4 w-4 shrink-0 text-brand-green" aria-hidden />
                  <span className="text-brand-teal-deep/90">{item}</span>
                </SurfaceCard>
              ))}
            </ul>
          </div>
          <div>
            <SectionEyebrow>How it works</SectionEyebrow>
            <SectionHeading className="mt-3" title="Selection Process" />
            <ol className="mt-8 space-y-4">
              {selectionSteps.map((step, index) => (
                <li key={step} className="flex items-center gap-4">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-pumpkin font-display text-sm font-bold text-white shadow-soft"
                  >
                    {index + 1}
                  </span>
                  <span className="text-brand-teal-deep/90">{step}</span>
                </li>
              ))}
            </ol>
            <SurfaceCard variant="accent" className="mt-8 p-5">
              <p className="font-display text-xl font-bold text-brand-teal-deep">
                Only {siteConfig.program.artistsSelected} artists will be selected. Apply by{' '}
                {siteConfig.program.registrationDeadline} — program starts {siteConfig.program.startDate}.
              </p>
            </SurfaceCard>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <SectionEyebrow>Support</SectionEyebrow>
        <SectionHeading className="mt-3" title="Frequently Asked Questions" align="center" />
        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {faqs.map((faq) => (
            <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </section>

      <FinalCtaSection />

      <footer className="relative border-t border-brand-peacock/10 bg-brand-cream-muted">
        <BrandPattern variant="footer" className="pointer-events-none absolute inset-0" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 text-sm text-brand-teal-deep/65 md:flex-row">
          <div className="flex flex-col items-center gap-3 md:items-start">
            <ArtistPathLogo variant="lockup" className="h-10" />
            <p>© {new Date().getFullYear()} {siteConfig.name}</p>
          </div>
          <p>
            A program by{' '}
            <a
              href={siteConfig.tscWebsiteUrl}
              className="cursor-pointer font-medium text-brand-teal-deep underline-offset-4 transition-colors duration-200 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              The Shakti Collective
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

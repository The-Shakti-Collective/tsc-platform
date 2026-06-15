'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
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
} from 'lucide-react';
import { ApplyButton } from '@/components/apply-button';
import { BrandPattern } from '@/components/brand/brand-pattern';
import { FinalCtaSection } from '@/components/final-cta-section';
import { HeroSection } from '@/components/hero-section';
import { SectionDivider } from '@/components/section-divider';
import { siteConfig } from '@/lib/config';
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
}: {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  light?: boolean;
}) {
  return (
    <div className={cn('space-y-3', align === 'center' && 'text-center mx-auto max-w-2xl')}>
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
            'text-lg text-balance',
            light ? 'text-brand-cream/75' : 'text-brand-teal-deep/70',
            align === 'center' && 'mx-auto',
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
    <div className="rounded-xl border border-brand-teal-deep/10 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="font-medium text-brand-teal-deep">{question}</span>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 text-brand-teal-deep/50 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      {open ? (
        <div className="border-t border-brand-teal-deep/10 px-5 py-4 text-brand-teal-deep/75">
          {answer}
        </div>
      ) : null}
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="relative bg-brand-cream-wash">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-brand-teal-deep/10 bg-brand-cream-wash/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-teal-deep text-brand-cream">
              <Music2 className="h-5 w-5" aria-hidden />
            </div>
            <span className="font-display text-lg font-bold text-brand-teal-deep">{siteConfig.name}</span>
          </Link>
          <ApplyButton size="default" />
        </div>
      </header>

      <HeroSection />

      {/* Opportunity */}
      <section className="relative mx-auto max-w-6xl px-4 py-16 md:py-20">
        <BrandPattern variant="section" className="pointer-events-none absolute inset-0" />
        <div className="relative">
          <SectionHeading
            title="The opportunity has never been bigger"
            subtitle="India is one of the largest music markets in the world — but talent alone is not enough."
          />
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <p className="text-lg font-medium text-brand-teal-deep">
                Hundreds of millions of listeners stream music every day. Independent artists can now:
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {opportunityBullets.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-xl border border-brand-teal-deep/10 bg-white p-4 shadow-sm"
                  >
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-pumpkin" />
                    <span className="text-brand-teal-deep/80">{item}</span>
                  </div>
                ))}
              </div>
              <p className="text-brand-teal-deep/70">
                Yet most artists never realize their potential — not because they lack talent, but because they
                lack the full picture.
              </p>
            </div>
            <div className="rounded-2xl border border-brand-teal-deep/10 bg-gradient-to-br from-brand-green-soft to-white p-6 md:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-brand-green">
                Career builders understand
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {careerPillars.map((pillar) => (
                  <span
                    key={pillar}
                    className="rounded-lg border border-brand-teal-deep/10 bg-white px-4 py-2 font-display text-sm font-semibold text-brand-teal-deep shadow-sm"
                  >
                    {pillar}
                  </span>
                ))}
              </div>
              <p className="mt-6 font-display text-xl font-bold text-brand-teal-deep">
                The Artist Path helps you develop all five.
              </p>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* What is */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <SectionHeading
          title="What is The Artist Path?"
          subtitle="A 9-month accelerator for independent artists serious about building a professional music career."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {notThisProgram.map((line) => (
            <div
              key={line}
              className="rounded-xl border border-brand-rust/20 bg-brand-rust/5 p-5 text-center text-brand-teal-deep/80"
            >
              <span className="mb-2 block text-2xl text-brand-rust" aria-hidden>×</span>
              {line}
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-2xl border border-brand-teal-deep/10 bg-white p-6 shadow-sm md:p-8">
          <p className="font-semibold text-brand-teal-deep">It is a structured pathway that helps artists:</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pathwayOutcomes.map((outcome) => (
              <div
                key={outcome}
                className="flex items-center gap-3 rounded-lg bg-brand-cream-muted/60 px-4 py-3 text-brand-teal-deep/85"
              >
                <Headphones className="h-4 w-4 shrink-0 text-brand-green" aria-hidden />
                {outcome}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="relative overflow-hidden bg-brand-teal-deep py-16 text-brand-cream md:py-20">
        <BrandPattern variant="hero" className="pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-6xl px-4">
          <SectionHeading
            title="Why we built this"
            light
            subtitle="27 years of working across labels, films, artists and talent ecosystems — one pattern kept repeating."
          />
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <blockquote className="rounded-2xl border border-brand-cream/15 bg-brand-teal-mid/30 p-6 font-display text-2xl font-semibold leading-snug md:text-3xl">
              Many talented artists never reach their potential — not because they lack skill, but because they lack
              guidance, structure and the right opportunities.
            </blockquote>
            <div className="space-y-4 text-brand-cream/80">
              <p>
                Over the past 27 years, Rohith Sobti has worked across music labels, films, artists, IPs and talent
                ecosystems.
              </p>
              <p className="text-lg font-semibold text-brand-cream">The Artist Path was created to solve that.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Framework journey */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <SectionHeading
          title="The framework"
          subtitle="Five pillars — one journey from self-discovery to sustainable career."
          align="center"
        />
        <div className="mt-14 hidden md:block">
          <div className="relative flex items-stretch justify-between gap-2">
            <div
              className="absolute left-[10%] right-[10%] top-8 h-0.5 bg-gradient-to-r from-brand-green via-brand-pumpkin to-brand-teal-mid"
              aria-hidden
            />
            {frameworkPillars.map((pillar, index) => {
              const Icon = frameworkIcons[index] ?? Sparkles;
              return (
                <div key={pillar.label} className="relative flex-1 text-center">
                  <div
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-brand-teal-deep/10 bg-white shadow-md"
                  >
                    <Icon className="h-7 w-7 text-brand-pumpkin" aria-hidden />
                  </div>
                  <p className="mt-4 text-xs font-bold uppercase tracking-widest text-brand-pumpkin">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-1 font-display text-lg font-bold text-brand-teal-deep">{pillar.label}</h3>
                  <p className="mt-1 text-sm text-brand-teal-deep/65">{pillar.description}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:hidden">
          {frameworkPillars.map((pillar, index) => {
            const Icon = frameworkIcons[index] ?? Sparkles;
            return (
              <div
                key={pillar.label}
                className="flex gap-4 rounded-xl border border-brand-teal-deep/10 bg-white p-5 shadow-sm"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-green-soft">
                  <Icon className="h-6 w-6 text-brand-green" aria-hidden />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-pumpkin">
                    {String(index + 1).padStart(2, '0')} · {pillar.label}
                  </p>
                  <p className="mt-1 text-sm text-brand-teal-deep/70">{pillar.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <SectionDivider />

      {/* Work phases timeline */}
      <section className="bg-brand-cream-muted/40 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading title="What you will work on" subtitle="Six phases from clarity to growth." />
          <div className="mt-12 space-y-0">
            {workPhases.map((phase, index) => {
              const Icon = phaseIcons[index] ?? Target;
              return (
                <div key={phase.id} className="relative flex gap-6 pb-10 last:pb-0">
                  {index < workPhases.length - 1 ? (
                    <div
                      className="absolute left-[23px] top-12 bottom-0 w-0.5 bg-brand-teal-deep/15 md:left-[27px]"
                      aria-hidden
                    />
                  ) : null}
                  <div
                    className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-brand-pumpkin bg-white shadow-sm md:h-14 md:w-14"
                  >
                    <Icon className="h-5 w-5 text-brand-pumpkin md:h-6 md:w-6" aria-hidden />
                  </div>
                  <div className="flex-1 rounded-2xl border border-brand-teal-deep/10 bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-brand-teal-deep px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-brand-cream">
                        Phase {index + 1}
                      </span>
                      <h3 className="font-display text-2xl font-bold text-brand-teal-deep">{phase.title}</h3>
                    </div>
                    <p className="mt-3 text-brand-teal-deep/70">{phase.intro}</p>
                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                      <ul className="space-y-2">
                        {phase.bullets.map((b) => (
                          <li key={b} className="flex gap-2 text-brand-teal-deep/80">
                            <span className="text-brand-green">→</span>
                            {b}
                          </li>
                        ))}
                      </ul>
                      <div className="rounded-xl bg-brand-green-soft/50 p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-brand-green">Outputs</p>
                        <ul className="mt-3 space-y-2">
                          {phase.outputs.map((o) => (
                            <li key={o} className="flex gap-2 text-sm text-brand-teal-deep/85">
                              <span className="text-brand-pumpkin">✓</span>
                              {o}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <SectionHeading
          title="What artists receive"
          subtitle="Every selected artist gets hands-on support across learning, mentoring and industry access."
        />
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {artistBenefits.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-xl border border-brand-teal-deep/10 bg-white px-4 py-3.5 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-pumpkin/15 text-xs text-brand-pumpkin">
                ✓
              </span>
              <span className="text-brand-teal-deep/85">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <SectionDivider />

      {/* Industry + Business */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="rounded-2xl border border-brand-teal-deep/10 bg-white p-6 shadow-sm md:p-8">
            <SectionHeading title="Industry exposure" />
            <p className="mt-4 text-brand-teal-deep/70">
              Throughout the program, artists interact with professionals across the ecosystem:
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {industryExposure.map((role) => (
                <span
                  key={role}
                  className="rounded-lg border border-brand-teal-deep/10 bg-brand-cream-muted/50 px-3 py-1.5 text-sm text-brand-teal-deep/80"
                >
                  {role}
                </span>
              ))}
            </div>
            <p className="mt-6 text-sm text-brand-teal-deep/60">
              Building a career requires understanding more than music alone.
            </p>
          </div>
          <div className="rounded-2xl border border-brand-pumpkin/20 bg-gradient-to-br from-brand-pumpkin-soft to-white p-6 shadow-sm md:p-8">
            <SectionHeading title="Understanding the business" />
            <p className="mt-4 text-brand-teal-deep/70">Practical understanding of how money flows through music:</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {businessTopics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-lg bg-brand-teal-deep px-3 py-1.5 text-sm font-medium text-brand-cream"
                >
                  {topic}
                </span>
              ))}
            </div>
            <p className="mt-6 font-semibold text-brand-teal-deep">
              Every artist should understand how money flows through music.
            </p>
          </div>
        </div>
      </section>

      {/* Program structure */}
      <section className="relative overflow-hidden bg-brand-teal-deep py-16 md:py-20">
        <BrandPattern variant="hero" className="pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-6xl px-4">
          <SectionHeading title="Program structure" light align="center" />
          <dl className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: 'Duration', value: siteConfig.program.duration },
              { label: 'Start date', value: siteConfig.program.startDate },
              { label: 'Format', value: siteConfig.program.format },
              { label: 'Artists selected', value: String(siteConfig.program.artistsSelected) },
              { label: 'Scholarship seats', value: siteConfig.program.scholarshipSeats },
              { label: 'Development grant', value: siteConfig.program.developmentGrant },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-brand-cream/15 bg-brand-teal-mid/30 p-6 text-center backdrop-blur-sm"
              >
                <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-cream/55">
                  {item.label}
                </dt>
                <dd className="mt-2 font-display text-2xl font-bold text-brand-cream">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Who + Selection */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading title="Who should apply?" subtitle="Designed for artists already creating original music." />
            <ul className="mt-8 space-y-3">
              {whoShouldApply.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 rounded-lg border border-brand-teal-deep/10 bg-white px-4 py-3 shadow-sm"
                >
                  <Mic2 className="h-4 w-4 shrink-0 text-brand-green" aria-hidden />
                  <span className="text-brand-teal-deep/85">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeading title="Selection process" />
            <ol className="mt-8 space-y-4">
              {selectionSteps.map((step, index) => (
                <li key={step} className="flex items-center gap-4">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-pumpkin font-display text-sm font-bold text-white shadow-md shadow-brand-pumpkin/30"
                  >
                    {index + 1}
                  </span>
                  <span className="text-brand-teal-deep/85">{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-8 rounded-xl border border-brand-pumpkin/30 bg-brand-pumpkin-soft p-5">
              <p className="font-display text-xl font-bold text-brand-teal-deep">
                Only {siteConfig.program.artistsSelected} artists will be selected.
              </p>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <SectionHeading title="Frequently asked questions" align="center" />
        <div className="mt-10 mx-auto max-w-3xl space-y-3">
          {faqs.map((faq) => (
            <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </section>

      <FinalCtaSection />

      {/* Footer */}
      <footer className="relative border-t border-brand-teal-deep/10 bg-brand-cream-muted">
        <BrandPattern variant="footer" className="pointer-events-none absolute inset-0" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-brand-teal-deep/60 md:flex-row">
          <p>© {new Date().getFullYear()} {siteConfig.name}</p>
          <p>
            A program by{' '}
            <a
              href={siteConfig.tscWebsiteUrl}
              className="font-medium text-brand-teal-deep underline-offset-4 hover:underline"
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

'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';

import HeroSection from '@/components/sections/HeroSection';
import ProblemSection from '@/components/sections/ProblemSection';
import SolutionSection from '@/components/sections/SolutionSection';
import QuoteLine from '@/components/sections/QuoteLine';
import BrandCTASection from '@/components/sections/BrandCTASection';
import TeamSection from '@/components/sections/TeamSection';
import ArtistCTASection from '@/components/sections/ArtistCTASection';
import IPGallerySection from '@/components/sections/IPGallerySection';
import AcademySection from '@/components/sections/AcademySection';
import FAQSection from '@/components/sections/FAQSection';

/**
 * TSC Website 2.0 — Revamped Homepage
 *
 * Section order per TSC Main Site Flow & Structure:
 * 1. Hero (dual CTAs: Artist + Brand)
 * 2. Quote / Line
 * 3. The Problem (why the industry fails artists)
 * 4. The Solution (The Roundway — 5-stage ecosystem)
 * 5. Brand CTA (for partners)
 * 6. People / Credibility (Team)
 * 7. Quote / Line
 * 8. Artist CTA (Artist Path + Academy)
 * 9. Work Catalogue (IP Gallery)
 * 10. Quote / Line
 * 11. Featured Programmes (Academy)
 * 12. FAQs
 * 13. Footer (via _app.tsx / AppShell)
 */
export default function Home() {
  const [activeSection, setActiveSection] = useState('hero');
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        'hero', 'problem', 'solution', 'brand-collab',
        'team', 'artist-path-section', 'ip-gallery', 'academy', 'faq',
      ];

      const scrollPosition = window.scrollY + window.innerHeight / 3;

      sections.forEach((sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
          const { top, bottom } = element.getBoundingClientRect();
          const elementTop = top + window.scrollY;
          const elementBottom = bottom + window.scrollY;
          if (scrollPosition >= elementTop && scrollPosition <= elementBottom) {
            setActiveSection(sectionId);
          }
        }
      });
    };

    const throttledScroll = () => {
      if (!isScrolling) {
        setIsScrolling(true);
        handleScroll();
        setTimeout(() => setIsScrolling(false), 100);
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [isScrolling]);

  return (
    <>
      <Head>
        <title>The Shakti Collective — Unfolding Artists&apos; Force</title>
        <meta
          name="description"
          content="The Shakti Collective is a talent-first global culture engine — a living ecosystem where emerging artists Prepare, Create, Produce, Monetize, and Replicate their way to global impact."
        />
        <meta property="og:title" content="The Shakti Collective — Unfolding Artists' Force" />
        <meta
          property="og:description"
          content="From Meteors to Maestros. A living ecosystem for India's emerging artists and their brand partners."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="scroll-smooth">
        {/* 1. Hero */}
        <section id="hero">
          <HeroSection activeSection={activeSection} setActiveSection={setActiveSection} />
        </section>

        {/* 2. Opening Quote */}
        <QuoteLine
          quote="Talent is everywhere. Opportunity is not. We're changing that."
          bg="cream"
        />

        {/* 3. The Problem */}
        <section id="problem">
          <ProblemSection />
        </section>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-pumpkin/30 to-transparent" />

        {/* 4. The Solution — The Roundway */}
        <section id="solution">
          <SolutionSection />
        </section>

        {/* 5. Brand Partner CTA */}
        <section id="brand-collab">
          <BrandCTASection />
        </section>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-cream/20 to-transparent" />

        {/* 6. People / Credibility */}
        <section id="team">
          <TeamSection />
        </section>

        {/* 7. Mid Quote */}
        <QuoteLine
          quote="We build sustainable music businesses where creativity and commerce thrive together."
          author="Rohit Sobti, Co-founder"
          bg="dark"
        />

        {/* 8. Artist CTA */}
        <section id="artist-path-section">
          <ArtistCTASection />
        </section>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-pumpkin/20 to-transparent" />

        {/* 9. Work Catalogue / IP Gallery */}
        <section id="ip-gallery">
          <IPGallerySection />
        </section>

        {/* 10. Pre-Academy Quote */}
        <QuoteLine
          quote="Your voice deserves more than an algorithm. It deserves a stage."
          bg="cream"
        />

        {/* 11. Featured Programmes — Academy */}
        <section id="academy">
          <AcademySection />
        </section>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-cream/10 to-transparent" />

        {/* 12. FAQs */}
        <section id="faq">
          <FAQSection />
        </section>
      </main>

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        body {
          overflow-x: hidden;
        }
        .scroll-behavior-auto {
          scroll-behavior: auto !important;
        }
      `}</style>
    </>
  );
}

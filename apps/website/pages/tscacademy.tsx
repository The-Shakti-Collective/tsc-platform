'use client';

import React from 'react';
import Head from 'next/head';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

import AcademyHero from '@/components/sections/academy/AcademyHero';
import AcademyAbout from '@/components/sections/academy/AcademyAbout';
import AcademyInitiatives from '@/components/sections/academy/AcademyInitiatives';
import AcademyCourses from '@/components/sections/academy/AcademyCourses';
import AcademyMentors from '@/components/sections/academy/AcademyMentors';
import AcademyTestimonials from '@/components/sections/academy/AcademyTestimonials';
import AcademyBookCall from '@/components/sections/academy/AcademyBookCall';
import AcademyCTA from '@/components/sections/academy/AcademyCTA';

/**
 * TSC Academy Page
 * 
 * Migrated from cloned repository.
 * Converted to Next.js components while maintaining original content and structure.
 */
export default function AcademyPage() {
  return (
    <>
      <Head>
        <title>TSC Academy — Unfolding Artist Force | Learn from Industry Legends</title>
        <meta 
          name="description" 
          content="TSC Academy - India's premier music academy. Learn from industry legends like Sandesh Shandilya and Prasad Khaparde. Professional music courses, masterclasses, and mentorship." 
        />
        <meta property="og:title" content="TSC Academy — Unfolding Artist Force" />
        <meta 
          property="og:description" 
          content="We help artists attain their maximum potential by providing right learning, guidance, incubation & acceleration." 
        />
      </Head>

      <main className="overflow-x-hidden">
        {/* 1. Hero Section */}
        <section id="hero">
          <AcademyHero />
        </section>

        {/* 2. About / Story Section */}
        <section id="about">
          <AcademyAbout />
        </section>

        {/* 3. Initiatives Section */}
        <section id="initiatives">
          <AcademyInitiatives />
        </section>

        {/* 4. Courses Section */}
        <section id="courses">
          <AcademyCourses />
        </section>

        {/* 5. Mentors Section */}
        <section id="mentors">
          <AcademyMentors />
        </section>

        {/* 6. Testimonials Section */}
        <section id="testimonials">
          <AcademyTestimonials />
        </section>

        {/* 7. Book a Call Section */}
        <section id="book-a-call">
          <AcademyBookCall />
        </section>

        {/* 8. CTA Section */}
        <section id="cta">
          <AcademyCTA />
        </section>
      </main>

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        body {
          background-color: #FDF6F1; /* matches 'cream' in tailwind.config.js */
        }
      `}</style>
    </>
  );
}

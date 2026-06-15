import React from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ARTIST_PATH_FORM_PATH } from '@/lib/siteUrls';

import ResourcesInstagram from '@/components/sections/ResourcesInstagram';
import ResourcesBlogs from '@/components/sections/ResourcesBlogs';
import ResourcesTools from '@/components/sections/ResourcesTools';

/**
 * Resources Page — TSC Revamp
 * Creative hub for artists: Instagram, blogs, free tools
 */
export default function ResourcesPage() {
  return (
    <>
      <Head>
        <title>Resources — The Shakti Collective</title>
        <meta
          name="description"
          content="Your hub for inspiration, knowledge, and free tools to elevate your craft. Curated resources from The Shakti Collective for emerging artists."
        />
      </Head>

      <main className="bg-cream min-h-screen">
        {/* Page Header */}
        <section className="relative pt-36 pb-24 sm:pt-40 sm:pb-28 px-4 sm:px-6 overflow-hidden bg-black">
          {/* Background blobs */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange/10 via-black to-black pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-pumpkin/10 rounded-full blur-3xl pointer-events-none" />

          {/* Ripple accent */}
          <motion.div
            className="absolute top-16 right-16 w-64 h-64 rounded-full border border-cream/5 pointer-events-none"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-16 right-16 w-40 h-40 rounded-full border border-cream/10 pointer-events-none"
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 4, repeat: Infinity }}
          />

          <div className="max-w-5xl mx-auto relative z-10">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-pumpkin font-black text-xs uppercase tracking-[0.3em] mb-4 font-alan-sans"
            >
              Artist Resources
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-cream font-signika mb-6 leading-tight"
            >
              Everything you need<br className="hidden sm:block" />
              to grow your craft.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-base sm:text-lg text-cream/60 max-w-2xl font-alan-sans leading-relaxed"
            >
              Curated inspiration, actionable knowledge, and free tools — all in one place. Built for emerging artists who are serious about their journey.
            </motion.p>

            {/* Quick category nav */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35 }}
              className="flex flex-wrap gap-3 mt-8"
            >
              {['Instagram Insights', 'Blog & Playbooks', 'Free Tools'].map((cat) => (
                <span
                  key={cat}
                  className="px-4 py-2 rounded-full border border-cream/20 text-cream/60 text-xs font-alan-sans font-medium hover:border-cream/50 hover:text-cream transition-all cursor-pointer"
                >
                  {cat}
                </span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Content sections */}
        <ResourcesInstagram />
        <ResourcesBlogs />
        <ResourcesTools />

        {/* Bottom CTA */}
        <section className="bg-black py-20 px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-cream font-signika mb-4">
              Ready to take your path?
            </h2>
            <p className="text-cream/60 font-alan-sans mb-8">
              Resources are just the start. The Artist Path questionnaire maps your complete journey through our ecosystem.
            </p>
            <a
              href={ARTIST_PATH_FORM_PATH}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-pumpkin text-cream font-bold font-signika text-base hover:bg-pumpkin/90 transition-all hover:scale-105 shadow-lg shadow-pumpkin/30"
            >
              Take the Artist Path <ArrowRight size={18} />
            </a>
          </motion.div>
        </section>
      </main>
    </>
  );
}

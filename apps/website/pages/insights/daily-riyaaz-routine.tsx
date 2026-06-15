import React from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';

export default function DailyRiyaazRoutine() {
  return (
    <>
      <Head>
        <title>The Daily Riyaaz Routine - The Shakti Collective</title>
        <meta
          name="description"
          content="A practical guide to improving your voice (even if you only have 20 minutes). Discover the ideal daily structure."
        />
      </Head>

      <main className="bg-cream min-h-screen pt-24 sm:pt-32 pb-16">
        <article className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <header className="mb-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-pumpkin font-black text-xs uppercase tracking-widest mb-4 font-alan-sans"
            >
              Insights & Guides
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-orange font-signika mb-6"
            >
              The Daily Riyaaz Routine
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center text-sm text-slate-medium font-alan-sans gap-4"
            >
              <span>May 2, 2026</span>
              <span>•</span>
              <span>7 min read</span>
            </motion.div>
          </header>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full h-64 sm:h-96 rounded-2xl overflow-hidden shadow-lg mb-12"
          >
            <img
              src="/assets/Patterns/LogoArtboard 19@300x-8.png"
              alt="The Daily Riyaaz Routine"
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="prose prose-lg prose-orange max-w-none text-slate-dark font-alan-sans"
          >
            <p className="lead text-xl text-orange font-semibold mb-8">
              A practical guide to improving your voice (even if you only have 20 minutes). Discover the ideal daily structure.
            </p>

            <h2 className="text-3xl font-bold text-orange font-signika mt-12 mb-6">Consistency over Duration</h2>
            <p className="mb-6 leading-relaxed">
              When it comes to vocal training, consistency is far more valuable than marathon sessions. Practicing for 20 minutes every single day will yield vastly superior results to practicing for three hours once a week. Your vocal cords are muscles, and they require regular, focused engagement to build strength, flexibility, and muscle memory.
            </p>

            <h2 className="text-3xl font-bold text-orange font-signika mt-12 mb-6">The 20-Minute Riyaaz Framework</h2>
            <p className="mb-6 leading-relaxed">
              If you only have 20 minutes, here is how you should structure your daily Riyaaz (practice) to maximize efficiency.
            </p>

            <h3 className="text-2xl font-bold text-orange mt-8 mb-4">Minutes 1-5: Physical & Breath Warm-up</h3>
            <p className="mb-4 leading-relaxed">
              Never start singing cold. Begin with gentle physical stretches to release tension in the neck, shoulders, and jaw. Follow this with foundational breathing exercises.
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Neck rolls and shoulder shrugs.</li>
              <li>Deep diaphragmatic breaths (inhale for 4 counts, hold for 4, exhale for 8).</li>
              <li>Gentle lip trills without pitch.</li>
            </ul>

            <h3 className="text-2xl font-bold text-orange mt-8 mb-4">Minutes 6-12: Vocal Warm-up & Flexibility</h3>
            <p className="mb-4 leading-relaxed">
              Gradually introduce pitch. Start in the middle of your range and slowly expand outward.
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Humming ascending and descending scales.</li>
              <li>Lip trills and tongue trills on a siren (sliding continuously from low to high and back).</li>
              <li>Vowel exercises (e.g., "Mee-May-Mah-Moh-Moo") focusing on smooth transitions.</li>
            </ul>

            <h3 className="text-2xl font-bold text-orange mt-8 mb-4">Minutes 13-20: Repertoire Application</h3>
            <p className="mb-4 leading-relaxed">
              Spend the final minutes applying your warmed-up voice to actual repertoire. Don't just sing through a song mindlessly. Target specific challenging phrases.
            </p>
            <ul className="list-disc pl-6 mb-8 space-y-2">
              <li>Isolate a tricky run or a high note.</li>
              <li>Practice it slowly on a lip trill first, then with lyrics.</li>
              <li>Record yourself to objectively evaluate your progress.</li>
            </ul>

            <div className="bg-orange/10 p-8 rounded-xl border border-orange/20 mt-12 text-center">
              <h3 className="text-2xl font-bold text-orange font-signika mb-4">Elevate Your Practice</h3>
              <p className="text-slate-medium mb-6">Access professional vocal scales, backing tracks, and personalized coaching.</p>
              <a href="/academy" className="inline-block bg-orange hover:bg-orange-dark text-cream font-semibold py-3 px-8 rounded-lg transition-colors">
                Discover Training Programs
              </a>
            </div>
          </motion.div>
        </article>
      </main>
    </>
  );
}

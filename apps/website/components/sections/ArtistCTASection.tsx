import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ARTIST_PATH_FORM_PATH, ARTIST_PATH_LANDING_URL } from '@/lib/siteUrls';

/**
 * ArtistCTASection — Full-width CTA targeting artists
 * Positioned after the People / Credibility section
 */
export default function ArtistCTASection() {
  return (
    <section
      id="artist-path-section"
      className="relative py-24 sm:py-32 md:py-40 px-4 sm:px-6 bg-white overflow-hidden"
    >
      {/* Decorative circles */}
      <motion.div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full border border-orange/10 pointer-events-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full border border-orange/10 pointer-events-none"
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-orange font-black text-xs uppercase tracking-[0.3em] mb-4 font-alan-sans"
        >
          For Artists
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-black font-signika leading-tight mb-6"
        >
          Your journey starts<br className="hidden sm:block" /> with one question.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-base sm:text-lg md:text-xl text-black/60 font-alan-sans leading-relaxed mb-10 sm:mb-12 max-w-2xl mx-auto"
        >
          Who are you as an artist? What do you want to create? Where do you want to go? Take the Artist Path questionnaire and let us help map your future.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          viewport={{ once: true }}
          className="flex flex-col gap-6 justify-center items-center px-4"
        >
          <a
            href={ARTIST_PATH_FORM_PATH}
            className="w-full max-w-[320px] px-10 py-5 rounded-full bg-orange text-white font-bold font-signika text-base sm:text-lg tracking-wide hover:bg-orange/90 transition-all duration-300 shadow-lg shadow-orange/30 hover:shadow-orange/50 hover:scale-105 text-center"
          >
            <span className="flex items-center justify-center gap-2">Apply to Artist Path <ArrowRight size={20} /></span>
          </a>
          <a
            href={ARTIST_PATH_LANDING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full max-w-[320px] px-10 py-5 rounded-full border-2 border-black/20 text-black font-bold font-signika text-base sm:text-lg tracking-wide hover:border-black hover:bg-black/5 transition-all duration-300 hover:scale-105 text-center"
          >
            About the program
          </a>
          <a
            href="https://tscacademy.in"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full max-w-[320px] px-10 py-5 rounded-full border-2 border-black/20 text-black font-bold font-signika text-base sm:text-lg tracking-wide hover:border-black hover:bg-black/5 transition-all duration-300 hover:scale-105 text-center"
          >
            Explore TSC Academy
          </a>
        </motion.div>
      </div>
    </section>
  );
}

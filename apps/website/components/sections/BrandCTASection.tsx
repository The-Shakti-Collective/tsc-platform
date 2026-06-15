import React from 'react';
import { motion } from 'framer-motion';

import { ArrowRight } from 'lucide-react';

/**
 * BrandCTASection — Full-width CTA targeting brands/partners
 * Positioned between Ecosystem and People sections
 */
export default function BrandCTASection() {
  return (
    <section
      id="brand-collab"
      className="relative py-20 sm:py-24 md:py-28 px-4 sm:px-6 bg-white overflow-hidden"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(0,0,0,0.1) 0%, transparent 60%), radial-gradient(circle at 70% 50%, rgba(0,0,0,0.05) 0%, transparent 60%)',
      }} />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-10 sm:gap-14">
          {/* Text */}
          <div className="flex-1 text-center lg:text-left">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-black/40 font-black text-xs uppercase tracking-[0.3em] mb-4 font-alan-sans"
            >
              For Brands & Partners
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-black font-signika leading-tight mb-6"
            >
              Culture doesn&apos;t happen in boardrooms.<br className="hidden sm:block" />
              <span className="text-black/40">It happens in studios.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-black/60 font-alan-sans text-base sm:text-lg leading-relaxed mb-8"
            >
              Partner with The Shakti Collective to co-create cultural IP that resonates authentically with India&apos;s next generation of consumers. Build with artists who live the culture.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <a
                href="/query"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-orange text-white font-bold font-signika text-base hover:bg-orange/90 transition-all duration-300 hover:scale-105 shadow-xl whitespace-nowrap"
              >
                Partner With Us <ArrowRight size={20} />
              </a>
            </motion.div>
          </div>

          {/* Stats column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="flex-shrink-0 grid grid-cols-2 gap-4 sm:gap-5 w-full max-w-xs sm:max-w-sm"
          >
            {[
              { val: '30+', label: 'Brand Collabs' },
              { val: '7B+', label: 'Combined Streams' },
              { val: '50+', label: 'Artists Mentored' },
              { val: '4+', label: 'Active IPs' },
            ].map((s, i) => (
              <div
                key={i}
                className="p-5 sm:p-6 rounded-2xl bg-black/5 border border-black/10 text-center"
              >
                <div className="text-3xl sm:text-4xl font-black font-signika text-black mb-1">{s.val}</div>
                <div className="text-xs text-black/40 font-alan-sans uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

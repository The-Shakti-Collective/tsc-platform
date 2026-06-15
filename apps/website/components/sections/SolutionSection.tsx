import React from 'react';
import { motion } from 'framer-motion';
import ReadMore from '@/components/ui/ReadMore';

import { ArrowRight } from 'lucide-react';

/**
 * SolutionSection — "The Roundway" / TSC's 5-stage ecosystem
 * How TSC solves the problem: Prepare -> Create -> Produce -> Monetize -> Replicate
 */
export default function SolutionSection() {
  const stages = [
    {
      num: '01',
      label: 'PREPARE',
      title: 'Build Your Foundation',
      desc: 'Master fundamentals through industry-led courses, masterclasses, and one-on-one mentorship from legends who\'ve built India\'s biggest music IPs.',
      accent: '#FF8C00', // Orange
    },
    {
      num: '02',
      label: 'CREATE',
      title: 'Find Your Voice',
      desc: 'Access world-class studios and Creation Cafés. Collaborate with peers in facilitated environments designed for innovation and experimentation.',
      accent: '#FF8C00', // Orange
    },
    {
      num: '03',
      label: 'PRODUCE',
      title: 'Make It Real',
      desc: 'Get funding, technical support, and production resources. From grants to recording to distribution — we\'ve built the infrastructure.',
      accent: '#FF8C00', // Orange
    },
    {
      num: '04',
      label: 'MONETIZE',
      title: 'Turn Craft into Commerce',
      desc: 'Connect with brands and cultural partners. Earn authentic, values-aligned income through collaborations that respect your artistic soul.',
      accent: '#FF8C00', // Orange
    },
    {
      num: '05',
      label: 'REPLICATE',
      title: 'Go Global',
      desc: 'Scale your impact. Expand to new markets, build communities, and influence culture across borders — from India to the world.',
      accent: '#FF8C00', // Orange
    },
  ];

  return (
    <section
      id="solution"
      className="relative py-20 sm:py-28 md:py-36 px-4 sm:px-6 bg-white overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-14 sm:mb-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-orange font-black text-xs uppercase tracking-[0.3em] mb-4 font-alan-sans"
          >
            The Solution
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-black font-signika leading-tight mb-6"
          >
            The Shakti Collective<br className="hidden sm:block" /> is{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange via-[#E07548] to-orange">The Roundway</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-base sm:text-lg text-black/70 font-alan-sans max-w-2xl mx-auto leading-relaxed"
          >
            Not a label. Not an agency. A living ecosystem — a complete journey from raw potential to global presence.
          </motion.p>
        </div>

        {/* 5-stage journey */}
        <div className="relative">
          {/* Connecting line - desktop */}
          <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-orange/30 to-transparent" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
            {stages.map((stage, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="relative group"
              >
                {/* Stage card */}
                <div className="rounded-2xl p-5 sm:p-6 border border-black/5 bg-black/5 backdrop-blur-sm hover:border-orange/40 hover:bg-black/10 transition-all duration-300 h-full shadow-sm">
                  {/* Number */}
                  <div className="text-6xl sm:text-7xl font-black font-signika text-black/5 absolute top-3 right-4 leading-none select-none">
                    {stage.num}
                  </div>

                  {/* Stage dot */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-4 relative z-10"
                    style={{ backgroundColor: stage.accent + '33', border: `1px solid ${stage.accent}` }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.accent }}
                    />
                  </div>

                  {/* Label */}
                  <div className="text-xs font-black uppercase tracking-[0.25em] text-orange mb-2 font-alan-sans relative z-10">
                    {stage.label}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-black font-signika mb-3 leading-snug relative z-10">
                    {stage.title}
                  </h3>

                  {/* Desc */}
                  <ReadMore 
                    text={stage.desc}
                    maxLength={60}
                    className="text-black/60 font-alan-sans text-xs sm:text-sm leading-relaxed relative z-10"
                  />
                </div>

                {/* Arrow connector */}
                {i < stages.length - 1 && (
                  <div className="hidden lg:flex absolute top-10 -right-3 z-20 items-center justify-center w-6 h-6">
                    <ArrowRight size={16} className="text-orange" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-14 sm:mt-20"
        >
          <p className="text-black/40 font-alan-sans text-sm uppercase tracking-[0.3em]">
            One ecosystem. Infinite possibilities.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

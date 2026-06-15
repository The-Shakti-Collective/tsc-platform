import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Target, CircleDollarSign } from 'lucide-react';
import ReadMore from '@/components/ui/ReadMore';

/**
 * ProblemSection — "The industry is broken for emerging artists"
 * Defines the gap TSC fills: talent exists, but no structure to sustain it.
 */
export default function ProblemSection() {
  const stats = [
    { value: '30%', label: 'Independent artists in streaming top charts' },
    { value: '70%', label: 'Established artists dominate revenue' },
    { value: '1 in 1000', label: 'Viral artists sustain a lasting career' },
  ];

  const problems = [
    {
      icon: <Zap className="w-8 h-8 text-orange" />,
      title: 'No Mentorship Structure',
      desc: 'Aspiring artists lack access to consistent, quality guidance from industry veterans who\'ve done it before.',
    },
    {
      icon: <Target className="w-8 h-8 text-orange" />,
      title: 'No Clear Path',
      desc: 'Without a roadmap from craft to career, most artists stay stuck in cycles of hustle with no sustainable progression.',
    },
    {
      icon: <CircleDollarSign className="w-8 h-8 text-orange" />,
      title: 'No Monetization Framework',
      desc: 'Creating is one thing. Turning your artistry into a business that funds your creative freedom is another entirely.',
    },
  ];

  return (
    <section
      id="problem"
      className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-white overflow-hidden"
    >
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, rgba(255, 140, 0, 0.05), rgba(255, 140, 0, 0.05) 1px, transparent 1px, transparent 48px), repeating-linear-gradient(90deg, rgba(255, 140, 0, 0.05), rgba(255, 140, 0, 0.05) 1px, transparent 1px, transparent 48px)',
      }} />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-orange font-black text-xs uppercase tracking-[0.3em] mb-4 font-alan-sans text-center"
        >
          The Reality
        </motion.p>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-black font-signika text-center leading-tight mb-6 sm:mb-8"
        >
          Most artists are{' '}
          <span className="text-orange">Meteors</span> —<br className="hidden sm:block" />
          brilliant flashes that fade fast.
        </motion.h2>

        <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-base sm:text-lg md:text-xl text-black/70 font-alan-sans leading-relaxed"
          >
            <ReadMore 
              text="The music industry is broken for emerging artists. Talent is everywhere. Mentorship, structure, and monetization pathways are not. The gap between potential and opportunity has never been wider."
              maxLength={120}
            />
          </motion.div>
        </div>

        {/* Stats grid — Side-by-side on desktop, vertical on mobile */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-16 sm:mb-20 items-center justify-center">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              viewport={{ once: true }}
              className="text-center py-8 md:py-14 px-6 md:px-12 rounded-[2.5rem] md:rounded-[4rem] border border-black/5 bg-black/[0.03] backdrop-blur-sm flex flex-col items-center justify-center min-h-[180px] md:min-h-[280px] w-full md:w-1/3 max-w-[320px] md:max-w-none hover:border-orange/20 transition-all duration-500"
            >
              <div className="text-4xl sm:text-5xl md:text-7xl font-black text-orange font-signika mb-2 md:mb-4">{stat.value}</div>
              <div className="text-xs sm:text-sm md:text-lg text-black/60 font-alan-sans leading-snug max-w-[180px] md:max-w-[200px]">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* The problems */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {problems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: i * 0.15 + 0.2 }}
              viewport={{ once: true }}
              className="p-6 sm:p-8 rounded-2xl bg-white text-black border-orange/20 transition-all shadow-sm"
            >
              <div className="mb-4">{item.icon}</div>
              <h3 className="text-lg sm:text-xl font-bold font-signika mb-3 text-orange">{item.title}</h3>
              <ReadMore 
                text={item.desc}
                maxLength={80}
                className="text-black/70 font-alan-sans text-sm sm:text-base leading-relaxed"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

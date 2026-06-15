import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import { ArrowRight } from 'lucide-react';

/**
 * Hero Section - TSC Revamp
 * "Unfolding artists' force" — talent-first culture engine
 * Dual CTAs: Artists + Brands
 */
export default function HeroSection({
  activeSection,
  setActiveSection,
}: {
  activeSection?: string;
  setActiveSection?: (section: string) => void;
}) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReducedMotion(prefersReducedMotion);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 },
    },
  };

  const lineVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  };

  const scrollToSection = (id: string) => {
    if (setActiveSection) setActiveSection(id);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const rippleColors = [
    '#B74B02', '#FF8C00', '#D4622D', '#E07548', '#FFB347',
    '#FFCC33', '#B74B02', '#FF8C00', '#D4622D', '#E07548',
    '#FFB347', '#FFCC33',
  ];

  const ripplePositions = [
    [150, 200], [500, 120], [850, 180], [80, 450], [120, 750],
    [300, 900], [550, 950], [880, 820], [920, 350], [950, 600],
    [250, 500], [750, 520],
  ];

  return (
    <section
      id="hero"
      className="relative w-screen min-h-screen overflow-hidden bg-white flex flex-col items-center justify-center"
    >
      {/* ── Background layers ── */}
      <div className="absolute inset-0 bg-white" />

      {/* YouTube Background Video - Commented out per user request */}
      {/* 
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-60">
        <iframe
          className="absolute top-1/2 left-1/2 w-[110%] h-[110%] -translate-x-1/2 -translate-y-1/2 object-cover aspect-video scale-150"
          src="https://www.youtube.com/embed/qvkbLqffHds?autoplay=1&mute=1&loop=1&playlist=qvkbLqffHds&controls=0&showinfo=0&rel=0&modestbranding=1"
          allow="autoplay; encrypted-media"
          frameBorder="0"
          allowFullScreen
        ></iframe>
        <div className="absolute inset-0 bg-white/20" />
      </div>
      */}

      {/* Restored Background Animation: Floating Ripples */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {ripplePositions.map((pos, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-[100px] opacity-[0.12]"
            style={{
              backgroundColor: rippleColors[i % rippleColors.length],
              left: `${(pos[0] / 1000) * 100}%`,
              top: `${(pos[1] / 1000) * 100}%`,
              width: '450px',
              height: '450px',
              marginLeft: '-225px',
              marginTop: '-225px',
            }}
            animate={!reducedMotion ? {
              scale: [1, 1.15, 1],
              x: [0, 30, 0],
              y: [0, -30, 0],
            } : {}}
            transition={{
              duration: 10 + i,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Orange glow — top-right */}
      <motion.div
        className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-br from-orange/20 via-orange/10 to-transparent rounded-full blur-3xl opacity-30 pointer-events-none"
        animate={!reducedMotion ? { y: [0, -20, 0], x: [0, 10, 0] } : {}}
        transition={!reducedMotion ? { duration: 8, repeat: Infinity, ease: 'easeInOut' } : {}}
      />

      {/* Orange glow — bottom-left */}
      <motion.div
        className="absolute bottom-0 left-0 w-56 sm:w-80 h-56 sm:h-80 bg-gradient-to-br from-orange/20 to-transparent rounded-full blur-3xl opacity-20 pointer-events-none"
        animate={!reducedMotion ? { y: [0, 20, 0], x: [0, -10, 0] } : {}}
        transition={!reducedMotion ? { duration: 10, repeat: Infinity, ease: 'easeInOut' } : {}}
      />

      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{ backgroundImage: 'url("/patterns/textures/dots.svg")', backgroundSize: '36px 36px' }}
      />

      {/* ── Main content ── */}
      <motion.div
        className="relative z-10 w-full max-w-5xl mx-auto px-5 sm:px-8 md:px-12 text-center flex flex-col items-center pt-12 pb-16 sm:pt-14 sm:pb-20 md:pt-16 md:pb-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-orange font-black text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.3em] mb-4 sm:mb-5 md:mb-6 font-alan-sans"
        >
          A Talent-First Global Culture Engine
        </motion.p>

        {/* Main headline */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-6 sm:mb-8 md:mb-10 w-full"
        >
          {/* METEORS */}
          <motion.h1
            variants={lineVariants}
            className="text-[13vw] xs:text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold font-signika text-black leading-[0.88] tracking-tighter"
          >
            METEORS
          </motion.h1>

          {/* "to" divider */}
          <motion.div
            variants={lineVariants}
            className="flex items-center justify-center gap-3 sm:gap-5 my-2 sm:my-3"
          >
            <div className="h-px bg-orange/50 flex-1 max-w-[60px] sm:max-w-[100px] md:max-w-[140px]" />
            <span className="text-orange font-alan-sans text-xs sm:text-sm uppercase tracking-[0.25em]">to</span>
            <div className="h-px bg-orange/50 flex-1 max-w-[60px] sm:max-w-[100px] md:max-w-[140px]" />
          </motion.div>

          {/* MAESTROS */}
          <motion.h1
            variants={lineVariants}
            className="text-[13vw] xs:text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold font-signika text-transparent bg-clip-text bg-gradient-to-r from-black via-orange to-black leading-[0.88] tracking-tighter"
          >
            MAESTROS
          </motion.h1>
        </motion.div>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="text-sm sm:text-base md:text-lg text-black/80 font-bold font-alan-sans leading-relaxed max-w-xl md:max-w-2xl mx-auto mb-8 sm:mb-10 md:mb-12 drop-shadow-sm"
        >
          Unfolding artists&apos; force — a living ecosystem where emerging talent prepares, creates, produces, and monetizes their craft globally.
        </motion.p>

        {/* Dual CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full max-w-sm sm:max-w-none"
        >
          {/* Artist CTA — filled */}
          <button
            onClick={() => scrollToSection('artist-path-section')}
            className="w-full sm:w-auto px-7 sm:px-9 py-3.5 sm:py-4 rounded-full bg-orange text-white font-bold font-signika text-sm sm:text-base tracking-wide hover:bg-orange/90 transition-all duration-300 shadow-lg shadow-orange/30 hover:shadow-orange/50 hover:scale-[1.03] active:scale-[0.98] whitespace-nowrap"
          >
            <span className="flex items-center justify-center gap-2">I&apos;m an Artist <ArrowRight size={18} /></span>
          </button>

          {/* Brand CTA — ghost */}
          <button
            onClick={() => scrollToSection('brand-collab')}
            className="w-full sm:w-auto px-7 sm:px-9 py-3.5 sm:py-4 rounded-full border-2 border-black/20 text-black font-bold font-signika text-sm sm:text-base tracking-wide hover:border-black/50 hover:bg-black/5 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] whitespace-nowrap"
          >
            I&apos;m a Brand
          </button>
        </motion.div>
      </motion.div>

      {/* Corner accents — hidden on very small screens */}
      <div className="hidden sm:block absolute top-6 left-6 md:top-8 md:left-8 w-12 md:w-16 h-12 md:h-16 border-l-2 border-t-2 border-black/5" />
      <div className="hidden sm:block absolute bottom-6 right-6 md:bottom-8 md:right-8 w-12 md:w-16 h-12 md:h-16 border-r-2 border-b-2 border-black/5" />
    </section>
  );
}

import React from 'react';
import { motion } from 'framer-motion';
import Container from '@/components/layout/Container';
import { AcademyButton } from '@/components/ui/AcademyButton';

export default function AcademyHero() {
  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-charcoal pt-12">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/academy/hero-academy.jpg"
          alt="TSC Academy"
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a8a]/50 via-[#172554]/70 to-pumpkin/50 z-10" />
        
        {/* Animated Orb */}
        <motion.div
          animate={{
            translate: [0, 50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -left-48 top-1/4 w-[600px] h-[600px] rounded-full bg-radial-gradient from-[#1e3a8a]/60 via-pumpkin/40 to-transparent blur-[80px] z-20"
        />
      </div>

      <Container className="relative z-30">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs font-bold tracking-[0.3em] text-cream/70 uppercase mb-8 font-alan-sans"
          >
            WELCOME TO TSC ACADEMY
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-cream mb-8 font-signika leading-[1.1] tracking-tight"
          >
            Unfolding <br />
            <span className="text-pumpkin">Artist Force</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="w-20 h-0.5 bg-gradient-to-r from-[#1e3a8a] to-pumpkin mb-8 origin-left"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg md:text-xl text-cream/85 mb-12 font-alan-sans leading-relaxed max-w-xl"
          >
            We help artists who aspire to go professional attain their maximum
            potential by providing right learning, guidance, incubation & acceleration.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-wrap gap-6"
          >
            <AcademyButton
              variant="gradient"
              onClick={() => {
                const el = document.getElementById('courses');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Explore Courses
            </AcademyButton>
            
            <AcademyButton
              variant="outline"
              onClick={() => {
                const el = document.getElementById('initiatives');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Our Initiatives
            </AcademyButton>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

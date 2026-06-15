import React from 'react';
import { motion } from 'framer-motion';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';
import { AcademyButton } from '@/components/ui/AcademyButton';

export default function AcademyCTA() {
  return (
    <Section id="cta" padding="xl" className="relative overflow-hidden bg-gradient-to-br from-[#1e3a8a] to-[#172554]">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-pumpkin/10 rounded-full blur-[100px] -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1e3a8a]/20 rounded-full blur-[100px] -ml-48 -mb-48" />

      <Container className="relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold text-cream font-signika mb-8 leading-tight"
          >
            Ready to Begin Your <br /> Musical Journey?
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-cream/80 font-alan-sans mb-12"
          >
            Join TSC Academy and learn from the best in the industry. <br className="hidden md:block" />
            Unfold your true potential as a musician.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-6"
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
                window.location.href = '/masterclass/sandesh-shandilya';
              }}
            >
              View Masterclasses
            </AcademyButton>
          </motion.div>
        </div>
      </Container>
    </Section>
  );
}

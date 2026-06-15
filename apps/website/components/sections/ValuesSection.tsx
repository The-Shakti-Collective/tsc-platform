import React from 'react';
import { motion } from 'framer-motion';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';

import { Zap, ShieldCheck, Sun, Eye } from 'lucide-react';

interface Value {
  title: string;
  description: string;
  icon: React.ReactNode;
}

/**
 * Values Section
 * 4 value cards with Lucide icons
 */
export default function ValuesSection() {
  const values: Value[] = [
    {
      title: 'Fearlessness',
      description: 'We embrace risk and boldly challenge the status quo.',
      icon: <Zap className="w-12 h-12 text-orange" />,
    },
    {
      title: 'Integrity',
      description: 'We champion authentic voices and transparent relationships.',
      icon: <ShieldCheck className="w-12 h-12 text-orange" />,
    },
    {
      title: 'Optimism',
      description: 'We believe in the power of culture to create positive change.',
      icon: <Sun className="w-12 h-12 text-orange" />,
    },
    {
      title: 'Transparency',
      description: 'We operate with openness and accountability in all partnerships.',
      icon: <Eye className="w-12 h-12 text-orange" />,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  return (
    <Section
      id="values"
      background="white"
      padding="xl"
      className="relative py-24"
    >
      <Container className="max-w-6xl">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-6 font-signika">
            Our Values
          </h2>
          <p className="text-lg text-black/60 font-alan-sans">
            The principles that guide everything we do
          </p>
        </motion.div>

        {/* Values grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              variants={itemVariants}
              className="group relative"
            >
              {/* Card */}
              <div
                style={{
                  backgroundColor: `#00000005`,
                  borderColor: `#00000010`,
                }}
                className="rounded-2xl p-8 h-full border hover:border-orange/40 transition-all duration-300 hover:shadow-lg"
              >
                {/* Icon */}
                <div className={`text-5xl mb-6 transition-transform duration-300 group-hover:scale-110`}>
                  {value.icon}
                </div>

                {/* Title */}
                <h3 className={`text-2xl font-bold text-black mb-3 font-signika`}>
                  {value.title}
                </h3>

                {/* Description */}
                <p className="text-black/70 font-alan-sans leading-relaxed">
                  {value.description}
                </p>

                {/* Hover effect - subtle lift */}
                <motion.div
                  initial={{ y: 0 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-black/40 text-lg font-alan-sans">
            These values shape how we work with artists, brands, and each other every single day.
          </p>
        </motion.div>
      </Container>
    </Section>
  );
}

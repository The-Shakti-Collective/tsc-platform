import React from 'react';
import { motion } from 'framer-motion';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';
import { Button } from '@/components/buttons/Button';

import { Layers, Clapperboard, Users, PenTool, Cpu, Rocket, TrendingUp } from 'lucide-react';

interface PartnershipModel {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface ProcessStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

/**
 * Collaborations Section
 * Brand partnership showcase and process
 */
export default function CollaborationsSection() {
  const models: PartnershipModel[] = [
    {
      id: 'model-1',
      title: 'Brand IP Creation',
      description: 'Co-create original cultural properties that align with your brand values',
      icon: <Layers className="w-10 h-10" />,
    },
    {
      id: 'model-2',
      title: 'Content Production',
      description: 'Leverage our talent pool for authentic brand storytelling',
      icon: <Clapperboard className="w-10 h-10" />,
    },
    {
      id: 'model-3',
      title: 'Artist Partnerships',
      description: 'Direct collaboration with emerging artists from our ecosystem',
      icon: <Users className="w-10 h-10" />,
    },
  ];

  const processSteps: ProcessStep[] = [
    {
      id: 'step-1',
      title: 'Brief',
      description: 'Share your vision and objectives',
      icon: <PenTool className="w-8 h-8" />,
    },
    {
      id: 'step-2',
      title: 'Create',
      description: 'Our team crafts authentic cultural IP',
      icon: <Cpu className="w-8 h-8" />,
    },
    {
      id: 'step-3',
      title: 'Launch',
      description: 'Release to audience across platforms',
      icon: <Rocket className="w-8 h-8" />,
    },
    {
      id: 'step-4',
      title: 'Scale',
      description: 'Amplify impact and measure success',
      icon: <TrendingUp className="w-8 h-8" />,
    },
  ];

  return (
    <Section
      id="collaborations"
      background="white"
      padding="xl"
      className="relative py-12 sm:py-16 md:py-24 bg-white"
    >
      <Container className="max-w-6xl px-4 sm:px-6">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-10 sm:mb-12 md:mb-16 text-center"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black mb-4 sm:mb-6 font-signika">
            Brand Partnerships
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-black/60 font-alan-sans max-w-2xl mx-auto">
            Creating authentic cultural IP that resonates with audiences worldwide
          </p>
        </motion.div>

        {/* Partnership models */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-12 sm:mb-16 md:mb-20"
        >
          <h3 className="text-xl sm:text-2xl font-bold text-black mb-6 sm:mb-8 font-signika text-center">
            Partnership Models
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {models.map((model, index) => (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
                className="bg-black/5 rounded-lg sm:rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8 border border-black/10 hover:bg-black/10 transition-all"
              >
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 text-orange">{model.icon}</div>
                <h4 className="text-lg sm:text-xl font-bold text-black mb-2 sm:mb-3 font-signika">
                  {model.title}
                </h4>
                <p className="text-black/60 font-alan-sans text-sm sm:text-base">
                  {model.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Process */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h3 className="text-xl sm:text-2xl font-bold text-black mb-6 sm:mb-8 md:mb-12 font-signika text-center">
            Our Process
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {processSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                viewport={{ once: true }}
                className="relative"
              >
                {/* Step number circle */}
                <div className="absolute -top-6 sm:-top-8 left-0 w-10 sm:w-12 h-10 sm:h-12 bg-orange text-white rounded-full flex items-center justify-center font-bold font-signika text-sm sm:text-lg">
                  {index + 1}
                </div>

                {/* Step card */}
                <div className="bg-black/5 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-black/10 pt-10 sm:pt-12">
                  <div className="text-3xl sm:text-4xl mb-2 sm:mb-3 text-orange">{step.icon}</div>
                  <h4 className="text-base sm:text-lg font-bold text-black mb-1 sm:mb-2 font-signika">
                    {step.title}
                  </h4>
                  <p className="text-black/60 font-alan-sans text-xs sm:text-sm">
                    {step.description}
                  </p>
                </div>

                {/* Connector line to next step */}
                {index < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 sm:top-12 left-full w-4 sm:w-6 h-0.5 bg-black/10" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-12 sm:mt-14 md:mt-16 text-center bg-black/5 rounded-lg sm:rounded-xl md:rounded-2xl p-6 sm:p-8 border border-black/10"
        >
          <h3 className="text-2xl sm:text-3xl font-bold text-black mb-3 sm:mb-4 font-signika">
            Ready to Collaborate?
          </h3>
          <p className="text-black/60 font-alan-sans text-sm sm:text-base mb-6 sm:mb-8 max-w-2xl mx-auto">
            Let's create cultural IP that resonates with your audience and makes an impact
          </p>
          <div className="flex justify-center">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                const contact = document.getElementById('contact');
                if (contact) {
                  contact.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Start Collab
            </Button>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}

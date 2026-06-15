import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowRight } from 'lucide-react';

/**
 * FAQSection — Common questions about TSC
 */
const faqs = [
  {
    q: 'Who is The Shakti Collective for?',
    a: 'TSC is for emerging and independent Indian artists — singers, songwriters, composers, producers, and musicians — who want to build a sustainable creative career without compromising their artistic soul.',
  },
  {
    q: 'What is TSC Academy?',
    a: 'TSC Academy is our education vertical at tscacademy.in. We offer masterclasses, online courses, and mentorship programs taught by legends like Sandesh Shandilya and Prasad Khaparde. It\'s where structured learning meets lived experience.',
  },
  {
    q: 'How does the Artist Path work?',
    a: 'The Artist Path is a questionnaire we use to understand where you are in your journey — your goals, your craft, your challenges. Based on your answers, we map out a personalised trajectory through our ecosystem.',
  },
  {
    q: 'What is "The Roundway"?',
    a: 'The Roundway is our 5-stage framework: Prepare -> Create -> Produce -> Monetize -> Replicate. It\'s a living cycle — not a linear path — designed to take artists from raw potential to global cultural impact.',
  },
  {
    q: 'Can brands work with TSC?',
    a: 'Absolutely. We work with brands to co-create authentic cultural IP, leveraging our roster of emerging artists and our deep understanding of India\'s music culture. If you\'re a brand looking to connect with the next generation, let\'s talk.',
  },
  {
    q: 'What is Main Bhi Artist?',
    a: 'Main Bhi Artist (MBA) is our community and activism IP — a home for quiet music dreamers. It\'s a rebellion dressed as community: safe, inspiring, and built to make every artist feel seen.',
  },
  {
    q: 'How do I get started?',
    a: 'Take the Artist Path questionnaire at /artist-path. It takes 5 minutes and gives us everything we need to understand your journey. From there, we\'ll suggest the right programmes, communities, and opportunities for you.',
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section
      id="faq"
      className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-white overflow-hidden"
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-orange font-black text-xs uppercase tracking-[0.3em] mb-4 font-alan-sans"
          >
            Common Questions
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-black font-signika leading-tight"
          >
            Everything you need to know
          </motion.h2>
        </div>

        {/* FAQ list */}
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              viewport={{ once: true }}
              className="border border-black/10 rounded-xl overflow-hidden bg-black/5"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 group"
              >
                <span className="text-base sm:text-lg font-bold text-black font-signika leading-snug group-hover:text-orange transition-colors">
                  {faq.q}
                </span>
                <motion.span
                  animate={{ rotate: open === i ? 45 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex-shrink-0 w-6 h-6 rounded-full border border-black/20 flex items-center justify-center text-black/60 group-hover:border-orange group-hover:text-orange transition-colors"
                >
                  <Plus size={16} />
                </motion.span>
              </button>

              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 text-black/70 font-alan-sans text-sm sm:text-base leading-relaxed border-t border-black/5 pt-4">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12 sm:mt-16"
        >
          <p className="text-black/40 font-alan-sans text-sm mb-4">Still have questions?</p>
          <a
            href="mailto:hello@theshaktcollective.com"
            className="inline-flex items-center gap-2 text-orange font-bold font-alan-sans hover:gap-3 transition-all"
          >
            Reach out to us <ArrowRight size={18} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

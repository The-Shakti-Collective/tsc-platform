import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function AcademyBookCall() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange/5 rounded-full blur-3xl -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1e3a8a]/5 rounded-full blur-3xl -ml-48 -mb-48" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-orange font-black text-xs uppercase tracking-[0.3em] mb-4 font-alan-sans"
            >
              Personal Guidance
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-black font-signika mb-6"
            >
              Still unsure where to start? Let&apos;s talk.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg text-black/60 font-alan-sans leading-relaxed mb-8"
            >
              Choosing the right mentorship is a pivotal decision in an artist&apos;s career. Whether you&apos;re curious about the curriculum, the mentorship style, or how our 360-degree support ecosystem works, we&apos;re here to provide clarity.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10"
            >
              {[
                { title: 'Personalized Roadmap', desc: 'Understand how our courses fit into your long-term career goals.' },
                { title: 'Curriculum Deep-dive', desc: 'Get specific details about modules, sessions, and outcomes.' },
                { title: 'Mentorship Access', desc: 'Learn how direct interactions with industry legends work.' },
                { title: 'Scholarship Info', desc: 'Ask about eligibility for our EWS and merit-based scholarships.' },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col">
                  <h4 className="font-bold text-black font-signika mb-1">{item.title}</h4>
                  <p className="text-sm text-black/50 font-alan-sans">{item.desc}</p>
                </div>
              ))}
            </motion.div>

            <motion.a
              href="/book-a-call"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-black text-white font-bold font-signika text-base hover:bg-black/90 transition-all hover:scale-105 shadow-xl shadow-black/10"
            >
              Book a Discovery Call <ArrowRight size={18} />
            </motion.a>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="flex-1 relative"
          >
            <div className="aspect-square rounded-2xl overflow-hidden bg-cream border border-black/5 shadow-2xl relative">
              <img 
                src="/assets/artist-consultation.png" 
                alt="Artist Consultation" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl border border-white/20">
                  <p className="text-sm font-bold text-black font-alan-sans italic">
                    &quot;Our mission is to ensure no talent goes unheard due to lack of direction.&quot;
                  </p>
                </div>
              </div>
            </div>
            {/* Abstract shapes */}
            <div className="absolute -top-6 -right-6 w-24 h-24 border-2 border-orange/20 rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 border border-[#1e3a8a]/10 rounded-full" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

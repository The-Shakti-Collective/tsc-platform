import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const categories = ['All', 'Production', 'Mixing', 'Vocals', 'Business'];

const freeTools = [
  {
    id: 1,
    title: 'Vital Synth',
    category: 'Production',
    description: 'A visual synthesizer. See what you play. Free spectral warping wavetable synth.',
    link: '#',
    image: '/assets/Patterns/LogoArtboard 20@300x-8.png',
  },
  {
    id: 2,
    title: 'Spitfire LABS',
    category: 'Production',
    description: 'An infinite series of free software instruments, made by musicians and sampling experts in London.',
    link: '#',
    image: '/assets/Patterns/LogoArtboard 19@300x-8.png',
  },
  {
    id: 3,
    title: 'Valhalla Supermassive',
    category: 'Mixing',
    description: 'Mind-blowing reverbs, delays, and modulation effects. Perfect for creating huge spaces.',
    link: '#',
    image: '/assets/Patterns/LogoArtboard 18@300x-8.png',
  },
  {
    id: 4,
    title: 'TDR Nova',
    category: 'Mixing',
    description: 'A parallel dynamic equalizer. Appears in the familiar layout of a parametric equalizer, with full dynamics processing.',
    link: '#',
    image: '/assets/Patterns/LogoArtboard 17@300x-8.png',
  },
  {
    id: 5,
    title: 'Vocal Doubler by iZotope',
    category: 'Vocals',
    description: 'A free plug-in designed to enhance your vocal with a natural doubling effect.',
    link: '#',
    image: '/assets/Patterns/LogoArtboard 20@300x-8.png',
  },
  {
    id: 6,
    title: 'Indie Artist Contract Templates',
    category: 'Business',
    description: 'Free split sheet and basic collaboration agreement templates for independent artists.',
    link: '#',
    image: '/assets/Patterns/LogoArtboard 19@300x-8.png',
  },
];

export default function ResourcesTools() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredTools = activeCategory === 'All'
    ? freeTools
    : freeTools.filter(tool => tool.category === activeCategory);

  return (
    <section className="py-16 sm:py-24 bg-white px-4 sm:px-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-orange font-black text-xs uppercase tracking-widest mb-2 font-alan-sans"
          >
            Curated Assets
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-black font-signika"
          >
            Free Tools & Assets
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-black/60 max-w-2xl mx-auto mt-4 text-sm sm:text-base"
          >
            A growing directory of the best free resources, plugins, and tools handpicked by our community of creators.
          </motion.p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-12">
          {categories.map((category, index) => (
            <motion.button
              key={category}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + index * 0.05 }}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeCategory === category
                  ? 'bg-orange text-white shadow-[0_0_15px_rgba(255,140,0,0.4)]'
                  : 'bg-black/5 text-black/70 hover:bg-black/10 hover:text-black'
              }`}
            >
              {category}
            </motion.button>
          ))}
        </div>

        {/* Tools Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <AnimatePresence mode="popLayout">
            {filteredTools.map((tool) => (
              <motion.div
                key={tool.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="bg-white border border-black/10 rounded-2xl overflow-hidden hover:shadow-xl transition-all group flex flex-col shadow-sm"
              >
                <div className="h-40 overflow-hidden relative">
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500 z-10"></div>
                  <img
                    src={tool.image}
                    alt={tool.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 right-4 z-20">
                    <span className="bg-black/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10">
                      {tool.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-black mb-2 font-signika group-hover:text-orange transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-black/60 text-sm leading-relaxed mb-6 flex-1">
                    {tool.description}
                  </p>
                  
                   <a
                    href={tool.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex items-center gap-2 text-orange font-semibold text-sm hover:text-orange/80 transition-colors"
                  >
                    <span>Get Resource</span>
                    <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

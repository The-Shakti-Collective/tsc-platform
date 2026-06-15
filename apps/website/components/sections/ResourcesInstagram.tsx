import React from 'react';
import { motion } from 'framer-motion';

const instagramEmbeds = [
  { id: '1', url: 'https://www.instagram.com/p/DXzNNvOk8Ob/embed' },
  { id: '2', url: 'https://www.instagram.com/p/DXwVb8-ExpP/embed' },
  { id: '3', url: 'https://www.instagram.com/p/DXtx8ZzE0WF/embed' },
];

export default function ResourcesInstagram() {
  return (
    <section className="py-16 sm:py-24 bg-cream px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-pumpkin font-black text-xs uppercase tracking-widest mb-2 font-alan-sans"
          >
            Social Highlights
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-black font-signika"
          >
            Latest on Instagram
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {instagramEmbeds.map((embed, index) => (
            <motion.div
              key={embed.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-md overflow-hidden aspect-[4/5] flex flex-col items-center justify-center border border-slate-lightest relative group"
            >
              <iframe 
                src={embed.url} 
                className="w-full h-full border-0 absolute top-0 left-0" 
                scrolling="no" 
                allowTransparency={true} 
                allow="encrypted-media"
                loading="lazy"
              ></iframe>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

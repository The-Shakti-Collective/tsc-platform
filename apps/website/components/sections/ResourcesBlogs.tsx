import React from 'react';
import { motion } from 'framer-motion';
import { Circle, ExternalLink } from 'lucide-react';

const blogPosts = [
  {
    id: 1,
    title: 'The Artist Release Playbook',
    excerpt: 'How to release your music without it getting lost. Learn the pre-release, release day, and post-release strategies.',
    link: '/insights/artist-release-playbook',
    pptLink: '#',
    image: '/assets/Patterns/LogoArtboard 17@300x-8.png',
    date: 'May 2, 2026',
    readTime: '6 min read',
  },
  {
    id: 2,
    title: 'Breathing Techniques & Vocal Texture',
    excerpt: 'Most singers think their problem is pitch. It’s not. It’s breath. How to improve your vocal texture practically.',
    link: '/insights/breathing-vocal-texture',
    pptLink: '#',
    image: '/assets/Patterns/LogoArtboard 18@300x-8.png',
    date: 'May 2, 2026',
    readTime: '5 min read',
  },
  {
    id: 3,
    title: 'The Daily Riyaaz Routine',
    excerpt: 'A practical guide to improving your voice (even if you only have 20 minutes). Discover the ideal daily structure.',
    link: '/insights/daily-riyaaz-routine',
    pptLink: '#',
    image: '/assets/Patterns/LogoArtboard 19@300x-8.png',
    date: 'May 2, 2026',
    readTime: '7 min read',
  },
];

export default function ResourcesBlogs() {
  return (
    <section className="py-16 sm:py-24 bg-white px-4 sm:px-6 border-t border-black/5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-orange font-black text-xs uppercase tracking-widest mb-2 font-alan-sans"
          >
            Insights & Guides
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-black font-signika"
          >
            From the Blog
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-black/60 max-w-2xl mx-auto mt-4 text-sm sm:text-base"
          >
            Dive deep into our curated articles on Medium, and download accompanying presentation decks for your own reference.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-black/5 group"
            >
              {/* Image Preview */}
              <div className="h-48 overflow-hidden relative">
                <div className="absolute inset-0 bg-orange/10 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8 flex-1 flex flex-col">
                <div className="flex items-center text-xs text-black/40 mb-3 font-alan-sans tracking-wide">
                  <span>{post.date}</span>
                  <Circle size={4} fill="currentColor" className="mx-2" />
                  <span>{post.readTime}</span>
                </div>
                
                <h3 className="text-xl sm:text-2xl font-bold text-black mb-3 font-signika leading-tight group-hover:text-orange transition-colors">
                  {post.title}
                </h3>
                
                <p className="text-black/60 text-sm leading-relaxed mb-6 flex-1">
                  {post.excerpt}
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 mt-auto pt-4 border-t border-black/5">
                  <a
                    href={post.link}
                    className="flex-1 flex items-center justify-center gap-2 bg-orange hover:bg-orange/80 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors font-alan-sans"
                  >
                    <span>Read Blog</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

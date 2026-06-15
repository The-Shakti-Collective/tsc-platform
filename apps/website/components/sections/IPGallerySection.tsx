import React from 'react';
import { motion } from 'framer-motion';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';

import { ArrowRight } from 'lucide-react';

interface IPItem {
  id: string;
  title: string;
  type: string;
  status: string;
  logline: string;
  thumbnail: string;
  link?: string;
}

/**
 * Work Catalogue (IP Gallery) — TSC's Active Cultural IPs
 * Revamped to match "Work Catalogue" branding from Site Flow doc
 */
export default function IPGallerySection() {
  const ipItems: IPItem[] = [
    {
      id: 'ip-1',
      title: 'Mahavatar Narsimha',
      type: 'Business Strategy / Core Marketing',
      status: 'Archived',
      logline: 'The highest-earning animated film of all time in India — built from devotion, teamwork, and purpose.',
      thumbnail: '/assets/Movie_images_117.jpg',
    },
    {
      id: 'ip-2',
      title: 'TSC Academy',
      type: 'Artist Development',
      status: 'Active',
      logline: 'Unfold yourself — from within to the world. A sanctuary where artists reclaim their voice.',
      thumbnail: '/assets/tsc academy.png',
      link: 'https://tscacademy.in',
    },
    {
      id: 'ip-3',
      title: 'Main Bhi Artist',
      type: 'Community & Activism',
      status: 'Active',
      logline: 'A rebellion dressed as community. A home for the quiet music dreamers.',
      thumbnail: '/assets/mba banner.png',
    },
    {
      id: 'ip-4',
      title: 'Artiste First',
      type: 'Strategic Partnerships',
      status: 'Active',
      logline: 'Consulting with creators on strategy and brand partnerships without compromising their soul.',
      thumbnail: '/assets/image.png',
    },
    {
      id: 'ip-5',
      title: 'Insta Music League',
      type: 'Competition',
      status: 'Archived',
      logline: 'Talent discovery through short-form content — where the next generation found their voice.',
      thumbnail: 'assets/IML Logo (1)@3x.png',
      link: 'https://iml.tscacademy.in',
    },
    {
      id: 'ip-6',
      title: 'Havells mYOUsic',
      type: 'Brand Collab',
      status: 'Active',
      logline: 'Creating home music experiences with India\'s leading electrical brand.',
      thumbnail: 'assets/havells logo 2 (2).png',
      link: 'https://havellsmyousic.com',
    },
  ];

  const statusColors: Record<string, { dot: string; label: string }> = {
    Active: { dot: 'bg-orange', label: 'text-orange' },
    Archived: { dot: 'bg-black/40', label: 'text-black/40' },
    'In Progress': { dot: 'bg-orange', label: 'text-orange' },
  };

  return (
    <Section
      id="ip-gallery"
      background="white"
      padding="xl"
      className="relative py-16 sm:py-20 md:py-28 bg-white"
    >
      <Container className="max-w-6xl px-4 sm:px-6">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-12 sm:mb-16 text-center"
        >
          <p className="text-orange font-black text-xs uppercase tracking-[0.3em] mb-4 font-alan-sans">
            Work Catalogue
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black mb-5 font-signika">
            What we&apos;ve built
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-black/60 font-alan-sans max-w-2xl mx-auto">
            Cultural properties and breakthrough stories created through our living ecosystem
          </p>
        </motion.div>

        {/* Gallery grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {ipItems.map((item, index) => (
            <motion.a
              key={item.id}
              href={item.link || '#'}
              target={item.link ? '_blank' : undefined}
              rel={item.link ? 'noopener noreferrer' : undefined}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              className="group relative rounded-2xl overflow-hidden bg-black h-64 sm:h-72 md:h-[400px] cursor-pointer border-2 border-black/5 shadow-lg transition-all duration-300"
            >
              {/* Image */}
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-full h-full object-cover"
                style={{ objectFit: 'cover' }}
              />

              {/* Gradient overlay — always visible at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-90" />

              {/* Status badge — top */}
              <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm border border-white/10">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${statusColors[item.status]?.dot || 'bg-slate-medium'}`}
                />
                <span className={`text-xs font-bold font-alan-sans ${statusColors[item.status]?.label || 'text-slate-medium'}`}>
                  {item.status}
                </span>
              </div>

              {/* Content overlay — bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6 translate-y-0 transition-transform duration-300">
                {/* Type badge */}
                <div className="inline-block px-2.5 py-1 bg-orange text-white text-xs font-bold rounded-full mb-2 font-alan-sans">
                  {item.type}
                </div>

                {/* Title */}
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 font-signika leading-snug">
                  {item.title}
                </h3>

                {/* Logline — Always visible */}
                <p className="text-white/80 font-alan-sans text-xs sm:text-sm line-clamp-3 mb-3">
                  {item.logline}
                </p>

                {/* CTA */}
                {item.link && (
                  <span className="inline-flex items-center gap-1.5 text-orange text-xs font-bold font-alan-sans">
                    View project <ArrowRight size={14} />
                  </span>
                )}
              </div>
            </motion.a>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-14 sm:mt-16 text-center"
        >
          <a
            href="mailto:hello@theshaktcollective.com"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-black/10 text-black font-bold font-signika text-base hover:border-orange hover:text-orange transition-all duration-300"
          >
            Co-create with us <ArrowRight size={18} />
          </a>
        </motion.div>
      </Container>
    </Section>
  );
}

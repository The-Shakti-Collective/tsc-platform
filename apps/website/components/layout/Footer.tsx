'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ARTIST_PATH_FORM_PATH, ARTIST_PATH_LANDING_URL } from '@/lib/siteUrls';

import { ArrowRight } from 'lucide-react';

interface FooterProps {
  className?: string;
}

/**
 * Footer — TSC Revamp
 * Updated brand tagline, links, and visual style
 */
export const Footer: React.FC<FooterProps> = ({ className }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Welcome to the collective!');
        setEmail('');
      } else {
        setMessage(data.error || 'Failed to subscribe.');
      }
    } catch {
      setMessage('A network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerSections = [
    {
      title: 'Explore',
      links: [
        { label: 'The Roundway', href: '/#solution' },
        { label: 'Work Catalogue', href: '/#ip-gallery' },
        { label: 'TSC Academy', href: '/tscacademy' },
        { label: 'Meet the Team', href: '/#team' },
        { label: 'Resources', href: '/resources' },
      ],
    },
    {
      title: 'Artists',
      links: [
        { label: 'Artist Path', href: ARTIST_PATH_LANDING_URL, external: true },
        { label: 'Apply to Artist Path', href: ARTIST_PATH_FORM_PATH },
        { label: 'Main Bhi Artist', href: '#' },
        { label: 'Masterclasses', href: '/masterclass/sandesh-shandilya' },
        { label: 'Mentorship', href: '/tscacademy' },
      ],
    },
    {
      title: 'Connect',
      links: [
        { label: 'Book a Call', href: '/book-a-call' },
        { label: 'Partner With Us', href: 'mailto:hello@theshaktcollective.com' },
        { label: 'Instagram', href: 'https://www.instagram.com/the_shakti_collective', external: true },
        { label: 'LinkedIn', href: 'https://www.linkedin.com/in/rohitsobti/', external: true },
        { label: 'Privacy Policy', href: '#' },
      ],
    },
  ];

  return (
    <footer className={cn('bg-black text-white', className)}>
      {/* Brand gradient border */}
      <div className="h-px bg-gradient-to-r from-orange/20 via-pumpkin to-orange/20 opacity-60" />

      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="max-w-container mx-auto px-4 md:px-8 py-10 md:py-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-8"
          >
            <div className="max-w-md">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 font-signika">
                Stay in the collective
              </h2>
              <p className="text-sm md:text-base text-white/50 font-alan-sans">
                Updates on new IPs, masterclasses, artist opportunities, and cultural moments.
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full md:max-w-sm">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 rounded-full bg-white/10 text-cream placeholder-white/30 border border-white/15 focus:outline-none focus:border-pumpkin/60 transition-all text-sm"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 rounded-full bg-orange text-white font-bold font-alan-sans text-sm hover:bg-orange/90 transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {isSubmitting ? 'Joining...' : <span className="flex items-center justify-center gap-1.5">Join <ArrowRight size={14} /></span>}
              </button>
            </form>
          </motion.div>
          {message && (
            <p className={`mt-3 text-sm font-alan-sans ${message.includes('Welcome') ? 'text-orange' : 'text-red-400'}`}>
              {message}
            </p>
          )}
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-container mx-auto px-4 md:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <img
              src="/assets/tsclogo-text.png"
              alt="The Shakti Collective"
              className="h-14 md:h-16 w-auto object-contain mb-4 -ml-1"
            />
            <p className="text-sm text-white/40 leading-relaxed mb-6 font-alan-sans">
              Unfolding artists&apos; force.
            </p>

            {/* Social Links */}
            <div className="flex gap-4">
              <motion.a
                href="https://www.instagram.com/the_shakti_collective"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-cream transition-colors text-sm font-medium font-alan-sans"
                whileHover={{ y: -2 }}
              >
                Instagram
              </motion.a>
              <motion.a
                href="https://www.linkedin.com/in/rohitsobti/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-cream transition-colors text-sm font-medium font-alan-sans"
                whileHover={{ y: -2 }}
              >
                LinkedIn
              </motion.a>
            </div>
          </motion.div>

          {/* Footer Links */}
          {footerSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: (sectionIndex + 1) * 0.1 }}
              viewport={{ once: true }}
            >
              <h4 className="text-xs uppercase tracking-[0.25em] font-bold text-white/30 mb-5 font-alan-sans">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <motion.a
                      href={link.href}
                      target={'external' in link && link.external ? '_blank' : undefined}
                      rel={'external' in link && link.external ? 'noopener noreferrer' : undefined}
                      className="text-white/50 hover:text-cream transition-colors text-sm font-alan-sans"
                      whileHover={{ x: 3 }}
                    >
                      {link.label}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/25 font-alan-sans"
        >
          <p>© {new Date().getFullYear()} The Shakti Collective. All rights reserved.</p>
          <p>A talent-first global culture engine.</p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;

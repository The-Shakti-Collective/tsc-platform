'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { ARTIST_PATH_LANDING_URL } from '@/lib/siteUrls';

/**
 * TSC Capsule Navigation Header — Revamped
 * Frosted glass pill nav with updated brand structure
 */
export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    setWindowWidth(window.innerWidth);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    const handleResize = () => setWindowWidth(window.innerWidth);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    if (window.location.pathname !== '/') {
      window.location.href = `/#${sectionId}`;
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const goTo = (href: string) => {
    window.location.href = href;
    setIsMobileMenuOpen(false);
  };

  if (!isMounted) return null;

  const isMobileView = windowWidth < 768;
  const isTabletView = windowWidth >= 768 && windowWidth < 1024;

  const desktopLinks = [
    { label: 'Home', action: () => scrollToSection('hero') },
    { label: 'Our Work', action: () => scrollToSection('ip-gallery') },
    { label: 'Resources', action: () => goTo('/resources') },
    { label: 'Artist Path', action: () => goTo(ARTIST_PATH_LANDING_URL) },
    { label: 'Book a Call', action: () => goTo('/book-a-call') },
  ];

  const mobileLinks = [
    { label: 'Home', action: () => scrollToSection('hero') },
    { label: 'Our Work', action: () => scrollToSection('ip-gallery') },
    { label: 'Resources', action: () => goTo('/resources') },
    { label: 'Artist Path', action: () => goTo(ARTIST_PATH_LANDING_URL) },
    { label: 'Book a Call', action: () => goTo('/book-a-call') },
    { label: 'Partner With Us', action: () => goTo('/query') },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-4 md:top-6 left-0 right-0 z-50 flex justify-center px-3 sm:px-4"
    >
      <motion.div
        className={`rounded-full backdrop-blur-xl border shadow-xl flex items-center justify-between transition-all duration-300 ${isScrolled ? 'bg-white/90 border-black/10' : 'bg-black/90 border-white/10'
          } ${isMobileView
            ? 'px-3 py-2.5 w-full max-w-sm sm:max-w-md'
            : isTabletView
              ? 'px-5 py-3 gap-4'
              : 'px-8 py-4 gap-8'
          }`}
        whileHover={!isMobileView ? { scale: 1.01 } : undefined}
      >
        {/* Logo */}
        <motion.button
          onClick={() => {
            if (window.location.pathname === '/') {
              scrollToSection('hero');
            } else {
              window.location.href = '/';
            }
          }}
          whileHover={{ scale: 1.05 }}
          className="flex-shrink-0 flex items-center justify-center"
        >
          <img
            src="/assets/tsclogo.png"
            alt="The Shakti Collective"
            className={`${isMobileView ? 'h-8' : 'h-10 sm:h-11'} w-auto object-contain`}
          />
        </motion.button>

        {/* Desktop Links */}
        {!isMobileView && (
          <div className={`hidden lg:flex items-center ${isTabletView ? 'gap-3' : 'gap-5'}`}>
            {desktopLinks.map((link) => (
              <button
                key={link.label}
                onClick={link.action}
                className={`text-xs sm:text-sm font-alan-sans transition font-medium ${isScrolled ? 'text-black/80 hover:text-black' : 'text-white/80 hover:text-white'
                  }`}
              >
                {link.label}
              </button>
            ))}

            {/* Academy CTA pill */}
            <a
              href="/tscacademy"
              className="ml-2 px-4 py-1.5 rounded-full bg-orange text-white text-xs sm:text-sm font-bold font-alan-sans hover:bg-orange/90 transition-all duration-200 whitespace-nowrap"
            >
              TSC Academy
            </a>
          </div>
        )}

        {/* Hamburger */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`${isMobileView ? 'flex' : 'hidden'} md:hidden items-center justify-center ${isScrolled ? 'text-black' : 'text-white'
            } hover:opacity-80 transition flex-shrink-0 p-1.5`}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          <AnimatePresence mode="wait">
            {isMobileMenuOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X size={22} strokeWidth={2} />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu size={22} strokeWidth={2} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-20 left-4 right-4 px-4 py-4 sm:px-6 sm:py-5 rounded-2xl bg-black/95 backdrop-blur-xl border border-white/10 flex flex-col gap-1"
          >
            {mobileLinks.map((link, i) => (
              <button
                key={link.label}
                onClick={link.action}
                className="text-left text-sm font-alan-sans text-white/90 hover:text-white hover:pl-2 transition-all py-3 border-b border-white/5 last:border-0"
              >
                {link.label}
              </button>
            ))}
            <a
              href="/tscacademy"
              className="mt-3 text-center px-4 py-3 rounded-full bg-orange text-white text-sm font-bold font-alan-sans hover:bg-orange/90 transition"
            >
              TSC Academy
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

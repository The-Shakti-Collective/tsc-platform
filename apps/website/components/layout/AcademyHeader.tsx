'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown } from 'lucide-react';

export default function AcademyHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMasterclassOpen, setIsMasterclassOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    setWindowWidth(window.innerWidth);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    const handleResize = () => setWindowWidth(window.innerWidth);
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMasterclassOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    if (window.location.pathname !== '/tscacademy') {
      window.location.href = `/tscacademy#${sectionId}`;
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
    setIsMasterclassOpen(false);
  };

  if (!isMounted) return null;

  const isMobileView = windowWidth < 1024;

  const academyLinks = [
    { label: 'About', action: () => scrollToSection('about') },
    { label: 'Initiatives', action: () => scrollToSection('initiatives') },
    { label: 'Courses', action: () => scrollToSection('courses') },
    { label: 'Mentors', action: () => scrollToSection('mentors') },
  ];

  const masterclassItems = [
    { label: 'Sandesh Shandilya', href: '/masterclass/sandesh-shandilya' },
    { label: 'Prasad Khaparde', href: '/masterclass/prasad-khaparde' },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-4 md:top-6 left-0 right-0 z-[100] flex justify-center px-3 sm:px-4"
    >
      <motion.div
        className={`rounded-full backdrop-blur-xl border shadow-xl flex items-center justify-between transition-all duration-300 ${
          isScrolled ? 'bg-white/25 border-white/40' : 'bg-white/15 border-white/25'
        } ${
          isMobileView
            ? 'px-4 py-2.5 w-full max-w-sm sm:max-w-md'
            : 'px-8 py-3.5 gap-8'
        }`}
        whileHover={!isMobileView ? { scale: 1.01 } : undefined}
      >
        {/* Academy Logo */}
        <motion.button
          onClick={() => goTo('/tscacademy')}
          whileHover={{ scale: 1.05 }}
          className="flex-shrink-0 flex items-center justify-center"
        >
          <img
            src="/assets/tsclogo.png"
            alt="TSC Academy"
            className={`${isMobileView ? 'h-8' : 'h-10 sm:h-11'} w-auto object-contain`}
          />
        </motion.button>

        {/* Desktop Links */}
        {!isMobileView && (
          <div className="flex items-center gap-7">
            {academyLinks.map((link) => (
              <button
                key={link.label}
                onClick={link.action}
                className="text-sm font-alan-sans text-cream/90 hover:text-cream transition font-medium"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
              >
                {link.label}
              </button>
            ))}

            {/* Masterclass Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsMasterclassOpen(!isMasterclassOpen)}
                className="flex items-center gap-1.5 text-sm font-alan-sans text-cream/90 hover:text-cream transition font-medium"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
              >
                Masterclasses
                <ChevronDown size={14} className={`transition-transform duration-300 ${isMasterclassOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isMasterclassOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-56 rounded-2xl bg-charcoal/90 backdrop-blur-2xl border border-white/10 p-2 shadow-2xl overflow-hidden"
                  >
                    {masterclassItems.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => goTo(item.href)}
                        className="w-full text-left px-4 py-3 text-sm font-alan-sans text-cream/80 hover:text-cream hover:bg-white/10 rounded-xl transition-all"
                      >
                        {item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <a
              href="/tscacademy/ambassador"
              className="px-5 py-2 rounded-full bg-gradient-to-r from-pumpkin to-academy-blue text-cream text-xs sm:text-sm font-bold font-alan-sans hover:opacity-90 shadow-md transition-all duration-200 whitespace-nowrap"
            >
              Become an Affiliate
            </a>

            <a
              href="/"
              className="ml-2 px-5 py-2 rounded-full border border-white/30 bg-white/10 text-cream text-xs sm:text-sm font-bold font-alan-sans hover:bg-white/20 transition-all duration-200 whitespace-nowrap"
            >
              Main Website
            </a>
          </div>
        )}

        {/* Hamburger for Mobile */}
        {isMobileView && (
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center justify-center text-cream hover:text-cream/80 transition flex-shrink-0 p-1.5"
          >
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </AnimatePresence>
          </motion.button>
        )}
      </motion.div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 left-4 right-4 px-4 py-4 rounded-2xl bg-charcoal/95 backdrop-blur-xl border border-white/10 flex flex-col gap-1 z-50"
          >
            {academyLinks.map((link) => (
              <button
                key={link.label}
                onClick={link.action}
                className="text-left text-sm font-alan-sans text-cream/90 hover:text-cream py-3 border-b border-white/5"
              >
                {link.label}
              </button>
            ))}
            
            <div className="py-2">
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-2 px-1">Masterclasses</p>
              {masterclassItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => goTo(item.href)}
                  className="w-full text-left py-2.5 text-sm font-alan-sans text-cream/70 hover:text-cream"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <a
              href="/tscacademy/ambassador"
              className="mt-3 text-center px-4 py-3 rounded-full bg-gradient-to-r from-pumpkin to-academy-blue text-cream text-sm font-bold font-alan-sans"
            >
              Become an Affiliate
            </a>

            <a
              href="/"
              className="mt-2 text-center px-4 py-3 rounded-full bg-white/10 text-cream text-sm font-bold font-alan-sans"
            >
              Back to Main Website
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

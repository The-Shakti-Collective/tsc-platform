import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';
import { Button } from '@/components/buttons/Button';

import { Palette, Handshake, Briefcase, Check, Send } from 'lucide-react';

type UserType = 'artist' | 'brand' | 'producer' | null;

/**
 * Contact Section
 * Dynamic contact form with user type selector
 */
export default function ContactSection() {
  const [userType, setUserType] = useState<UserType>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    // Artist fields
    genres: '',
    experience: '',
    lookingFor: '',
    // Brand fields
    company: '',
    budget: '',
    campaignType: '',
    // Producer fields
    focusArea: '',
    capital: '',
    timeline: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Send to API
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userType,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({
          name: '',
          email: '',
          message: '',
          genres: '',
          experience: '',
          lookingFor: '',
          company: '',
          budget: '',
          campaignType: '',
          focusArea: '',
          capital: '',
          timeline: '',
        });
        setUserType(null);

        // Reset after 3 seconds
        setTimeout(() => {
          setSubmitted(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const userOptions = [
    { value: 'artist', label: 'Artist', icon: Palette, description: 'Creator / Performer' },
    { value: 'brand', label: 'Brand', icon: Handshake, description: 'Company / Organization' },
    { value: 'producer', label: 'Producer', icon: Briefcase, description: 'Financier / Investor' },
  ];

  return (
    <Section
      id="contact"
      background="white"
      padding="xl"
      className="relative py-12 sm:py-16 md:py-24 bg-white"
    >
      <Container className="max-w-4xl px-4 sm:px-6">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-8 sm:mb-10 md:mb-12 text-center"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black mb-4 sm:mb-6 font-signika">
            Get in Touch
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-black/60 font-alan-sans">
            Tell us about yourself and how we can help you achieve your dreams
          </p>
        </motion.div>

        {/* Success state */}
        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 flex items-center justify-center z-50 bg-charcoal/50 backdrop-blur px-4"
            >
              <motion.div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-6 sm:p-8 md:p-12 text-center max-w-md shadow-2xl border border-black/5" layout>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-20 h-20 bg-orange/10 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <Check className="w-10 h-10 text-orange" />
                </motion.div>
                <h3 className="text-xl sm:text-2xl font-bold text-black mb-2 font-signika">
                  Thank You!
                </h3>
                <p className="text-sm sm:text-base text-black/60 font-alan-sans">
                  We'll be in touch within 48 hours to discuss your opportunities.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="space-y-6 sm:space-y-8"
        >
          {/* User type selector */}
          <div>
            <label className="block text-black font-semibold font-signika mb-3 sm:mb-4 text-sm sm:text-base">
              I am a...
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {userOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setUserType(option.value as UserType)}
                  className={`p-4 sm:p-5 rounded-xl border-2 transition-all font-alan-sans flex flex-col items-center text-center group ${userType === option.value
                      ? 'border-orange bg-orange/5'
                      : 'border-black/5 bg-black/[0.02] hover:border-black/20 hover:bg-black/[0.04]'
                    }`}
                >
                  <option.icon className={`w-6 h-6 mb-3 transition-colors ${userType === option.value ? 'text-orange' : 'text-black/30 group-hover:text-black/50'}`} />
                  <p className={`font-bold font-signika text-sm sm:text-base mb-1 ${userType === option.value ? 'text-orange' : 'text-black/80'}`}>
                    {option.label}
                  </p>
                  <p className="text-[10px] sm:text-xs text-black/40 uppercase tracking-widest">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Common fields */}
          <div>
            <label className="block text-black font-semibold font-signika mb-2 text-sm sm:text-base">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/5 border border-black/10 text-black placeholder-black/30 rounded-lg sm:rounded-xl focus:outline-none focus:border-orange transition-all font-alan-sans text-sm sm:text-base"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-black font-semibold font-signika mb-2 text-sm sm:text-base">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/5 border border-black/10 text-black placeholder-black/30 rounded-lg sm:rounded-xl focus:outline-none focus:border-orange transition-all font-alan-sans text-sm sm:text-base"
              placeholder="your@email.com"
            />
          </div>

          {/* Artist-specific fields */}
          <AnimatePresence>
            {userType === 'artist' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-black font-semibold font-signika mb-2 text-sm sm:text-base">
                    Genres
                  </label>
                  <input
                    type="text"
                    name="genres"
                    value={formData.genres}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/5 border border-black/10 text-black placeholder-black/30 rounded-lg sm:rounded-xl focus:outline-none focus:border-orange transition-all font-alan-sans text-sm sm:text-base"
                    placeholder="e.g., Hip-hop, Indie, Electronic"
                  />
                </div>
                <div>
                  <label className="block text-black font-semibold font-signika mb-2 text-sm sm:text-base">
                    Years of Experience
                  </label>
                  <select
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/5 border border-black/10 text-black rounded-lg sm:rounded-xl focus:outline-none focus:border-orange transition-all font-alan-sans text-sm sm:text-base"
                  >
                    <option value="">Select experience level</option>
                    <option value="0-1">0-1 years</option>
                    <option value="1-3">1-3 years</option>
                    <option value="3-5">3-5 years</option>
                    <option value="5+">5+ years</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Brand-specific fields */}
          <AnimatePresence>
            {userType === 'brand' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-black font-semibold font-signika mb-2 text-sm sm:text-base">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/5 border border-black/10 text-black placeholder-black/30 rounded-lg sm:rounded-xl focus:outline-none focus:border-orange transition-all font-alan-sans text-sm sm:text-base"
                    placeholder="Your company"
                  />
                </div>
                <div>
                  <label className="block text-black font-semibold font-signika mb-2 text-sm sm:text-base">
                    Budget Range
                  </label>
                  <select
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/5 border border-black/10 text-black rounded-lg sm:rounded-xl focus:outline-none focus:border-orange transition-all font-alan-sans text-sm sm:text-base"
                  >
                    <option value="">Select budget range</option>
                    <option value="50k-100k">₹50k - ₹100k</option>
                    <option value="100k-500k">₹100k - ₹500k</option>
                    <option value="500k-1m">₹500k - ₹1M</option>
                    <option value="1m+">₹1M+</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Producer-specific fields */}
          <AnimatePresence>
            {userType === 'producer' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-black font-semibold font-signika mb-2">
                    Focus Area
                  </label>
                  <input
                    type="text"
                    name="focusArea"
                    value={formData.focusArea}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-black/5 border border-black/10 text-black placeholder-black/30 rounded-xl focus:outline-none focus:border-orange transition-all font-alan-sans"
                    placeholder="e.g., Music, Content, Film"
                  />
                </div>
                <div>
                  <label className="block text-black font-semibold font-signika mb-2">
                    Available Capital
                  </label>
                  <select
                    name="capital"
                    value={formData.capital}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-black/5 border border-black/10 text-black rounded-xl focus:outline-none focus:border-orange transition-all font-alan-sans"
                  >
                    <option value="">Select capital range</option>
                    <option value="1m-5m">₹1M - ₹5M</option>
                    <option value="5m-10m">₹5M - ₹10M</option>
                    <option value="10m+">₹10M+</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message field */}
          <div>
            <label className="block text-black font-semibold font-signika mb-2 text-sm sm:text-base">
              Message
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              required
              rows={5}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/5 border border-black/10 text-black placeholder-black/30 rounded-lg sm:rounded-xl focus:outline-none focus:border-orange transition-all font-alan-sans resize-none text-sm sm:text-base"
              placeholder="Tell us about your project or interests..."
            />
          </div>

          {/* Submit button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              className="w-full"
              disabled={!userType || !formData.name || !formData.email || !formData.message}
            >
              <span className="flex items-center justify-center gap-2">Send Message <Send size={18} /></span>
            </Button>
          </div>
        </motion.form>

        {/* Style fix: force dark background on native select options */}
        <style>{`
          select option {
            background-color: #FFFFFF;
            color: #000000;
          }
        `}</style>
      </Container>
    </Section>
  );
}

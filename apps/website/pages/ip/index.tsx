import { Button } from '@/components/buttons/Button';
import { CMSGrid } from '@/components/cards/CMSCard';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import { cms } from '@/lib/cms';
import Head from 'next/head';
import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * IP & Work Catalogue Page — TSC Revamp
 * Full catalogue of TSC's cultural IP and creative properties
 */
export default function IPPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const allIPs = cms.getIPs();
  const typeFilters = Array.from(new Set(allIPs.map((ip) => ip.type)));
  const statusFilters = Array.from(new Set(allIPs.map((ip) => ip.status)));

  const filteredIP = allIPs
    .map((ip) => ({
      image: ip.heroImage,
      title: ip.title,
      subtitle: ip.type,
      description: ip.logline,
      tags: [ip.status],
      ctaLabel: ip.ctaLabel,
      ctaHref: `/ip/${ip.slug}`,
    }))
    .filter((ip) => {
      const typeMatch = !selectedType || ip.subtitle === selectedType;
      const statusMatch = !selectedStatus || (ip.tags && ip.tags.some((tag) => tag === selectedStatus));
      return typeMatch && statusMatch;
    });

  return (
    <>
      <Head>
        <title>Work Catalogue — The Shakti Collective</title>
        <meta
          name="description"
          content="Explore The Shakti Collective's portfolio of cultural IP and creative properties — from TSC Academy to Main Bhi Artist and Havells mYOUsic."
        />
      </Head>

      {/* Hero */}
      <section className="relative bg-black min-h-[55vh] flex items-end pb-16 sm:pb-20 pt-36 sm:pt-40 overflow-hidden px-4 sm:px-6">
        {/* Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-orange/10 via-black to-black pointer-events-none" />
        <motion.div
          className="absolute top-20 right-20 w-80 h-80 rounded-full border border-cream/5 pointer-events-none"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 7, repeat: Infinity }}
        />

        <Container className="relative z-10">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-pumpkin font-black text-xs uppercase tracking-[0.3em] mb-4 font-alan-sans"
          >
            Work Catalogue
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold text-cream font-signika mb-5 leading-tight"
          >
            What we&apos;ve built
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base sm:text-lg text-cream/60 max-w-2xl font-alan-sans"
          >
            Breakthrough cultural IP created at the intersection of talent, technology, and authentic storytelling.
          </motion.p>
        </Container>
      </section>

      {/* Filter Section */}
      <Section background="white" padding="lg">
        <Container>
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-10">
            {/* Type Filter */}
            <div className="flex-1">
              <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-charcoal/40 mb-3 font-alan-sans">
                Filter by Type
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setSelectedType(null)} variant={selectedType === null ? 'primary' : 'outline'} size="sm">
                  All
                </Button>
                {typeFilters.map((type) => (
                  <Button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    variant={selectedType === type ? 'secondary' : 'outline'}
                    size="sm"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-charcoal/40 mb-3 font-alan-sans">
                Status
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setSelectedStatus(null)} variant={selectedStatus === null ? 'primary' : 'outline'} size="sm">
                  All
                </Button>
                {statusFilters.map((status) => (
                  <Button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    variant={selectedStatus === status ? 'secondary' : 'outline'}
                    size="sm"
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* IP Grid */}
      <Section background="cream-dark" padding="lg">
        <Container>
          {filteredIP.length > 0 ? (
            <CMSGrid items={filteredIP} columns="3" variant="ip" />
          ) : (
            <div className="text-center py-16">
              <p className="text-lg text-charcoal/40 font-alan-sans">
                No IP matching your filters. Try adjusting your selection.
              </p>
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}

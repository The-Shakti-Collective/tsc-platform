'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

import { ArrowRight } from 'lucide-react';

interface TimelineMember {
  id: string;
  name: string;
  role: string;
  image: string;
  bio?: string;
}

/**
 * Artists Section
 * Displays the TSC artist community with click-to-expand functionality
 */
export default function ArtistsSection() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Flatten all artists from different categories into a single list
  const teamMembers: TimelineMember[] = [
    {
      id: 'artist-1',
      name: 'Aarav Singh',
      role: 'Music Producer & Songwriter',
      bio: 'Urban music innovator blending tradition with technology',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop',
    },
    {
      id: 'artist-2',
      name: 'Priya Devi',
      role: 'Director & Cinematographer',
      bio: 'Visual storyteller capturing cultural narratives',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=500&fit=crop',
    },
    {
      id: 'artist-3',
      name: 'Dev Sharma',
      role: 'Animator & Game Designer',
      bio: 'Interactive media artist exploring digital artistry',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=500&fit=crop',
    },
    {
      id: 'artist-4',
      name: 'Maya Acoustic',
      role: 'Singer & Composer',
      bio: 'Classical roots, contemporary voice',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=500&fit=crop',
    },
    {
      id: 'artist-5',
      name: 'Ravi Patel',
      role: 'Painter & Installation Artist',
      bio: 'Contemporary artist exploring cultural identity',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop',
    },
    {
      id: 'artist-6',
      name: 'Zara Khan',
      role: 'DJ & Music Producer',
      bio: 'Electronic music pioneer with global reach',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=500&fit=crop',
    },
    {
      id: 'artist-7',
      name: 'Ananya Gupta',
      role: 'Documentary Photographer',
      bio: 'Showcasing stories through visual narratives',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=500&fit=crop',
    },
    {
      id: 'artist-8',
      name: 'Vikram Das',
      role: 'Graphic Designer & UX Designer',
      bio: 'Visual designer with cultural sensibility',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop',
    },
    {
      id: 'artist-9',
      name: 'Sneha Reddy',
      role: 'Illustrator & Concept Artist',
      bio: 'Creating immersive visual worlds',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=500&fit=crop',
    },
    {
      id: 'artist-10',
      name: 'Arjun Nair',
      role: '3D Artist & Motion Designer',
      bio: 'Creating motion graphics and 3D experiences',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=500&fit=crop',
    },
    {
      id: 'artist-11',
      name: 'Dr. Rajesh Verma',
      role: 'Mentor & Music Theorist',
      bio: 'Guiding the next generation of artists',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop',
    },
    {
      id: 'artist-12',
      name: 'Kavya Singh',
      role: 'Producer & Cultural Strategist',
      bio: 'Building bridges between tradition and innovation',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=500&fit=crop',
    },
  ];

  return (
    <section id="artists" className="py-20 px-6 bg-white">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <p className="text-orange font-black text-xs uppercase tracking-widest mb-2">Our Community</p>
          <h2 className="heading-font text-5xl md:text-6xl font-black text-black mb-4">ARTIST COLLECTIVE</h2>
        </div>
        
        <div className="space-y-6 max-w-5xl mx-auto">
          {teamMembers.map((member) => (
            <motion.div
              key={member.id}
              layoutId={`artist-card-${member.id}`}
              onClick={() => setExpandedId(expandedId === member.id ? null : member.id)}
              className="cursor-pointer transition-all duration-500"
              layout
            >
              <AnimatePresence mode="wait">
                {expandedId === member.id ? (
                  <motion.div
                    key={`expanded-${member.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.36 }}
                    className="rounded-2xl overflow-hidden bg-black/5 backdrop-blur-xl border border-black/10 shadow-2xl"
                  >
                    <div className="flex gap-6 p-6">
                      <div className="flex-1">
                        <h3 className="text-2xl font-black text-black mb-2 font-signika">{member.name}</h3>
                        <p className="text-black/70 font-bold text-sm mb-4 font-alan-sans">{member.role}</p>
                        {member.bio && (
                          <p className="text-sm text-black/80 mb-3 font-alan-sans">{member.bio}</p>
                        )}
                      </div>
                      <div className="relative w-48 h-64 flex-shrink-0 rounded-xl overflow-hidden ring-1 ring-cream/20">
                        <Image src={member.image} alt={member.name} fill className="object-cover" />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`collapsed-${member.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex gap-6 items-center bg-black/5 backdrop-blur border border-black/10 rounded-2xl overflow-hidden shadow-lg p-6 group/card hover:bg-black/10 hover:border-black/20 transition-all duration-300"
                  >
                    <div className="flex-1">
                      <h3 className="text-2xl font-black text-black mb-1 font-signika">{member.name}</h3>
                      <p className="text-black/70 font-bold text-sm mb-3 font-alan-sans">{member.role}</p>
                      {member.bio && (
                        <p className="text-sm text-black/60 line-clamp-2 font-alan-sans">{member.bio}</p>
                      )}
                      <p className="text-xs text-orange font-bold mt-3 cursor-pointer flex items-center gap-1">Click to see more <ArrowRight size={14} /></p>
                    </div>
                    <div className="relative w-48 h-56 flex-shrink-0 rounded-xl overflow-hidden ring-1 ring-cream/20">
                      <Image 
                        src={member.image} 
                        alt={member.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12 text-black/40 text-xs uppercase tracking-wider font-bold">
          Click on any card to see more details
        </div>
      </div>
    </section>
  );
}

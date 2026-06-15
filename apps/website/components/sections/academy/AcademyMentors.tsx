import React from 'react';
import { motion } from 'framer-motion';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';

import { Mic2, Music2, Guitar } from 'lucide-react';

const featuredMentors = [
  {
    name: 'Sandesh Shandilya',
    role: 'Acclaimed Film Composer & Music Director',
    bio: 'An acclaimed music director, recognized for 50+ films, 30+ years in the Industry, a Filmfare nomination & 7Bn+ streams. Creator of iconic songs like Aaoge Jab Tum, Piya Basanti & many more.',
    image: '/assets/academy/sandesh.jpg',
    logos: [
      '/assets/academy/aaoge-jab-tum.jpg',
      '/assets/academy/k3g.jpg',
      '/assets/academy/piya-basanti.jpg',
      '/assets/academy/chameli.jpg'
    ]
  },
  {
    name: 'Prasad Khaparde',
    role: 'Legendary Hindustani Classical Vocalist',
    bio: 'Renowned Hindustani classical vocalist of international repute with over 30 years of illustrious career. A master of the Rampur Sahaswan gharana, trained under Padma Bhushan Ustad Rashid Khan Sahab.',
    image: '/assets/academy/prasadji.jpg',
    logos: [
      '/assets/academy/ustad_rashid_khan.jpg',
      '/assets/academy/coke-studio.png',
      '/assets/academy/iccr.jpeg',
      '/assets/academy/kala.jpg'
    ]
  },
  {
    name: 'Rohit Sobti',
    role: 'Ex VP at Yashraj Films | Artists Curator',
    bio: '27+ years of creating & monetizing intellectual property across Entertainment, Music & Brand Licensing. Managed music labels for legends like Arijit Singh, Vishal Bhardwaj, and Amit Trivedi.',
    image: '/assets/academy/rohit.png',
    logos: [
      '/assets/academy/yrf.png.png',
      '/assets/academy/sony.jpg',
      '/assets/academy/universal-music-group-n-v--600.png',
      '/assets/academy/bmg.jpg'
    ]
  }
];

const comingSoonMentors = [
  {
    role: 'Iconic Voice Behind Bollywood Hits',
    desc: 'A renowned Bollywood playback singer known for her rustic voice behind some of the most iconic songs across Bollywood genres.',
    icon: <Mic2 className="w-12 h-12 text-[#1e3a8a]" />
  },
  {
    role: 'Master of Musical Excellence',
    desc: 'An internationally acclaimed artist with decades of experience shaping the music industry and inspiring generations.',
    icon: <Music2 className="w-12 h-12 text-[#1e3a8a]" />
  },
  {
    role: 'Visionary in Music Creation',
    desc: 'A trailblazer in the music industry, known for innovative compositions and groundbreaking work that redefined musical boundaries.',
    icon: <Guitar className="w-12 h-12 text-[#1e3a8a]" />
  }
];

export default function AcademyMentors() {
  return (
    <Section id="mentors" background="cream" padding="xl">
      <Container>
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-[#1e3a8a] font-signika mb-6"
          >
            Our Mentors
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-medium font-alan-sans max-w-2xl mx-auto"
          >
            We define international standards. Our mentors are only the best artists in the world
            with proven craft and impeccable track records.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-24">
          {featuredMentors.map((mentor, index) => (
            <motion.article
              key={mentor.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="bg-white p-8 rounded-3xl border border-slate-lightest shadow-lg hover:shadow-2xl transition-all duration-400 group"
            >
              <h3 className="text-2xl font-bold text-[#1e3a8a] font-signika mb-1">{mentor.name}</h3>
              <p className="text-sm font-bold text-pumpkin font-alan-sans mb-6 uppercase tracking-wider">{mentor.role}</p>
              
              <div className="h-80 overflow-hidden rounded-2xl mb-8">
                <img
                  src={mentor.image}
                  alt={mentor.name}
                  className="w-full h-full object-cover transition-all duration-700"
                />
              </div>

              <p className="text-slate-medium font-alan-sans text-sm leading-relaxed mb-8 h-24 overflow-hidden line-clamp-4">
                {mentor.bio}
              </p>

              <div className="grid grid-cols-4 gap-3">
                {mentor.logos.map((logo, i) => (
                  <div key={i} className="aspect-square rounded-lg bg-cream flex items-center justify-center p-2 border border-slate-lightest transition-all">
                    <img src={logo} alt="Work" className="max-w-full max-h-full object-contain" />
                  </div>
                ))}
              </div>
            </motion.article>
          ))}
        </div>

        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-[#1e3a8a] font-signika mb-4">Launching Soon</h3>
          <p className="text-slate-medium font-alan-sans">More legends joining the force</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {comingSoonMentors.map((mentor, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-cream-dark/30 p-8 rounded-3xl border border-dashed border-[#1e3a8a]/20 text-center"
            >
              <div className="flex justify-center mb-6 opacity-80">{mentor.icon}</div>
              <h4 className="text-lg font-bold text-[#1e3a8a] font-signika mb-4">{mentor.role}</h4>
              <p className="text-sm text-slate-medium font-alan-sans leading-relaxed">
                {mentor.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

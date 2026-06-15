'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, Circle, ArrowUp, ArrowRight, Linkedin, Instagram } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  description: React.ReactNode;
  philosophy?: string;
  accomplishments: React.ReactNode[];
  socials: {
    linkedin?: string;
    instagram?: string;
  };
}

export default function TeamSection() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const teamMembers: TeamMember[] = [
    {
      id: 'rohit-sobti',
      name: 'Rohit Sobti',
      role: 'Curator and Co-founder',
      image: '/assets/rohit.png',
      description: (
        <>
          Rohit Sobti is a <strong>visionary music and entertainment strategist</strong>,{' '}
          <strong>Co-Founder of The Shakti Collective</strong>, and a{' '}
          <strong>Harvard Business School (BEMS) and IIM Bangalore alumnus</strong>. With{' '}
          <strong>27+ years of experience</strong>, he has been at the forefront of{' '}
          <strong>creating and monetizing intellectual property</strong>.
        </>
      ),
      philosophy:
        '"Through The Shakti Collective and Artiste First, he continues to build scalable IPs and sustainable music businesses where creativity and commerce thrive together."',
      accomplishments: [
        <>A former <strong>Vice President at Yash Raj Films</strong> and a leader at <strong>Sony Music and Universal Music India</strong>.</>,
        <>Expertise in <strong>Intellectual Property Rights (IPR)</strong> and non-theatrical monetization.</>,
        <>Architected monetization strategies for catalogs totaling over <strong>7Bn+ streams</strong>.</>,
        <>Led strategy for massive IPs like <strong>Mahavatar Narsimha</strong> and scaled labels for top artists.</>,
      ],
      socials: {
        linkedin: 'https://www.linkedin.com/in/rohitsobti/',
        instagram: 'https://www.instagram.com/rohitsobti1/',
      },
    },
    {
      id: 'sandesh-shandaliya',
      name: 'Sandesh Shandaliya',
      role: 'Music Composer and Co-founder',
      image: '/assets/sandesh.jpg',
      description: (
        <>
          An acclaimed <strong>music director</strong>, recognised for{' '}
          <strong>50+ films, 30+ years in the Industry</strong>, a{' '}
          <strong>Filmfare nomination</strong> &amp; <strong>7Bn+ streams</strong>.
          Creator of iconic songs like <strong>Aaoge Jab Tum and Piya Basanti</strong>.
        </>
      ),
      accomplishments: [
        <>Iconic songs like <strong>"Piya Basanti"</strong> and <strong>"Suraj Hua Maddham"</strong>.</>,
        <>Recognised for <strong>50+ films</strong> and <strong>30+ years</strong> in the industry.</>,
        <>Garnered over <strong>7 billion streams</strong> across platforms.</>,
        <>Received a <strong>Filmfare nomination</strong> for his legendary work.</>,
      ],
      socials: {
        instagram: 'https://www.instagram.com/sandeshshandilya/',
      },
    },
  ];

  return (
    <section id="team" className="py-16 sm:py-24 px-4 sm:px-6 bg-white overflow-hidden">
      <div className="max-w-4xl mx-auto">
        {/* Section Heading */}
        <div className="text-center mb-12 sm:mb-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-orange font-black text-[10px] sm:text-xs uppercase tracking-[0.4em] mb-3 font-alan-sans"
          >
            THE ARCHITECTS
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-5xl md:text-6xl font-bold text-black font-signika leading-tight"
          >
            Meet the Founders
          </motion.h2>
        </div>

        {/* Team Cards */}
        <div className="flex flex-col gap-6 sm:gap-10">
          {teamMembers.map((member, index) => {
            const isExpanded = expandedId === member.id;
            return (
              <motion.div
                key={member.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                onClick={() => setExpandedId(isExpanded ? null : member.id)}
                className={`cursor-pointer relative rounded-[2.5rem] p-6 sm:p-10 border transition-all duration-300 ${
                  isExpanded 
                  ? 'bg-black/[0.02] border-orange/20 shadow-xl' 
                  : 'bg-white border-black/5 hover:border-orange/20 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex flex-col gap-6 sm:gap-8 items-center w-full">
                  {/* Image Container */}
                  <motion.div 
                    layout
                    className={`relative flex-shrink-0 transition-all duration-500 rounded-[2rem] overflow-hidden ring-1 ring-black/5 ${
                      isExpanded ? 'w-full max-w-[420px] h-80 sm:h-[480px]' : 'w-40 h-48 sm:w-56 sm:h-64'
                    }`}
                  >
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  </motion.div>

                  {/* Text Container */}
                  <div className={`flex-1 w-full ${isExpanded ? 'text-left' : 'text-center'}`}>
                    <motion.div layout>
                      <h3 className={`font-bold text-black mb-1 font-signika transition-all duration-300 ${isExpanded ? 'text-3xl sm:text-5xl' : 'text-xl sm:text-2xl'}`}>
                        {member.name}
                      </h3>
                      <p className={`text-orange font-bold font-alan-sans uppercase tracking-widest transition-all duration-300 ${isExpanded ? 'text-sm sm:text-base mb-6' : 'text-[10px] sm:text-xs mb-4'}`}>
                        {member.role}
                      </p>
                    </motion.div>

                    {!isExpanded && (
                      <p className="text-sm text-black/60 line-clamp-2 font-alan-sans leading-relaxed max-w-2xl mx-auto">
                        {member.description}
                      </p>
                    )}

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.4 }}
                          className="space-y-6 pt-6 border-t border-black/5"
                        >
                          <div className="text-sm sm:text-lg text-black/70 font-alan-sans leading-relaxed">
                            {member.description}
                          </div>

                          {member.philosophy && (
                            <div className="relative py-6 px-8 bg-white/50 rounded-2xl border border-orange/10 italic text-black/80 font-alan-sans text-sm sm:text-base overflow-hidden">
                              <div className="absolute -top-2 -left-2 text-orange/10">
                                <Quote size={48} fill="currentColor" />
                              </div>
                              {member.philosophy}
                            </div>
                          )}

                          <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-orange/60 font-alan-sans">
                              HIGHLIGHTS
                            </h4>
                            <ul className="space-y-3 font-alan-sans text-black/80">
                              {member.accomplishments.map((a, i) => (
                                <li key={i} className="flex gap-3 text-sm sm:text-base items-start">
                                  <Circle size={6} fill="currentColor" className="text-orange mt-1.5 flex-shrink-0" />
                                  <span>{a}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex justify-start gap-4 pt-4">
                            {member.socials.linkedin && (
                              <a
                                href={member.socials.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-12 h-12 flex items-center justify-center rounded-xl bg-black text-white hover:bg-orange transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Linkedin size={20} />
                              </a>
                            )}
                            {member.socials.instagram && (
                              <a
                                href={member.socials.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-12 h-12 flex items-center justify-center rounded-xl bg-orange text-white hover:bg-black transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Instagram size={20} />
                              </a>
                            )}
                          </div>
                          
                          <button className="text-[10px] font-black uppercase tracking-widest text-black/20 hover:text-orange transition-colors pt-4 flex items-center gap-2">
                            Close Profile <ArrowUp size={10} />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!isExpanded && (
                      <p className="text-[10px] font-black uppercase tracking-widest text-orange mt-4 group-hover:translate-x-1 transition-transform flex items-center justify-center gap-2">
                        Tap to expand <ArrowRight size={10} />
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

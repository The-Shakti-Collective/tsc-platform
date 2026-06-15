import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';

import { ArrowRight } from 'lucide-react';

const courses = [
  {
    id: 'comp-comprehensive',
    title: 'The heART of Composition - Comprehensive',
    mentor: 'Sandesh Shandilya',
    mentorImage: '/assets/academy/sandesh.jpg',
    features: ['6 Months', '200+ Mins Content', '3 Live Sessions', 'Industry Mentorship'],
    desc: 'Dive deeper into advanced composition techniques with this comprehensive 6-month course. Learn the art of imagination, emotion to expression, and mainstream mastery directly from a legend.',
    image: '/assets/academy/sandesh.jpg',
    link: '/courses/composition-comprehensive',
    isLive: true,
  },
  {
    id: 'hindustani-roots',
    title: 'The Roots of Hindustani Classical Music',
    mentor: 'Prasad Khaparde',
    mentorImage: '/assets/academy/prasadji.jpg',
    features: ['6 Months', '3+ Live Sessions', '300+ Mins Content', 'Certification'],
    desc: 'Immerse yourself in the timeless art of Hindustani classical singing. Twelve exclusive online group sessions, quality assessments, and certification under the guidance of Pandit Prasad Khaparde.',
    image: '/assets/academy/prasadji.jpg',
    link: '/courses/hindustani-classical',
    isLive: true,
  },
  {
    id: 'prod-luca',
    title: 'A to Z of Music Production for Singer Songwriters',
    mentor: 'Luca Petracca',
    mentorImage: '/assets/academy/luca.jpg',
    features: ['DAW Training', 'Orchestration', 'Film Music'],
    desc: 'Master the end-to-end process of producing professional music for your songs. From recording and arrangement to mixing and mastering, Luca Petracca guides you through the technical and creative steps of modern music production.',
    image: '/assets/academy/luca.jpg',
    isComingSoon: true,
  },
  {
    id: 'artist-path-rohit',
    title: 'Artist Path',
    mentor: 'Rohith Sobti',
    mentorImage: '/assets/academy/rohit.png',
    features: ['Career Roadmap', 'Brand Building', 'Industry Networking'],
    desc: "Navigate your professional journey with a personalized roadmap. Learn how to bridge the gap between your craft and the commercial music world. Guided by Rohith Sobti's 27+ years of experience in curating talent and managing major labels.",
    image: '/assets/academy/rohit.png',
    link: '/courses/artist-path', // Fixed link
    isComingSoon: true,
  },
  {
    id: 'writing-geet',
    title: 'Writing for Songs & Ads',
    mentor: 'Geet Sagar',
    mentorImage: '/assets/academy/geetsagar.jpg',
    features: ['Vocal Mastery', 'Lyric Writing', 'Performance Art'],
    desc: 'Learn the art of singing and songwriting from the winner of X Factor India. Geet Sagar shares his 20+ years of experience as a singer, lyricist, and RJ to help you find your unique voice and craft songs that stand out in the mainstream.',
    image: '/assets/academy/geetsagar.jpg',
    isComingSoon: true,
  },
];

export default function AcademyCourses() {
  return (
    <Section id="courses" background="charcoal" padding="xl">
      <Container>
        <div className="text-center mb-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-cream font-signika mb-6"
          >
            Our Courses
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-cream/70 font-alan-sans max-w-2xl mx-auto"
          >
            Learn from industry legends and take your musical journey to the next level
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`
                group relative min-h-[480px] rounded-3xl overflow-hidden border border-white/10
                flex flex-col justify-end p-8 md:p-12
                ${index === 0 ? 'md:col-span-2' : ''}
                ${course.isComingSoon ? 'opacity-80' : 'cursor-pointer'}
              `}
              onClick={() => {
                if (course.link) window.location.href = course.link;
              }}
            >
              {/* Background Image / Overlay */}
              <div className="absolute inset-0 z-0">
                {course.image ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={course.image}
                      alt={course.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-1000 group-hover:scale-110"
                      priority={index < 3}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-academy-blue to-charcoal" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                {course.isComingSoon && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-20 flex items-center justify-center">
                    <div className="px-6 py-2 bg-pumpkin text-cream rounded-full font-bold text-sm tracking-widest uppercase shadow-xl">
                      Revealing Soon
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="relative z-30">
                <div className="text-xs font-bold text-cream/60 tracking-widest uppercase mb-4 font-alan-sans">
                  {course.isComingSoon ? 'Coming Soon' : `By ${course.mentor}`}
                </div>

                <h3 className="text-3xl font-bold text-cream mb-6 font-signika leading-tight">
                  {course.title}
                </h3>

                <div className="flex flex-wrap gap-x-4 gap-y-2 mb-8">
                  {course.features.map((f, i) => (
                    <React.Fragment key={f}>
                      <span className="text-xs font-bold text-cream/80 font-alan-sans">{f}</span>
                      {i < course.features.length - 1 && (
                        <span className="text-white/20">|</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <p className="text-cream/70 font-alan-sans text-sm leading-relaxed mb-10 max-w-lg line-clamp-3 group-hover:line-clamp-none transition-all duration-500">
                  {course.desc}
                </p>

                {!course.isComingSoon && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full border border-pumpkin overflow-hidden relative">
                      <Image
                        src={course.mentorImage}
                        alt={course.mentor}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="text-cream font-bold font-alan-sans text-sm">{course.mentor}</span>
                    <div className="ml-auto w-10 h-10 rounded-full bg-pumpkin/20 border border-pumpkin/50 flex items-center justify-center text-cream group-hover:bg-pumpkin group-hover:scale-110 transition-all">
                      <ArrowRight size={18} />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

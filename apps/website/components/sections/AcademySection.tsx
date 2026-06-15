import React from 'react';
import { motion } from 'framer-motion';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';
import { FishyButton } from '@/components/ui/fishy-button';

/** ─────────────────────────────────────────────────────────────────────────────
 *  Types
 * ───────────────────────────────────────────────────────────────────────────── */
interface Course {
  id: string;
  title: string;
  mentor: string;
  level: string;
  description: string;
  /**
   * If true, this course is rendered as the large hero-featured card on its
   * own full-width row above the secondary cards.
   */
  isFeatured?: boolean;
  /**
   * Optional URL for a banner/thumbnail image.
   * – Featured card  -> displays as a tall landscape banner.
   * – Secondary card -> displays as a short landscape thumbnail.
   * If omitted the card shows an SVG "Coming Soon" placeholder instead.
   */
  bannerImage?: string;
  /**
   * When true the primary CTA reads "Coming Soon" (disabled) instead of
   * "Enroll Now" (active link).
   */
  isComingSoon?: boolean;
  /** Destination for the "Enroll Now" link. */
  enrollUrl?: string;
}

import { Lock, Clock, Star, ArrowRight } from 'lucide-react';

/** ─────────────────────────────────────────────────────────────────────────────
 *  SVG "Coming Soon" banner placeholder
 * ───────────────────────────────────────────────────────────────────────────── */
function ComingSoonBanner({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 340"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Coming Soon"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="csGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#172554" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="800" height="340" fill="url(#csGrad)" />

      {/* Decorative circles */}
      <circle cx="640" cy="60" r="120" fill="#FFFFFF" opacity="0.06" />
      <circle cx="160" cy="280" r="90" fill="#FFFFFF" opacity="0.06" />

      {/* COMING SOON text */}
      <text
        x="400"
        y="155"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#FFFFFF"
        fontSize="52"
        fontWeight="800"
        fontFamily="'Signika', sans-serif"
        letterSpacing="8"
        opacity="0.9"
      >
        COMING SOON
      </text>

      {/* Accent underline */}
      <rect x="280" y="178" width="240" height="4" rx="2" fill="#FF8C00" opacity="0.8" />

      {/* Sub-label */}
      <text
        x="400"
        y="220"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="18"
        fontFamily="'Alan Sans', sans-serif"
        opacity="0.5"
        letterSpacing="3"
      >
        STAY TUNED
      </text>
    </svg>
  );
}

/** ─────────────────────────────────────────────────────────────────────────────
 *  Shared CTA buttons
 * ───────────────────────────────────────────────────────────────────────────── */
function CourseCTAs({
  isComingSoon,
  enrollUrl,
  size = 'sm',
}: {
  isComingSoon?: boolean;
  enrollUrl?: string;
  size?: 'sm' | 'lg';
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all duration-200 font-signika w-full sm:w-auto';
  const lg = size === 'lg';

  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${lg ? 'mt-6' : 'mt-4'}`}>
      {/* Primary: Enroll Now — disabled (locked) when coming soon, active link otherwise */}
      {isComingSoon ? (
        <span
          className={`${base} cursor-not-allowed bg-black/5 text-black/40 border border-black/10 ${lg ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm'}`}
        >
          <Lock className="w-4 h-4" /> Enroll Now
        </span>
      ) : (
        <a
          href={enrollUrl ?? '/book-a-call'}
          className={`${base} bg-[#1e3a8a] hover:bg-[#1e3a8a]/80 text-white shadow-lg hover:shadow-blue-900/30 ${lg ? 'px-7 py-3.5 text-base' : 'px-5 py-2.5 text-sm'} whitespace-nowrap`}
        >
          Enroll Now <ArrowRight size={16} />
        </a>
      )}

      {/* Coming Soon badge — only shown when the course is NOT yet active */}
      {isComingSoon && (
        <span
          className={`${base} border border-orange/40 bg-black/5 text-black/80 ${lg ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm'}`}
        >
          <Clock className="w-4 h-4" /> Coming Soon
        </span>
      )}
    </div>
  );
}

/** ─────────────────────────────────────────────────────────────────────────────
 *  Featured (hero) course card — full width, tall banner
 * ───────────────────────────────────────────────────────────────────────────── */
function FeaturedCourseCard({ course }: { course: Course }) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="w-full rounded-2xl overflow-hidden border border-orange/20 bg-white shadow-xl group"
    >
      <div className="flex flex-col lg:flex-row">
        {/* Banner image / placeholder — left on desktop, top on mobile */}
        <div className="w-full lg:w-[55%] flex-shrink-0 overflow-hidden aspect-video lg:aspect-auto lg:min-h-[360px] relative bg-black/40 flex items-center justify-center">
          {course.bannerImage ? (
            <img
              src={course.bannerImage}
              alt={course.title}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <ComingSoonBanner className="w-full h-full" />
          )}

          <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-orange text-white text-[10px] font-bold uppercase tracking-widest font-alan-sans shadow-lg z-10 flex items-center gap-1.5">
            <Star className="w-3 h-3 fill-white" /> Featured
          </span>
        </div>

        {/* Content — right on desktop */}
        <div className="flex-1 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
          <div>
            {/* Level badge */}
            <span className="inline-block px-3 py-1 rounded-full bg-orange/10 border border-orange/30 text-orange text-xs font-bold uppercase tracking-widest mb-4 font-alan-sans">
              {course.level}
            </span>

            <h4 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-3 font-signika leading-tight">
              {course.title}
            </h4>

            <p className={`text-black/70 font-alan-sans text-sm sm:text-base mb-4 leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}>
              {course.description}
            </p>
            
            {course.description.length > 150 && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-orange font-bold text-sm mb-4 block"
              >
                {isExpanded ? 'Read Less' : 'Read More'}
              </button>
            )}

            <p className="text-black/50 font-alan-sans text-sm">
              Mentor:{' '}
              <span className="font-semibold text-black/80">{course.mentor}</span>
            </p>
          </div>

          <CourseCTAs
            // isComingSoon={course.isComingSoon}
            enrollUrl={course.enrollUrl}
            size="lg"
          />
        </div>
      </div>
    </motion.div>
  );
}

/** ─────────────────────────────────────────────────────────────────────────────
 *  Secondary course card — compact, thumbnail banner on top
 * ───────────────────────────────────────────────────────────────────────────── */
function SecondaryCourseCard({ course, index }: { course: Course; index: number }) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.6 }}
      viewport={{ once: true }}
      className="flex flex-col rounded-xl overflow-hidden border border-black/10 hover:border-orange/30 bg-white transition-all duration-300 group shadow-lg"
    >
      {/* Thumbnail banner */}
      <div className="w-full aspect-video overflow-hidden relative flex-shrink-0">
        {course.bannerImage ? (
          <img
            src={course.bannerImage}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <ComingSoonBanner className="w-full h-full" />
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-5 sm:p-6">
        {/* Level badge */}
        <span className="inline-block self-start px-2.5 py-0.5 rounded-full bg-black/5 border border-black/10 text-black/70 text-xs font-bold uppercase tracking-widest mb-3 font-alan-sans">
          {course.level}
        </span>

        <h4 className="text-lg sm:text-xl font-bold text-black mb-2 font-signika leading-snug">
          {course.title}
        </h4>

        <p className={`text-black/70 font-alan-sans text-xs sm:text-sm mb-3 leading-relaxed flex-1 ${!isExpanded ? 'line-clamp-3' : ''}`}>
          {course.description}
        </p>

        {course.description.length > 100 && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-orange font-bold text-xs mb-3 text-left block"
          >
            {isExpanded ? 'Read Less' : 'Read More'}
          </button>
        )}

        <p className="text-black/50 font-alan-sans text-xs mb-1">
          Mentor: <span className="font-semibold text-black/80">{course.mentor}</span>
        </p>

        <CourseCTAs
          isComingSoon={course.isComingSoon}
          enrollUrl={course.enrollUrl}
          size="sm"
        />
      </div>
    </motion.div>
  );
}

/** ─────────────────────────────────────────────────────────────────────────────
 *  Academy Section
 * ───────────────────────────────────────────────────────────────────────────── */
export default function AcademySection() {
  const stages = [
    {
      id: 'foundation',
      title: 'Foundation',
      description: 'Master your fundamentals with guided courses and mentorship',
    },
    {
      id: 'creation',
      title: 'Creation',
      description: 'Develop your unique voice in our creative spaces',
    },
    {
      id: 'collaboration',
      title: 'Collaboration',
      description: 'Partner with peers and industry professionals',
    },
    {
      id: 'launch',
      title: 'Launch',
      description: 'Take your work to the world with brand partnerships',
    },
  ];

  const courses: Course[] = [
    // ── Featured course (isFeatured: true) renders on its own full-width row ──
    {
      id: 'course-featured',
      title: 'The heART of Composition - Comprehensive',
      mentor: 'Sandesh Shandilya',
      level: 'Intermediate',
      description:
        'A comprehensive 6-month program with 200+ mins of recorded content and 12+ live interactive sessions. Learn the art of imagination, emotion to expression, subconscious mind workings, and mainstream mastery. 1 year access to course contents, lifetime community access, and unique training approach where knowledge meets experience. Score 9+ on final capstone to perform at The Young Guns Demo Day.',
      isFeatured: true,
      // ▼ BANNER IMAGE — place the image file in /public/assets/ and set the path below:
      bannerImage: '/assets/the heart of music composition thumbmail 4K.jpg.jpeg',
      isComingSoon: false,
      enrollUrl: '/tscacademy',
    },

    // ── Secondary courses (rendered in a grid) ─────────────────
    {
      id: 'course-artist-brand',
      title: 'Classical Singing - Comprehensive',
      mentor: 'Prasad Khaparde',
      level: 'Intermediate',
      description: 'Master the art of Hindustani classical singing under the guidance of Prasad Khaparde. Twelve online group sessions, 120 mins of recorded content, quality assessments, and certification. Top 10 students per 300 enrollments will get opportunity to continue the journey under Prasad Khaparde\'s personal mentorship.',
      bannerImage: '/assets/The roots of Hindustani Classical Music.png',
      isComingSoon: false,
      enrollUrl: '/tscacademy',
    },
    {
      id: 'course-music-prod',
      title: 'A–Z of Music Production',
      mentor: 'Luca Petracca',
      level: 'Beginner',
      description: 'Master the complete journey of music production from concept to final mix. Learn professional techniques for recording, arranging, mixing, and mastering your songs. Perfect for singer-songwriters who want to produce their own music.',
      isComingSoon: true,
    },
  ];

  const featuredCourse = courses.find((c) => c.isFeatured);
  const secondaryCourses = courses.filter((c) => !c.isFeatured);

  return (
    <Section
      id="academy"
      background="white"
      padding="xl"
      className="relative py-12 sm:py-16 md:py-24 bg-white"
    >
      <Container className="max-w-6xl px-4 sm:px-6">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-10 sm:mb-12 md:mb-16 text-center"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black mb-4 sm:mb-6 font-signika">
            The Artist Path
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-black/70 font-alan-sans max-w-2xl mx-auto">
            A structured journey from aspiring artist to globally recognized creator
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative mb-12 sm:mb-16 md:mb-20">
          {/* Timeline line */}
          <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-1 h-96 bg-gradient-to-b from-black/20 to-transparent" />

          {/* Timeline stages */}
          <div className="space-y-8 sm:space-y-10 md:space-y-12">
            {stages.map((stage, index) => (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                viewport={{ once: true }}
                className={`flex flex-col items-center lg:flex-row lg:items-center gap-4 sm:gap-6 md:gap-8 ${index % 2 === 0 ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}
              >
                {/* Content */}
                <div className="flex-1 bg-black/5 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-black/10 backdrop-blur w-full">
                  <h3 className="text-xl sm:text-2xl font-bold text-black mb-2 font-signika">
                    {stage.title}
                  </h3>
                  <p className="text-sm sm:text-base text-black/70 font-alan-sans">
                    {stage.description}
                  </p>
                </div>

                {/* Timeline dot */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex-shrink-0 w-3 sm:w-4 h-3 sm:h-4 bg-orange rounded-full ring-4 ring-orange/20 lg:order-none"
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Featured Courses ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-8 sm:mb-10 md:mb-12"
        >
          <h3 className="text-2xl sm:text-3xl font-bold text-black mb-8 sm:mb-10 font-signika text-center">
            Featured Courses
          </h3>

          {/* Row 1: Hero featured course */}
          {featuredCourse && (
            <div className="mb-6 sm:mb-8">
              <FeaturedCourseCard course={featuredCourse} />
            </div>
          )}

          {/* Row 2: Secondary courses grid — One per row as requested */}
          {secondaryCourses.length > 0 && (
            <div className="flex flex-col gap-8 max-w-3xl mx-auto">
              {secondaryCourses.map((course, index) => (
                <SecondaryCourseCard key={course.id} course={course} index={index} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          viewport={{ once: true }}
          className="flex justify-center text-center"
        >
          <FishyButton
            variant="pumpkin"
            width="clamp(200px, 80vw, 380px)"
            height="clamp(50px, 10vw, 68px)"
            onClick={() => {
              window.location.href = '/tscacademy';
            }}
          >
            Start Your Path
          </FishyButton>
        </motion.div>
      </Container>
    </Section>
  );
}

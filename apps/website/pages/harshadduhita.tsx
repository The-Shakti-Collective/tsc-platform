import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  FaYoutube,
  FaInstagram,
  FaSpotify,
  FaStar,
  FaCalendarCheck,
  FaAward,
  FaMusic,
  FaEnvelope,
  FaPhone,
} from 'react-icons/fa';

const IMAGES = {
  hero: '/artists/harshadduhita/heroHND.jpeg',
  portrait: '/artists/harshadduhita/hnd-posing.jpeg',
  audience: '/artists/harshadduhita/hnd-audience-3.jpeg',
  live: '/artists/harshadduhita/hnd-singing-2.jpeg',
  booking: '/artists/harshadduhita/hnd-audience-2.jpeg',
} as const;

const HarshadDuhitaPage = () => {
  const achievements = [
    {
      year: '2026',
      title: 'Padma Shri Mahendra Kapoor Award',
      desc: 'Awarded for outstanding contributions to contemporary Indian music.',
      icon: FaAward,
    },
    {
      year: '2024',
      title: "India's Got Talent Season 11",
      desc: "Semi-finalists on Sony TV's global reality franchise, bringing Indian classical music to mainstream audiences.",
      icon: FaStar,
    },
    {
      year: '2024',
      title: 'Gananayaka',
      desc: "MiMa award-winning devotional anthem that became a viral Ganpati release across digital platforms.",
      icon: FaMusic,
    },
  ];

  const repertoire = [
    'Bhajans',
    'Sufi',
    'Ghazals',
    'Folk Music',
    'Bollywood Classics',
    'Semi-Classical',
    'Marathi Musical Performances',
    'Original Compositions',
    'Contemporary Fusion Sets',
    'Devotional Concert Experiences',
  ];

  const discography = [
    {
      title: 'Gananayaka',
      type: 'Devotional / Original Composition',
      spotify: 'https://open.spotify.com/track/1utLt90yMwsYKYGAFqWOB5?si=6832f0a99fef4270',
      youtube: 'https://www.youtube.com/watch?v=IcknSFj2rys',
    },
    {
      title: 'Murchana',
      type: 'Original Composition',
      spotify: 'https://open.spotify.com/artist/6L88xirodmbWYoZuvseUnc',
      youtube: 'https://www.youtube.com/@theHarshaduhitacollective',
    },
    {
      title: "IGT Highlights",
      type: "India's Got Talent Season 11",
      spotify: 'https://open.spotify.com/artist/6L88xirodmbWYoZuvseUnc',
      youtube: 'https://www.youtube.com/watch?v=_PRy2jW7t0c',
    },
  ];

  const perfectFor = [
    'Corporate & Leadership Events',
    'Luxury Weddings & Sangeet Experiences',
    'Cultural & Heritage Festivals',
    'Devotional & Spiritual Gatherings',
    'Government & Tourism Events',
    'College & Youth Festivals',
    'Curated Musical Evenings',
    'Hospitality & Destination Experiences',
    'Theatre & Auditorium Performances',
    'Brand & Cultural Collaborations',
  ];

  return (
    <div className="bg-cream selection:bg-orange selection:text-white">
      <Head>
        <title>Harshaduhita Collective | Official Artist Page | TSC</title>
        <meta
          name="description"
          content="Harshaduhita Collective — a live music duo blending deep-rooted Indian classical music with divine emotion and diverse musical expression. Book for events."
        />
        <meta property="og:title" content="Harshaduhita Collective | TSC" />
        <meta
          property="og:description"
          content="A live music duo blending Indian classical heritage with bhajans, sufi, folk, ghazals, and contemporary live arrangements."
        />
        <meta property="og:image" content={IMAGES.hero} />
      </Head>

      {/* Hero */}
      <section className="relative min-h-[100svh] flex items-center justify-center pt-28 pb-36 overflow-hidden bg-black">
        <div className="absolute inset-0 z-[1]">
          <Image
            src={IMAGES.hero}
            alt="Harshad & Duhita live on stage"
            fill
            className="object-cover object-[center_30%] md:object-[center_28%]"
            priority
          />
          <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/90 via-black/40 to-transparent h-[38%] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />
        </div>

        <div className="absolute inset-x-0 bottom-0 h-32 md:h-40 z-[2] pointer-events-none bg-gradient-to-t from-white via-white/75 to-transparent" />

        <div className="relative z-20 container mx-auto px-4 text-center flex flex-col items-center justify-center min-h-[62vh] md:min-h-[68vh]">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-black/30 backdrop-blur-xl border border-white/20 text-orange font-bold text-xs md:text-sm mb-5 md:mb-8"
          >
            <FaAward /> PADMA SHRI MAHENDRA KAPOOR AWARD 2026
          </motion.div>

          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl md:text-8xl lg:text-9xl font-signika font-bold text-white mb-5 tracking-tighter drop-shadow-[0_4px_24px_rgba(0,0,0,0.55)]"
          >
            Harshaduhita Collective
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="max-w-2xl mx-auto text-base md:text-xl font-alan-sans text-white/90 leading-relaxed px-2 drop-shadow-md"
          >
            A live music duo blending deep-rooted Indian classical music with divine emotion and diverse musical expression.
          </motion.p>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-16 md:bottom-20 left-0 right-0 flex flex-col sm:flex-row justify-center items-center gap-4 md:gap-6 w-full px-4 z-30"
        >
          <button
            onClick={() => document.getElementById('book-now')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 md:px-10 py-4 md:py-5 rounded-full bg-orange text-white font-bold text-lg md:text-xl hover:scale-105 transition-transform shadow-2xl shadow-orange/40 w-full sm:w-auto"
          >
            Book for Events
          </button>
          <a
            href="#discography"
            className="px-8 md:px-10 py-4 md:py-5 rounded-full bg-black/30 backdrop-blur-md border border-white/25 text-white font-bold text-lg md:text-xl hover:bg-black/45 transition-all shadow-xl w-full sm:w-auto"
          >
            Explore Music
          </a>
        </motion.div>
      </section>

      {/* Who Are We */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start max-w-6xl mx-auto">
            <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-cream order-2 lg:order-1 lg:sticky lg:top-32">
              <Image
                src={IMAGES.portrait}
                alt="Harshad & Duhita portrait"
                fill
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-orange/10 mix-blend-overlay" />
            </div>
            <div className="text-center lg:text-left order-1 lg:order-2">
              <h2 className="text-sm font-bold text-orange uppercase tracking-widest mb-4">Who Are We?</h2>
              <h3 className="text-4xl md:text-6xl font-signika font-bold text-slate-dark mb-8 tracking-tighter">
                Deep Rooted • Divine • Diverse
              </h3>
              <p className="text-slate-medium font-alan-sans text-lg md:text-xl leading-relaxed mb-10">
                Rooted in the traditions of the Rampur and Jaipur Gharanas, Harshad and Duhita bring together bhajans, sufi, folk, ghazals, and contemporary live arrangements into one emotionally powerful performance experience.
              </p>

              <div className="space-y-8 text-left">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h4 className="text-2xl font-signika font-bold text-slate-dark">Duhita Golesar</h4>
                    <span className="px-3 py-1 rounded-full bg-orange/10 text-orange text-xs font-bold uppercase tracking-widest">
                      Jaipur Gharana
                    </span>
                  </div>
                  <p className="text-slate-medium font-alan-sans text-lg leading-relaxed">
                    Raised in a family steeped in classical recordings, she is a University of Mumbai Gold Medalist, trained in the Jaipur Gharana, and a successful playback singer for films like Navra Maza Navsacha 2.
                  </p>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h4 className="text-2xl font-signika font-bold text-slate-dark">Harshad Golesar</h4>
                    <span className="px-3 py-1 rounded-full bg-orange/10 text-orange text-xs font-bold uppercase tracking-widest">
                      Rampur Gharana
                    </span>
                  </div>
                  <p className="text-slate-medium font-alan-sans text-lg leading-relaxed">
                    Hailing from a 12th-generation temple lineage, he is a Sangeet Visharad trained in the Rampur Gharana and a MiMa award-winning composer.
                  </p>
                </div>
              </div>

              <p className="mt-10 text-xl font-signika font-bold text-orange">
                Together, they create a sound that feels deeply rooted yet contemporary.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-sm font-bold text-orange uppercase tracking-widest mb-4">Milestones</h2>
              <h3 className="text-4xl md:text-7xl font-signika font-bold text-slate-dark mb-12 tracking-tighter">
                Milestones & Achievements
              </h3>
              <div className="space-y-12">
                {achievements.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    className="flex gap-6"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-orange/10 flex items-center justify-center text-orange text-xl">
                      <item.icon />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-orange uppercase tracking-widest mb-1">{item.year}</p>
                      <h4 className="text-2xl font-signika font-bold text-slate-dark mb-2">{item.title}</h4>
                      <p className="text-slate-medium font-alan-sans leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="relative aspect-[4/5] md:aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-8 border-cream">
              <Image
                src={IMAGES.audience}
                alt="Harshad & Duhita with audience"
                fill
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-orange/10 mix-blend-overlay" />
            </div>
          </div>
        </div>
      </section>

      {/* Live Spectacle */}
      <section className="py-24 bg-slate-dark text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image src={IMAGES.live} alt="" fill className="object-cover object-center blur-sm scale-105" aria-hidden />
        </div>
        <div className="absolute inset-0 bg-slate-dark/85" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-sm font-bold text-orange uppercase tracking-widest mb-4">The Live Spectacle</h2>
            <h3 className="text-4xl md:text-6xl font-signika font-bold mb-6">Emotionally Immersive Performances</h3>
            <p className="text-white/70 font-alan-sans text-lg leading-relaxed">
              From intimate baithaks to large-format cultural stages, Harshaduhita Collective creates emotionally immersive live performances rooted in Indian musical traditions.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {repertoire.map((item) => (
              <div
                key={item}
                className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-center font-alan-sans text-sm md:text-base"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Discography */}
      <section id="discography" className="py-24 bg-cream">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center md:items-end justify-between mb-16 gap-6 text-center md:text-left">
            <div className="max-w-2xl">
              <h2 className="text-sm font-bold text-orange uppercase tracking-widest mb-4">Discography</h2>
              <h3 className="text-4xl md:text-6xl font-signika font-bold text-slate-dark">Featured Tracks</h3>
            </div>
            <div className="flex justify-center md:justify-end gap-4">
              <a
                href="https://open.spotify.com/artist/6L88xirodmbWYoZuvseUnc"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#1DB954] text-white font-bold hover:scale-105 transition-transform"
              >
                <FaSpotify /> Spotify
              </a>
              <a
                href="https://www.youtube.com/@theHarshaduhitacollective"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#FF0000] text-white font-bold hover:scale-105 transition-transform"
              >
                <FaYoutube /> YouTube
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
            {discography.map((song, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-3xl border border-slate-lighter bg-white hover:border-orange/30 transition-all gap-4"
              >
                <div>
                  <span className="text-orange font-bold text-sm mr-3">{String(i + 1).padStart(2, '0')}.</span>
                  <h4 className="inline text-xl md:text-2xl font-signika font-bold text-slate-dark group-hover:text-orange transition-colors">
                    {song.title}
                  </h4>
                  <p className="text-slate-medium font-alan-sans text-sm uppercase tracking-widest mt-1">{song.type}</p>
                </div>
                <div className="flex items-center gap-4">
                  <a
                    href={song.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-slate-lighter flex items-center justify-center hover:bg-[#1DB954] hover:text-white transition-all text-xl"
                  >
                    <FaSpotify />
                  </a>
                  {song.youtube && (
                    <a
                      href={song.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-full bg-slate-lighter flex items-center justify-center hover:bg-[#FF0000] hover:text-white transition-all text-xl"
                    >
                      <FaYoutube />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Digital Presence */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-sm font-bold text-orange uppercase tracking-widest mb-4 text-center">Connect</h2>
          <h3 className="text-4xl font-signika font-bold text-slate-dark mb-10 text-center">Digital Presence</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="https://www.instagram.com/harshad_golesar/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-2xl bg-cream border border-slate-lighter hover:border-orange transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl group-hover:bg-orange group-hover:text-white transition-colors">
                <FaInstagram />
              </div>
              <span className="font-alan-sans font-bold text-sm">Harshad Golesar</span>
            </a>
            <a
              href="https://www.instagram.com/duhita_harshad/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-2xl bg-cream border border-slate-lighter hover:border-orange transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl group-hover:bg-orange group-hover:text-white transition-colors">
                <FaInstagram />
              </div>
              <span className="font-alan-sans font-bold text-sm">Duhita Harshad</span>
            </a>
            <a
              href="https://www.instagram.com/harshaduhita_collective/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-2xl bg-cream border border-slate-lighter hover:border-orange transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl group-hover:bg-orange group-hover:text-white transition-colors">
                <FaInstagram />
              </div>
              <span className="font-alan-sans font-bold text-sm">Harshaduhita Collective</span>
            </a>
            <a
              href="https://open.spotify.com/artist/6L88xirodmbWYoZuvseUnc"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-2xl bg-cream border border-slate-lighter hover:border-[#1DB954] transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl group-hover:bg-[#1DB954] group-hover:text-white transition-colors">
                <FaSpotify />
              </div>
              <span className="font-alan-sans font-bold text-sm">Spotify</span>
            </a>
          </div>
        </div>
      </section>

      {/* Booking */}
      <section id="book-now" className="py-24 bg-orange">
        <div className="container mx-auto px-4">
          <div className="bg-slate-dark rounded-[4rem] p-12 md:p-20 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full opacity-25">
              <Image src={IMAGES.booking} alt="" fill className="object-cover object-bottom md:object-center" aria-hidden />
            </div>
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div>
                <FaCalendarCheck className="text-5xl text-orange mb-6" />
                <h2 className="text-4xl md:text-6xl font-signika font-bold text-white mb-6 tracking-tighter">
                  Contact & Booking
                </h2>
                <p className="text-lg font-alan-sans text-white/70 mb-8 leading-relaxed">
                  Available for global events — from destination weddings to stadium concerts, the collective brings the soul of Indian classical fusion to your stage.
                </p>
                <div className="space-y-4 text-white/90 font-alan-sans">
                  <p>
                    <span className="text-orange font-bold uppercase text-sm tracking-widest block mb-1">Contact</span>
                    Harshika Kasliwal
                  </p>
                  <a href="tel:+917028280968" className="flex items-center gap-3 hover:text-orange transition-colors">
                    <FaPhone className="text-orange" />
                    +91 7028280968
                  </a>
                  <a
                    href="mailto:artist@theshakticollective.in"
                    className="flex items-center gap-3 hover:text-orange transition-colors"
                  >
                    <FaEnvelope className="text-orange" />
                    artist@theshakticollective.in
                  </a>
                </div>
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <a
                    href="tel:+917028280968"
                    className="px-10 py-5 rounded-full bg-orange text-white font-bold text-xl hover:scale-105 transition-transform shadow-xl shadow-orange/20 text-center"
                  >
                    Call to Book
                  </a>
                  <button
                    onClick={() => (window.location.href = '/query')}
                    className="px-10 py-5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-xl hover:bg-white/20 transition-all"
                  >
                    Inquire Online
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-orange uppercase tracking-widest mb-6">Perfect For</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {perfectFor.map((item) => (
                    <li
                      key={item}
                      className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 font-alan-sans text-sm"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HarshadDuhitaPage;

import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FaAward, FaCalendarAlt, FaEnvelope, FaGlobe, FaMusic } from 'react-icons/fa';

const YugmPage = () => {
  const achievements = [
    {
      title: "Netflix Spotlight",
      desc: "'Musafir x Wanderer' and 'Rang Laago' featured in Netflix's Mismatched Season 2 & 3.",
      icon: FaMusic,
    },
    {
      title: "IPL 2025 Performance",
      desc: "Live stage presence for Rajasthan Royals at the Indian Premier League.",
      icon: FaAward,
    },
    {
      title: "Filmfare Recognition",
      desc: "Nominated for Filmfare Awards 2023 in the Best Album category.",
      icon: FaGlobe,
    },
    {
      title: "Stage & Talk Legacy",
      desc: "900+ performances including 9 TEDx talks, festival showcases, and national tours.",
      icon: FaCalendarAlt,
    },
    {
      title: "Best Band of Rajasthan",
      desc: "Winner at Rajasthan Style Fest 2018 and a celebrated folk-fusion movement.",
      icon: FaAward,
    },
    {
      title: "Hit India Tour",
      desc: "A sponsored tour championing regional soundscapes with support from Rajasthan Tourism.",
      icon: FaMusic,
    },
  ];

  const members = [
    {
      name: 'Abhishek',
      role: 'Frontman, Guitar & Lead Vocals',
      imageUrl: '/artists/yugm/yugm12.jpg',
      description:
        'Abhishek brings raw energy to every performance, blending expressive guitar work with powerful vocal storytelling. His stage presence turns poetic social commentary into anthems that resonate across audiences.',
    },
    {
      name: 'Mayank',
      role: 'Flute, Classical Fusion & Sound Designer',
      imageUrl: '/artists/yugm/yugm10.jpg',
      description:
        'Mayank fuses Indian classical grace with modern indie textures, using flute and sonic layers to create evocative, atmospheric soundscapes. His music adds depth, emotion, and an unforgettable folk touch.',
    },
  ];

  return (
    <div className="bg-cream selection:bg-orange selection:text-white">
      <Head>
        <title>Yugm | Folk Fusion from Jaipur | TSC</title>
        <meta
          name="description"
          content="Yugm is a Jaipur-based folk-fusion band blending India’s roots with modern storytelling. Explore their profile, achievements, and booking options."
        />
      </Head>

      <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 overflow-hidden bg-slate-dark text-white">
        <div className="absolute inset-0 z-0">
          <Image
            src="/artists/yugm/img-9384.jpg"
            alt="Yugm live performance"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/60 via-black/45 to-black/70" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />

        <div className="relative z-20 container mx-auto px-4 text-center flex flex-col justify-center items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-orange/10 border border-orange/20 text-orange font-bold text-sm mb-6"
          >
            <FaMusic /> Jaipur Folk Fusion Band
          </motion.div>

          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl md:text-8xl font-signika font-bold tracking-tighter leading-tight"
          >
            Yugm
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-6 max-w-3xl text-base md:text-lg text-slate-100/90 leading-relaxed"
          >
            Bringing India’s traditional roots into contemporary folk fusion, Yugm tells powerful stories about water, gender, culture and hope through soulful music and magnetic stagecraft.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 flex flex-col sm:flex-row items-center gap-4"
          >
            <a
              href="/query?artist=YUGM"
              className="inline-flex items-center justify-center rounded-full bg-orange px-10 py-4 text-white font-bold text-lg shadow-2xl shadow-orange/30 hover:scale-105 transition-transform w-full sm:w-auto"
            >
              Book a Query Call
            </a>
            <a
              href="#about"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-10 py-4 text-white font-bold text-lg hover:bg-white/20 transition-colors w-full sm:w-auto"
            >
              Discover the Story
            </a>
          </motion.div>
        </div>
      </section>

      <section id="about" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-sm font-bold text-orange uppercase tracking-widest mb-4">About Yugm</h2>
              <h3 className="text-4xl md:text-6xl font-signika font-bold text-slate-dark mb-8">
                A bridge between tradition and transformation.
              </h3>
              <p className="text-slate-medium font-alan-sans text-lg leading-relaxed">
                Yugm is a Jaipur-based folk-fusion band that weaves India’s traditional roots with modern musical expression. Founded in 2016 by Abhishek and Mayank, the band blends storytelling with socially conscious themes — from water scarcity and menstrual taboos to sharp satire — delivered through soul-stirring melodies and contemporary arrangements.
              </p>
              <p className="mt-6 text-slate-medium font-alan-sans text-lg leading-relaxed">
                Over the years, Yugm has carved a distinct space in India’s independent music scene with a unique sound that is both globally resonant and deeply rooted in regional culture.
              </p>
            </div>

            <div className="relative aspect-[4/5] overflow-hidden rounded-[3rem] shadow-2xl border border-slate-100">
              <Image
                src="/artists/yugm/yugm-about.png"
                alt="Yugm band portrait"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-dark text-white">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-orange font-bold mb-3">Achievements</p>
            <h3 className="text-4xl md:text-6xl font-signika font-bold">Performance Milestones</h3>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {achievements.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="rounded-[2rem] border border-white/10 bg-white/5 p-8"
              >
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-orange/10 text-orange text-2xl">
                  <item.icon />
                </div>
                <h4 className="text-2xl font-signika font-bold mb-3">{item.title}</h4>
                <p className="text-slate-100/80 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-cream">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-sm uppercase font-bold tracking-[0.35em] text-orange mb-3">Vision</p>
            <h3 className="text-4xl md:text-5xl font-signika font-bold text-slate-dark">Making folk feel fresh for a new generation.</h3>
          </div>
          <div className="mx-auto max-w-4xl text-slate-medium font-alan-sans text-lg leading-relaxed">
            <p>
              Yugm’s vision is to become a bridge between tradition and transformation, using music as a powerful medium to revive India’s folk roots while addressing contemporary social issues. The band aims to spark thought, inspire change, and connect hearts through storytelling that is both deeply rooted and globally resonant.
            </p>
            <p className="mt-6">
              Through soulful fusion and meaningful narratives, Yugm brings Indian folk to mainstream platforms — from global stages to digital screens — creating a legacy where music not only entertains but enlightens.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-sm uppercase tracking-[0.35em] text-orange font-bold mb-3">Meet the Band</p>
            <h3 className="text-4xl md:text-6xl font-signika font-bold text-slate-dark">Abhishek & Mayank</h3>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {members.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-slate-950/95 shadow-2xl"
              >
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={member.imageUrl}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-10">
                <p className="text-sm font-bold uppercase tracking-[0.35em] text-orange mb-3">{member.role}</p>
                <h4 className="text-3xl font-signika font-bold mb-4 text-white">{member.name}</h4>
                <p className="text-slate-200 leading-relaxed">{member.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="book-now" className="py-24 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-4xl md:text-5xl font-signika font-bold mb-6">Ready to bring Yugm to your stage?</h3>
          <p className="max-w-2xl mx-auto text-slate-300 text-lg leading-relaxed mb-10">
            Connect with Yugm for bookings, collaborations, and creative shows that combine folk tradition with modern cinematic energy.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="mailto:artist@theshakticollective.in"
              className="inline-flex items-center justify-center rounded-full bg-orange px-10 py-4 text-white font-bold text-lg hover:scale-105 transition-transform"
            >
              <FaEnvelope className="mr-3" /> Email Us
            </a>
            <a
              href="/links/yugm"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-10 py-4 text-white font-bold text-lg hover:bg-white/20 transition-colors"
            >
              <FaGlobe className="mr-3" /> View Link Hub
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default YugmPage;

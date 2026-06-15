import React from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';

export default function ArtistReleasePlaybook() {
  return (
    <>
      <Head>
        <title>The Artist Release Playbook - The Shakti Collective</title>
        <meta
          name="description"
          content="How to release your music without it getting lost. Learn the pre-release, release day, and post-release strategies."
        />
      </Head>

      <main className="bg-cream min-h-screen pt-24 sm:pt-32 pb-16">
        <article className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <header className="mb-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-pumpkin font-black text-xs uppercase tracking-widest mb-4 font-alan-sans"
            >
              Insights & Guides
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-orange font-signika mb-6"
            >
              The Artist Release Playbook
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center text-sm text-slate-medium font-alan-sans gap-4"
            >
              <span>May 2, 2026</span>
              <span>•</span>
              <span>6 min read</span>
            </motion.div>
          </header>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full h-64 sm:h-96 rounded-2xl overflow-hidden shadow-lg mb-12"
          >
            <img
              src="/assets/Patterns/LogoArtboard 17@300x-8.png"
              alt="The Artist Release Playbook"
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="prose prose-lg prose-orange max-w-none text-slate-dark font-alan-sans"
          >
            <p className="lead text-xl text-orange font-semibold mb-8">
              How to release your music without it getting lost. Learn the pre-release, release day, and post-release strategies.
            </p>

            <h2 className="text-3xl font-bold text-orange font-signika mt-12 mb-6">Phase 1: Pre-Release (4-6 Weeks Out)</h2>
            <p className="mb-6 leading-relaxed">
              The biggest mistake independent artists make is treating the release date as the finish line. It’s actually the starting line. Your pre-release phase is where you build the foundation for a successful launch. Start by ensuring your metadata is pristine. Submit to Spotify for Artists at least 3 weeks in advance to be considered for editorial playlists and to guarantee your song appears in your followers' Release Radar.
            </p>
            <ul className="list-disc pl-6 mb-8 space-y-2">
              <li>Finalize all artwork and marketing assets.</li>
              <li>Pitch to curators, bloggers, and influencers in your niche.</li>
              <li>Tease the release on social media using engaging, behind-the-scenes content.</li>
            </ul>

            <h2 className="text-3xl font-bold text-orange font-signika mt-12 mb-6">Phase 2: Release Day</h2>
            <p className="mb-6 leading-relaxed">
              Release day is all about momentum. Your goal is to drive as much traffic to your streaming links as possible within the first 24 hours. This triggers algorithms on platforms like Spotify and Apple Music. Update all your social media bios with a smart link that directs fans to their preferred streaming platform.
            </p>
            <p className="mb-6 leading-relaxed">
              Don't just post an album cover and say "out now." Share a story. Go live on Instagram or TikTok to celebrate with your audience. Respond to every comment and message. Engagement is key.
            </p>

            <h2 className="text-3xl font-bold text-orange font-signika mt-12 mb-6">Phase 3: Post-Release (Weeks 1-4)</h2>
            <p className="mb-6 leading-relaxed">
              Many artists experience a post-release slump. To combat this, you need a sustained content strategy. Break down your music video into short-form clips for Shorts, Reels, and TikTok. Share lyrics, the story behind the song, and acoustic performance versions.
            </p>
            <p className="mb-8 leading-relaxed">
              Remember, consistent promotion over a longer period is more effective than one massive spike on release day. Keep finding new angles to talk about your art.
            </p>

            <div className="bg-orange/10 p-8 rounded-xl border border-orange/20 mt-12 text-center">
              <h3 className="text-2xl font-bold text-orange font-signika mb-4">Want the full framework?</h3>
              <p className="text-slate-medium mb-6">Join our community to access comprehensive playbooks, templates, and expert guidance.</p>
              <a href="/academy" className="inline-block bg-orange hover:bg-orange-dark text-cream font-semibold py-3 px-8 rounded-lg transition-colors">
                Explore Academy
              </a>
            </div>
          </motion.div>
        </article>
      </main>
    </>
  );
}

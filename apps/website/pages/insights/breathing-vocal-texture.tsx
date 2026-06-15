import React from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';

export default function BreathingVocalTexture() {
  return (
    <>
      <Head>
        <title>Breathing Techniques & Vocal Texture - The Shakti Collective</title>
        <meta
          name="description"
          content="Most singers think their problem is pitch. It’s not. It’s breath. How to improve your vocal texture practically."
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
              Breathing Techniques & Vocal Texture
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center text-sm text-slate-medium font-alan-sans gap-4"
            >
              <span>May 2, 2026</span>
              <span>•</span>
              <span>5 min read</span>
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
              src="/assets/Patterns/LogoArtboard 18@300x-8.png"
              alt="Breathing Techniques & Vocal Texture"
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
              Most singers think their problem is pitch. It’s not. It’s breath. How to improve your vocal texture practically.
            </p>

            <h2 className="text-3xl font-bold text-orange font-signika mt-12 mb-6">The Myth of Pitch</h2>
            <p className="mb-6 leading-relaxed">
              When a note falls flat or sharp, the immediate reaction is to adjust the vocal cords. However, more often than not, pitch issues are symptoms of a deeper problem: poor breath support. Your breath is the fuel for your voice. Without a consistent and controlled airflow, your vocal cords have to overcompensate, leading to tension, fatigue, and pitch inaccuracies.
            </p>

            <h2 className="text-3xl font-bold text-orange font-signika mt-12 mb-6">Diaphragmatic Breathing: The Foundation</h2>
            <p className="mb-6 leading-relaxed">
              The foundation of powerful vocal texture is diaphragmatic breathing. Place a hand on your stomach. As you inhale, your stomach should expand outward. As you exhale, it should pull inward. Your shoulders and chest should remain relatively still. This ensures you are utilizing the full capacity of your lungs and creating a solid column of air to support your tone.
            </p>
            <ul className="list-disc pl-6 mb-8 space-y-2">
              <li><strong>The Hissing Exercise:</strong> Inhale deeply into your diaphragm, then exhale slowly with a consistent "ssss" sound. Aim for a steady, unwavering stream of air for at least 15 seconds.</li>
              <li><strong>Lip Trills:</strong> These help balance breath pressure and vocal cord tension. Glide smoothly up and down your range while maintaining the trill.</li>
            </ul>

            <h2 className="text-3xl font-bold text-orange font-signika mt-12 mb-6">Unlocking Vocal Texture</h2>
            <p className="mb-6 leading-relaxed">
              Once your breath support is solid, you can begin to explore vocal texture. Texture refers to the quality or "color" of your voice—is it breathy, raspy, resonant, or pure? You manipulate texture by adjusting your vocal tract (the space in your throat and mouth).
            </p>
            <p className="mb-8 leading-relaxed">
              For a breathier, more intimate tone, allow more air to pass through the vocal cords. For a brighter, more piercing tone, focus the resonance forward into the "mask" (the area behind your nose and eyes). Experiment with different vowel shapes and placements to discover the unique textures your voice can produce.
            </p>

            <div className="bg-orange/10 p-8 rounded-xl border border-orange/20 mt-12 text-center">
              <h3 className="text-2xl font-bold text-orange font-signika mb-4">Master Your Voice</h3>
              <p className="text-slate-medium mb-6">Explore our advanced vocal training modules to unlock your true potential.</p>
              <a href="/academy" className="inline-block bg-orange hover:bg-orange-dark text-cream font-semibold py-3 px-8 rounded-lg transition-colors">
                View Masterclasses
              </a>
            </div>
          </motion.div>
        </article>
      </main>
    </>
  );
}

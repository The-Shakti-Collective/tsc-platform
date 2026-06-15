import React from 'react';
import Head from 'next/head';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import { FishyButton } from '@/components/ui/fishy-button';
import { motion } from 'framer-motion';
import { Mic2, Rocket, Music, Award, Star } from 'lucide-react';

export default function PrasadMasterclass() {
  const enrollmentLink = "https://tscacademy.exlyapp.com/checkout/3d04cb4b-82c8-4208-9eff-bd633e086619";

  return (
    <>
      <Head>
        <title>Masterclass with Pandit Prasad Khaparde | TSC Academy</title>
        <meta name="description" content="Join an exclusive masterclass with legendary Hindustani classical vocalist Pandit Prasad Khaparde. Learn the sacred traditions and technical mastery of classical singing." />
      </Head>

      <main className="pt-24 bg-white text-black">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-center overflow-hidden bg-white border-b border-black/5">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-block px-4 py-1.5 rounded-full bg-pumpkin/20 border border-pumpkin/40 text-pumpkin text-xs font-bold uppercase tracking-widest mb-8 font-alan-sans">
                  Exclusive Masterclass
                </div>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-black mb-8 font-signika leading-tight">
                  The Roots of Hindustani Classical Music with <br />
                  <span className="text-orange">Pandit Prasad Khaparde</span>
                </h1>
                <p className="text-xl text-black/70 mb-12 font-alan-sans leading-relaxed max-w-xl">
                  Access the secrets of classical singing from a legend of the Rampur Sahaswan Gharana.
                </p>
                <div className="flex flex-wrap gap-6 items-center">
                  <FishyButton 
                    variant="pumpkin"
                    onClick={() => window.open(enrollmentLink, '_blank')}
                  >
                    Enroll Now for ₹99 Only!
                  </FishyButton>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-pumpkin/20 to-academy-blue/20 blur-3xl rounded-full" />
                <img 
                  src="/assets/academy/prasad-hero.jpg" 
                  alt="Pandit Prasad Khaparde" 
                  className="relative z-10 w-full h-auto rounded-3xl shadow-2xl transition-all duration-700"
                />
              </motion.div>
            </div>
          </Container>
        </section>

        {/* What to Expect */}
        <Section background="cream" padding="xl">
          <Container>
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-academy-blue font-signika mb-6">What to Expect?</h2>
              <p className="text-lg text-slate-medium font-alan-sans max-w-2xl mx-auto">
                Discover the secrets behind Hindustani classical music, understanding the sacred traditions, and developing technical mastery.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                {
                  title: "Foundations of Classical Music",
                  desc: "Master the fundamental concepts including swaras, raags, thaats, and philosophical principles.",
                  img: "/assets/academy/p1.jpg"
                },
                {
                  title: "Raag Exploration & Interpretation",
                  desc: "Learn to understand and interpret multiple raags, grasping the unique mood and rules.",
                  img: "/assets/academy/p2.jpg"
                },
                {
                  title: "Traditional Vocal Culture",
                  desc: "Develop proper vocal technique and discipline through the Rampur Sahaswan gharana tradition.",
                  img: "/assets/academy/p3.jpg"
                }
              ].map((step, i) => (
                <motion.div 
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-lightest group"
                >
                  <div className="h-64 overflow-hidden">
                    <img src={step.img} alt={step.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-academy-blue mb-4 font-signika">{step.title}</h3>
                    <p className="text-slate-medium font-alan-sans leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-20 text-center">
              <button 
                onClick={() => window.open(enrollmentLink, '_blank')}
                className="inline-flex items-center gap-4 bg-orange text-white px-10 py-5 rounded-2xl font-bold font-alan-sans hover:scale-105 transition-all shadow-xl shadow-orange/20 whitespace-nowrap"
              >
                <span>Enroll Now</span>
                <span className="w-px h-6 bg-white/20" />
                <span>₹99</span>
              </button>
            </div>
          </Container>
        </Section>

        {/* Who is it for */}
        <Section background="academy-blue" padding="xl" className="text-cream relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-pumpkin/10 rounded-full blur-[100px] -mr-48 -mt-48" />
          <Container className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold font-signika mb-12 text-center">Who Should DEFINITELY ATTEND?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
              <div className="flex gap-6">
                <div className="text-4xl text-orange"><Mic2 size={40} /></div>
                <div>
                  <h3 className="text-2xl font-bold font-signika mb-4">Vocalists & Students</h3>
                  <p className="text-cream/80 font-alan-sans leading-relaxed">Classical vocalists, semi-classical singers, and students can learn sacred traditions and technical mastery.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-4xl text-orange"><Rocket size={40} /></div>
                <div>
                  <h3 className="text-2xl font-bold font-signika mb-4">Just Starting Out</h3>
                  <p className="text-cream/80 font-alan-sans leading-relaxed">Decided to become a professional artist? Connect with the right mentor and learn from day one.</p>
                </div>
              </div>
            </div>
          </Container>
        </Section>

        {/* About Prasad ji */}
        <Section background="cream" padding="xl">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1">
                <h3 className="text-4xl font-bold text-academy-blue font-signika mb-2">Pandit Prasad Khaparde</h3>
                <p className="text-pumpkin font-bold font-alan-sans uppercase tracking-widest mb-8">Legendary Hindustani Classical Vocalist</p>
                <p className="text-lg text-slate-medium font-alan-sans leading-relaxed mb-8">
                  A renowned Hindustani classical vocalist of international repute with over 30 years of illustrious career. Trained under Padma Bhushan Ustad Rashid Khan Sahab.
                </p>
                <div className="grid grid-cols-3 gap-8">
                  <div>
                    <div className="text-3xl font-bold text-academy-blue font-signika">30+</div>
                    <div className="text-sm text-slate-light font-alan-sans">Years Exp</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-academy-blue font-signika">Gharana</div>
                    <div className="text-sm text-slate-light font-alan-sans">Rampur Sahaswan</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-academy-blue font-signika">Legacy</div>
                    <div className="text-sm text-slate-light font-alan-sans">Rashid Khan Disciple</div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <img src="/assets/academy/p4.jpg" className="rounded-3xl shadow-2xl w-full" alt="Prasad portrait" />
              </div>
            </div>
          </Container>
        </Section>
      </main>

    </>
  );
}

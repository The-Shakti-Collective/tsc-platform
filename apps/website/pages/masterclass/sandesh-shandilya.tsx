import React from 'react';
import Head from 'next/head';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import { FishyButton } from '@/components/ui/fishy-button';
import { motion } from 'framer-motion';
import { Mic2, Rocket, Users, Play, Star } from 'lucide-react';

export default function SandeshMasterclass() {
  const enrollmentLink = "https://tscacademy.exlyapp.com/checkout/ac754377-b8db-4722-9cf9-1cc3ba3e743a";

  return (
    <>
      <Head>
        <title>Masterclass with Sandesh Shandilya | TSC Academy</title>
        <meta name="description" content="Join an exclusive masterclass with acclaimed Bollywood composer Sandesh Shandilya. Learn the secrets of creating timeless music from a legend." />
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
                  The heART of Music Composition with <br />
                  <span className="text-orange">Sandesh Shandilya</span>
                </h1>
                <p className="text-xl text-black/70 mb-12 font-alan-sans leading-relaxed max-w-xl">
                  Access the secrets of creating timeless music from a Bollywood legend.
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
                  src="/assets/academy/sss.png" 
                  alt="Sandesh Shandilya" 
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
                Discover the secrets behind creating timeless music, understanding the creative process, and developing the right mindset for success.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                {
                  title: "Creating Timeless Melodies",
                  desc: "Learn the principles and techniques that make music stand the test of time. Understand what makes a composition memorable.",
                  img: "/assets/academy/melodies.jpg"
                },
                {
                  title: "The Creative Process",
                  desc: "Get insights into Sandesh Shandilya's creative workflow - from initial inspiration to final composition.",
                  img: "/assets/academy/process.jpg"
                },
                {
                  title: "The Right Mindset",
                  desc: "Develop the mental framework needed to unfold your true potential as an artist. Learn about perseverance and creativity.",
                  img: "/assets/academy/mindset.jpg"
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
                  <h3 className="text-2xl font-bold font-signika mb-4">Full-Time Artists</h3>
                  <p className="text-cream/80 font-alan-sans leading-relaxed">Singers, Songwriters, Composers, Lyrics Writers, Musicians & Music Producers can learn from the journey & industry insights.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-4xl text-orange"><Rocket size={40} /></div>
                <div>
                  <h3 className="text-2xl font-bold font-signika mb-4">Just Starting Out</h3>
                  <p className="text-cream/80 font-alan-sans leading-relaxed">Decided to become a professional artist? Connect with the right mentor and learn the right approach from day one.</p>
                </div>
              </div>
            </div>
            <div className="mt-16 p-8 rounded-2xl bg-white/5 border border-white/10 text-center max-w-2xl mx-auto">
               <p className="text-xl font-alan-sans italic text-cream/90">
                 "Our goal: To unfold artists who are a professional artist and want to make a career in music."
               </p>
            </div>
          </Container>
        </Section>

        {/* About Sandesh */}
        <Section background="cream" padding="xl">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1">
                <h3 className="text-4xl font-bold text-academy-blue font-signika mb-2">Sandesh Shandilya</h3>
                <p className="text-pumpkin font-bold font-alan-sans uppercase tracking-widest mb-8">Acclaimed Film Composer & Music Director</p>
                <p className="text-lg text-slate-medium font-alan-sans leading-relaxed mb-8">
                  An acclaimed music director, recognized for 50+ films, 30+ years in the Industry, a Filmfare nomination & 7Bn+ streams across platforms. Creator of iconic songs like Aaoge Jab Tum, Piya Basanti & many more.
                </p>
                <div className="grid grid-cols-3 gap-8 mb-12">
                  <div>
                    <div className="text-3xl font-bold text-academy-blue font-signika">50+</div>
                    <div className="text-sm text-slate-light font-alan-sans">Films</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-academy-blue font-signika">30+</div>
                    <div className="text-sm text-slate-light font-alan-sans">Years Exp</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-academy-blue font-signika">7Bn+</div>
                    <div className="text-sm text-slate-light font-alan-sans">Streams</div>
                  </div>
                </div>
                <h4 className="text-xl font-bold text-academy-blue mb-6 font-signika">Iconic Works</h4>
                <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 gap-4">
                  {['aaoge-jab-tum.jpg', 'k3g.jpg', 'piya-basanti.jpg', 'chameli.jpg', 'socha-na-tha.jpeg', 'dholna.png'].map(img => (
                    <img key={img} src={`/assets/academy/${img}`} className="rounded-lg shadow-md hover:scale-105 transition-all aspect-square object-cover" alt="Work" />
                  ))}
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <img src="/assets/academy/sandesh.jpg" className="rounded-3xl shadow-2xl w-full" alt="Sandesh portrait" />
              </div>
            </div>
          </Container>
        </Section>
      </main>

    </>
  );
}

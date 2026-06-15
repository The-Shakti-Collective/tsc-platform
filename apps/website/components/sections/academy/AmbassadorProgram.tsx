import React from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  IndianRupee,
  Heart,
  Users,
  ArrowDown,
  GraduationCap,
  Mic2,
  Headphones,
  Music2,
  School,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import { AcademyButton } from '@/components/ui/AcademyButton';

interface AmbassadorProgramProps {
  registerUrl: string;
}

const whoIsFor = [
  { icon: GraduationCap, label: 'Current TSC Academy students' },
  { icon: Mic2, label: 'Independent musicians' },
  { icon: Music2, label: 'Singers and songwriters' },
  { icon: Headphones, label: 'Music producers' },
  { icon: School, label: 'Music educators' },
  { icon: Users, label: 'Community builders' },
  { icon: Briefcase, label: 'Artist managers' },
  { icon: Sparkles, label: 'Creative entrepreneurs' },
  { icon: Heart, label: 'Anyone passionate about helping artists grow' },
];

const referralSteps = [
  {
    title: 'Identify artists who may benefit from the program.',
    detail: 'Friends, collaborators, students, musicians in your network, community members.',
  },
  {
    title: 'Understand their goals.',
    detail: 'Have a genuine conversation about their musical journey and challenges.',
  },
  {
    title: 'Recommend the relevant TSC Academy program.',
    detail: 'Share your experience and explain how the program can help.',
  },
  {
    title: 'Send your unique referral link and discount code.',
  },
  {
    title: 'They enroll using your referral link.',
    detail:
      'They receive an instant discount of ₹500, making the program worth ₹4,499.',
  },
  {
    title: 'You receive ₹500 cashback directly in your Ambassador account.',
    detail: 'Simple. Transparent. Rewarding.',
  },
];

const becomeSteps = [
  {
    title: 'Register',
    desc: 'Click the Ambassador Registration button and complete your profile.',
  },
  {
    title: 'Add Your Details',
    desc: 'Set up your account and bank information to receive referral payouts.',
  },
  {
    title: 'Understand The Programs',
    desc: 'Explore the academy programs and understand who they are best suited for. The better you understand the offerings, the easier it becomes to recommend them authentically.',
  },
  {
    title: 'Access Your Referral Dashboard',
    desc: 'Get your unique referral links and discount codes for each program.',
  },
  {
    title: 'Start Sharing',
    desc: 'Reach out to artists in your network and introduce them to the right learning opportunities.',
  },
  {
    title: 'Start your WIN WIN WIN journey',
    desc: 'Join our Ambassador Community for updates and exclusive discounts on programs. Receive cashback earnings directly in your registered bank account. Become the reason behind shaping the future of independent music and education.',
  },
];

const winWinItems = [
  {
    icon: BookOpen,
    title: 'Learn',
    line: 'From the best.',
    accent: 'from-academy-blue/10 to-academy-blue/5',
  },
  {
    icon: IndianRupee,
    title: 'Earn',
    line: 'Through referrals.',
    accent: 'from-pumpkin/15 to-pumpkin/5',
  },
  {
    icon: Heart,
    title: 'Give back',
    line: 'To the artist community.',
    accent: 'from-academy-blue/10 to-pumpkin/10',
  },
];

const pillars = [
  {
    icon: BookOpen,
    title: 'Learn',
    intro:
      'Enjoy exclusive discounts on TSC Academy programs and continue investing in your own artistic growth.',
    access: [
      'Ambassador-only program benefits',
      'Special discounts on courses',
      'Early access to announcements',
      'Industry insights and updates',
    ],
  },
  {
    icon: IndianRupee,
    title: 'Earn',
    intro:
      'Receive ₹500 cashback for every successful referral made through your unique referral link and discount code.',
    referrals: ['₹500 OFF on their enrollment'],
    youReceive: ['₹500 cashback directly to your registered account'],
    footer: 'The more artists you help, the more you earn.',
  },
  {
    icon: Heart,
    title: 'Return to the community',
    intro:
      'Help independent artists discover mentorship, community, and opportunities that can accelerate their growth.',
    footer:
      'Every referral strengthens the larger creative ecosystem. When artists grow together, the entire community grows stronger.',
  },
];

export default function AmbassadorProgram({ registerUrl }: AmbassadorProgramProps) {
  return (
    <div className="bg-cream">
      {/* Hero */}
      <section className="relative min-h-[75vh] flex items-center overflow-hidden bg-charcoal pt-28 pb-16">
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/academy/hero-academy.jpg"
            alt=""
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-academy-blue/60 via-[#172554]/80 to-pumpkin/40 z-10" />
        </div>

        <Container className="relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <p className="text-xs font-bold tracking-[0.3em] text-cream/70 uppercase mb-6 font-alan-sans">
              TSC Academy Ambassador Program
            </p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-cream mb-10 font-signika leading-tight">
              Become a TSC Academy Ambassador
            </h1>

            <AcademyButton
              variant="gradient"
              onClick={() => window.open(registerUrl, '_blank', 'noopener,noreferrer')}
            >
              Become An Ambassador
            </AcademyButton>
          </motion.div>
        </Container>
      </section>

      {/* Why */}
      <Section background="cream" padding="xl">
        <Container size="md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <p className="text-xs font-bold tracking-widest text-pumpkin uppercase mb-4 font-alan-sans">
              Why Become An Ambassador?
            </p>
            <h2 className="text-3xl md:text-5xl font-bold text-academy-blue font-signika mb-6">
              More Than A Referral Program
            </h2>
            <p className="text-slate-medium font-alan-sans text-lg leading-relaxed mb-4">
              We believe great opportunities grow through trusted recommendations.
            </p>
            <p className="text-slate-medium font-alan-sans text-lg leading-relaxed">
              As a TSC Academy Ambassador, you&apos;re not just sharing a course. You&apos;re helping
              artists discover mentorship, structure, and a supportive ecosystem that can transform
              their creative journey.
            </p>
          </motion.div>
        </Container>
      </Section>

      {/* Learn / Earn / Community */}
      <Section background="white" padding="xl" className="bg-white">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {pillars.map((pillar, i) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-3xl border border-slate-lighter/80 bg-cream p-8 shadow-sm"
              >
                <pillar.icon className="w-10 h-10 text-pumpkin mb-4" />
                <h3 className="text-2xl font-bold text-academy-blue font-signika mb-4">
                  {pillar.title}
                </h3>
                <p className="text-slate-medium font-alan-sans leading-relaxed mb-6">
                  {pillar.intro}
                </p>

                {'access' in pillar && pillar.access && (
                  <div>
                    <p className="text-sm font-bold text-academy-blue uppercase tracking-wide mb-3 font-alan-sans">
                      Access
                    </p>
                    <ul className="space-y-2">
                      {pillar.access.map((item) => (
                        <li
                          key={item}
                          className="text-slate-medium font-alan-sans text-sm flex gap-2"
                        >
                          <span className="text-pumpkin">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {'referrals' in pillar && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-bold text-academy-blue mb-2 font-alan-sans">
                        Your referrals receive:
                      </p>
                      <ul className="space-y-1">
                        {pillar.referrals?.map((item) => (
                          <li key={item} className="text-slate-medium font-alan-sans text-sm">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-academy-blue mb-2 font-alan-sans">
                        You receive:
                      </p>
                      <ul className="space-y-1">
                        {pillar.youReceive?.map((item) => (
                          <li key={item} className="text-slate-medium font-alan-sans text-sm">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {pillar.footer && (
                      <p className="text-slate-medium font-alan-sans text-sm pt-2 border-t border-slate-lighter">
                        {pillar.footer}
                      </p>
                    )}
                  </div>
                )}

                {'footer' in pillar && !('referrals' in pillar) && pillar.footer && (
                  <p className="text-slate-medium font-alan-sans text-sm leading-relaxed">
                    {pillar.footer}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Who is this for */}
      <Section background="cream" padding="xl">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-academy-blue font-signika mb-4">
              Who Is This For?
            </h2>
            <p className="text-slate-medium font-alan-sans text-lg">
              This program is ideal for:
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {whoIsFor.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 rounded-2xl bg-white border border-slate-lighter/80 px-5 py-4"
              >
                <item.icon className="w-6 h-6 text-academy-blue shrink-0" />
                <span className="text-slate-dark font-alan-sans text-sm md:text-base">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-slate-medium font-alan-sans mt-10 max-w-2xl mx-auto leading-relaxed">
            You don&apos;t need a large following. You simply need genuine belief in the value of
            music education and artist development.
          </p>
        </Container>
      </Section>

      {/* How referrals work */}
      <Section background="white" padding="xl" className="bg-white">
        <Container size="md">
          <h2 className="text-3xl md:text-5xl font-bold text-academy-blue font-signika text-center mb-14">
            How Referrals Work
          </h2>
          <div className="space-y-0">
            {referralSteps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="flex gap-6 pb-8">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pumpkin to-academy-blue text-cream font-bold font-signika flex items-center justify-center shrink-0">
                      {i + 1}
                    </div>
                    {i < referralSteps.length - 1 && (
                      <div className="w-px flex-1 bg-slate-lighter min-h-[2rem] mt-2" />
                    )}
                  </div>
                  <div className="pt-2 pb-4">
                    <h3 className="text-lg font-bold text-academy-blue font-signika mb-2">
                      Step {i + 1}
                    </h3>
                    <p className="text-slate-dark font-alan-sans font-medium mb-1">{step.title}</p>
                    {step.detail && (
                      <p className="text-slate-medium font-alan-sans text-sm leading-relaxed">
                        {step.detail}
                      </p>
                    )}
                  </div>
                </div>
                {i < referralSteps.length - 1 && (
                  <div className="flex justify-center -mt-4 mb-2 text-slate-lighter">
                    <ArrowDown className="w-5 h-5 md:hidden" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* How to become */}
      <Section background="cream" padding="xl">
        <Container>
          <h2 className="text-3xl md:text-5xl font-bold text-academy-blue font-signika text-center mb-14">
            How To Become An Ambassador
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {becomeSteps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-3xl bg-white border border-slate-lighter/80 p-8"
              >
                <span className="inline-block text-sm font-bold text-pumpkin font-alan-sans mb-3">
                  {i + 1}.
                </span>
                <h3 className="text-xl font-bold text-academy-blue font-signika mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-medium font-alan-sans leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Final CTA */}
      <Section background="academy-blue" padding="xl" className="text-cream">
        <Container size="md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-5xl font-bold font-signika mb-6 leading-tight">
              The future of independent music will be built through artists helping artists.
            </h2>
            <p className="text-cream/90 font-alan-sans text-lg mb-10 max-w-2xl mx-auto">
              Join the TSC Academy Ambassador Program and become part of that movement.
            </p>
            <div className="flex justify-center">
              <AcademyButton
                variant="gradient"
                onClick={() => window.open(registerUrl, '_blank', 'noopener,noreferrer')}
              >
                Become An Ambassador Today
              </AcademyButton>
            </div>
          </motion.div>
        </Container>
      </Section>
    </div>
  );
}

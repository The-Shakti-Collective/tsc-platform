import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Container from './Container';
import Section from './Section';
import { FishyButton } from '@/components/ui/fishy-button';
import { AcademyButton } from '@/components/ui/AcademyButton';

interface Highlight {
  icon: string;
  title: string;
  desc: string;
}

interface LearnItem {
  title: string;
  desc: string;
}

interface ModuleSegment {
  name: string;
  number: string;
  assignment?: boolean;
}

interface Module {
  title: string;
  desc: string;
  icon: string;
  segments: ModuleSegment[];
}

interface CourseLayoutProps {
  title: string;
  mentor: string;
  mentorRole: string;
  mentorImage: string;
  heroImage: string;
  credentials: string[];
  overview: string[];
  highlights: Highlight[];
  learnings: LearnItem[];
  curriculum: Module[];
  enrollLink: string;
  masterclassLink?: string;
  comparisonTable?: {
    headers: string[];
    rows: string[][];
    tierLinks?: string[];
  };
}

export default function CourseLayout({
  title,
  mentor,
  mentorRole,
  mentorImage,
  heroImage,
  credentials,
  overview,
  highlights,
  learnings,
  curriculum,
  enrollLink,
  masterclassLink,
  comparisonTable,
}: CourseLayoutProps) {
  const [openModule, setOpenModule] = useState<number | null>(0);

  return (
    <div className="bg-charcoal pt-24">
      {/* Hero */}
      <section className="relative py-12 overflow-hidden border-b border-white/5">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold text-cream mb-8 font-signika leading-tight">
                {title.split(' - ')[0]}<br />
                <span className="text-pumpkin">{title.split(' - ')[1] || ''}</span>
              </h1>
              <div className="mb-10">
                <p className="text-lg text-cream/70 mb-4 font-alan-sans">
                  Learn with <strong>{mentor}</strong>
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-pumpkin uppercase tracking-widest font-alan-sans">
                  {credentials.map((c, i) => (
                    <React.Fragment key={c}>
                      <span>{c}</span>
                      {i < credentials.length - 1 && <span className="text-white/20">•</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-6">
                <AcademyButton variant="gradient" onClick={() => window.open(enrollLink, '_blank')}>
                  Enroll for Course!
                </AcademyButton>
                {masterclassLink && (
                  <AcademyButton 
                    variant="outline"
                    onClick={() => window.open(masterclassLink, '_blank')}
                  >
                    Register for Masterclass!
                  </AcademyButton>
                )}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl overflow-hidden border border-pumpkin/30 shadow-2xl">
                <img src={heroImage} alt={mentor} className="w-full h-full object-cover" />
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Overview */}
      <Section background="cream" padding="xl">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-academy-blue mb-8 font-signika">Course Overview</h2>
              {overview.map((p, i) => (
                <p key={i} className="text-lg text-slate-medium mb-6 font-alan-sans leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {highlights.map((h, i) => (
                <div key={i} className="p-6 bg-white rounded-2xl shadow-sm border border-slate-lightest hover:shadow-md transition-shadow">
                  <div className="text-3xl mb-4">{h.icon}</div>
                  <h3 className="text-lg font-bold text-academy-blue mb-2 font-signika">{h.title}</h3>
                  <p className="text-sm text-slate-medium font-alan-sans leading-relaxed">{h.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* What You'll Learn */}
      <Section background="academy-blue" padding="xl" className="text-cream">
        <Container>
          <h2 className="text-3xl md:text-4xl font-bold font-signika mb-16 text-center">What You&apos;ll Learn</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {learnings.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative p-8 rounded-2xl bg-white/5 border border-white/10 group hover:bg-white/10 transition-colors"
              >
                <div className="text-5xl font-bold text-pumpkin/20 mb-6 font-signika group-hover:text-pumpkin/40 transition-colors">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="text-xl font-bold mb-4 font-signika">{item.title}</h3>
                <p className="text-sm text-cream/70 font-alan-sans leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Curriculum */}
      <Section background="cream-dark" padding="xl">
        <Container className="max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-academy-blue mb-4 text-center font-signika">Curriculum Overview</h2>
          <p className="text-slate-medium text-center mb-16 font-alan-sans">A focused path with structured chapters and assignments.</p>
          
          <div className="space-y-4">
            {curriculum.map((module, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-lightest">
                <button
                  onClick={() => setOpenModule(openModule === i ? null : i)}
                  className="w-full flex items-center gap-6 p-6 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="text-2xl">{module.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-academy-blue font-signika">{module.title}</h3>
                    <p className="text-sm text-slate-light font-alan-sans">{module.desc}</p>
                  </div>
                  <div className={`transform transition-transform ${openModule === i ? 'rotate-180' : ''}`}>▼</div>
                </button>
                
                <AnimatePresence>
                  {openModule === i && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden border-t border-slate-lightest bg-slate-50/30"
                    >
                      <div className="p-6 space-y-4">
                        {module.segments.map((seg, si) => (
                          <div key={si} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-lightest shadow-sm">
                            <div className="flex items-center gap-4">
                              <span className="text-xs font-bold text-pumpkin font-alan-sans">{seg.number}</span>
                              <span className="font-bold text-academy-blue font-signika">{seg.name}</span>
                            </div>
                            {seg.assignment && (
                              <span className="text-[10px] font-bold uppercase tracking-widest text-sea-foam bg-sea-foam/10 px-2 py-1 rounded">Assignment</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Comparison Table */}
      {comparisonTable && (
        <Section background="cream" padding="xl" id="comparison">
          <Container>
            <h2 className="text-3xl md:text-4xl font-bold text-academy-blue mb-16 text-center font-signika">Choose Your Path</h2>
            <div className="overflow-x-auto rounded-3xl border border-slate-lightest shadow-xl">
              <table className="w-full text-left bg-white min-w-[600px]">
                <thead>
                  <tr className="bg-academy-blue text-cream">
                    {comparisonTable.headers.map((h, i) => (
                      <th key={i} className={`p-6 font-signika text-lg ${i > 0 ? 'text-center' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-lightest">
                  {comparisonTable.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      {row.map((cell, ci) => (
                        <td key={ci} className={`p-6 font-alan-sans ${ci === 0 ? 'font-bold text-academy-blue' : 'text-slate-medium text-center'}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Buttons Row */}
                  {comparisonTable.tierLinks && (
                    <tr className="bg-slate-50/50">
                      <td className="p-6"></td>
                      {comparisonTable.tierLinks.map((link, i) => (
                        <td key={i} className="p-6 text-center">
                          <AcademyButton 
                            variant={i === 1 ? "gradient" : "dark"} 
                            onClick={() => window.open(link, '_blank')}
                            className="w-full text-xs"
                          >
                            Secure Your Spot
                          </AcademyButton>
                        </td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {!comparisonTable.tierLinks && (
              <div className="mt-12 text-center">
                 <AcademyButton variant="gradient" onClick={() => window.open(enrollLink, '_blank')}>
                   Secure Your Spot Now
                 </AcademyButton>
              </div>
            )}
          </Container>
        </Section>
      )}
    </div>
  );
}

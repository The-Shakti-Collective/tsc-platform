import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';

const initiatives = [
  {
    title: 'Artist Unfolding Sessions',
    desc: 'Every week at 7:00 PM, we go live on our Instagram page (@the_shakti_collective) with our mentors, followers & learners. Join us for exclusive sessions, Q&As, and real-time interactions with industry legends.',
    image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=300&fit=crop',
    link: 'https://www.instagram.com/the_shakti_collective',
    linkText: 'Follow @the_shakti_collective',
  },
  {
    title: 'TSC Scholarships',
    desc: 'Talent shouldn\'t be limited by access. We offer scholarships for economically weaker sections, ensuring deserving artists can pursue their dreams and unlock their potential. Please write to tscacademy@theshakticollective.in',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop',
  },
  /* {
    title: 'Demoday @ The Young Guns',
    desc: 'Hosted once every quarter, it is an opportunity to showcase your talent in front of the leading professionals, artists and evangelists of the industry and get upward mobility in the industry.',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=300&fit=crop',
  }, */
  {
    title: 'Certificate Programs',
    desc: 'Professional certification programs that validate your skills and help you stand out in the competitive music industry. Earn credentials recognized by industry professionals.',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop',
  },
  {
    title: 'Community & Alumni',
    desc: 'Building a strong community of artists where members can collaborate, share experiences, and grow together. Connect with alumni who have successfully carved their path in the industry.',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop',
  },
];

export default function AcademyInitiatives() {
  return (
    <Section id="initiatives" background="cream-dark" padding="xl">
      <Container>
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-[#1e3a8a] font-signika mb-6"
          >
            Our Initiatives
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-medium font-alan-sans max-w-2xl mx-auto"
          >
            To help you cultivate unwavering belief in your own self.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {initiatives.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group"
            >
              <div className="h-56 overflow-hidden relative">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
              </div>
              <div className="p-8 flex flex-col flex-1">
                <h3 className="text-2xl font-bold text-[#1e3a8a] mb-4 font-signika">{item.title}</h3>
                <p className="text-slate-medium font-alan-sans text-sm leading-relaxed mb-6 flex-1">
                  {item.desc}
                </p>
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pumpkin font-bold font-alan-sans text-sm hover:translate-x-2 transition-transform flex items-center gap-2"
                  >
                    {item.linkText} <ArrowRight size={14} />
                  </a>
                )}
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white p-12 rounded-[2.5rem] text-center shadow-xl border border-[#1e3a8a]/5"
        >
          <p className="text-xl md:text-2xl font-bold text-[#1e3a8a] mb-8 font-signika">
            Want to ask anything about our initiatives and programs?
          </p>
          <a
            href="https://wa.me/919168665455"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20BA5A] text-white px-10 py-5 rounded-2xl font-bold font-alan-sans shadow-lg shadow-green-500/20 hover:scale-105 transition-all"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Talk to Us on WhatsApp
          </a>
        </motion.div>
      </Container>
    </Section>
  );
}

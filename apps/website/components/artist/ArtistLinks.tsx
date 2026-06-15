import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaSpotify,
  FaFacebook,
  FaGlobe,
  FaEnvelope,
  FaMusic
} from 'react-icons/fa';
import { LucideIcon } from 'lucide-react';

export interface LinkItem {
  label: string;
  url: string;
  icon?: React.ElementType;
  primary?: boolean;
  highlight?: boolean;
}

export interface ArtistLinksProps {
  name: string;
  bio?: string;
  avatarUrl: string;
  links: LinkItem[];
  socials?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    spotify?: string;
    facebook?: string;
    website?: string;
    email?: string;
  };
  themeColor?: string; // OKLCH or Hex
}

const ArtistLinks: React.FC<ArtistLinksProps> = ({
  name,
  bio,
  avatarUrl,
  links,
  socials,
  themeColor = '#1e3a8a', // Default Academy Blue
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12,
      },
    },
  };

  return (
    <div className="relative min-h-screen bg-cream selection:bg-academy-blue selection:text-white pt-32 pb-12 px-4 sm:px-6 overflow-hidden">
      {/* Premium Ambient Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[30rem] md:w-[40rem] h-[30rem] md:h-[40rem] bg-orange/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] md:w-[40rem] h-[30rem] md:h-[40rem] bg-academy-blue/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.015] pointer-events-none mix-blend-overlay z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(255,249,240,0.4)_0%,transparent_70%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-md mx-auto flex flex-col items-center">
        {/* Profile Section */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="relative w-28 h-28 mb-6"
        >
          <div className="absolute inset-0 rounded-full bg-academy-blue/10 animate-pulse" />
          <div className="relative w-full h-full rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-lighter">
            <Image
              src={avatarUrl}
              alt={name}
              fill
              className="object-cover"
              priority
            />
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-3xl font-signika font-bold text-slate-dark text-center mb-2"
        >
          {name}
        </motion.h1>

        {bio && (
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-base font-alan-sans text-slate-medium text-center mb-8 max-w-[85%]"
          >
            {bio}
          </motion.p>
        )}

        {/* Links Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full space-y-4"
        >
          {links.map((link, index) => (
            <motion.a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              variants={itemVariants}
              whileHover={{ scale: 1.02, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "group relative flex items-center justify-center w-full py-4 px-6 rounded-2xl transition-all duration-300 border-2",
                link.primary
                  ? "bg-academy-blue border-academy-blue text-white shadow-lg hover:shadow-academy-blue/25"
                  : link.highlight
                    ? "bg-orange border-orange text-white shadow-lg hover:shadow-orange/25"
                    : "bg-white border-slate-lighter text-slate-dark hover:border-academy-blue hover:text-academy-blue"
              )}
            >
              {link.icon && (
                <div className="absolute left-6 text-xl transition-transform group-hover:scale-110">
                  <link.icon />
                </div>
              )}
              <span className="font-signika font-semibold text-lg">{link.label}</span>
              {link.highlight && (
                <span className="absolute -top-2 -right-2 bg-wine text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider animate-bounce">
                  New
                </span>
              )}
            </motion.a>
          ))}
        </motion.div>

        {/* Social Icons Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-6 mt-12 mb-8"
        >
          {socials?.instagram && (
            <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="text-2xl text-slate-medium hover:text-academy-blue transition-colors">
              <FaInstagram />
            </a>
          )}
          {socials?.spotify && (
            <a href={socials.spotify} target="_blank" rel="noopener noreferrer" className="text-2xl text-slate-medium hover:text-[#1DB954] transition-colors">
              <FaSpotify />
            </a>
          )}
          {socials?.youtube && (
            <a href={socials.youtube} target="_blank" rel="noopener noreferrer" className="text-2xl text-slate-medium hover:text-[#FF0000] transition-colors">
              <FaYoutube />
            </a>
          )}
          {socials?.twitter && (
            <a href={socials.twitter} target="_blank" rel="noopener noreferrer" className="text-2xl text-slate-medium hover:text-[#1DA1F2] transition-colors">
              <FaTwitter />
            </a>
          )}
          {socials?.website && (
            <a href={socials.website} target="_blank" rel="noopener noreferrer" className="text-2xl text-slate-medium hover:text-academy-blue transition-colors">
              <FaGlobe />
            </a>
          )}
          {socials?.email && (
            <a href={`mailto:${socials.email}`} className="text-2xl text-slate-medium hover:text-academy-blue transition-colors">
              <FaEnvelope />
            </a>
          )}
        </motion.div>

        {/* Branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-auto pt-8 flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity"
        >
          <span className="text-xs font-alan-sans uppercase tracking-tighter text-slate-dark">Powered by</span>
          <div className="font-signika font-bold text-sm tracking-tighter text-academy-blue">The Shakti Collective</div>
        </motion.div>
      </div>
    </div>
  );
};

export default ArtistLinks;

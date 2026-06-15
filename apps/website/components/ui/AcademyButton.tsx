import React from 'react';
import { motion } from 'framer-motion';

interface AcademyButtonProps {
  children: React.ReactNode;
  variant?: 'gradient' | 'outline' | 'dark';
  onClick?: () => void;
  className?: string;
  href?: string;
}

export const AcademyButton: React.FC<AcademyButtonProps> = ({
  children,
  variant = 'gradient',
  onClick,
  className = '',
  href
}) => {
  const baseStyles = "px-8 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center text-center whitespace-nowrap";
  
  const variants = {
    gradient: "bg-gradient-to-r from-orange to-[#1e3a8a] text-white hover:opacity-90 shadow-lg",
    outline: "border border-white/30 bg-white/5 text-white hover:bg-white/10",
    dark: "border border-[#1e3a8a]/30 bg-[#1e3a8a]/5 text-[#1e3a8a] hover:bg-[#1e3a8a]/10"
  };

  const Component = href ? 'a' : 'button';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      {href ? (
        <a href={href} className={`${baseStyles} ${variants[variant]} ${className}`}>
          {children}
        </a>
      ) : (
        <button onClick={onClick} className={`${baseStyles} ${variants[variant]} ${className}`}>
          {children}
        </button>
      )}
    </motion.div>
  );
};

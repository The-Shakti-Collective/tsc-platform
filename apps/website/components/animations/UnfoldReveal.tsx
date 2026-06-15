import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { unfoldAnimations, useReducedMotion } from '@/lib/animations';

interface UnfoldRevealProps {
  children: ReactNode;
  variant?: keyof typeof unfoldAnimations;
  delay?: number;
  className?: string;
}

/**
 * UnfoldReveal Component
 * Viewport-based reveal animation wrapper using Framer Motion
 * Respects prefers-reduced-motion for accessibility
 */
export const UnfoldReveal: React.FC<UnfoldRevealProps> = ({
  children,
  variant = 'fadeUp',
  delay = 0,
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const animation = unfoldAnimations[variant];

  // Reduced motion version - no animation, just render
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={animation.initial}
      whileInView={animation.whileInView}
      transition={{
        ...animation.transition,
        delay,
      }}
      viewport={animation.viewport}
    >
      {children}
    </motion.div>
  );
};

export default UnfoldReveal;

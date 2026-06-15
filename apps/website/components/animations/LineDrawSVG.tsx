import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/animations';

interface LineDrawSVGProps {
  svgPath: string;
  strokeColor?: string;
  strokeWidth?: number;
  duration?: number;
  delay?: number;
  /** SVG viewBox dimensions */
  viewBox?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
}

/**
 * LineDrawSVG Component
 * Animates SVG stroke as if being drawn
 * Used for brand mark and decorative line animations
 */
export const LineDrawSVG: React.FC<LineDrawSVGProps> = ({
  svgPath,
  strokeColor = 'currentColor',
  strokeWidth = 2,
  duration = 2,
  delay = 0,
  viewBox = '0 0 100 100',
  width = '100%',
  height = 'auto',
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();

  // Calculate path length for stroke-dasharray (approximate)
  const pathLength = 1000;

  if (prefersReducedMotion) {
    return (
      <svg
        viewBox={viewBox}
        width={width}
        height={height}
        className={className}
        fill="none"
      >
        <path
          d={svgPath}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <motion.svg
      viewBox={viewBox}
      width={width}
      height={height}
      className={className}
      fill="none"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.3, delay }}
      viewport={{ once: true }}
    >
      <motion.path
        d={svgPath}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLength}
        initial={{ strokeDashoffset: pathLength }}
        whileInView={{ strokeDashoffset: 0 }}
        transition={{
          duration,
          delay,
          ease: 'easeInOut',
        }}
        viewport={{ once: true }}
      />
    </motion.svg>
  );
};

export default LineDrawSVG;

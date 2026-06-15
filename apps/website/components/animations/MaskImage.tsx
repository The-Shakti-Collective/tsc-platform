import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/animations';

interface MaskImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  duration?: number;
  delay?: number;
  direction?: 'left' | 'right' | 'top' | 'bottom';
}

const directionMap = {
  left: { initial: 'inset(0 100% 0 0)', animate: 'inset(0 0 0 0)' },
  right: { initial: 'inset(0 0 0 100%)', animate: 'inset(0 0 0 0)' },
  top: { initial: 'inset(100% 0 0 0)', animate: 'inset(0 0 0 0)' },
  bottom: { initial: 'inset(0 0 100% 0)', animate: 'inset(0 0 0 0)' },
};

/**
 * MaskImage Component
 * Image reveal animation using clip-path masks
 */
export const MaskImage: React.FC<MaskImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  duration = 1,
  delay = 0,
  direction = 'left',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const dirConfig = directionMap[direction];

  if (prefersReducedMotion) {
    return (
      <div className={className}>
        <img src={src} alt={alt} width={width} height={height} />
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ clipPath: dirConfig.initial }}
      whileInView={{ clipPath: dirConfig.animate }}
      transition={{ duration, delay, ease: 'easeInOut' }}
      viewport={{ once: true, amount: 0.3 }}
    >
      <img src={src} alt={alt} width={width} height={height} className="w-full h-auto" />
    </motion.div>
  );
};

export default MaskImage;

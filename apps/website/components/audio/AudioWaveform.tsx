import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Audio Waveform
 * Global reactive audio visualization with ambient drift
 */
export default function AudioWaveform() {
  const [isHovering, setIsHovering] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Generate 12 bars with random base heights
  const bars = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    baseHeight: Math.random() * 0.7 + 0.3,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="fixed bottom-8 left-8 z-40"
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
    >
      {/* Waveform container */}
      <div className="flex items-center gap-1 h-20">
        {bars.map((bar, index) => (
          <motion.div
            key={bar.id}
            className={`w-1 rounded-full ${
              isHovering ? 'bg-pumpkin' : 'bg-gradient-to-t from-orange to-cream'
            }`}
            animate={{
              height: isHovering
                ? [bar.baseHeight * 40, bar.baseHeight * 60, bar.baseHeight * 40]
                : [bar.baseHeight * 40, bar.baseHeight * 50, bar.baseHeight * 40],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: index * 0.05,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Label */}
      <motion.p
        className="text-xs text-cream/60 font-semibold font-signika mt-2 text-center"
        animate={{
          opacity: isHovering ? 1 : 0.6,
        }}
      >
        TSC
      </motion.p>
    </motion.div>
  );
}

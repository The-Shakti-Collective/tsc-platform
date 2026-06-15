'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface PersonFormationProps {
  isOpen: boolean;
  onClose: () => void;
}

const ovals = [
  {
    id: 'vision',
    title: 'Our Vision',
    content: 'Empowering emerging artists with the tools, mentorship, and resources to create, monetize, and scale their cultural impact globally.',
    position: 'top-12 left-1/2 -translate-x-1/2',
    color: 'border-orange',
    gradient: 'from-orange/10 to-transparent',
  },
  {
    id: 'mission',
    title: 'Our Mission',
    content: 'Build the most inclusive creative ecosystem where artists own their IP, collaborate freely, and earn directly from their work.',
    position: 'bottom-12 left-12',
    color: 'border-orange',
    gradient: 'from-orange/10 to-transparent',
  },
  {
    id: 'values',
    title: 'Our Values',
    content: 'Creativity, Collaboration, Ownership, and Impact. We believe artists deserve fair compensation and creative control.',
    position: 'bottom-12 right-12',
    color: 'border-orange',
    gradient: 'from-orange/10 to-transparent',
  },
  {
    id: 'culture',
    title: 'Our Culture',
    content: 'Community-first mentality where every member amplifies each other. Together we shape culture, not follow it.',
    position: 'top-12 right-12',
    color: 'border-black/20',
    gradient: 'from-black/5 to-transparent',
  },
];

export function PersonFormation({ isOpen, onClose }: PersonFormationProps) {
  const [hoveredOval, setHoveredOval] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-5xl h-[600px] bg-white rounded-3xl border border-black/10 overflow-hidden shadow-2xl">
              {/* Center Person Formation */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Animated circles forming person shape */}
                <svg
                  viewBox="0 0 200 300"
                  className="w-48 h-72 absolute"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* Head */}
                  <motion.circle
                    cx="100"
                    cy="60"
                    r="30"
                    fill="none"
                    stroke="#FF8C00"
                    strokeWidth="2"
                    animate={
                      hoveredOval
                        ? {
                            r: [30, 35, 30],
                            opacity: [1, 0.8, 1],
                          }
                        : {}
                    }
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                    }}
                  />
                  {/* Upper torso */}
                  <motion.circle
                    cx="100"
                    cy="125"
                    r="28"
                    fill="none"
                    stroke="#FF8C00"
                    strokeWidth="2"
                    animate={
                      hoveredOval
                        ? {
                            r: [28, 33, 28],
                            opacity: [1, 0.8, 1],
                          }
                        : {}
                    }
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                    }}
                  />
                  {/* Lower torso */}
                  <motion.circle
                    cx="100"
                    cy="195"
                    r="25"
                    fill="none"
                    stroke="#FF8C00"
                    strokeWidth="2"
                    animate={
                      hoveredOval
                        ? {
                            r: [25, 30, 25],
                            opacity: [1, 0.8, 1],
                          }
                        : {}
                    }
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                    }}
                  />
                </svg>
              </div>

              {/* 4 Premium Ovals */}
              {ovals.map((oval, index) => (
                <motion.div
                  key={oval.id}
                  className={cn(
                    'absolute w-40 h-24 rounded-full border-2 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer transition-all',
                    oval.position,
                    oval.color,
                    'bg-gradient-to-br',
                    oval.gradient,
                    hoveredOval === oval.id
                      ? 'shadow-2xl scale-110 border-opacity-100'
                      : 'border-opacity-40 hover:border-opacity-70'
                  )}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * (index + 1), duration: 0.4 }}
                  onMouseEnter={() => setHoveredOval(oval.id)}
                  onMouseLeave={() => setHoveredOval(null)}
                >
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-black mb-1">
                      {oval.title}
                    </h3>
                    <AnimatePresence>
                      {hoveredOval === oval.id && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-xs text-black/60 line-clamp-2"
                        >
                          {oval.content}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}

              {/* Close Button */}
              <motion.button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 hover:bg-black/5 rounded-full transition-colors z-10"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <X size={24} />
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface WaveButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * Enhanced Wave Button with Advanced Sound Wave Animation
 * Features:
 * - 150-point waveform with multiple layered sine waves
 * - Multi-layered color gradients (Pumpkin, Cream, Academy Blue, Wine)
 * - Subtle 5-second breathing animation at rest
 * - Mouse-reactive wave amplitude with proximity detection
 * - Enhanced hover state with increased frequency and amplitude
 * - Dynamic gradient layers that shift with animation
 */
export default function WaveButton({
  children,
  onClick,
  className = '',
}: WaveButtonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const animate = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 2 - 3;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Calculate wave parameters based on hover state and mouse position
      const distToMouse = Math.sqrt(
        Math.pow(mousePos.x - centerX, 2) + Math.pow(mousePos.y - centerY, 2)
      );
      const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
      const distanceRatio = Math.max(0, 1 - distToMouse / maxDist);

      // Breathing animation: very subtle at rest (5-second cycle = ~0.126 rad/frame)
      // On hover: more pronounced with higher frequency
      const breatheFrequency = isHovering ? 0.08 : 0.02; // Controls how fast the breathing
      const baseAmplitude = isHovering ? 6 : 1.8; // Smaller at rest for subtlety
      const hoverMultiplier = isHovering ? 2.2 : 1;

      // Mouse proximity creates localized wave peaks
      const proximityWave = isHovering
        ? distanceRatio * 8 * (1 + Math.sin(timeRef.current * 0.05) * 0.4)
        : 0;

      // Draw multiple wave layers for sophisticated sound wave effect
      const wavePoints = 150;

      // Layer 1: High-frequency waves (create fine ripple effect)
      ctx.beginPath();
      for (let i = 0; i <= wavePoints; i++) {
        const angle = (i / wavePoints) * Math.PI * 2;
        const wave1 = Math.sin(angle * 8 + timeRef.current * breatheFrequency * 1.2) * baseAmplitude * 0.8 * hoverMultiplier;
        const wave2 = Math.sin(angle * 4 + timeRef.current * breatheFrequency * 0.9) * baseAmplitude * 0.6 * hoverMultiplier;
        const wave3 = Math.sin(angle * 2 + timeRef.current * breatheFrequency * 0.6) * baseAmplitude * 0.4 * hoverMultiplier;
        const proximityComponent = proximityWave * Math.cos(angle - timeRef.current * 0.03);

        const totalWave = wave1 + wave2 + wave3 + proximityComponent;
        const x = centerX + Math.cos(angle) * (radius + totalWave);
        const y = centerY + Math.sin(angle) * (radius + totalWave);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      // Apply multi-layered gradient strokes
      if (isHovering) {
        // Layer 1: Primary gradient (vibrant)
        const gradient1 = ctx.createLinearGradient(0, 0, width, height);
        gradient1.addColorStop(0, 'rgba(183, 75, 2, 0.95)'); // Pumpkin
        gradient1.addColorStop(0.25, 'rgba(255, 236, 209, 0.85)'); // Cream
        gradient1.addColorStop(0.5, 'rgba(30, 58, 138, 0.95)'); // Academy Blue
        gradient1.addColorStop(0.75, 'rgba(109, 32, 52, 0.8)'); // Wine
        gradient1.addColorStop(1, 'rgba(183, 75, 2, 0.95)'); // Pumpkin

        ctx.strokeStyle = gradient1;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Layer 2: Glow overlay
        const gradientGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 2);
        gradientGlow.addColorStop(0, 'rgba(183, 75, 2, 0.3)');
        gradientGlow.addColorStop(1, 'rgba(30, 58, 138, 0.1)');
        ctx.strokeStyle = gradientGlow;
        ctx.lineWidth = 6;
        ctx.stroke();
      } else {
        // At rest: subtle breathing gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        const breatheOpacity = 0.4 + Math.sin(timeRef.current * 0.02) * 0.15; // Breathing opacity

        gradient.addColorStop(0, `rgba(183, 75, 2, ${breatheOpacity * 0.7})`); // Pumpkin
        gradient.addColorStop(0.33, `rgba(30, 58, 138, ${breatheOpacity * 0.5})`); // Academy Blue
        gradient.addColorStop(0.66, `rgba(23, 37, 84, ${breatheOpacity * 0.6})`); // Academy Blue Dark
        gradient.addColorStop(1, `rgba(255, 236, 209, ${breatheOpacity * 0.7})`); // Cream

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      timeRef.current += 0.016; // 60fps
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mousePos, isHovering]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.96 }}
      className={`relative cursor-pointer ${className}`}
    >
      {/* Canvas for wave animation */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Button content */}
      <div className="relative z-10 px-6 py-3 flex items-center justify-center text-center">
        {children}
      </div>
    </motion.div>
  );
}

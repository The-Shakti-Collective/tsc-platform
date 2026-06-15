import React, { useEffect, useRef, useState } from 'react';

interface HeroVideoProps {
  sources?: {
    webm?: string;
    mp4?: string;
  };
  fallbackColor?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

/**
 * HeroVideo Component - Optimized cinematic video with CDN fallback
 * Features:
 * - Lazy loading with IntersectionObserver
 * - Multiple video formats (WebM, MP4)
 * - Gradient fallback if video fails to load
 * - Prevents layout shift with aspect ratio preservation
 * - CDN-optimized format support
 */
export default function HeroVideo({
  sources = {
    webm: process.env.NEXT_PUBLIC_HERO_VIDEO_WEBM,
    mp4: process.env.NEXT_PUBLIC_HERO_VIDEO_MP4,
  },
  fallbackColor = 'from-slate-950 via-slate-900 to-charcoal',
  autoPlay = true,
  muted = true,
  loop = true,
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  /**
   * Intersection Observer for lazy loading video
   * Only loads video when container enters viewport
   */
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && videoRef.current && !isLoaded) {
          // Trigger video load
          const video = videoRef.current;

          // Set up event listeners for when video is ready
          const handleCanPlay = () => {
            setIsLoaded(true);
            if (autoPlay) {
              video.play().catch((err) => {
                console.warn('Autoplay prevented:', err);
                setHasError(false); // Not an error, just browser policy
              });
            }
          };

          const handleError = () => {
            console.warn('Video failed to load, using fallback gradient');
            setHasError(true);
          };

          video.addEventListener('canplay', handleCanPlay, { once: true });
          video.addEventListener('error', handleError, { once: true });

          // Start loading by setting src (if not already set)
          if (!video.src && sources.mp4) {
            video.src = sources.mp4;
            video.load();
          }

          return () => {
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('error', handleError);
          };
        }
      },
      {
        threshold: 0.1, // Load when 10% of video container is visible
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [isLoaded, autoPlay, sources.mp4]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden"
    >
      {/* Fallback gradient background - visible while video loads or if it fails */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${fallbackColor} transition-opacity duration-500 ${
          isLoaded && !hasError ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      />

      {/* Video element with multiple source formats */}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          isLoaded && !hasError ? 'opacity-100' : 'opacity-0'
        }`}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline
        preload="none"
      >
        {/* WebM format (preferred for modern browsers, better compression) */}
        {sources.webm && (
          <source src={sources.webm} type="video/webm" />
        )}
        {/* MP4 fallback (better browser support) */}
        {sources.mp4 && (
          <source src={sources.mp4} type="video/mp4" />
        )}
        Your browser does not support the video tag.
      </video>

      {/* Loading indicator (optional) */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

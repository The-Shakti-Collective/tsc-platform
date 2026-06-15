import React from 'react';

interface YouTubeHeroProps {
  videoId?: string;
  fallbackColor?: string;
}

/**
 * YouTube Hero Video Component
 * Embeds a YouTube video as the hero background
 */
export default function YouTubeHero({
  videoId = 'dQw4w9WgXcQ', // Default video ID (replace with actual video)
  fallbackColor = 'from-slate-950 via-slate-900 to-charcoal',
}: YouTubeHeroProps) {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1`}
        title="The Shakti Collective Hero Video"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Overlay fallback gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${fallbackColor} opacity-0`} />
    </div>
  );
}

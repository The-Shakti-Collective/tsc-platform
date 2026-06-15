import { useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';

/**
 * Hook to manage smooth page transitions
 * Fades out hero and fades in next section
 */
export function usePageTransition() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.5 });

  return { ref, isInView };
}

/**
 * Hook to detect scroll direction and manage hero fade-out
 */
export function useScrollDirection() {
  const scrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      scrollY.current = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollY.current;
}

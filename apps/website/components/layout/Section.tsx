import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionProps {
  children: ReactNode;
  className?: string;
  background?: 'cream' | 'white' | 'academy-blue' | 'cream-dark' | 'charcoal' | 'transparent';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  id?: string;
}

const paddingMap = {
  sm: 'px-4 md:px-6 py-4 md:py-6',
  md: 'px-4 md:px-8 py-6 md:py-8',
  lg: 'px-4 md:px-8 py-10 md:py-12',
  xl: 'px-4 md:px-8 py-12 md:py-16',
};

const backgroundMap = {
  cream: 'bg-white',
  white: 'bg-white',
  'cream-dark': 'bg-white',
  'academy-blue': 'bg-academy-blue',
  charcoal: 'bg-black',
  transparent: 'bg-transparent',
};

/**
 * Section Component
 * Standardized spacing and background container for page sections
 * Provides consistent horizontal and vertical padding
 */
export const Section: React.FC<SectionProps> = ({
  children,
  className,
  background = 'cream',
  padding = 'md',
  id,
}) => {
  return (
    <section
      id={id}
      className={cn(
        'w-full',
        paddingMap[padding],
        backgroundMap[background],
        className
      )}
    >
      <div className="max-w-container mx-auto w-full">
        {children}
      </div>
    </section>
  );
};

export default Section;

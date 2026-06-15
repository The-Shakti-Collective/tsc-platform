import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

const sizeMap = {
  sm: 'max-w-prose',
  md: 'max-w-4xl',
  lg: 'max-w-container',
  full: 'w-full',
};

/**
 * Container Component
 * Max-width wrapper for content alignment
 */
export const Container: React.FC<ContainerProps> = ({
  children,
  className,
  size = 'lg',
}) => {
  return (
    <div className={cn('mx-auto px-4 md:px-8', sizeMap[size], className)}>
      {children}
    </div>
  );
};

export default Container;

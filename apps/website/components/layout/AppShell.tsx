import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * AppShell Component
 * Layout wrapper for header, main content, and footer
 * Maintains consistent spacing and structure across all pages
 */
export const AppShell: React.FC<AppShellProps> = ({ children, className }) => {
  return (
    <div className={cn('flex flex-col min-h-screen bg-cream', className)}>
      {/* Header will be inserted here by layouts */}
      <main className="flex-1 w-full">
        {children}
      </main>
      {/* Footer will be inserted here by layouts */}
    </div>
  );
};

export default AppShell;

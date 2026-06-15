import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  isLoading?: boolean;
  className?: string;
}

const variantStyles = {
  primary:
    'bg-orange text-white hover:bg-orange-dark active:bg-orange shadow-lg shadow-orange/20',
  secondary:
    'bg-orange text-white hover:bg-orange-dark active:bg-orange shadow-lg shadow-orange/20',
  outline:
    'border-2 border-orange text-orange hover:bg-orange hover:text-white transition-colors',
  ghost:
    'text-orange hover:underline hover:underline-offset-4 transition-all',
};

const sizeStyles = {
  sm: 'px-4 py-2 text-sm font-medium rounded-lg',
  md: 'px-6 py-3 text-base font-semibold rounded-lg',
  lg: 'px-8 py-4 text-lg font-semibold rounded-lg',
};

/**
 * Button Component
 * Primary CTA element with multiple variants
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    isLoading,
    className,
    disabled,
    ...props
  },
  ref
) => {
  return (
    <motion.button
      ref={ref as any}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'transition-all duration-300 ease-out',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      disabled={disabled || isLoading}
      {...(props as any)}
    >
      {isLoading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
        />
      )}
      {icon && !isLoading && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </motion.button>
  );
});

Button.displayName = 'Button';

/**
 * CTACluster Component
 * Container for multiple related CTA buttons (3 pathways)
 */
interface CTAClusterProps {
  items: Array<{
    label: string;
    description?: string;
    onClick?: () => void;
    href?: string;
  }>;
  className?: string;
}

export const CTACluster: React.FC<CTAClusterProps> = ({
  items,
  className,
}) => {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8', className)}>
      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          viewport={{ once: true }}
          className="flex flex-col items-start"
        >
          <div className="mb-4 h-1 w-12 bg-orange rounded" />
          {item.description && (
            <p className="text-sm text-slate-medium mb-6">{item.description}</p>
          )}
          {item.href ? (
            <a
              href={item.href}
              className="inline-flex items-center text-orange font-semibold hover:gap-2 gap-1 transition-all"
            >
              {item.label} <ArrowRight size={16} />
            </a>
          ) : (
            <motion.button
              onClick={item.onClick}
              className="inline-flex items-center text-orange font-semibold hover:gap-2 gap-1 transition-all"
              whileHover={{ x: 4 }}
            >
              {item.label} <ArrowRight size={16} />
            </motion.button>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default Button;

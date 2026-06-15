import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import UnfoldReveal from '@/components/animations/UnfoldReveal';
import { ArrowRight } from 'lucide-react';

interface CMSCardProps {
  image: string;
  title: string;
  subtitle?: string;
  description?: string;
  tags?: string[];
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
  variant?: 'ip' | 'artist' | 'course' | 'proof';
  index?: number;
}

/**
 * CMSCard Component
 * Reusable card for displaying CMS content
 * Used for IPs, Artists, Courses, and Proof tiles
 */
export const CMSCard: React.FC<CMSCardProps> = ({
  image,
  title,
  subtitle,
  description,
  tags,
  ctaLabel = 'View',
  ctaHref,
  className,
  variant = 'ip',
  index = 0,
}) => {
  return (
    <UnfoldReveal
      variant="scaleUp"
      delay={index * 0.1}
      className={cn('h-full', className)}
    >
      <motion.article
        className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 h-full flex flex-col group"
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
      >
        {/* Image Section */}
        <div className="relative aspect-video md:aspect-square overflow-hidden bg-cream">
          <motion.img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {tags && tags.length > 0 && variant === 'ip' && (
            <div className="absolute top-4 right-4 flex gap-2 flex-wrap justify-end">
              {tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-orange text-white text-xs font-semibold rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6 flex flex-col flex-grow">
          {subtitle && (
            <p className="text-xs text-slate-light uppercase tracking-wide mb-2">
              {subtitle}
            </p>
          )}

          <h3 className="text-lg md:text-xl font-bold text-charcoal mb-2 line-clamp-2">
            {title}
          </h3>

          {description && (
            <p className="text-sm md:text-base text-slate-medium mb-4 line-clamp-3 flex-grow">
              {description}
            </p>
          )}

          {variant === 'artist' && tags && (
            <div className="mb-4 flex flex-wrap gap-2">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-cream-dark text-orange-dark text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {ctaHref && (
            <motion.a
              href={ctaHref}
              className="inline-flex items-center gap-2 mt-auto text-orange font-semibold hover:gap-3 transition-all group-hover:text-orange-dark"
              whileHover={{ x: 4 }}
            >
              {ctaLabel} <ArrowRight size={16} />
            </motion.a>
          )}
        </div>
      </motion.article>
    </UnfoldReveal>
  );
};

/**
 * CMSGrid Component
 * Reusable grid layout for CMS cards
 */
interface CMSGridProps {
  items: CMSCardProps[];
  columns?: 'auto' | '2' | '3' | '4';
  className?: string;
  variant?: 'ip' | 'artist' | 'course' | 'proof';
}

export const CMSGrid: React.FC<CMSGridProps> = ({
  items,
  columns = '3',
  className,
  variant = 'ip',
}) => {
  const gridCols = {
    auto: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    '2': 'grid-cols-1 md:grid-cols-2',
    '3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    '4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-6 md:gap-8', gridCols[columns], className)}>
      {items.map((item, index) => (
        <CMSCard
          key={`${item.title}-${index}`}
          {...item}
          variant={variant}
          index={index}
        />
      ))}
    </div>
  );
};

export default CMSCard;

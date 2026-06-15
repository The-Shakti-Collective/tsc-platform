import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useReducedMotion } from '@/lib/animations';
import * as RadixAccordion from '@radix-ui/react-accordion';

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  image?: string;
}

interface UnfoldAccordionProps {
  items: AccordionItem[];
  className?: string;
  variant?: 'single' | 'multiple';
  defaultValue?: string;
}

/**
 * UnfoldAccordion Component
 * Expandable accordion with UNFOLD motion
 * Used for problem panels and expandable content
 */
export const UnfoldAccordion: React.FC<UnfoldAccordionProps> = ({
  items,
  className,
  variant = 'single',
  defaultValue,
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <RadixAccordion.Root
      type={variant as any}
      defaultValue={defaultValue}
      className={cn('w-full space-y-4', className)}
    >
      {items.map((item, index) => (
        <AccordionItem
          key={item.id}
          item={item}
          index={index}
          prefersReducedMotion={prefersReducedMotion}
        />
      ))}
    </RadixAccordion.Root>
  );
};

interface AccordionItemProps {
  item: AccordionItem;
  index: number;
  prefersReducedMotion: boolean;
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  item,
  index,
  prefersReducedMotion,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <RadixAccordion.Item value={item.id} className="border-b border-slate-lighter pb-4">
      <RadixAccordion.Trigger
        className="w-full text-left py-4 hover:text-orange transition-colors duration-300 group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.6,
            delay: prefersReducedMotion ? 0 : index * 0.1,
          }}
          className="flex items-center justify-between"
        >
          <h3 className="text-xl md:text-2xl font-bold text-charcoal group-hover:text-orange">
            {item.title}
          </h3>
          <motion.span
            initial={false}
            animate={{
              rotate: isOpen ? 45 : 0,
            }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.3,
            }}
            className="text-2xl"
          >
            <Plus size={24} className="text-orange" />
          </motion.span>
        </motion.div>
      </RadixAccordion.Trigger>

      <RadixAccordion.Content className="overflow-hidden">
        <motion.div
          initial={false}
          animate={{
            opacity: 1,
            height: 'auto',
            marginTop: 0,
          }}
          exit={{
            opacity: 0,
            height: 0,
            marginTop: -16,
          }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.4,
            ease: 'easeInOut',
          }}
          className="pb-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {item.image && (
              <div className="aspect-square overflow-hidden rounded-lg">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className={cn(item.image ? 'md:col-span-1' : 'col-span-2')}>
              {typeof item.content === 'string' ? (
                <p className="text-base md:text-lg text-slate-medium leading-relaxed">
                  {item.content}
                </p>
              ) : (
                item.content
              )}
            </div>
          </div>
        </motion.div>
      </RadixAccordion.Content>
    </RadixAccordion.Item>
  );
};

export default UnfoldAccordion;

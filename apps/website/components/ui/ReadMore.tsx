import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReadMoreProps {
  text: string;
  maxLength?: number;
  className?: string;
}

export default function ReadMore({ text, maxLength = 150, className = "" }: ReadMoreProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldShowReadMore = text.length > maxLength;

  const displayText = isExpanded ? text : `${text.slice(0, maxLength)}...`;

  return (
    <div className={className}>
      <p className="inline">
        {shouldShowReadMore ? displayText : text}
      </p>
      {shouldShowReadMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-2 text-orange font-bold hover:underline transition-all text-sm inline-block"
        >
          {isExpanded ? 'Read Less' : 'Read More'}
        </button>
      )}
    </div>
  );
}

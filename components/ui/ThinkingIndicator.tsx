'use client';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ThinkingIndicatorProps {
  step?: string;
  layout?: 'vertical' | 'horizontal';
}

export const ThinkingIndicator = ({ step, layout = 'vertical' }: ThinkingIndicatorProps) => {
  const isHorizontal = layout === 'horizontal';
  const displayedStep = step || 'Processing...';

  return (
    <div className={`flex ${isHorizontal ? 'flex-row items-center gap-3' : 'flex-col gap-2 py-4 px-2'}`}>
      <div className="flex gap-1.5 items-center shrink-0">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ 
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              delay: i * 0.2,
              ease: "easeInOut"
            }}
            className={`${isHorizontal ? 'w-1.5 h-1.5' : 'w-2 h-2'} bg-amber-500/50 rounded-full`}
          />
        ))}
      </div>
      <div className={`relative ${isHorizontal ? 'flex-1 overflow-hidden h-4' : 'h-4 w-full overflow-hidden'}`}>
        <AnimatePresence mode="popLayout">
          <motion.p 
            key={displayedStep}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className={`text-[10px] font-serif italic uppercase tracking-[0.2em] text-slate-500 absolute w-full ${isHorizontal ? 'truncate whitespace-nowrap' : ''}`}
          >
            {displayedStep}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};




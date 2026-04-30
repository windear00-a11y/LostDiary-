'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ThinkingIndicatorProps {
  step?: string;
  layout?: 'vertical' | 'horizontal';
}

const BACKGROUND_PROCESSES = [
  "Understanding your thoughts...",
  "Tuning into emotions...",
  "Reflecting on the past...",
  "Sensing the undertone...",
  "Formulating a response..."
];

export const ThinkingIndicator = ({ step, layout = 'vertical' }: ThinkingIndicatorProps) => {
  const isHorizontal = layout === 'horizontal';
  const [localStepIndex, setLocalStepIndex] = useState(0);

  useEffect(() => {
    if (step && step !== 'Processing...') return;
    
    // Cycle every 2 seconds for a smooth fade-in fade-out wait experience
    const interval = setInterval(() => {
      setLocalStepIndex((prev) => (prev + 1) % BACKGROUND_PROCESSES.length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [step]);

  const displayedStep = step && step !== 'Processing...' ? step : BACKGROUND_PROCESSES[localStepIndex];

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
            initial={{ opacity: 0, scale: 0.98, filter: "blur(2px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.02, filter: "blur(2px)" }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className={`text-[10px] font-serif italic uppercase tracking-[0.2em] text-slate-500 absolute w-full ${isHorizontal ? 'truncate whitespace-nowrap' : ''}`}
          >
            {displayedStep}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};




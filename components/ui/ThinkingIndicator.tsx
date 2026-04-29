'use client';
import React from 'react';
import { motion } from 'motion/react';

interface ThinkingIndicatorProps {
  step?: string;
}

export const ThinkingIndicator = ({ step }: ThinkingIndicatorProps) => {
  return (
    <div className="flex flex-col gap-2 py-4 px-2">
      <div className="flex gap-1.5 items-center">
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
            className="w-2 h-2 bg-amber-500/50 rounded-full"
          />
        ))}
      </div>
      {step && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] font-serif italic uppercase tracking-[0.2em] text-slate-500"
        >
          {step}
        </motion.p>
      )}
    </div>
  );
};

'use client';

import React from 'react';
import { motion } from 'motion/react';

interface StoryProgressBarProps {
  count: number;
}

export const StoryProgressBar: React.FC<StoryProgressBarProps> = ({ count }) => {
  const target = 5;
  const progress = Math.min(count / target, 1);
  
  return (
    <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
      <div className="w-full h-1 bg-gray-100 dark:bg-gray-900 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
        />
      </div>
      <div className="max-w-[800px] mx-auto px-6 pt-2">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
            Your story is growing...
          </span>
          <span className="text-[10px] font-mono text-gray-300 dark:text-gray-700">
            {Math.round(progress * 100)}%
          </span>
        </motion.div>
      </div>
    </div>
  );
};

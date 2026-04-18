'use client';

import React from 'react';
import { motion } from 'motion/react';

interface LoadingSpaceProps {
  message?: string;
  className?: string;
}

export const LoadingSpace = ({ 
  message = "Preparing your space...", 
  className = "" 
}: LoadingSpaceProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`flex flex-col items-center justify-center gap-6 ${className}`}
    >
      <div className="relative flex items-center justify-center w-20 h-20">
        <motion.div 
          className="absolute inset-0 rounded-full bg-indigo-500/10 border border-indigo-500/20"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div 
          className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
      
      <p className="text-sm font-serif italic text-slate-500 dark:text-slate-400 animate-pulse">
        {message}
      </p>
    </motion.div>
  );
};
